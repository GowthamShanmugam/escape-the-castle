import { useState } from 'react'
import styles from './Puzzles.module.css'

export default function PuzzleSequence({ onSolve, onClose, room, submitError, onClearError }) {
  const labels = room?.sequence?.labels ?? ['A', 'B', 'C', 'D', 'E']
  const instruction = room?.sequence?.instruction || 'Arrange the symbols in the correct order.'
  const runeKey = room?.sequence?.rune_key
  const isKitchen = room?.title === 'Kitchen'
  const [order, setOrder] = useState([0, 1, 2, 3, 4].slice(0, labels.length))
  const [selected, setSelected] = useState(null)
  const [wrong, setWrong] = useState(false)
  const showWrong = wrong || !!submitError

  const handleClick = (idx) => {
    onClearError?.()
    if (selected === null) {
      setSelected(idx)
      setWrong(false)
      return
    }
    if (selected === idx) {
      setSelected(null)
      return
    }
    const next = [...order]
    const a = order[selected]
    next[selected] = next[idx]
    next[idx] = a
    setOrder(next)
    setSelected(null)
    setWrong(false)
  }

  const check = () => {
    onClearError?.()
    onSolve(order.join(','))
  }

  const recipeBlock = (
    <div className={styles.recipeBlock}>
      <p className={styles.hint}>{instruction}</p>
      {runeKey && <p className={styles.runeKey}>{runeKey}</p>}
    </div>
  )

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Sequence'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      {isKitchen ? recipeBlock : <p className={styles.hint}>{instruction}</p>}
      <div className={`${styles.sequence} ${showWrong ? styles.sequenceShake : ''}`}>
        {order.map((symbolIndex, position) => (
          <button
            key={`${position}-${symbolIndex}`}
            type="button"
            className={`${styles.symbolBtn} ${selected === position ? styles.selected : ''}`}
            onClick={() => handleClick(position)}
          >
            {labels[symbolIndex]}
          </button>
        ))}
      </div>
      {showWrong && (
        <p className={styles.wrong} aria-live="polite">
          {submitError || 'Wrong order.'}
        </p>
      )}
      <button type="button" onClick={check} className={styles.solveBtn}>
        {isKitchen ? 'Try larder' : 'Try lock'}
      </button>
      <button type="button" onClick={onClose} className={styles.closeBtn}>Close</button>
    </div>
  )
}
