import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STORY_INTRO_SLIDES } from '../data/storyIntro'
import { unlockAndStartGameBackground, stopGameBackground, playThunder, stopThunder, startRain, stopRain, setIntroSoundsActive, preloadIntroSounds, playRunningSound, playRunningSoundSlower, playRunningSoundFaster, stopRunningSound, playGuardShout, stopGuardShout, playGuardYouStop, stopGuardYouStop, playScreamingSound, stopScreamingSound } from '../audio/soundService'
import ImageBackground from '../components/ImageBackground'
import ProceduralSlideBg from '../components/ProceduralSlideBg'
import styles from './StoryIntro.module.css'

const SLIDE_DURATION_MS = 12000  // 12s per slide, 48s total

const FADE_OUT_MS = 2200   // slow darken at end, then connects to game blink
const FADE_OUT_SKIP_MS = 1200

export default function StoryIntro({ onComplete }) {
  const [index, setIndex] = useState(0)
  const [skip, setSkip] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const [fadeOutDuration, setFadeOutDuration] = useState(FADE_OUT_MS)
  const hasUnlocked = useRef(false)
  const prevIndexRef = useRef(null)

  /* Lightning first (CSS flash at 10.8s & 34.8s), then thunder ~400ms later */
  const THUNDER_FIRST_MS = 11200   // after first flash (27% of 40s = 10.8s)
  const THUNDER_THIRD_MS = 35200   // after second flash (87% of 40s = 34.8s)
  // Running in gaps: normal / slow / normal / slow … then faster (clear variation)
  const RUN_1_MS = 800               // normal
  const RUN_2_MS = 5200              // slow
  const RUN_3_MS = 9500              // normal
  const RUN_4_MS = 12800             // slow again (before guards)
  const GUARD_SHOUT_MS = 14000       // Slide 2: spotted
  const GUARD_YOU_STOP_MS = 28000    // Slide 3: "you stop"
  const RUN_SLOW_MS = 25500          // Slide 3: slow
  const RUN_FAST_1_MS = 32000        // faster
  const RUN_FAST_2_MS = 37000        // faster again
  const SCREAMING_MS = 43000         // screaming

  const handleUnlock = () => {
    if (hasUnlocked.current) return
    hasUnlocked.current = true
    unlockAndStartGameBackground()
  }

  useEffect(() => {
    setIntroSoundsActive(true)
    preloadIntroSounds()
    unlockAndStartGameBackground()
    startRain()
    return () => {
      setIntroSoundsActive(false)
      stopGameBackground()
      stopThunder()
      stopRunningSound()
      stopGuardShout()
      stopGuardYouStop()
      stopScreamingSound()
      stopRain()
    }
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => playThunder(), THUNDER_FIRST_MS)
    const t2 = setTimeout(() => playThunder(), THUNDER_THIRD_MS)
    const tRun1 = setTimeout(() => playRunningSound(), RUN_1_MS)
    const tRun2 = setTimeout(() => playRunningSoundSlower(), RUN_2_MS)
    const tRun3 = setTimeout(() => playRunningSound(), RUN_3_MS)
    const tRun4 = setTimeout(() => playRunningSoundSlower(), RUN_4_MS)
    const tGuard = setTimeout(() => playGuardShout(), GUARD_SHOUT_MS)
    const tGuardStop = setTimeout(() => playGuardYouStop(), GUARD_YOU_STOP_MS)
    const tRunSlow = setTimeout(() => playRunningSoundSlower(), RUN_SLOW_MS)
    const tRunFast1 = setTimeout(() => playRunningSoundFaster(), RUN_FAST_1_MS)
    const tRunFast2 = setTimeout(() => playRunningSoundFaster(), RUN_FAST_2_MS)
    const tScreaming = setTimeout(() => playScreamingSound(), SCREAMING_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(tRun1)
      clearTimeout(tRun2)
      clearTimeout(tRun3)
      clearTimeout(tRun4)
      clearTimeout(tGuard)
      clearTimeout(tGuardStop)
      clearTimeout(tRunSlow)
      clearTimeout(tRunFast1)
      clearTimeout(tRunFast2)
      clearTimeout(tScreaming)
      stopThunder()
      stopRunningSound()
      stopGuardShout()
      stopGuardYouStop()
      stopScreamingSound()
    }
  }, [])

  useEffect(() => {
    if (prevIndexRef.current !== null && prevIndexRef.current !== index) {
      setTransitioning(true)
    }
    prevIndexRef.current = index
  }, [index])

  useEffect(() => {
    if (skip) return
    const slide = STORY_INTRO_SLIDES[index]
    if (!slide) {
      onComplete?.()
      return
    }
    const t = setTimeout(() => {
      if (index < STORY_INTRO_SLIDES.length - 1) {
        setIndex((i) => i + 1)
      } else {
        setFadeOutDuration(FADE_OUT_MS)
        setFadingOut(true)
      }
    }, SLIDE_DURATION_MS)
    return () => clearTimeout(t)
  }, [index, skip, onComplete])

  useEffect(() => {
    if (!fadingOut) return
    const t = setTimeout(() => {
      onComplete?.()
    }, fadeOutDuration)
    return () => clearTimeout(t)
  }, [fadingOut, fadeOutDuration, onComplete])

  const handleSkip = () => {
    setIntroSoundsActive(false)
    setSkip(true)
    setFadeOutDuration(FADE_OUT_SKIP_MS)
    setFadingOut(true)
  }

  const slide = STORY_INTRO_SLIDES[index]
  if (!slide) return null

  const panX = slide.panX ?? 2
  const panY = slide.panY ?? 2
  const slideDurationSec = SLIDE_DURATION_MS / 1000
  const isImage = slide.type === 'image' && slide.image

  return (
    <div className={styles.wrapper} onClick={handleUnlock}>
      <div
        className={styles.fadeOutOverlay}
        style={{
          opacity: fadingOut ? 1 : 0,
          transitionDuration: `${fadeOutDuration}ms`,
        }}
        aria-hidden
      />
      <div className={`${styles.rain} ${transitioning ? styles.rainHidden : ''}`} aria-hidden />
      <div className={styles.thunderFlash} aria-hidden />
      <div className={styles.grain} aria-hidden />
      <div className={`${styles.letterbox} ${styles.letterboxTop}`} aria-hidden />
      <div className={`${styles.letterbox} ${styles.letterboxBottom}`} aria-hidden />
      <button type="button" className={styles.skipBtn} onClick={handleSkip} aria-label="Skip intro">
        Skip
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={styles.slideWrap}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          onAnimationComplete={() => setTransitioning(false)}
        >
          {isImage ? (
            <motion.div
              className={styles.videoLayer}
              initial={{ scale: 1.2, x: `${-panX}%`, y: `${-panY}%` }}
              animate={{
                scale: 1,
                x: `${panX}%`,
                y: `${panY}%`,
              }}
              transition={{
                duration: slideDurationSec,
                ease: [0.2, 0, 0.4, 1],
              }}
            >
              <ImageBackground src={slide.image} overlay={true} />
              <div className={styles.horrorOverlay} aria-hidden />
            </motion.div>
          ) : (
            <ProceduralSlideBg variant={slide.variant || 'key'} />
          )}
          <div className={styles.textOverlay}>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {slide.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {slide.body}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className={styles.progress} aria-hidden>
        <div className={styles.progressBarTrack}>
          <motion.div
            className={styles.progressBarFill}
            key={index}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: slideDurationSec, ease: 'linear' }}
          />
        </div>
        <div className={styles.progressDots}>
          {STORY_INTRO_SLIDES.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === index ? styles.active : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
