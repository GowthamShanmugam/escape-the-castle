import { useState, useEffect, useRef, useCallback } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './PuzzleBubbleRound.module.css'

const VIEW_W = 400
const VIEW_H = 280
const BUBBLE_R = 14
const SCROLL_SPEED = 1.8
const GRAVITY = 0.04           // very light - bubble barely feels gravity
const LIFT_FORCE = 0.38        // gentle lift, responsive
const BUOYANCY = 0.12          // strong upward drift when idle (bubble floats up)
const AIR_DAMPING = 0.97      // smooth deceleration - floaty, not heavy
const MAX_VELOCITY = 2.0       // gentle movement, no fast drops
const MAP_W = 6600
const EXIT_X = MAP_W - 80
const CHECKPOINT_50_X = Math.floor(MAP_W * 0.5)
const CHECKPOINT_SPAWN_X = CHECKPOINT_50_X - 40

function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw))
  const nearestY = Math.max(ry, Math.min(cy, ry + rh))
  const dx = cx - nearestX
  const dy = cy - nearestY
  return dx * dx + dy * dy <= cr * cr
}

const PERSON_EMOJI = '🙆'  // person with arms up – fits "holding bubble" pose

function getBaseHazards() {
  return [
    { type: 'spike', x: 320, y: VIEW_H - 40, w: 60, h: 40 },
    { type: 'spike', x: 480, y: 0, w: 80, h: 36 },
    { type: 'spike', x: 640, y: VIEW_H - 44, w: 70, h: 44 },
    { type: 'steam', x: 820, y: 0, w: 50, h: 120, phase: 0, period: 1800 },
    { type: 'steam', x: 920, y: VIEW_H - 100, w: 50, h: 100, phase: 900, period: 1800 },
    { type: 'spike', x: 1100, y: 0, w: 60, h: 30 },
    { type: 'spike', x: 1100, y: VIEW_H - 35, w: 60, h: 35 },
    { type: 'blade', x: 1300, y: VIEW_H / 2 - 35, w: 80, h: 20, phase: 0, period: 1200 },
    { type: 'steam', x: 1520, y: 0, w: 45, h: 100, phase: 0, period: 1600 },
    { type: 'steam', x: 1520, y: VIEW_H - 90, w: 45, h: 90, phase: 800, period: 1600 },
    { type: 'steam', x: 1620, y: 0, w: 45, h: 110, phase: 400, period: 1600 },
    { type: 'steam', x: 1620, y: VIEW_H - 95, w: 45, h: 95, phase: 1200, period: 1600 },
    { type: 'spike', x: 1850, y: VIEW_H - 42, w: 65, h: 42 },
    { type: 'spike', x: 2000, y: 0, w: 70, h: 32 },
    { type: 'steam', x: 2200, y: 0, w: 48, h: 105, phase: 0, period: 1700 },
    { type: 'steam', x: 2300, y: VIEW_H - 95, w: 48, h: 95, phase: 850, period: 1700 },
    { type: 'blade', x: 2500, y: VIEW_H / 2 - 30, w: 75, h: 18, phase: 200, period: 1300 },
    { type: 'spike', x: 2700, y: VIEW_H - 38, w: 60, h: 38 },
    { type: 'spike', x: 2850, y: 0, w: 65, h: 35 },
    { type: 'steam', x: 3050, y: 0, w: 50, h: 115, phase: 100, period: 1750 },
    { type: 'steam', x: 3150, y: VIEW_H - 88, w: 50, h: 88, phase: 900, period: 1750 },
    { type: 'spike', x: 3350, y: VIEW_H - 40, w: 68, h: 40 },
    { type: 'blade', x: 3550, y: VIEW_H / 2 - 38, w: 82, h: 22, phase: 0, period: 1250 },
    { type: 'steam', x: 3800, y: 0, w: 46, h: 108, phase: 0, period: 1680 },
    { type: 'steam', x: 3800, y: VIEW_H - 92, w: 46, h: 92, phase: 840, period: 1680 },
    { type: 'spike', x: 4000, y: 0, w: 62, h: 30 },
    { type: 'spike', x: 4100, y: VIEW_H - 36, w: 64, h: 36 },
    { type: 'steam', x: 4300, y: 0, w: 48, h: 102, phase: 300, period: 1720 },
    { type: 'steam', x: 4400, y: VIEW_H - 98, w: 48, h: 98, phase: 860, period: 1720 },
    { type: 'blade', x: 4650, y: VIEW_H / 2 - 32, w: 78, h: 20, phase: 400, period: 1280 },
    { type: 'spike', x: 4900, y: VIEW_H - 44, w: 66, h: 44 },
    { type: 'spike', x: 5050, y: 0, w: 70, h: 34 },
    { type: 'steam', x: 5250, y: 0, w: 45, h: 110, phase: 0, period: 1650 },
    { type: 'steam', x: 5250, y: VIEW_H - 90, w: 45, h: 90, phase: 825, period: 1650 },
    { type: 'steam', x: 5450, y: 0, w: 45, h: 108, phase: 400, period: 1650 },
    { type: 'steam', x: 5450, y: VIEW_H - 92, w: 45, h: 92, phase: 1200, period: 1650 },
    { type: 'spike', x: 5750, y: 0, w: 60, h: 28 },
    { type: 'spike', x: 5750, y: VIEW_H - 32, w: 60, h: 32 },
    { type: 'blade', x: 5690, y: VIEW_H / 2 - 36, w: 80, h: 20, phase: 0, period: 1200 },
    { type: 'steam', x: 6250, y: 0, w: 46, h: 100, phase: 0, period: 1600 },
    { type: 'steam', x: 6250, y: VIEW_H - 88, w: 46, h: 88, phase: 800, period: 1600 },
  ]
}

