/**
 * Scene config per room index (15 rooms). Used by AnimatedRoomScene.
 * - useDarkRoom: render DarkRoomScene (room 0)
 * - type: 'procedural' | 'image'
 * - procedural: variant = room type for ProceduralRoomBg
 * - image: src = image URL for ImageBackground
 */
import { IMAGE_ASSETS } from './imageAssets'

const SCENES = [
  { useDarkRoom: true, type: 'procedural', variant: 'entrance', backgroundImage: IMAGE_ASSETS.darkRoom },
  { type: 'image', src: IMAGE_ASSETS.library, parallax: true, effects: ['dust', 'shadow', 'library', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.kitchen, parallax: true, effects: ['dust', 'steam', 'kitchen', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.dungeon, parallax: true, effects: ['dust', 'chain', 'shadow', 'dungeon', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.throne, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.armory, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.tower, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.chapel, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.wineCellar, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.guardRoom, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.nursery, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.gallery, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.alchemyLab, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.bathhouse, parallax: true, effects: ['steam', 'dust', 'shadow', 'firefly'] },
  { type: 'image', src: IMAGE_ASSETS.stables, parallax: true, effects: ['dust', 'shadow', 'firefly'] },
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
