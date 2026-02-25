import { useState } from 'react'
import styles from './ImageBackground.module.css'

export default function ImageBackground({ src, overlay = true, className = '' }) {
  const [error, setError] = useState(false)

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
      <img
        className={styles.image}
        src={src}
        alt=""
        onError={() => setError(true)}
      />
      {overlay && <div className={styles.overlay} />}
    </div>
  )
}
