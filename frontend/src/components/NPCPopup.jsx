import { useEffect } from 'react'
import { motion } from 'framer-motion'
import styles from './NPCPopup.module.css'

const DEFAULT_DISMISS_MS = 5000

export default function NPCPopup({ message, onDismiss, dismissAfterMs = DEFAULT_DISMISS_MS, coins = 0, onBribe }) {
  useEffect(() => {
    const ms = typeof dismissAfterMs === 'number' && dismissAfterMs > 0 ? dismissAfterMs : DEFAULT_DISMISS_MS
    const t = setTimeout(() => onDismiss(), ms)
    return () => clearTimeout(t)
  }, [onDismiss, dismissAfterMs, message])

  const canBribe = onBribe && coins >= 1

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
    >
      <div className={styles.glowWrapper}>
        <svg className={styles.glowBorder} viewBox="0 0 200 80" preserveAspectRatio="none">
          <motion.rect
            className={styles.glowRect}
            x="2"
            y="2"
            width="196"
            height="76"
            rx="12"
            ry="12"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="50 500"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 550 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </svg>
        <div className={styles.panel}>
          <div className={styles.avatar} aria-hidden>🧙</div>
          <div className={styles.content}>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              {canBribe && (
                <button type="button" className={styles.bribeBtn} onClick={onBribe}>
                  Bribe for closer hint (1 🪙)
                </button>
              )}
              <button type="button" className={styles.continueBtn} onClick={onDismiss}>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
