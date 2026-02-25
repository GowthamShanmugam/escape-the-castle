/**
 * Sound service: intro/room ambient, game background (thriller), and UI effects.
 * Uses Web Audio API (no asset files required). Call init() after user gesture if needed.
 */

let audioContext = null
let ambientSource = null
let ambientGain = null
let gameBackgroundNodes = []
let gameBackgroundAudio = null
let gameBackgroundLoadFailed = false

/** One track for intro + all levels. Place mixkit-meditation-441.mp3 in public/sounds/ */
const GAME_BACKGROUND_URL = `${import.meta.env.BASE_URL || '/'}sounds/mixkit-meditation-441.mp3`.replace(/\/+/g, '/')

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

async function resumeIfNeeded() {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** Start a soft looping ambient (intro or room 0–10). Stops any current ambient. */
export async function playAmbient(id) {
  if (isMuted()) return
  try {
    await resumeIfNeeded()
    stopAmbient()
    const ctx = getContext()
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.1
    gainNode.connect(ctx.destination)
    ambientGain = gainNode

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = id === 'intro' ? 110 : 90
    osc.connect(gainNode)
    osc.start(0)
    ambientSource = osc
  } catch (_) {
    // Autoplay or context not allowed
  }
}

export function stopAmbient() {
  if (ambientSource) {
    try {
      if (ambientSource.stop) ambientSource.stop()
    } catch (_) {}
    ambientSource = null
  }
  if (ambientGain) {
    try {
      ambientGain.disconnect()
    } catch (_) {}
    ambientGain = null
  }
}

/** Persistent game background: plays mixkit-meditation-441.mp3. Must be called directly from user click (no await before play()). */
export function startGameBackground() {
  if (isMuted()) return
  if (gameBackgroundAudio && !gameBackgroundAudio.paused) return
  gameBackgroundLoadFailed = false
  stopGameBackground()
  const audio = new Audio(GAME_BACKGROUND_URL)
  audio.loop = true
  audio.volume = 0.08
  audio.onerror = () => {
    gameBackgroundLoadFailed = true
  }
  const playPromise = audio.play()
  gameBackgroundAudio = audio
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch(() => { gameBackgroundLoadFailed = true })
  }
}

export function didGameBackgroundFailToLoad() {
  return gameBackgroundLoadFailed
}

export function stopGameBackground() {
  if (gameBackgroundAudio) {
    try {
      gameBackgroundAudio.pause()
      gameBackgroundAudio.currentTime = 0
      gameBackgroundAudio.src = ''
    } catch (_) {}
    gameBackgroundAudio = null
  }
  gameBackgroundNodes.forEach((node) => {
    try {
      if (node.stop) node.stop()
      if (node.disconnect) node.disconnect()
    } catch (_) {}
  })
  gameBackgroundNodes = []
}

/** Call this directly from a click handler (no async before it) so play() runs in the same user gesture. */
export function unlockAndStartGameBackground() {
  resumeIfNeeded()
  startGameBackground()
}

/** One-shot effect: 'click' | 'open' | 'close' | 'success' | 'fail' | 'page' | 'tick' | 'drip' */
export async function playEffect(name) {
  if (isMuted()) return
  try {
    await resumeIfNeeded()
    const ctx = getContext()
    const now = ctx.currentTime
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    gainNode.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.connect(gainNode)
    if (name === 'drip') {
      osc.frequency.setValueAtTime(680, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06)
      osc.type = 'sine'
      gainNode.gain.setValueAtTime(0.08, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
      osc.start(now)
      osc.stop(now + 0.06)
    } else if (name === 'click' || name === 'open' || name === 'close') {
      osc.frequency.value = 520
      osc.type = 'sine'
      osc.start(now)
      osc.stop(now + 0.06)
    } else if (name === 'page') {
      osc.frequency.value = 320
      osc.type = 'sine'
      gainNode.gain.setValueAtTime(0.12, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (name === 'tick') {
      osc.frequency.value = 640
      osc.type = 'sine'
      osc.start(now)
      osc.stop(now + 0.04)
    } else if (name === 'success') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523, now)
      osc.frequency.setValueAtTime(659, now + 0.08)
      osc.frequency.setValueAtTime(784, now + 0.16)
      osc.start(now)
      osc.stop(now + 0.28)
    } else if (name === 'fail') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.setValueAtTime(160, now + 0.12)
      osc.start(now)
      osc.stop(now + 0.22)
    } else if (name === 'guard') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(380, now)
      osc.frequency.setValueAtTime(180, now + 0.15)
      gainNode.gain.setValueAtTime(0.12, now)
      gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.25)
      osc.start(now)
      osc.stop(now + 0.25)
    } else if (name === 'flame_calm') {
      osc.type = 'sine'
      osc.frequency.value = 82
      gainNode.gain.setValueAtTime(0.06, now)
      gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.5)
      osc.start(now)
      osc.stop(now + 0.5)
    } else if (name === 'flame_unstable') {
      const noise = ctx.createBufferSource()
      const buf = ctx.createBuffer(1, 22050 * 0.08, 22050)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15
      noise.buffer = buf
      const filt = ctx.createBiquadFilter()
      filt.type = 'bandpass'
      filt.frequency.value = 800
      filt.Q.value = 2
      noise.connect(filt)
      filt.connect(gainNode)
      gainNode.gain.setValueAtTime(0.04, now)
      gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.08)
      noise.start(now)
      noise.stop(now + 0.08)
    } else if (name === 'flame_overheat') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.setValueAtTime(180, now + 0.12)
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (name === 'flame_perfect') {
      osc.type = 'sine'
      osc.frequency.value = 165
      gainNode.gain.setValueAtTime(0.08, now)
      gainNode.gain.exponentialRampToValueAtTime(0.03, now + 0.4)
      osc.start(now)
      osc.stop(now + 0.4)
    } else {
      osc.frequency.value = 400
      osc.type = 'sine'
      osc.start(now)
      osc.stop(now + 0.08)
    }
  } catch (_) {}
}

export function isMuted() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('soundMuted') === '1'
}

export function setMuted(muted) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('soundMuted', muted ? '1' : '0')
  }
  if (muted) {
    stopAmbient()
    stopGameBackground()
  }
}
