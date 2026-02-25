import { useState, useRef, useEffect } from 'react'
import styles from './Puzzles.module.css'

const KEY_POSITION = { x: 72, y: 35 }
const TOLERANCE = 12

export default function PuzzleTorch({ onSolve, onClose, room }) {
  const [torch, setTorch] = useState({ x: 50, y: 50 })
  const [found, setFound] = useState(false)
  const boxRef = useRef(null)

  const handleMove = (e) => {
    if (!boxRef.current || found) return
    const rect = boxRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTorch({ x, y })
  }

  useEffect(() => {
    if (found) return
    const dx = torch.x - KEY_POSITION.x
    const dy = torch.y - KEY_POSITION.y
    if (Math.hypot(dx, dy) < TOLERANCE) setFound(true)
  }, [torch, found])

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Entrance Hall'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.instruction}>Move your torch through the darkness to find the key.</p>
      <div
        ref={boxRef}
        className={styles.torchBox}
        onMouseMove={handleMove}
      >
        <div
          className={styles.torchLight}
          style={{ '--x': `${torch.x}%`, '--y': `${torch.y}%` }}
        />
        {found && (
          <div
            className={styles.keyFound}
            style={{ left: `${KEY_POSITION.x}%`, top: `${KEY_POSITION.y}%` }}
          >
            Key found
          </div>
        )}
      </div>
      {found && (
        <button type="button" onClick={onSolve} className={styles.solveBtn}>
          Use key — Open door
        </button>
      )}
      <button type="button" onClick={onClose} className={styles.closeBtn}>Close</button>
    </div>
  )
}
