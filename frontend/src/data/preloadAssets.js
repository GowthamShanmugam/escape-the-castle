/**
 * List of public assets to preload after Lobby (before intro/game) so there’s no delay during play.
 * Paths are relative to public (no leading slash in list; base URL applied when loading).
 */
const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''

/** Build absolute URL for a public asset so preload and runtime (e.g. soundService) use the same URL and share cache. */
export function getAssetUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${BASE.replace(/\/$/, '')}${p}`
}

export const PRELOAD_IMAGES = [
  '/images/dark-room-bg.jpeg',
  '/images/chapel-chain-rhythm.jpg',
  '/images/key-icon.png',
  '/images/armory-jigsaw.jpg',
  '/arcade-banner.png',
  '/arcade-banner.jpg',
]

export const PRELOAD_SOUNDS = [
  '/sounds/rain.mp3',
  '/sounds/running.wav',
  '/sounds/guard-shout.wav',
  '/sounds/guard-you-stop.wav',
  '/sounds/screaming.wav',
  '/sounds/thunder.mp3',
  '/sounds/where-i-am.wav',
]

/**
 * Preload all images and sounds. Returns a Promise that resolves to { loaded, failed }
 * and calls onProgress(loaded, total) as items finish.
 */
function assetUrl(path) {
  return getAssetUrl(path)
}

export function preloadAllAssets(onProgress) {
  const images = PRELOAD_IMAGES.map(assetUrl)
  const sounds = PRELOAD_SOUNDS.map(assetUrl)
  const total = images.length + sounds.length
  let loaded = 0

  const tick = () => {
    loaded += 1
    onProgress?.(loaded, total)
  }

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => { tick(); resolve() }
      img.onerror = () => { tick(); resolve() }
      img.src = src
    })

  const loadSound = (src) =>
    new Promise((resolve) => {
      let settled = false
      const audio = new Audio(src)
      const done = () => {
        if (settled) return
        settled = true
        tick()
        resolve()
      }
      audio.addEventListener('canplaythrough', done, { once: true })
      audio.addEventListener('error', done, { once: true })
      audio.load()
      // Resolve after a timeout in case canplaythrough never fires (e.g. CORS)
      setTimeout(done, 8000)
    })

  const all = [
    ...images.map(loadImage),
    ...sounds.map(loadSound),
  ]

  return Promise.all(all).then(() => ({ loaded: total, failed: 0 }))
}
