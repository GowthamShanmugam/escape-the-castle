/**
 * On-screen touch controls for mobile. Shows when viewport <= 768px.
 * Use for puzzles that require arrow keys, space, E, etc.
 */
import { useState, useEffect, useRef } from 'react'
import styles from './TouchControls.module.css'

export function useShowTouchControls() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const check = () => {
      const mq = window.matchMedia('(max-width: 768px)')
      const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0
      // Show on narrow viewport OR when touch device (fixes in-app browsers, PWA, "desktop site" mode)
      setShow(mq.matches || (isTouch && window.innerWidth <= 1024))
    }
    check()
    const mq = window.matchMedia('(max-width: 768px)')
    const mq1024 = window.matchMedia('(max-width: 1024px)')
    const onChange = () => check()
    mq.addEventListener('change', onChange)
    mq1024.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      mq1024.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])
  return show
}

/** D-pad: up/down/left/right. Pass keysRef = { current: { up, down, left, right } } */
export function TouchDpad({ keysRef, variant = 'full' }) {
  const show = useShowTouchControls()
  if (!show || !keysRef) return null

  const setKey = (dir, value) => {
    if (keysRef.current) keysRef.current[dir] = value
  }

  const btn = (dir, label) => (
    <button
      type="button"
      className={styles.dpadBtn}
      onPointerDown={(e) => { e.preventDefault(); setKey(dir, true) }}
      onPointerUp={(e) => { e.preventDefault(); setKey(dir, false) }}
      onPointerLeave={(e) => { e.currentTarget.releasePointerCapture?.(e.pointerId); setKey(dir, false) }}
      onPointerCancel={() => setKey(dir, false)}
      aria-label={label}
    >
      {label === 'Up' && '↑'}
      {label === 'Down' && '↓'}
      {label === 'Left' && '←'}
      {label === 'Right' && '→'}
    </button>
  )

  if (variant === 'vertical') {
    return (
      <div className={`${styles.dpad} ${styles.dpadVertical}`}>
        {btn('up', 'Up')}
        {btn('down', 'Down')}
      </div>
    )
  }

  return (
    <div className={styles.dpad}>
      <div className={styles.dpadRow}>
        {btn('up', 'Up')}
      </div>
      <div className={styles.dpadRow}>
        {btn('left', 'Left')}
        <span className={styles.dpadCenter} aria-hidden />
        {btn('right', 'Right')}
      </div>
      <div className={styles.dpadRow}>
        {btn('down', 'Down')}
      </div>
    </div>
  )
}

/** Action button (Jump, Dash, Activate, Run) - sets key on press, clears on release */
export function TouchActionButton({ keysRef, keyName, label, title, className }) {
  const show = useShowTouchControls()
  if (!show || !keysRef) return null

  return (
    <button
      type="button"
      className={`${styles.actionBtn} ${className || ''}`}
      title={title}
      onPointerDown={(e) => { e.preventDefault(); keysRef.current[keyName] = true }}
      onPointerUp={(e) => { e.preventDefault(); keysRef.current[keyName] = false }}
      onPointerLeave={(e) => { e.currentTarget.releasePointerCapture?.(e.pointerId); keysRef.current[keyName] = false }}
      onPointerCancel={() => { keysRef.current[keyName] = false }}
      aria-label={label}
    >
      {label}
    </button>
  )
}

/** Wrapper for action buttons - positions them on the right */
export function TouchActionGroup({ children }) {
  const show = useShowTouchControls()
  if (!show || !children) return null
  return <div className={styles.actionGroup}>{children}</div>
}

/** D-pad for tap-to-move puzzles (RealityShift). onMove(dy, dx) called once per tap. */
export function TouchMoveButtons({ onMove, onActivate }) {
  const show = useShowTouchControls()
  if (!show || !onMove) return null

  const move = (dy, dx) => onMove(dy, dx)
  const btn = (dy, dx, label) => (
    <button
      type="button"
      className={styles.dpadBtn}
      onPointerDown={(e) => { e.preventDefault(); move(dy, dx) }}
      onPointerUp={(e) => e.preventDefault()}
      aria-label={label}
    >
      {label === 'Up' && '↑'}
      {label === 'Down' && '↓'}
      {label === 'Left' && '←'}
      {label === 'Right' && '→'}
    </button>
  )

  return (
    <div className={styles.moveControls}>
      <div className={styles.dpad}>
        <div className={styles.dpadRow}>{btn(-1, 0, 'Up')}</div>
        <div className={styles.dpadRow}>
          {btn(0, -1, 'Left')}
          <span className={styles.dpadCenter} aria-hidden />
          {btn(0, 1, 'Right')}
        </div>
        <div className={styles.dpadRow}>{btn(1, 0, 'Down')}</div>
      </div>
      {onActivate && (
        <TouchActivateButton onActivate={onActivate} />
      )}
    </div>
  )
}

export function TouchActivateButton({ onActivate }) {
  const show = useShowTouchControls()
  const lastFireRef = useRef(0)
  if (!show) return null

  const handleActivate = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const now = Date.now()
    if (now - lastFireRef.current < 250) return
    lastFireRef.current = now
    onActivate()
  }

  return (
    <button
      type="button"
      className={`${styles.actionBtn} ${styles.activateBtn}`}
      onPointerDown={handleActivate}
      onClick={handleActivate}
      aria-label="Activate (E)"
    >
      E
    </button>
  )
}
