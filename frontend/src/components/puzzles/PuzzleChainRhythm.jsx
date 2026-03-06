import { useState, useEffect, useRef } from 'react'
import { playEffect } from '../../audio/soundService'
import { useViewportScale } from '../../hooks/useViewportScale'
import styles from './PuzzleChainRhythm.module.css'

const CHAPEL_IMG = '/images/chapel-chain-rhythm.jpg'
const ARENA_WIDTH = 520
const ARENA_HEIGHT = 340
const N_CHAINS = 5
const BLINK_MS = 400

/**
 * Chapel resonant chains: indirect clue by blinking.
 * Wrong chain → that chain blinks N times (N = ordinal of the correct chain, 1–5), then sequence resets.
 */
export default function PuzzleChainRhythm({ onSolve, onClose, room }) {
  const config = room?.chain_rhythm || {}
  const labels = config.labels ?? ['I', 'II', 'III', 'IV', 'V']
  const instruction = config.instruction || 'Click chains to strike. Wrong chain resets—watch the blinks for feedback.'
  const feedbackOrder = config.feedback_order ?? [2, 0, 4, 1, 3]

  const [strikes, setStrikes] = useState([])
  const [struckId, setStruckId] = useState(null)
  const [blinkChainIndex, setBlinkChainIndex] = useState(null)
  const [blinkCount, setBlinkCount] = useState(0)
  const resetTimeoutRef = useRef(null)

  const isBlinking = blinkChainIndex !== null

  const handleStrike = (chainIndex) => {
    if (strikes.length >= N_CHAINS || isBlinking) return

    const step = strikes.length
    const correctIndex = feedbackOrder[step]

    if (chainIndex === correctIndex) {
      setStruckId(chainIndex)
      const time = Date.now()
      const nextStrikes = [...strikes, { index: chainIndex, time }]
      setStrikes(nextStrikes)
      if (nextStrikes.length === N_CHAINS) {
        const order = nextStrikes.map((s) => s.index)
        const intervals = nextStrikes.slice(1).map((s, i) => s.time - nextStrikes[i].time)
        onSolve(JSON.stringify({ order, intervals }))
      }
      setTimeout(() => setStruckId(null), 200)
      return
    }

    const correctOrdinal = correctIndex + 1
    setBlinkChainIndex(chainIndex)
    setBlinkCount(correctOrdinal)
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    resetTimeoutRef.current = setTimeout(() => {
      setStrikes([])
      setBlinkChainIndex(null)
      setBlinkCount(0)
      resetTimeoutRef.current = null
    }, BLINK_MS * correctOrdinal)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (strikes.length >= N_CHAINS || isBlinking) return
      const k = e.key
      const idx = k === '1' ? 0 : k === '2' ? 1 : k === '3' ? 2 : k === '4' ? 3 : k === '5' ? 4 : -1
      if (idx >= 0) {
        e.preventDefault()
        handleStrike(idx)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [strikes.length, isBlinking])

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (blinkChainIndex === null || blinkCount <= 0) return
    const timeouts = []
    for (let i = 0; i < blinkCount; i++) {
      timeouts.push(setTimeout(() => playEffect('tick'), i * BLINK_MS))
    }
    return () => timeouts.forEach((t) => clearTimeout(t))
  }, [blinkChainIndex, blinkCount])

  const handleReset = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    setStrikes([])
    setBlinkChainIndex(null)
    setBlinkCount(0)
  }

  const arenaWrapperRef = useRef(null)
  const arenaScale = useViewportScale(arenaWrapperRef, ARENA_WIDTH, ARENA_HEIGHT)

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{room?.title ?? 'Chapel'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.instruction}>{instruction}</p>
      <div className={styles.hud}>
        <span className={styles.strikeCount}>Strikes: {strikes.length} / {N_CHAINS}</span>
        <span className={styles.keyHint}>Keys 1–5 · Wrong chain resets</span>
      </div>
      <div ref={arenaWrapperRef} className={styles.arenaWrapper}>
        <div
          className={styles.arena}
          style={{
            width: ARENA_WIDTH,
            height: ARENA_HEIGHT,
            transform: `scale(${arenaScale})`,
            transformOrigin: 'top left',
          }}
        >
        <div
          className={styles.arenaBg}
          style={{ backgroundImage: `url(${CHAPEL_IMG})` }}
        />
        {labels.map((label, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.chain} ${struckId === idx ? styles.chainStruck : ''} ${blinkChainIndex === idx ? styles.chainBlink : ''}`}
            style={{
              left: `${14 + idx * 18}%`,
              top: '58%',
              ...(blinkChainIndex === idx && blinkCount > 0 ? { '--blink-count': blinkCount } : {}),
            }}
            onClick={() => handleStrike(idx)}
            disabled={strikes.length >= N_CHAINS || isBlinking}
            aria-label={`Chain ${label}`}
          >
            <span className={styles.chainLink} />
            <span className={styles.chainBar} />
            <span className={styles.chainLink} />
          </button>
        ))}
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={handleReset} className={styles.resetBtn}>
          Reset
        </button>
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
