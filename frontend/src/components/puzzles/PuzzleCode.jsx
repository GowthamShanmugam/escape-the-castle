import { useState } from 'react'
import styles from './Puzzles.module.css'

export default function PuzzleCode({ onSolve, onClose, room }) {
  const digits = room?.code_lock?.digits ?? 4
  const instruction = room?.code_lock?.instruction || 'Enter the code.'
  const [values, setValues] = useState(Array(digits).fill(''))
  const [wrong, setWrong] = useState(false)

  const setDigit = (i, v) => {
    const next = [...values]
    next[i] = v.replace(/\D/g, '').slice(-1)
    setValues(next)
    setWrong(false)
    if (i < digits - 1 && next[i]) document.getElementById(`digit-${i + 1}`)?.focus()
  }

  const submit = () => {
    const code = values.join('')
    if (code.length !== digits) return
    onSolve(code)
  }

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Code lock'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.hint}>{instruction}</p>
      <div className={styles.codeLock}>
        {values.map((v, i) => (
          <input
            key={i}
            id={`digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => setDigit(i, e.target.value)}
            className={wrong ? styles.digitWrong : styles.digit}
          />
        ))}
      </div>
      {wrong && <p className={styles.wrong}>Wrong code.</p>}
      <button type="button" onClick={submit} className={styles.solveBtn}>Unlock</button>
      <button type="button" onClick={onClose} className={styles.closeBtn}>Close</button>
    </div>
  )
}
