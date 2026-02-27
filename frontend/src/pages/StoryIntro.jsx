import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STORY_INTRO_SLIDES } from '../data/storyIntro'
import { unlockAndStartGameBackground, stopGameBackground } from '../audio/soundService'
import ImageBackground from '../components/ImageBackground'
import ProceduralSlideBg from '../components/ProceduralSlideBg'
import styles from './StoryIntro.module.css'

const SLIDE_DURATION_MS = 15000

export default function StoryIntro({ onComplete }) {
  const [index, setIndex] = useState(0)
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    unlockAndStartGameBackground()
    return () => stopGameBackground()
  }, [])

  useEffect(() => {
    if (skip) {
      onComplete?.()
      return
    }
    const slide = STORY_INTRO_SLIDES[index]
    if (!slide) {
      onComplete?.()
      return
    }
    const t = setTimeout(() => {
      if (index < STORY_INTRO_SLIDES.length - 1) {
        setIndex((i) => i + 1)
      } else {
        onComplete?.()
      }
    }, SLIDE_DURATION_MS)
    return () => clearTimeout(t)
  }, [index, skip, onComplete])

  const handleSkip = () => setSkip(true)

  const slide = STORY_INTRO_SLIDES[index]
  if (!slide) return null

  const panX = slide.panX ?? 2
  const panY = slide.panY ?? 2
  const slideDurationSec = SLIDE_DURATION_MS / 1000
  const isImage = slide.type === 'image' && slide.image

  return (
    <div className={styles.wrapper}>
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
