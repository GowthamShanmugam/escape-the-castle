import styles from './ProceduralSlideBg.module.css'

export default function ProceduralSlideBg({ variant = 'key' }) {
  return (
    <div className={styles.wrapper} aria-hidden>
      <div className={`${styles.base} ${styles[variant]}`} />
      <div className={styles.overlay} />
    </div>
  )
}
