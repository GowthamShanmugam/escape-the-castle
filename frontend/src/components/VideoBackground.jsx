import { useRef, useEffect, useState } from 'react'
import styles from './VideoBackground.module.css'

export default function VideoBackground({ src, overlay = true, className = '' }) {
  const videoRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    const handleCanPlay = () => setLoaded(true)
    const handleError = () => setError(true)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [src])

  if (!src) return null

  if (error) {
    return (
      <div className={`${styles.fallback} ${className}`} aria-hidden>
        <div className={styles.fallbackGradient} />
      </div>
    )
  }

  return (
    <div className={`${styles.wrapper} ${className}`} aria-hidden>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      {overlay && <div className={styles.overlay} />}
      {!loaded && <div className={styles.fallbackGradient} />}
    </div>
  )
}
