import { useState } from 'react'
import styles from './PuzzleDungeonCode.module.css'

export default function PuzzleDungeonCode({ onSolve, onClose, room, submitError, onClearError }) {
  const digits = room?.code_lock?.digits ?? 4
  const instruction = room?.code_lock?.instruction || 'Enter the code.'
  const chronicle = room?.scene || room?.atmosphere || ''
  const [values, setValues] = useState(Array(digits).fill(''))
  const [wrong, setWrong] = useState(false)
  const showWrong = wrong || !!submitError

  const setDigit = (i, v) => {
    onClearError?.()
    const next = [...values]
    next[i] = v.replace(/\D/g, '').slice(-1)
    setValues(next)
    setWrong(false)
    if (i < digits - 1 && next[i]) document.getElementById(`dungeon-digit-${i + 1}`)?.focus()
  }

  const submit = () => {
    const code = values.join('')
    if (code.length !== digits) return
    onSolve(code)
  }

  return (
    <div className={styles.dungeonScene}>
      <h2 className={styles.title}>{room?.title ?? 'Dungeon'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.chronicleTitle}>Carved in the Stone</p>
      <div className={styles.chroniclePanel}>
        <p className={styles.chronicleProse}>{chronicle}</p>
      </div>
      <p className={styles.instruction}>{instruction}</p>
      <div className={styles.shackleLock}>
        {values.map((v, i) => (
          <input
            key={i}
            id={`dungeon-digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => setDigit(i, e.target.value)}
            className={showWrong ? styles.digitWrong : styles.digit}
          />
        ))}
      </div>
      {showWrong && (
        <p className={styles.wrong} aria-live="polite">
          {submitError || 'Wrong code.'}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" onClick={submit} className={styles.unlockBtn}>Release</button>
        <button type="button" onClick={onClose} className={styles.leaveBtn}>Leave</button>
      </div>
    </div>
  )
}
