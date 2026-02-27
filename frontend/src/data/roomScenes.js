/**
 * Scene config per room index (15 rooms). Used by AnimatedRoomScene.
 * - useDarkRoom: render DarkRoomScene (room 0)
 * - type: 'procedural' | 'image'
 * - procedural: variant = room type for ProceduralRoomBg
 * - image: src = image URL for ImageBackground
 * Same background image for all rounds; puzzle modals keep their own images.
 */
import { IMAGE_ASSETS } from './imageAssets'

const SHARED_BG = IMAGE_ASSETS.darkRoom

const SCENES = [
  { useDarkRoom: true, type: 'procedural', variant: 'entrance', backgroundImage: SHARED_BG },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'library', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'steam', 'kitchen', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'chain', 'shadow', 'dungeon', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['steam', 'dust', 'shadow', 'firefly'] },
  { type: 'image', src: SHARED_BG, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
]

export function getRoomSceneConfig(roomIndex) {
  if (roomIndex >= 0 && roomIndex < SCENES.length) {
    return SCENES[roomIndex]
  }
  return { placeholder: true }
}

export function getAllSceneConfigs() {
  return SCENES
}
