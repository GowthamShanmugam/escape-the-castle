// Intro story: trapped in the castle → sections & puzzles → unlock your way out
// type: 'image' | 'procedural'
// image: CC-licensed image URL for Ken Burns effect (Wikimedia Commons)
// procedural: no image, use CSS gradient/animation
// panX, panY: end offset in % for Ken Burns (image only)
import { IMAGE_ASSETS } from './imageAssets'

export const STORY_INTRO_SLIDES = [
  {
    title: 'Trapped',
    body: 'You are a spy. You infiltrated the enemy castle to gather intel. A guard spotted you; as you fled he struck you. You escaped the grounds but fell unconscious. You wake in the dark—stone walls, a single torch. You are trapped inside. To get out, you must solve the castle\'s puzzles and escape.',
    type: 'image',
    image: IMAGE_ASSETS.darkRoom,
    panX: 2,
    panY: 3,
  },
  {
    title: 'The Castle',
    body: 'The castle has many sections: halls, towers, dungeons, chapels, guard rooms. Each section is locked. To reach the next, you must find your way through the one you are in.',
    type: 'image',
    image: IMAGE_ASSETS.darkRoom,
    panX: -2,
    panY: -2,
  },
  {
    title: 'Unlock Your Way',
    body: 'Every section holds a puzzle—keys in the dark, codes in books, sequences, riddles, and trials. Solve the puzzle to unlock the door. Only then can you move on.',
    type: 'image',
    image: IMAGE_ASSETS.darkRoom,
    panX: 1,
    panY: -1,
  },
  {
    title: 'Escape',
    body: 'Fifteen rooms. One journey. One section at a time, one puzzle at a time. Think clearly. The castle does not give second chances.',
    type: 'image',
    image: IMAGE_ASSETS.darkRoom,
    panX: -1,
    panY: 2,
  },
]
