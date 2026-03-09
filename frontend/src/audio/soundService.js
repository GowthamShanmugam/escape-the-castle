/**
 * Sound service: intro/room ambient and UI effects.
 * Uses Web Audio API (no asset files required). Call init() after user gesture if needed.
 */

let audioContext = null
let ambientSource = null
let ambientGain = null

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

export function startGameBackground() {}

export function stopGameBackground() {}

export function unlockAndStartGameBackground() {
  resumeIfNeeded()
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

let thunderBuffer = null
let thunderSource = null
let introSoundsActive = false

/** Call when entering intro page. */
export function setIntroSoundsActive(active) {
  introSoundsActive = active
  if (!active) {
    if (thunderSource) { try { thunderSource.stop() } catch (_) {} thunderSource = null }
    stopRunningSound()
    stopGuardShout()
    stopGuardYouStop()
    stopScreamingSound()
    stopRain()
  }
}

/** Preload intro and wake-up sounds so they are cached before timers fire (avoids delay/miss on slow server). */
export function preloadIntroSounds() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
  const sounds = [
    'rain.mp3',
    'running.wav',
    'guard-shout.wav',
    'guard-you-stop.wav',
    'screaming.wav',
    'where-i-am.wav',
  ]
  sounds.forEach((file) => {
    const a = new Audio(`${base}sounds/${file}`)
    a.preload = 'auto'
    a.load()
  })
  // Thunder uses Web Audio API; preload buffer so first play is instant
  if (!thunderBuffer) {
    fetch(`${base}sounds/thunder.mp3`)
      .then((res) => res.ok && res.arrayBuffer())
      .then((buf) => buf && getContext().decodeAudioData(buf))
      .then((decoded) => { thunderBuffer = decoded })
      .catch(() => {})
  }
}

/** Play thunder sound (CC BY 4.0, Orange Free Sounds). Stops any playing thunder first. */
export async function playThunder() {
  if (!introSoundsActive || isMuted()) return
  try {
    await resumeIfNeeded()
    const ctx = getContext()
    if (thunderSource) {
      try { thunderSource.stop() } catch (_) {}
      thunderSource = null
    }
    if (!thunderBuffer) {
      const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
      const res = await fetch(`${base}sounds/thunder.mp3`)
      if (!res.ok) return
      thunderBuffer = await ctx.decodeAudioData(await res.arrayBuffer())
    }
    const src = ctx.createBufferSource()
    src.buffer = thunderBuffer
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start(0)
    thunderSource = src
    src.onended = () => { thunderSource = null }
  } catch (_) {}
}

/** Stop thunder (call when leaving intro page). */
export function stopThunder() {
  if (thunderSource) {
    try { thunderSource.stop() } catch (_) {}
    thunderSource = null
  }
}

let runningSoundAudio = null

/** Play running footsteps once (intro). CC-licensed: sounds/running.wav or running.mp3. */
export function playRunningSound() {
  if (!introSoundsActive || isMuted()) return
  stopRunningSound()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/running.wav`
    const mp3 = `${base}sounds/running.mp3`
    audio.volume = 0.55
    audio.playbackRate = 1
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    runningSoundAudio = audio
    audio.onended = () => { runningSoundAudio = null }
  } catch (_) {}
}

/** Start looping running footsteps (intro, player escaping). Stops with stopRunningSound(). */
export function startRunningLoop() {
  if (!introSoundsActive || isMuted()) return
  stopRunningSound()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/running.wav`
    const mp3 = `${base}sounds/running.mp3`
    audio.volume = 0.55
    audio.loop = true
    audio.playbackRate = 1
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    runningSoundAudio = audio
  } catch (_) {}
}

/** Play running footsteps once at noticeably slower speed (intro). .wav playbackRate applied so it’s clearly slow. */
export function playRunningSoundSlower() {
  if (!introSoundsActive || isMuted()) return
  stopRunningSound()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/running.wav`
    const mp3 = `${base}sounds/running.mp3`
    audio.volume = 0.55
    audio.playbackRate = 0.5
    let triedMp3 = false
    const play = () => {
      audio.playbackRate = 0.5
      audio.play().catch(() => {})
    }
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.playbackRate = 0.5
        audio.play().catch(() => {})
      }
    })
    audio.addEventListener('canplaythrough', play, { once: true })
    audio.src = wav
    if (audio.readyState >= 3) play()
    runningSoundAudio = audio
    audio.onended = () => { runningSoundAudio = null }
  } catch (_) {}
}

/** Play running footsteps once at faster speed (intro, urgency). */
export function playRunningSoundFaster() {
  if (!introSoundsActive || isMuted()) return
  stopRunningSound()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/running.wav`
    const mp3 = `${base}sounds/running.mp3`
    audio.volume = 0.55
    audio.playbackRate = 1.35
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    runningSoundAudio = audio
    audio.onended = () => { runningSoundAudio = null }
  } catch (_) {}
}

