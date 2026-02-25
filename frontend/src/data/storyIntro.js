// Intro story: trapped in the castle → sections & puzzles → unlock your way out
// type: 'video' | 'procedural'
// video: Pexels video URL for animated background
// procedural: no video, use CSS gradient/animation
// panX, panY: end offset in % for Ken Burns (video/image only)
import { VIDEO_ASSETS } from './videoAssets'

export const STORY_INTRO_SLIDES = [
  {
    title: 'Trapped',
    body: 'You wake in the dark. Stone walls, a single torch. You are inside the castle with no way back—only forward. To survive, you must escape.',
    type: 'video',
    video: VIDEO_ASSETS.castleIntro,
    panX: 2,
    panY: 3,
  },
  {
    title: 'The Castle',
    body: 'The castle has many sections: halls, towers, dungeons, chapels, guard rooms. Each section is locked. To reach the next, you must find your way through the one you are in.',
    type: 'video',
    video: VIDEO_ASSETS.castleIntro,
    panX: -2,
    panY: -2,
  },
  {
    title: 'Unlock Your Way',
    body: 'Every section holds a puzzle—keys in the dark, codes in books, sequences, riddles, and trials. Solve the puzzle to unlock the door. Only then can you move on.',
    type: 'video',
    video: VIDEO_ASSETS.castleIntro,
    panX: 1,
    panY: -1,
  },
  {
    title: 'Escape',
    body: 'Fifteen rooms. One journey. One section at a time, one puzzle at a time. Think clearly. The castle does not give second chances.',
    type: 'video',
    video: VIDEO_ASSETS.castleIntro,
    panX: -1,
    panY: 2,
  },
]
