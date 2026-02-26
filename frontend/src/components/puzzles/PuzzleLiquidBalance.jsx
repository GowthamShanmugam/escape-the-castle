import { useState, useRef, useEffect } from 'react'
import { playEffect } from '../../audio/soundService'
import { useViewportScale } from '../../hooks/useViewportScale'
import styles from './PuzzleLiquidBalance.module.css'

const TICK_MS = 150
const DEFAULT_BALANCE_THRESHOLD = 5
const CLOSE_THRESHOLD = 15
const DEFAULT_STABLE_TICKS = 7
const DEFAULT_INITIAL_LEVELS = [70, 40, 20]
const RATE_FAST = 1.8
const RATE_SLOW = 0.5
const RATE_PULSE = 1.0
const LEAK = 0.06
const LEAK_C = 0.04
const PULSE_EVERY = 3
const VAT_LABELS = 'ABCDEFGHIJ'.split('')

export default function PuzzleLiquidBalance({ onSolve, onClose, room }) {
  const lb = room?.liquid_balance
  const vatCount = lb?.vat_count ?? 3
  const balanceThreshold = lb?.balance_threshold ?? DEFAULT_BALANCE_THRESHOLD
  const stableTicks = lb?.stable_ticks ?? DEFAULT_STABLE_TICKS
  const ambientLeakScale = lb?.ambient_leak_scale ?? 1

  const rawInitial = lb?.initial_levels
  const initialLevels = (Array.isArray(rawInitial) && rawInitial.length === vatCount)
    ? rawInitial
    : vatCount === 3 ? DEFAULT_INITIAL_LEVELS : Array(vatCount).fill(0).map((_, i) => 100 - (i * 25))

  const valveCount = vatCount === 3 ? 3 : vatCount - 1
  const initialValves = Array(valveCount).fill(false)

  const [levels, setLevels] = useState(initialLevels)
  const [valves, setValves] = useState(initialValves)
  const [solved, setSolved] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const levelsRef = useRef(initialLevels)
  const valvesRef = useRef(initialValves)
  const tickCountRef = useRef(0)
  const stableCountRef = useRef(0)
  const solvedRef = useRef(false)
  const lastDripRef = useRef(0)

  useEffect(() => {
    levelsRef.current = levels
  }, [levels])
  useEffect(() => {
    valvesRef.current = valves
  }, [valves])

  useEffect(() => {
    if (solvedRef.current) return
    const interval = setInterval(() => {
      const l = [...levelsRef.current]
      const v = [...valvesRef.current]
      tickCountRef.current += 1
      const tick = tickCountRef.current

      if (vatCount === 3) {
        // Legacy 3-vat: Valve 0 A→B fast, Valve 1 B↔C slow+leak, Valve 2 pulsed B↔C
        if (v[0] && l[0] > 0) {
          const move = Math.min(RATE_FAST, l[0], 100 - l[1])
          l[0] -= move
          l[1] += move
        }
        if (v[1]) {
          const move = Math.min(RATE_SLOW, Math.abs(l[1] - l[2]) / 2)
          if (l[1] > l[2]) {
            l[1] -= move
            l[2] += move
          } else if (l[2] > l[1]) {
            l[2] -= move
            l[1] += move
          }
          l[1] = Math.max(0, l[1] - LEAK)
          l[2] = Math.max(0, l[2] - LEAK_C)
        }
        if (v[2] && tick % PULSE_EVERY === 0) {
          const move = Math.min(RATE_PULSE, Math.abs(l[1] - l[2]) / 2)
          if (l[1] > l[2]) {
            l[1] -= move
            l[2] += move
          } else if (l[2] > l[1]) {
            l[2] -= move
            l[1] += move
          }
        }
        l[1] = Math.max(0, l[1] - LEAK * 0.3 * ambientLeakScale)
        l[2] = Math.max(0, l[2] - LEAK_C * 0.3 * ambientLeakScale)
      } else {
        // Generic N-vat: valve i connects vat i and vat i+1, flow high→low. One pipe drips (middle, like 3-vat B–C)
        const dripPipeIndex = Math.floor(valveCount / 2)
        for (let i = 0; i < valveCount; i++) {
          if (v[i]) {
            const move = Math.min(RATE_SLOW, Math.abs(l[i] - l[i + 1]) / 2)
            if (l[i] > l[i + 1]) {
              l[i] -= move
              l[i + 1] += move
            } else if (l[i + 1] > l[i]) {
              l[i + 1] -= move
              l[i] += move
            }
            if (i === dripPipeIndex) {
              l[i] = Math.max(0, l[i] - LEAK)
              l[i + 1] = Math.max(0, l[i + 1] - LEAK_C)
            }
          }
        }
        // Ambient leak: only the drip pipe (both vats)
        l[dripPipeIndex] = Math.max(0, l[dripPipeIndex] - LEAK * 0.3 * ambientLeakScale)
        l[dripPipeIndex + 1] = Math.max(0, l[dripPipeIndex + 1] - LEAK_C * 0.3 * ambientLeakScale)
      }

      if (vatCount === 3 && v[1] && (l[1] > 0 || l[2] > 0) && tick - lastDripRef.current >= 18) {
        lastDripRef.current = tick
        playEffect('drip')
      } else if (vatCount > 3) {
        const dripIdx = Math.floor(valveCount / 2)
        if (v[dripIdx] && (l[dripIdx] > 0 || l[dripIdx + 1] > 0) && tick - lastDripRef.current >= 18) {
          lastDripRef.current = tick
          playEffect('drip')
        }
      }

      for (let i = 0; i < vatCount; i++) l[i] = Math.max(0, Math.min(100, l[i]))
      setLevels(l)

      const range = Math.max(...l) - Math.min(...l)
      const allClosed = v.every((x) => !x)
      if (range < balanceThreshold && allClosed) {
        stableCountRef.current += 1
        if (stableCountRef.current >= stableTicks) {
          solvedRef.current = true
          setSolved(true)
          setShowSuccess(true)
          setTimeout(() => onSolve('balanced'), 800)
        }
      } else {
        stableCountRef.current = 0
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [onSolve, balanceThreshold, stableTicks, ambientLeakScale, vatCount, valveCount])

  const toggleValve = (i) => {
    if (solved) return
    playEffect('click')
    setValves((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const range = Math.max(...levels) - Math.min(...levels)
  const isClose = range < CLOSE_THRESHOLD && !solved
  const instruction = room?.liquid_balance?.instruction || 'Click valve wheels to open/close pipes. Balance all vats at the marks.'

  const vatsWrapperRef = useRef(null)
  const contentW = Math.min(560, 90 * vatCount + 60)
  const contentH = vatCount <= 3 ? 180 : 160
  const vatsScale = useViewportScale(vatsWrapperRef, contentW, contentH)

  // 3-vat: vat+valve under each vat, pipes between (legacy layout). 5-vat: vat, pipe+valve, vat, ...
  const renderVatsRow = () => {
    if (vatCount === 3) {
      return [0, 'pipeAB', 1, 'pipeBC', 2].map((item) =>
        item === 'pipeAB' ? (
          <div key="pipeAB" className={styles.pipe} aria-hidden />
        ) : item === 'pipeBC' ? (
          <div key="pipeBC" className={`${styles.pipe} ${styles.pipeDrip}`} aria-hidden />
        ) : (
          <div key={item} className={styles.vatWrapper}>
            <div className={styles.vat}>
              <div className={styles.vatSlit}>
                <div
                  className={`${styles.liquid} ${isClose && range < balanceThreshold ? styles.still : ''}`}
                  style={{ height: `${levels[item]}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              className={`${styles.valve} ${valves[item] ? styles.valveOpen : ''}`}
              onClick={() => toggleValve(item)}
              disabled={solved}
              aria-label={`Valve ${VAT_LABELS[item]} ${valves[item] ? 'open' : 'closed'}`}
            >
              <span className={styles.valveWheel} />
            </button>
            <span className={styles.vatLabel}>{VAT_LABELS[item]}</span>
          </div>
        )
      )
    }
    const items = []
    for (let i = 0; i < vatCount; i++) {
      items.push(
        <div key={`vat-${i}`} className={styles.vatWrapper}>
          <div className={styles.vat}>
            <div className={styles.vatSlit}>
              <div
                className={`${styles.liquid} ${isClose && range < balanceThreshold ? styles.still : ''}`}
                style={{ height: `${levels[i]}%` }}
              />
            </div>
          </div>
          <div className={styles.valveSpacer} aria-hidden />
          <span className={styles.vatLabel}>{VAT_LABELS[i]}</span>
        </div>
      )
      if (i < valveCount) {
        const dripPipeIdx = Math.floor(valveCount / 2)
        const pipeClass = i === dripPipeIdx ? `${styles.pipe} ${styles.pipeDrip}` : styles.pipe
        items.push(
          <div key={`pv-${i}`} className={styles.pipeValveSegment}>
            <div className={pipeClass} aria-hidden />
            <button
              type="button"
              className={`${styles.valve} ${valves[i] ? styles.valveOpen : ''}`}
              onClick={() => toggleValve(i)}
              disabled={solved}
              aria-label={`Valve ${VAT_LABELS[i]}-${VAT_LABELS[i + 1]} ${valves[i] ? 'open' : 'closed'}`}
            >
              <span className={styles.valveWheel} />
            </button>
          </div>
        )
      }
    }
    return items
  }

  return (
    <div className={`${styles.puzzle} ${vatCount > 3 ? styles.puzzleCompact : ''}`}>
      <h2>{room?.title ?? 'Wine Cellar'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.hint}>{instruction}</p>

      <div ref={vatsWrapperRef} className={styles.vatsWrapper}>
        <div
          className={`${styles.vatsRow} ${vatCount > 3 ? styles.vatsRowCompact : ''} ${isClose ? styles.glow : ''} ${showSuccess ? styles.success : ''}`}
          style={{
            transform: `scale(${vatsScale})`,
            transformOrigin: 'center bottom',
          }}
        >
          {renderVatsRow()}
        </div>
      </div>

      <button type="button" onClick={onClose} className={styles.closeBtn}>
        Close
      </button>
    </div>
  )
}