/** Stop running sound (call when leaving intro page). */
export function stopRunningSound() {
  if (runningSoundAudio) {
    try {
      runningSoundAudio.pause()
      runningSoundAudio.currentTime = 0
    } catch (_) {}
    runningSoundAudio = null
  }
}

let guardShoutAudio = null

/** Play guard shout once (e.g. "Prisoner escaped—catch him!"). Uses HTML Audio. CC-licensed: sounds/guard-shout.wav or guard-shout.mp3. Louder than rain/thunder. */
export function playGuardShout() {
  if (!introSoundsActive || isMuted()) return
  stopGuardShout()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/guard-shout.wav`
    const mp3 = `${base}sounds/guard-shout.mp3`
    audio.volume = 0.7
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    guardShoutAudio = audio
    audio.onended = () => { guardShoutAudio = null }
  } catch (_) {}
}

/** Stop guard shout (call when leaving intro page). */
export function stopGuardShout() {
  if (guardShoutAudio) {
    try {
      guardShoutAudio.pause()
      guardShoutAudio.currentTime = 0
    } catch (_) {}
    guardShoutAudio = null
  }
}

let guardYouStopAudio = null

/** Play guard "you stop" once (intro). CC-licensed: sounds/guard-you-stop.wav or .mp3. */
export function playGuardYouStop() {
  if (!introSoundsActive || isMuted()) return
  stopGuardYouStop()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/guard-you-stop.wav`
    const mp3 = `${base}sounds/guard-you-stop.mp3`
    audio.volume = 0.7
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    guardYouStopAudio = audio
    audio.onended = () => { guardYouStopAudio = null }
  } catch (_) {}
}

/** Stop guard "you stop" (call when leaving intro page). */
export function stopGuardYouStop() {
  if (guardYouStopAudio) {
    try {
      guardYouStopAudio.pause()
      guardYouStopAudio.currentTime = 0
    } catch (_) {}
    guardYouStopAudio = null
  }
}

let screamingSoundAudio = null

/** Play screaming sound once (intro, after guard). CC-licensed: sounds/screaming.wav or screaming.mp3. */
export function playScreamingSound() {
  if (!introSoundsActive || isMuted()) return
  stopScreamingSound()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/screaming.wav`
    const mp3 = `${base}sounds/screaming.mp3`
    audio.volume = 0.78
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
    screamingSoundAudio = audio
    audio.onended = () => { screamingSoundAudio = null }
  } catch (_) {}
}

/** Stop screaming sound (call when leaving intro page). */
export function stopScreamingSound() {
  if (screamingSoundAudio) {
    try {
      screamingSoundAudio.pause()
      screamingSoundAudio.currentTime = 0
    } catch (_) {}
    screamingSoundAudio = null
  }
}

/** Play "Where I am" once (first level loaded — player opens eyes). CC-licensed: sounds/where-i-am.wav or where-i-am.mp3. */
export function playWhereAmISound() {
  if (isMuted()) return
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio()
    const wav = `${base}sounds/where-i-am.wav`
    const mp3 = `${base}sounds/where-i-am.mp3`
    audio.volume = 0.6
    let triedMp3 = false
    audio.addEventListener('error', () => {
      if (!triedMp3) {
        triedMp3 = true
        audio.src = mp3
        audio.play().catch(() => {})
      }
    })
    audio.src = wav
    audio.play().catch(() => {})
  } catch (_) {}
}

let rainAudio = null

/** Start looping rain (CC BY 4.0, Orange Free Sounds). Uses HTML Audio for reliable stop. */
export function startRain() {
  if (!introSoundsActive || isMuted()) return
  stopRain()
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
    const audio = new Audio(`${base}sounds/rain.mp3`)
    audio.loop = true
    audio.volume = 0.12
    audio.play().catch(() => {})
    rainAudio = audio
  } catch (_) {}
}

/** Stop rain — pause and reset HTML Audio for immediate silence. */
export function stopRain() {
  if (rainAudio) {
    try {
      rainAudio.pause()
      rainAudio.currentTime = 0
    } catch (_) {}
    rainAudio = null
  }
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
    stopRunningSound()
    stopGuardShout()
    stopGuardYouStop()
    stopScreamingSound()
    stopRain()
  }
}
