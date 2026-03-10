import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { preloadAllAssets } from '../data/preloadAssets'
import { ensureThunderDecoded } from '../audio/soundService'
import styles from './Loading.module.css'

export default function Loading() {
  const navigate = useNavigate()
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const next = location.state?.next ?? '/intro'
    const onProgress = (loaded, totalCount) => {
      setProgress(loaded)
      setTotal(totalCount)
    }
    // Wait for all assets (same URLs = cache) and thunder decode so intro/game play seamlessly
    Promise.all([
      preloadAllAssets(onProgress),
      ensureThunderDecoded(),
    ]).then(() => {
      navigate(next, { replace: true, state: location.state?.nextState })
    })
  }, [navigate, location.state])

  const pct = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Loading</h1>
        <p className={styles.subtitle}>Preparing images and sounds…</p>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.pct}>{pct}%</p>
      </div>
    </div>
  )
}
