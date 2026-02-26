import { useState, useEffect, useRef, useCallback } from 'react'
import { playEffect } from '../../audio/soundService'
import { TouchDpad } from '../TouchControls'
import { useViewportScale } from '../../hooks/useViewportScale'
import styles from './PuzzleTowerClimb.module.css'

const TICK_MS = 50
const AREA_WIDTH = 200
const AREA_HEIGHT = 380
const PLAYER_W = 24
const PLAYER_H = 32
const ARROW_W = 8
const ARROW_H = 22
/* Slightly smaller collision boxes so hit only registers when arrow and climber visibly overlap (no "gap" false hit) */
const COLLIDE_PAD = 5
const PLAYER_COLLIDE_W = Math.max(8, PLAYER_W - COLLIDE_PAD)
const PLAYER_COLLIDE_H = Math.max(16, PLAYER_H - COLLIDE_PAD)
const ARROW_COLLIDE_W = Math.max(4, ARROW_W - COLLIDE_PAD)
const ARROW_COLLIDE_H = Math.max(10, ARROW_H - COLLIDE_PAD)
const CLIMB_SPEED = 1.8
const MOVE_SPEED = 2.2
const SUMMIT_Y = 20

export default function PuzzleTowerClimb({ room, onSolve, onClose }) {
  const cfg = room?.tower_climb || {}
  const instruction = cfg.instruction || "↑↓←→ or arrow keys to climb. Dodge the arrows. Stamina depletes. Reach the top to unlock the door."
  const staminaMax = cfg.staminaMax ?? 100
  const staminaDrain = cfg.staminaDrain ?? 0.9
  const staminaRefill = cfg.staminaRefill ?? 0.5
  const windStrength = cfg.windStrength ?? 0.8
  const arrowInterval = cfg.arrowInterval ?? 4500
  const arrowSpeed = cfg.arrowSpeed ?? 0.82
  const arrowsPerVolley = cfg.arrowsPerVolley ?? 3
  const arrowVolleyDelay = cfg.arrowVolleyDelay ?? 600

  const [status, setStatus] = useState('playing') // 'playing' | 'fail' | 'success'
  const [failReason, setFailReason] = useState('')
  const [stamina, setStamina] = useState(staminaMax)
  const [playerX, setPlayerX] = useState(AREA_WIDTH / 2 - PLAYER_W / 2)
  const [playerY, setPlayerY] = useState(AREA_HEIGHT - PLAYER_H - 20)
  const [arrows, setArrows] = useState([])
  const [windOffset, setWindOffset] = useState(0)

  const keysRef = useRef({ up: false, down: false, left: false, right: false })
  const arrowsRef = useRef([])
  const lastArrowVolleyRef = useRef(0)
  const nextArrowInVolleyRef = useRef(0)
  const arrowsSpawnedThisVolleyRef = useRef(0)
  const windPhaseRef = useRef(0)
  const playerXRef = useRef(AREA_WIDTH / 2 - PLAYER_W / 2)
  const playerYRef = useRef(AREA_HEIGHT - PLAYER_H - 20)
  const staminaRef = useRef(staminaMax)
  const configRef = useRef({ staminaMax, staminaDrain, staminaRefill, windStrength, arrowInterval, arrowSpeed, arrowsPerVolley, arrowVolleyDelay })

  configRef.current = { staminaMax, staminaDrain, staminaRefill, windStrength, arrowInterval, arrowSpeed, arrowsPerVolley, arrowVolleyDelay }

  const reset = useCallback(() => {
    const now = Date.now()
    setStatus('playing')
    setFailReason('')
    playerXRef.current = AREA_WIDTH / 2 - PLAYER_W / 2
    playerYRef.current = AREA_HEIGHT - PLAYER_H - 20
    staminaRef.current = staminaMax
    setStamina(staminaMax)
    setPlayerX(playerXRef.current)
    setPlayerY(playerYRef.current)
    setArrows([])
    arrowsRef.current = []
    lastArrowVolleyRef.current = now
    nextArrowInVolleyRef.current = now
    arrowsSpawnedThisVolleyRef.current = 0
    windPhaseRef.current = 0
    setWindOffset(0)
  }, [staminaMax])

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = true
      if (k === 'arrowdown' || k === 's') keysRef.current.down = true
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = true
      if (k === 'arrowright' || k === 'd') keysRef.current.right = true
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) e.preventDefault()
    }
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = false
      if (k === 'arrowdown' || k === 's') keysRef.current.down = false
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = false
      if (k === 'arrowright' || k === 'd') keysRef.current.right = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const arenaWrapperRef = useRef(null)
  const arenaScale = useViewportScale(arenaWrapperRef, AREA_WIDTH, AREA_HEIGHT)

  useEffect(() => {
    if (status === 'fail') playEffect('fail')
  }, [status])

  useEffect(() => {
    if (status !== 'playing') return

    const nowStart = Date.now()
    if (lastArrowVolleyRef.current === 0) lastArrowVolleyRef.current = nowStart
    if (nextArrowInVolleyRef.current === 0) nextArrowInVolleyRef.current = nowStart

    const interval = setInterval(() => {
      const cfg = configRef.current
      let x = playerXRef.current
      let y = playerYRef.current
      let st = staminaRef.current
      let arrowsList = [...arrowsRef.current]
      const now = Date.now()

      if (now - lastArrowVolleyRef.current >= cfg.arrowInterval) {
        lastArrowVolleyRef.current = now
        nextArrowInVolleyRef.current = now
        arrowsSpawnedThisVolleyRef.current = 0
      }
      if (arrowsSpawnedThisVolleyRef.current < cfg.arrowsPerVolley && now >= nextArrowInVolleyRef.current) {
        nextArrowInVolleyRef.current = now + cfg.arrowVolleyDelay
        arrowsSpawnedThisVolleyRef.current += 1
        arrowsList.push({
          id: `${now}-${arrowsSpawnedThisVolleyRef.current}`,
          x: 20 + Math.random() * (AREA_WIDTH - 40 - ARROW_W),
          y: 0,
        })
      }

      const moving = keysRef.current.up || keysRef.current.down || keysRef.current.left || keysRef.current.right
      if (moving) {
        st = Math.max(0, st - cfg.staminaDrain)
        if (st <= 0) {
          setStatus('fail')
          setFailReason('You ran out of stamina.')
          return
        }
        if (keysRef.current.up) y = Math.max(0, y - CLIMB_SPEED)
        if (keysRef.current.down) y = Math.min(AREA_HEIGHT - PLAYER_H, y + CLIMB_SPEED * 0.6)
        if (keysRef.current.left) x = Math.max(0, x - MOVE_SPEED)
        if (keysRef.current.right) x = Math.min(AREA_WIDTH - PLAYER_W, x + MOVE_SPEED)
      } else {
        st = Math.min(cfg.staminaMax, st + cfg.staminaRefill)
      }
      staminaRef.current = st
      setStamina(st)

      windPhaseRef.current += 0.02
      const wind = Math.sin(windPhaseRef.current) * cfg.windStrength
      x += wind
      setWindOffset(wind)

      if (x < 0 || x > AREA_WIDTH - PLAYER_W) {
        setStatus('fail')
        setFailReason('The wind blew you off the tower.')
        return
      }

      arrowsList = arrowsList.filter((arr) => {
        arr.y += cfg.arrowSpeed
        if (arr.y > AREA_HEIGHT) return false
        const px = x + PLAYER_W / 2
        const py = y + PLAYER_H / 2
        const ax = arr.x + ARROW_W / 2
        const ay = arr.y + ARROW_H / 2
        const distX = Math.abs(px - ax)
        const distY = Math.abs(py - ay)
        if (distX < (PLAYER_COLLIDE_W + ARROW_COLLIDE_W) / 2 && distY < (PLAYER_COLLIDE_H + ARROW_COLLIDE_H) / 2) {
          setStatus('fail')
          setFailReason('An arrow hit you!')
          return false
        }
        return true
      })
      arrowsRef.current = arrowsList
      setArrows([...arrowsList])

      if (y <= SUMMIT_Y) {
        setStatus('success')
        onSolve('summit')
        return
      }

      playerXRef.current = x
      playerYRef.current = y
      setPlayerX(x)
      setPlayerY(y)
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [status, onSolve])

  return (
    <div className={`${styles.wrap} touchSafe`}>
      <TouchDpad keysRef={keysRef} />
      <h2 className={styles.title}>{room?.title ?? 'Tower'}</h2>
      <p className={styles.instruction}>{instruction}</p>

      <div className={styles.hud}>
        <div className={styles.staminaLabel}>Stamina</div>
        <div className={styles.staminaTrack}>
          <div className={styles.staminaBar} style={{ width: `${Math.max(0, (stamina / staminaMax) * 100)}%` }} />
        </div>
        {Math.abs(windOffset) > 0.3 && (
          <div className={styles.windIndicator}>
            Wind: {windOffset > 0 ? '→' : '←'}
          </div>
        )}
      </div>

      <div ref={arenaWrapperRef} className={styles.arenaWrapper}>
        <div
          className={styles.arena}
          style={{
            width: AREA_WIDTH,
            height: AREA_HEIGHT,
            transform: `scale(${arenaScale})`,
            transformOrigin: 'top center',
          }}
        >
        <div className={styles.towerBg} />
        {status === 'playing' && (
          <div className={styles.archerIcon} title="Archer">🏹</div>
        )}
        {arrows.map((arr) => (
          <div
            key={arr.id}
            className={styles.arrow}
            style={{ left: arr.x, top: arr.y, width: ARROW_W, height: ARROW_H }}
          />
        ))}
        {status === 'playing' && (
          <div
            className={styles.player}
            style={{
              left: playerX,
              top: playerY,
              width: PLAYER_W,
              height: PLAYER_H,
            }}
          >
            🧗
          </div>
        )}
        <div className={styles.summit}>▼ Summit</div>
        </div>
      </div>

      {status === 'fail' && (
        <div className={styles.result}>
          <p className={styles.failMsg}>{failReason}</p>
          <button type="button" className={styles.retryBtn} onClick={reset}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