function getExtraHazards() {
  return [
    { type: 'pillar', x: 1700, y: 0, w: 35, h: 100 },
    { type: 'pillar', x: 1740, y: VIEW_H - 95, w: 35, h: 95 },
    { type: 'swing', x: 3400, y: VIEW_H / 2 - 8, w: 12, h: 100, phase: 0, period: 2000 },
    { type: 'slide', x: 4800, y: VIEW_H - 40, w: 55, h: 40, phase: 0, period: 2500, range: 90 },
    { type: 'pillar', x: 5500, y: 0, w: 40, h: 85 },
    { type: 'pillar', x: 5555, y: VIEW_H - 90, w: 40, h: 90 },
    { type: 'crush', x: 5980, y: 0, w: 140, h: 45, phase: 300, period: 5500 },
    { type: 'crush', x: 5980, y: VIEW_H - 50, w: 140, h: 50, phase: 300, period: 5500 },
  ]
}

export default function PuzzleBubbleRound({ room, onSolve, onClose }) {
  const cfg = room?.bubble_round || {}
  const instruction =
    cfg.instruction ||
    'Hold ↑ to rise, ↓ to fall. Avoid steam, spikes, and blades. Reach the exit without popping.'

  const scrollSpeed = cfg.scrollSpeed ?? SCROLL_SPEED
  const gravity = cfg.gravity ?? GRAVITY
  const liftForce = cfg.liftForce ?? LIFT_FORCE
  const buoyancy = cfg.buoyancy ?? BUOYANCY
  const airDamping = cfg.airDamping ?? 0.97
  const maxVelocity = cfg.maxVelocity ?? 2.0

  const canvasRef = useRef(null)
  const keysRef = useRef({ up: false, down: false })
  const [gameState, setGameState] = useState('running') // running | popping | popped | complete
  const popPosRef = useRef({ x: 0, y: 0, cameraX: 0 })
  const checkpointRef = useRef({ x: 80, y: VIEW_H / 2 - BUBBLE_R })
  const stateRef = useRef({
    x: 80,
    y: VIEW_H / 2 - BUBBLE_R,
    velocityY: 0,
    cameraX: 0,
    lastTime: 0,
  })

  const hazardsRef = useRef([...getBaseHazards(), ...getExtraHazards()])
  const midCheckpoint = { x: CHECKPOINT_SPAWN_X, y: VIEW_H / 2 - BUBBLE_R }

  const startPos = { x: 80, y: VIEW_H / 2 - BUBBLE_R }
  const reset = useCallback((fromCheckpoint = false) => {
    keysRef.current = { up: false, down: false }
    const target = fromCheckpoint && checkpointRef.current.x >= CHECKPOINT_50_X - 100
      ? midCheckpoint
      : startPos
    stateRef.current = {
      x: target.x,
      y: target.y,
      velocityY: 0,
      cameraX: Math.max(0, target.x - 80),
      lastTime: performance.now(),
    }
    setGameState('running')
  }, [])

  useEffect(() => {
    if (gameState !== 'running') return

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = true
      if (k === 'arrowdown' || k === 's') keysRef.current.down = true
    }
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = false
      if (k === 'arrowdown' || k === 's') keysRef.current.down = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'running' || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    let rafId

    const loop = (timestamp) => {
      const dt = Math.min((timestamp - stateRef.current.lastTime) / 16, 4)
      stateRef.current.lastTime = timestamp
      const t = timestamp % 100000

      const s = stateRef.current
      const keys = keysRef.current

      s.x += scrollSpeed * dt
      s.velocityY += gravity * dt
      if (keys.up) {
        s.velocityY -= liftForce * dt
      } else if (keys.down) {
        s.velocityY += liftForce * 0.6 * dt
      } else {
        s.velocityY -= buoyancy * dt
      }
      s.velocityY *= airDamping
      s.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, s.velocityY))
      s.y += s.velocityY * dt

      s.cameraX = s.x - 100
      s.cameraX = Math.max(0, Math.min(MAP_W - VIEW_W, s.cameraX))

      if (s.x >= CHECKPOINT_50_X && checkpointRef.current.x < CHECKPOINT_50_X - 20) {
        checkpointRef.current = { ...midCheckpoint }
      }

      if (s.y - BUBBLE_R < 0 || s.y + BUBBLE_R > VIEW_H) {
        keysRef.current = { up: false, down: false }
        popPosRef.current = { x: s.x, y: s.y, cameraX: s.cameraX }
        playEffect('fail')
        setGameState('popping')
        rafId = requestAnimationFrame(loop)
        return
      }

      const hazards = hazardsRef.current
      for (const h of hazards) {
        let active = true
        let hx = h.x, hy = h.y, hw = h.w, hh = h.h
        if (h.type === 'steam') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          active = phase < 0.35
        } else if (h.type === 'blade') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          hy = h.y + Math.sin(phase * Math.PI * 2) * 60
        } else if (h.type === 'swing') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          hx = h.x + Math.sin(phase * Math.PI * 2) * 50
        } else if (h.type === 'slide') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          hx = h.x + Math.sin(phase * Math.PI * 2) * (h.range || 80)
        } else if (h.type === 'crush') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          active = phase > 0.78
          if (h.y < VIEW_H / 2) {
            hy = 0
            hh = phase < 0.78 ? 40 : 40 + ((phase - 0.78) / 0.22) * 100
          } else {
            hh = phase < 0.78 ? 45 : 45 + ((phase - 0.78) / 0.22) * 100
            hy = VIEW_H - hh
          }
        }
        if (active && circleRectOverlap(s.x, s.y, BUBBLE_R, hx, hy, hw, hh)) {
          keysRef.current = { up: false, down: false }
          popPosRef.current = { x: s.x, y: s.y, cameraX: s.cameraX }
          playEffect('fail')
          setGameState('popping')
          rafId = requestAnimationFrame(loop)
          return
        }
      }

      if (s.x + BUBBLE_R >= EXIT_X) {
        setGameState('complete')
        playEffect('success')
        onSolve('escaped')
        rafId = requestAnimationFrame(loop)
        return
      }

      ctx.fillStyle = '#1a2433'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
      ctx.fillStyle = '#0d1620'
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(((-s.cameraX % 80) + i * 80) - 80, 0, 2, VIEW_H)
      }
      ctx.fillStyle = '#2a3544'
      ctx.fillRect(0, VIEW_H - 8, VIEW_W + 200, 8)
      ctx.fillRect(0, 0, VIEW_W + 200, 8)

      const cam = s.cameraX
      for (const h of hazards) {
        let active = true
        let hx = h.x - cam, hy = h.y, hw = h.w, hh = h.h
        if (h.type === 'steam') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          active = phase < 0.35
          if (active) {
            ctx.fillStyle = 'rgba(180, 200, 220, 0.6)'
            ctx.fillRect(hx, hy, hw, hh)
          }
        } else if (h.type === 'spike') {
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(hx, hy, hw, hh)
          ctx.fillStyle = '#3a3030'
          ctx.beginPath()
          ctx.moveTo(hx, hy + hh)
          ctx.lineTo(hx + hw / 2, hy)
          ctx.lineTo(hx + hw, hy + hh)
          ctx.closePath()
          ctx.fill()
        } else if (h.type === 'blade') {
          const phase = ((t + (h.phase || 0)) % h.period) / h.period
          hy = h.y + Math.sin(phase * Math.PI * 2) * 60
          ctx.save()
          ctx.translate(hx + hw / 2, hy + hh / 2)
          ctx.rotate(phase * Math.PI * 4)
          ctx.fillStyle = '#5a5050'
          ctx.fillRect(-hw / 2, -hh / 2, hw, hh)
          ctx.restore()
        } else if (h.type === 'pillar') {
          ctx.fillStyle = '#453d35'
          ctx.fillRect(hx, hy, hw, hh)
          ctx.fillStyle = '#3a3328'
          ctx.strokeRect(hx, hy, hw, hh)
        } else if (h.type === 'swing') {
          const phase = ((t + (h.phase || 0)) % (h.period || 2000)) / (h.period || 2000)
          const sx = h.x - cam + Math.sin(phase * Math.PI * 2) * 50
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(sx, h.y, h.w, h.h)
        } else if (h.type === 'slide') {
          const phase = ((t + (h.phase || 0)) % (h.period || 2500)) / (h.period || 2500)
          const slideX = h.x - cam + Math.sin(phase * Math.PI * 2) * (h.range || 80)
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(slideX, h.y, h.w, h.h)
          ctx.fillStyle = '#3a3030'
          ctx.beginPath()
          ctx.moveTo(slideX, h.y + h.h)
          ctx.lineTo(slideX + h.w / 2, h.y)
          ctx.lineTo(slideX + h.w, h.y + h.h)
          ctx.closePath()
          ctx.fill()
        } else if (h.type === 'crush') {
          const phase = ((t + (h.phase || 0)) % (h.period || 5500)) / (h.period || 5500)
          if (phase > 0.78) {
            const crushH = 40 + ((phase - 0.78) / 0.22) * 100
            ctx.fillStyle = 'rgba(80, 70, 60, 0.9)'
            ctx.fillRect(hx, 0, h.w, crushH)
            ctx.fillRect(hx, VIEW_H - crushH, h.w, crushH)
          }
        }
      }

      const bx = s.x - cam
      if (bx > -50 && bx < VIEW_W + 50) {
        ctx.beginPath()
        ctx.arc(bx, s.y, BUBBLE_R, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(150, 200, 255, 0.5)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.9)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(bx + 3, s.y - 3, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fill()
        ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(PERSON_EMOJI, bx, s.y)
      }

      if (EXIT_X - cam > -50 && EXIT_X - cam < VIEW_W + 50) {
        ctx.fillStyle = '#2d5a2d'
        ctx.fillRect(EXIT_X - cam, VIEW_H / 2 - 40, 60, 80)
        ctx.fillStyle = '#3d7a3d'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('EXIT', EXIT_X - cam + 12, VIEW_H / 2)
      }

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gameState, scrollSpeed, gravity, liftForce, buoyancy, airDamping, maxVelocity, onSolve])

  useEffect(() => {
    if (gameState !== 'popping' || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const hazards = hazardsRef.current
    const { x: popX, y: popY, cameraX: popCam } = popPosRef.current
    const popBx = popX - popCam
    const startTime = performance.now()
    const POP_DURATION = 480

    const drawScene = (t) => {
      ctx.fillStyle = '#1a2433'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
      ctx.fillStyle = '#0d1620'
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(((-popCam % 80) + i * 80) - 80, 0, 2, VIEW_H)
      }
      ctx.fillStyle = '#2a3544'
      ctx.fillRect(0, VIEW_H - 8, VIEW_W + 200, 8)
      ctx.fillRect(0, 0, VIEW_W + 200, 8)
      hazards.forEach((h) => {
        let hx = h.x - popCam
        let hy = h.y
        const hw = h.w
        const hh = h.h
        const phase = ((t + (h.phase || 0)) % (h.period || 2000)) / (h.period || 2000)
        if (h.type === 'steam') {
          if (phase < 0.35) {
            ctx.fillStyle = 'rgba(180, 200, 220, 0.6)'
            ctx.fillRect(hx, hy, hw, hh)
          }
        } else if (h.type === 'spike') {
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(hx, hy, hw, hh)
          ctx.fillStyle = '#3a3030'
          ctx.beginPath()
          ctx.moveTo(hx, hy + hh)
          ctx.lineTo(hx + hw / 2, hy)
          ctx.lineTo(hx + hw, hy + hh)
          ctx.closePath()
          ctx.fill()
        } else if (h.type === 'blade') {
          hy = h.y + Math.sin(phase * Math.PI * 2) * 60
          ctx.save()
          ctx.translate(hx + hw / 2, hy + hh / 2)
          ctx.rotate(phase * Math.PI * 4)
          ctx.fillStyle = '#5a5050'
          ctx.fillRect(-hw / 2, -hh / 2, hw, hh)
          ctx.restore()
        } else if (h.type === 'pillar') {
          ctx.fillStyle = '#453d35'
          ctx.fillRect(hx, hy, hw, hh)
        } else if (h.type === 'swing') {
          const sx = hx + Math.sin(phase * Math.PI * 2) * 50
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(sx, hy, hw, hh)
        } else if (h.type === 'slide') {
          const slideX = hx + Math.sin(phase * Math.PI * 2) * (h.range || 80)
          ctx.fillStyle = '#4a4040'
          ctx.fillRect(slideX, hy, hw, hh)
        } else if (h.type === 'crush') {
          if (phase > 0.78) {
            const ch = 40 + ((phase - 0.78) / 0.22) * 100
            ctx.fillStyle = 'rgba(80, 70, 60, 0.9)'
            if (h.y < VIEW_H / 2) ctx.fillRect(hx, 0, hw, ch)
            else ctx.fillRect(hx, VIEW_H - ch, hw, ch)
          }
        }
      })
    }

    const drawPopEffect = (elapsed) => {
      const burstRadius = Math.min(elapsed * 0.15, 28)
      const dropletCount = 10
      ctx.save()
      ctx.translate(popBx, popY)
      for (let i = 0; i < dropletCount; i++) {
        const angle = (i / dropletCount) * Math.PI * 2 + (elapsed * 0.02)
        const dist = Math.min(elapsed * 0.4, 18) + (i % 3) * 4
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - elapsed * 0.08
        const alpha = Math.max(0, 1 - elapsed / POP_DURATION)
        ctx.fillStyle = `rgba(180, 210, 255, ${alpha * 0.8})`
        ctx.beginPath()
        ctx.arc(dx, dy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = `rgba(200, 230, 255, ${Math.max(0, 0.6 - elapsed / POP_DURATION)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, burstRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    let rafId
    const loop = (timestamp) => {
      const elapsed = timestamp - startTime
      drawScene(timestamp)
      drawPopEffect(elapsed)
      if (elapsed < POP_DURATION) {
        rafId = requestAnimationFrame(loop)
      } else {
        setGameState('popped')
      }
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gameState])

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Bathhouse'}</h2>
      <p className={styles.subtitle}>The Steam Passage</p>
      <p className={styles.instruction}>{instruction}</p>
      <div className={styles.viewport}>
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className={styles.canvas}
          tabIndex={0}
          aria-label="Bubble escape game. Use up and down arrows to control the bubble."
        />
        <div className={styles.steamOverlay} aria-hidden />
      </div>
      <div className={styles.controls}>
        <span className={styles.keyHint}>↑ Rise &nbsp; ↓ Fall</span>
        {gameState === 'popped' && (
          <>
            {checkpointRef.current.x >= CHECKPOINT_50_X - 100 && (
              <button type="button" onClick={() => reset(true)} className={styles.resetBtn}>
                Retry from checkpoint (50%)
              </button>
            )}
            <button type="button" onClick={() => reset(false)} className={checkpointRef.current.x >= CHECKPOINT_50_X - 100 ? styles.resetSecondary : styles.resetBtn}>
              Start over
            </button>
          </>
        )}
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
