import { useState } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './PuzzleRoyalLineage.module.css'

const DEFAULT_RULERS = [
  { name: 'King Aldric', title: 'the Founder', symbol: '🏰' },
  { name: 'Queen Seraphine', title: 'the Peacemaker', symbol: '🕊️' },
  { name: 'King Rowan', title: 'the Conqueror', symbol: '⚔️' },
  { name: 'King Cedric', title: 'the Just', symbol: '⚖️' },
  { name: 'Princess Elowen', title: 'the Heir', symbol: '🌹' },
]
const DEFAULT_CLUES = [
  'The Founder did not see peace in his lifetime.',
  'The Conqueror did not rule first, nor did he rule last.',
  'The Peacemaker ruled immediately after a time of war.',
  'The Just did not follow the Founder directly.',
  'The Rose came after Justice.',
]
// Logic solution: Aldric, Rowan, Seraphine, Cedric, Elowen
const CORRECT_ORDER = [0, 2, 1, 3, 4]
const SHUFFLED_START = [1, 0, 3, 2, 4] // 🕊️ 🏰 ⚖️ ⚔️ 🌹

export default function PuzzleRoyalLineage({ room, onSolve, onClose }) {
  const config = room?.royal_lineage || {}
  const rulers = config.rulers ?? DEFAULT_RULERS
  const scrollClues = config.scrollClues ?? DEFAULT_CLUES
  const instruction = config.instruction || 'Set the crests in the order of reign. Use the scroll to deduce the sequence.'
  // Legend only: symbol → title, shown in non-answer order so it doesn't reveal sequence
  const canopyLegend = [...(config.rulers ?? DEFAULT_RULERS)].sort((a, b) => String(a.symbol).localeCompare(String(b.symbol)))

  const [order, setOrder] = useState(config.initialOrder ?? SHUFFLED_START)
  const [selected, setSelected] = useState(null)
  const [lockFeedback, setLockFeedback] = useState(null)
  const [solved, setSolved] = useState(false)

  const handleSlotClick = (position) => {
    if (solved) return
    playEffect('click')
    setLockFeedback(null)
    if (selected === null) {
      setSelected(position)
      return
    }
    if (selected === position) {
      setSelected(null)
      return
    }
    const next = [...order]
    const a = order[selected]
    next[selected] = next[position]
    next[position] = a
    setOrder(next)
    setSelected(null)
  }

  const tryLock = () => {
    if (solved) return
    playEffect('click')
    const correct = order.length === CORRECT_ORDER.length && order.every((v, i) => v === CORRECT_ORDER[i])
    if (correct) {
      playEffect('success')
      setSolved(true)
      setLockFeedback('unlocked')
      setTimeout(() => onSolve(order.join(',')), 600)
    } else {
      playEffect('fail')
      setLockFeedback('resists')
    }
  }

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Nursery'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.hint}>{instruction}</p>

      <div className={styles.scroll}>
        <div className={styles.scrollInner}>
          <div className={styles.scrollTitle}>Lineage of the Realm</div>
          <ul className={styles.scrollClues}>
            {scrollClues.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.canopyHint}>
        <span className={styles.canopyLabel}>Bed canopy embroidery — each symbol marks a ruler:</span>
        <div className={styles.canopyLegend}>
          {canopyLegend.map((r, i) => (
            <span key={i} className={styles.canopyPair}>
              {r.symbol} <em>({r.title})</em>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.lockSection}>
        <div className={styles.lockRing}>
          {order.map((rulerIndex, position) => (
            <button
              key={`${position}-${rulerIndex}`}
              type="button"
              className={`${styles.crestSlot} ${selected === position ? styles.selected : ''}`}
              onClick={() => handleSlotClick(position)}
              disabled={solved}
              title={rulers[rulerIndex]?.name}
            >
              <span className={styles.crestSymbol}>{rulers[rulerIndex]?.symbol ?? '?'}</span>
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.tryLockBtn}
            onClick={tryLock}
            disabled={solved}
          >
            Try lock
          </button>
          <button type="button" onClick={() => { playEffect('click'); onClose(); }} className={styles.closeBtn}>
            Close
          </button>
        </div>
        {lockFeedback === 'resists' && (
          <p className={styles.feedbackResist}>The mechanism does not turn.</p>
        )}
        {lockFeedback === 'unlocked' && (
          <p className={styles.feedbackUnlock}>The lock yields. The door opens.</p>
        )}
      </div>
    </div>
  )
}
