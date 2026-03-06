import { useState, useEffect } from 'react'
import styles from './PuzzleThrone.module.css'

const ANGLES = [0, 90, 180, 270]
const LIGHT_HIT_DURATION_MS = 700
const SUCCESS_ANIMATION_MS = 1000

export default function PuzzleThrone({ onSolve, onClose, room }) {
  const numMirrors = room?.throne_game?.numMirrors ?? 3
  const instruction = room?.throne_game?.instruction || 'Click each mirror to rotate (0°, 90°, 180°, 270°). Match the carved clue above.'
  const trapMessage = room?.throne_game?.trapMessage || 'The light triggers a trap!'
  const symbols = room?.throne_game?.symbols || '⚜ 👑 ⚜'

  const [angles, setAngles] = useState(Array(numMirrors).fill(0))
  const [trap, setTrap] = useState(false)
  const [lightHit, setLightHit] = useState(false)
  const [trapBeam, setTrapBeam] = useState(false)

  useEffect(() => {
    if (!lightHit) return
    const t = setTimeout(() => setLightHit(false), LIGHT_HIT_DURATION_MS)
    return () => clearTimeout(t)
  }, [lightHit])

  useEffect(() => {
    if (!trapBeam) return
    const t = setTimeout(() => setTrapBeam(false), 800)
    return () => clearTimeout(t)
  }, [trapBeam])

  const cycleMirror = (i) => {
    const idx = ANGLES.indexOf(angles[i])
    const next = (idx + 1) % ANGLES.length
    const nextAngles = [...angles]
    nextAngles[i] = ANGLES[next]
    setAngles(nextAngles)
    setTrap(false)
  }

  const handleCheck = async () => {
    setTrap(false)
    try {
      await onSolve(angles.join(','))
      setLightHit(true)
      await new Promise((r) => setTimeout(r, SUCCESS_ANIMATION_MS))
      onClose()
    } catch {
      setLightHit(false)
      setTrap(true)
      setTrapBeam(true)
    }
  }

  return (
    <div className={`${styles.throneScene} ${trap ? styles.trapShake : ''}`}>
      <h2 className={styles.title}>{room?.title ?? 'Throne Room'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.instruction}>{instruction}</p>

      <div className={`${styles.lightPuzzle} ${trap ? styles.trapActive : ''}`}>
        {lightHit && <div className={styles.lightBeam} aria-hidden />}
        {trapBeam && <div className={styles.trapBeam} aria-hidden />}
        <div className={styles.sunWrap}>
          <div className={styles.sun} aria-hidden>☀</div>
          <span className={styles.zoneLabel}>Light</span>
        </div>
        <div className={styles.mirrorsWrap}>
          <span className={styles.zoneLabel}>Mirrors</span>
          <div className={styles.mirrors}>
            {angles.map((angle, i) => (
              <div key={i} className={styles.mirrorWrap}>
                <div
                  className={styles.mirror}
                  style={{ transform: `rotate(${angle}deg)` }}
                  title={`Mirror ${i + 1}: ${angle}°`}
                  aria-hidden
                >
                  <span className={styles.mirrorFace}>▲</span>
                </div>
                <button
                  type="button"
                  className={styles.angleBtn}
                  onClick={() => cycleMirror(i)}
                  aria-label={`Mirror ${i + 1}: rotate (current ${angle}°)`}
                >
                  {angle}°
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.glassWrap}>
          <div className={`${styles.glass} ${lightHit ? styles.symbolsHit : ''} ${trap ? styles.symbolsTrap : ''}`}>
            <span className={styles.symbols}>{symbols}</span>
          </div>
          <span className={styles.zoneLabel}>Symbols</span>
        </div>
      </div>

      {trap && <p className={styles.trapMessage}>{trapMessage}</p>}

      <div className={styles.actions}>
        <button type="button" onClick={handleCheck} className={styles.checkBtn}>
          Align light
        </button>
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
