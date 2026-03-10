import { useNavigate } from 'react-router-dom'
import styles from './Credits.module.css'

export default function Credits() {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden>🏰</span>
        <h1 className={styles.title}>Credits</h1>
        <p className={styles.subtitle}>Escape the Castle</p>

        <div className={styles.creditBlock}>
          <p className={styles.name}>Gowtham Shanmugasundaram</p>
          <ul className={styles.links}>
            <li>
              <a href="https://www.linkedin.com/in/gowtham-shanmugasundaram/" target="_blank" rel="noopener noreferrer" className={styles.link}>
                LinkedIn
              </a>
            </li>
            <li>
              <a href="https://github.com/GowthamShanmugam/escape-the-castle" target="_blank" rel="noopener noreferrer" className={styles.link}>
                GitHub
              </a>
            </li>
          </ul>
          <p className={styles.query}>
            <a href="mailto:gshanmug@redhat.com" className={styles.email}>gshanmug@redhat.com</a>
            <span className={styles.queryLabel}> for any queries</span>
          </p>
        </div>

        <button type="button" onClick={handleBack} className={styles.backBtn}>
          Back
        </button>
      </div>
    </div>
  )
}
