import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
const TOUR_STORAGE_KEY = 'escape-the-castle_tourCompleted'

export function isTourCompleted() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markTourCompleted() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
  } catch {}
}

const TOUR_STEPS = [
  {
    element: '[data-tour-id="tour-gamecode"]',
    popover: {
      title: 'Game Code',
      description: 'Share this code with friends so they can join the same game.',
    },
  },
  {
    element: '[data-tour-id="tour-gamearea"]',
    popover: {
      title: 'Game Area',
      description: 'The current room is shown here. Explore the scene, talk to the NPC, and open puzzles to solve.',
    },
  },
  {
    element: '[data-tour-id="tour-coins"]',
    popover: {
      title: 'Coins',
      description: 'Earn coins by solving rooms. Spend them for closer hints when stuck.',
    },
  },
  {
    element: '[data-tour-id="tour-hint"]',
    popover: {
      title: 'Hints',
      description: 'Ask the NPC for hints. Some rooms offer a closer hint for 1 coin.',
    },
  },
  {
    element: '[data-tour-id="tour-leaderboard"]',
    popover: {
      title: 'Leaderboard',
      description: 'See how everyone is progressing through the castle.',
    },
  },
  {
    element: '[data-tour-id="tour-map"]',
    popover: {
      title: 'Castle Map',
      description: 'Tap any uncompleted room to jump between levels. No need to solve in order.',
    },
  },
  {
    element: '[data-tour-id="tour-leave"]',
    popover: {
      title: 'Leave Game',
      description: 'Exit when you\'re done. Your progress is saved.',
    },
  },
]

export default function GameTour({ onReady }) {
  const driverRef = useRef(null)

  useEffect(() => {
    if (isTourCompleted() || !onReady) return

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Got it',
      closeBtnText: 'Skip tour',
      showButtons: ['next', 'previous', 'close'],
      smoothScroll: true,
      steps: TOUR_STEPS,
      onDestroyed: () => {
        markTourCompleted()
      },
    })

    driverRef.current = driverObj
    // Small delay so sidebar is rendered and visible
    const t = setTimeout(() => {
      driverObj.drive()
    }, 400)

    return () => {
      clearTimeout(t)
      if (driverRef.current?.isActive?.()) {
        driverRef.current.destroy()
      }
    }
  }, [onReady])

  return null
}
