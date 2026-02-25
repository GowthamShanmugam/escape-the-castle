/**
 * Bat — Twemoji bat (standard bat shape: wings, body, ears)
 */
import { useState } from 'react'
import styles from './HangingBat.module.css'

export default function HangingBat({ className = '', delay = 0 }) {
  const [useEmoji, setUseEmoji] = useState(false)
  return (
    <div className={`${styles.bat} ${className}`} style={{ animationDelay: `${delay}s` }} aria-hidden>
      {useEmoji ? (
        <span className={styles.batEmoji}>🦇</span>
      ) : (
        <img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f987.svg"
          alt=""
          className={styles.batImg}
          onError={() => setUseEmoji(true)}
        />
      )}
    </div>
  )
}
