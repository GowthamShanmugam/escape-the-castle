/**
 * CC-licensed images from Wikimedia Commons (CC BY / CC BY-SA / CC0).
 * All assets comply with Red Hat Arcade requirements.
 * See ASSETS.md for full attribution.
 */
const wm = (path, filename, w = 1920) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${filename}/${w}px-${filename}`

export const IMAGE_ASSETS = {
  darkRoom: wm('7/71', 'Dark_Night_%28210029631%29.jpeg'),
}
