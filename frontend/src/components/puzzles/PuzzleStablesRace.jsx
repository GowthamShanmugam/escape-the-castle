import { useState, useEffect, useRef, useCallback } from 'react'
import { useViewportScale } from '../../hooks/useViewportScale'
import { playEffect } from '../../audio/soundService'
import { TouchActionButton, TouchActionGroup } from '../TouchControls'
import styles from './PuzzleStablesRace.module.css'

const VIEW_W = 400
const VIEW_H = 280
const PLAYER_W = 24
const PLAYER_H = 20
const GROUND_Y = VIEW_H - 30
const MAP_W = 4200
const FINISH_X = MAP_W - 60
const BASE_SCROLL = 2.2
const GRAVITY = 0.5
const BASE_JUMP = -8
const AI_SCROLL = 1.9
const AI_JUMP = -9
const AI_START_X = 180

// Simulate jump - matches game: each frame velY += GRAVITY*dt, aiY += velY, aiX += aiScroll.
function simulateJumpLandX(takeoffX, aiScroll, dt = 1) {
  let x = takeoffX
  let y = GROUND_Y - PLAYER_H
  let velY = AI_JUMP
  for (let f = 0; f < 50; f++) {
    velY += GRAVITY * dt
    y += velY
    x += aiScroll
    if (y >= GROUND_Y - PLAYER_H) return x
  }
  return x
}

// Jump window: [takeoffMin, takeoffMax]. aiScroll = movement per frame (AI_SCROLL*dt or halved in mud).
function getAiJumpWindow(obstacle, aiScroll, dt = 1) {
  const ox = obstacle.x
  const ow = obstacle.w || 40
  const obstacleRight = ox + ow
  const takeoffMax = ox - 10

  let takeoffMin = takeoffMax
  for (let t = 80; t <= takeoffMax; t++) {
    const landX = simulateJumpLandX(t, aiScroll, dt)
    if (landX > obstacleRight) {
      takeoffMin = t
      break
    }
  }

  return {
    takeoffMin: Math.max(80, takeoffMin - 5),
    takeoffMax: takeoffMax + 5,
  }
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function seededRandom(seed) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

const BASE_OBSTACLES = [
  { type: 'hay', x: 280, y: GROUND_Y - 18, w: 40, h: 22 },
  { type: 'hay', x: 480, y: GROUND_Y - 20, w: 45, h: 24 },
  { type: 'mud', xStart: 620, xEnd: 820, y: GROUND_Y - 5 },
  { type: 'hay', x: 900, y: GROUND_Y - 18, w: 42, h: 22 },
  { type: 'barrier', x: 1100, y: GROUND_Y - 22, w: 42, h: 22 },
  { type: 'hay', x: 1250, y: GROUND_Y - 16, w: 38, h: 20 },
  { type: 'mud', xStart: 1420, xEnd: 1680, y: GROUND_Y - 5 },
  { type: 'barrier', x: 1780, y: GROUND_Y - 24, w: 44, h: 24 },
  { type: 'hay', x: 1980, y: GROUND_Y - 20, w: 44, h: 24 },
  { type: 'hay', x: 2150, y: GROUND_Y - 18, w: 40, h: 22 },
  { type: 'barrier', x: 2350, y: GROUND_Y - 22, w: 42, h: 22 },
  { type: 'mud', xStart: 2520, xEnd: 2820, y: GROUND_Y - 5 },
  { type: 'hay', x: 2950, y: GROUND_Y - 18, w: 42, h: 22 },
  { type: 'hay', x: 3150, y: GROUND_Y - 20, w: 46, h: 24 },
  { type: 'barrier', x: 3350, y: GROUND_Y - 22, w: 42, h: 22 },
  { type: 'mud', xStart: 3520, xEnd: 3780, y: GROUND_Y - 5 },
  { type: 'hay', x: 3850, y: GROUND_Y - 16, w: 40, h: 20 },
  { type: 'hay', x: 4020, y: GROUND_Y - 18, w: 42, h: 22 },
]

function getObstacles(seed) {
  const rnd = seededRandom(seed || 1)
  return BASE_OBSTACLES.map((o) => {
    const dx = Math.floor((rnd() - 0.5) * 50)
    if (o.type === 'mud') {
      const len = o.xEnd - o.xStart
      const shift = Math.floor((rnd() - 0.5) * 60)
      const xStart = Math.max(100, o.xStart + dx + shift)
      const xEnd = Math.min(MAP_W - 100, xStart + len)
      return { ...o, xStart, xEnd }
    }
    return { ...o, x: Math.max(80, Math.min(MAP_W - 80, o.x + dx)) }
  })
}

const HORSE_EMOJI = '🐎'

const DEFAULT_HORSES = [
  { name: 'Ember', speed: 1.4, jump: 0.7, stamina: 0.6, special: 'Quick dash', favor: 'flat' },
  { name: 'Stone', speed: 0.8, jump: 1.2, stamina: 1.3, special: 'Thrives in mud', favor: 'mud' },
  { name: 'Mist', speed: 1.0, jump: 1.0, stamina: 1.0, special: 'Double jump', favor: 'jump' },
]

export default function PuzzleStablesRace({ room, onSolve, onClose }) {
  const cfg = room?.stables_race || {}
  const horses = cfg.horses || DEFAULT_HORSES
  const trackFavor = cfg.trackFavor || 'mud'
  const trackMap = cfg.trackMap || 'The lower tunnel is long and muddy. The upper section has scattered hay bales.'
  const weatherNote = cfg.weatherNote || 'Heavy rain soaked the lower tunnel.'
  const instruction = cfg.instruction || 'Check track map and weather. Choose a horse. During race: Space to jump.'

  const [phase, setPhase] = useState('investigation')
  const [horseIndex, setHorseIndex] = useState(-1)
  const [prep, setPrep] = useState({ feed: false, saddle: false, hooves: false })
  const [gameState, setGameState] = useState('running') // running | crashed | complete | lost
  const [attemptCount, setAttemptCount] = useState(0)
  const canvasRef = useRef(null)
  const keysRef = useRef({ jump: false, dash: false })
  const stateRef = useRef({
    playerX: 80,
    playerY: GROUND_Y - PLAYER_H,
    velY: 0,
    grounded: true,
    cameraX: 0,
    lastTime: 0,
    jumpCount: 0,
    dashCooldown: 0,
    aiX: AI_START_X,
    aiY: GROUND_Y - PLAYER_H,
    aiVelY: 0,
  })
  const obstaclesRef = useRef(getObstacles(1))

  const horse = horseIndex >= 0 ? horses[horseIndex] : null
  const isStone = horse?.favor === 'mud'
  const isMist = horse?.favor === 'jump'
  const isEmber = horse?.favor === 'flat'
  const prepSpeed = horse ? (prep.saddle ? horse.speed * 1.08 : horse.speed) : 1
  const mudMultiplier = isStone ? 1 : (prep.hooves ? 0.7 : 0.5)
  const scrollSpeed = horse ? BASE_SCROLL * prepSpeed : BASE_SCROLL
  const jumpForce = horse ? BASE_JUMP * (prep.feed ? horse.jump * 1.06 : horse.jump) : BASE_JUMP
  const canDoubleJump = isMist
  const canDash = isEmber

  const resetRace = useCallback((isRetry = false) => {
    keysRef.current = { jump: false, dash: false }
    if (isRetry) {
      setAttemptCount((c) => {
        const next = c + 1
        obstaclesRef.current = getObstacles(next * 31337 + 42)
        return next
      })
    } else {
      obstaclesRef.current = getObstacles(1)
    }
    stateRef.current = {
      playerX: 80,
      playerY: GROUND_Y - PLAYER_H,
      velY: 0,
      grounded: true,
      cameraX: 0,
      lastTime: performance.now(),
      jumpCount: 0,
      dashCooldown: 0,
      aiX: AI_START_X,
      aiY: GROUND_Y - PLAYER_H,
      aiVelY: 0,
    }
    setGameState('running')
  }, [])

  useEffect(() => {
    if (phase !== 'race' || gameState !== 'running') return

    const handleKeyDown = (e) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'arrowup' || k === 'w') {
        e.preventDefault()
        keysRef.current.jump = true
      }
      if (k === 'e') keysRef.current.dash = true
    }
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'arrowup' || k === 'w') keysRef.current.jump = false
      if (k === 'e') keysRef.current.dash = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [phase, gameState])

  useEffect(() => {
    if (phase !== 'race' || gameState !== 'running' || !canvasRef.current || !horse) return

    const ctx = canvasRef.current.getContext('2d')
    const obstacles = obstaclesRef.current
    let rafId

    const loop = (timestamp) => {
      const dt = Math.max(0.01, Math.min((timestamp - stateRef.current.lastTime) / 16, 4))
      stateRef.current.lastTime = timestamp
      const s = stateRef.current
      const keys = keysRef.current

      let scroll = scrollSpeed * dt
      const inMud = obstacles.some(
        (o) =>
          o.type === 'mud' &&
          s.playerX + PLAYER_W > o.xStart &&
          s.playerX < o.xEnd &&
          s.playerY + PLAYER_H >= o.y
      )
      if (inMud) scroll *= mudMultiplier
      if (s.dashCooldown > 0) {
        s.dashCooldown = Math.max(0, s.dashCooldown - dt)
      }
      if (canDash && keys.dash && s.dashCooldown <= 0) {
        scroll *= 2
        s.dashCooldown = 90
      }

      s.playerX += scroll
      s.velY += GRAVITY * dt
      s.playerY += s.velY

      if (s.playerY >= GROUND_Y - PLAYER_H) {
        s.playerY = GROUND_Y - PLAYER_H
        s.velY = 0
        s.grounded = true
        s.jumpCount = 0
      } else {
        s.grounded = false
      }

      if (keys.jump && (s.grounded || (canDoubleJump && s.jumpCount < 2))) {
        if (s.grounded) {
          s.velY = jumpForce
          s.grounded = false
          s.jumpCount = 1
        } else if (canDoubleJump && s.jumpCount === 1) {
          s.velY = jumpForce * 0.85
          s.jumpCount = 2
        }
      }

      s.cameraX = s.playerX - 120
      s.cameraX = Math.max(0, Math.min(MAP_W - VIEW_W, s.cameraX))

      let aiScroll = AI_SCROLL * dt
      const aiInMud = obstacles.some(
        (o) =>
          o.type === 'mud' &&
          s.aiX + PLAYER_W > o.xStart &&
          s.aiX < o.xEnd &&
          s.aiY + PLAYER_H >= o.y
      )
      if (aiInMud) aiScroll *= 0.5

      const aiGrounded = s.aiY >= GROUND_Y - PLAYER_H - 0.5

      if (aiGrounded) {
        const upcoming = obstacles
          .filter((o) => (o.type === 'hay' || o.type === 'barrier') && s.aiX < o.x + (o.w || 40))
          .sort((a, b) => a.x - b.x)
        const nextObstacle = upcoming[0]
        if (nextObstacle) {
          const { takeoffMin, takeoffMax } = getAiJumpWindow(nextObstacle, aiScroll, dt)
          if (s.aiX >= takeoffMin && s.aiX <= takeoffMax) {
            s.aiVelY = AI_JUMP
          }
        }
      }

      s.aiVelY += GRAVITY * dt
      s.aiY += s.aiVelY
      if (s.aiY >= GROUND_Y - PLAYER_H) {
        s.aiY = GROUND_Y - PLAYER_H
        s.aiVelY = 0
      }
      s.aiX += aiScroll

      // No hit penalty - AI phases through if jump fails (avoids stuck loop)

      if (s.aiX >= FINISH_X) {
        playEffect('fail')
        setGameState('lost')
        rafId = requestAnimationFrame(loop)
        return
      }

      const cam = s.cameraX
      const px = s.playerX
      const py = s.playerY

      for (const o of obstacles) {
        if (o.type === 'mud') continue
        const ox = o.x - cam
        if (ox + (o.w || (o.xEnd - o.xStart)) < -50 || ox > VIEW_W + 50) continue

        if (o.type === 'hay' || o.type === 'barrier') {
          const ow = o.w || 40
          const oh = o.h || 24
          if (rectOverlap(px + 4, py + 4, PLAYER_W - 8, PLAYER_H - 8, o.x, o.y, ow, oh)) {
            playEffect('fail')
            setGameState('crashed')
            rafId = requestAnimationFrame(loop)
            return
          }
        }
      }

      if (s.playerX >= FINISH_X) {
        playEffect('success')
        setGameState('complete')
        onSolve('escaped')
        rafId = requestAnimationFrame(loop)
        return
      }

      ctx.fillStyle = '#1a2e1a'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
      ctx.fillStyle = '#0d1a0d'
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(((-cam % 60) + i * 60) - 60, 0, 2, VIEW_H)
      }
      ctx.fillStyle = '#3d4a2d'
      ctx.fillRect(0, GROUND_Y, VIEW_W + 200, VIEW_H - GROUND_Y + 20)

      for (const o of obstacles) {
        const ox = o.x - cam
        if (o.type === 'mud') {
          const mudW = o.xEnd - o.xStart
          if (ox + mudW < -20 || ox > VIEW_W + 20) continue
          const mudX = o.xStart - cam
          ctx.fillStyle = 'rgba(80, 60, 40, 0.8)'
          ctx.fillRect(mudX, o.y, mudW, VIEW_H - o.y + 20)
        } else if (o.type === 'hay') {
          ctx.fillStyle = '#c4a035'
          ctx.fillRect(ox, o.y, o.w, o.h)
          ctx.strokeStyle = '#8b6914'
          ctx.lineWidth = 2
          ctx.strokeRect(ox, o.y, o.w, o.h)
        } else if (o.type === 'barrier') {
          ctx.fillStyle = '#5a5040'
          ctx.fillRect(ox, o.y, o.w, o.h)
          ctx.strokeStyle = '#4a4030'
          ctx.strokeRect(ox, o.y, o.w, o.h)
        }
      }

      const playerPos = px > s.aiX ? 1 : 2
      const aiPos = s.aiX > px ? 1 : 2

      const drawPosBadge = (x, y, pos) => {
        const label = pos === 1 ? '1st' : '2nd'
        ctx.fillStyle = pos === 1 ? '#c9a227' : '#8a8374'
        ctx.strokeStyle = '#1a2e1a'
        ctx.lineWidth = 2
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.strokeText(label, x, y - 18)
        ctx.fillText(label, x, y - 18)
      }

      const aiDrawX = s.aiX - cam
      const aiDrawY = s.aiY + PLAYER_H / 2
      if (aiDrawX > -40 && aiDrawX < VIEW_W + 40) {
        drawPosBadge(aiDrawX + PLAYER_W / 2, aiDrawY, aiPos)
        ctx.save()
        const opacity = Math.abs(px - s.aiX) < 60 ? 0.5 : 0.85
        ctx.globalAlpha = opacity
        ctx.translate(aiDrawX + PLAYER_W / 2, aiDrawY)
        ctx.scale(-1, 1)
        ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🐴', 0, 0)
        ctx.restore()
        ctx.globalAlpha = 1
      }

      const drawX = px - cam
      if (drawX > -30 && drawX < VIEW_W + 30) {
        ctx.save()
        drawPosBadge(drawX + PLAYER_W / 2, py + PLAYER_H / 2, playerPos)
        ctx.translate(drawX + PLAYER_W / 2, py + PLAYER_H / 2)
        ctx.scale(-1, 1)
        ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(HORSE_EMOJI, 0, 0)
        ctx.restore()
      }

      if (FINISH_X - cam > -50 && FINISH_X - cam < VIEW_W + 50) {
        const fx = FINISH_X - cam
        ctx.fillStyle = '#2d5a2d'
        ctx.fillRect(fx, GROUND_Y - 50, 50, 80)
        ctx.fillStyle = '#3d7a3d'
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText('GOAL', fx + 12, GROUND_Y - 20)
      }

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [phase, gameState, horse, scrollSpeed, jumpForce, isStone, isMist, canDash, canDoubleJump, isEmber, mudMultiplier, onSolve])

  const viewportWrapperRef = useRef(null)
  const viewportScale = useViewportScale(viewportWrapperRef, VIEW_W, VIEW_H)

  return (
    <div className={`${styles.puzzle} touchSafe`}>
      <h2>{room?.title ?? 'Stables'}</h2>
      <p className={styles.subtitle}>The Royal Trial Race</p>
      <p className={styles.instruction}>{instruction}</p>

      {phase === 'investigation' && (
        <div className={styles.investigation}>
          <div className={styles.investigationSection}>
            <h4>Track Map</h4>
            <p>{trackMap}</p>
          </div>
          <div className={styles.investigationSection}>
            <h4>Weather Note</h4>
            <p>{weatherNote}</p>
          </div>
          <div className={styles.controls}>
            <button type="button" onClick={() => setPhase('preparation')} className={styles.primaryBtn}>
              Continue to horse selection
            </button>
            <button type="button" onClick={onClose} className={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}

      {phase === 'preparation' && (
        <>
          <p className={styles.hint}>Choose your horse.</p>
          <div className={styles.horseGrid}>
            {horses.map((h, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.horseCard} ${horseIndex === i ? styles.selected : ''}`}
                onClick={() => setHorseIndex(i)}
              >
                <h4>{h.name}</h4>
                <p>Speed {h.speed > 1 ? 'Fast' : h.speed < 0.9 ? 'Slow' : 'Medium'}</p>
                <p>Jump {h.jump > 1 ? 'High' : h.jump < 0.9 ? 'Low' : 'Medium'}</p>
                <p className={styles.special}>{h.special}</p>
              </button>
            ))}
          </div>
          <div className={styles.prepSection}>
            <h4>Preparation (optional)</h4>
            <div className={styles.prepOptions}>
              <label className={styles.prepOption}>
                <input
                  type="checkbox"
                  checked={prep.feed}
                  onChange={(e) => setPrep((p) => ({ ...p, feed: e.target.checked }))}
                />
                <span>Feed horse — +6% jump height</span>
              </label>
              <label className={styles.prepOption}>
                <input
                  type="checkbox"
                  checked={prep.saddle}
                  onChange={(e) => setPrep((p) => ({ ...p, saddle: e.target.checked }))}
                />
                <span>Lighter saddle — +8% speed</span>
              </label>
              <label className={styles.prepOption}>
                <input
                  type="checkbox"
                  checked={prep.hooves}
                  onChange={(e) => setPrep((p) => ({ ...p, hooves: e.target.checked }))}
                />
                <span>Clean hooves — less mud slowdown</span>
              </label>
            </div>
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              onClick={() => { setPhase('race'); setAttemptCount(0); resetRace(false) }}
              disabled={horseIndex < 0}
              className={styles.primaryBtn}
            >
              Begin race
            </button>
            <button type="button" onClick={() => setPhase('investigation')} className={styles.secondaryBtn}>
              Back
            </button>
            <button type="button" onClick={onClose} className={styles.closeBtn}>
              Close
            </button>
          </div>
        </>
      )}

      {phase === 'race' && (
        <>
          <TouchActionGroup>
            <TouchActionButton keysRef={keysRef} keyName="jump" label="Jump" />
            {isEmber && (
              <TouchActionButton keysRef={keysRef} keyName="dash" label="Dash" title="Ember only: quick speed boost (E)" />
            )}
          </TouchActionGroup>
          <div ref={viewportWrapperRef} className={styles.viewportWrapper}>
            <div
              className={styles.viewportInner}
              style={{
                width: Math.floor(VIEW_W * viewportScale),
                height: Math.floor(VIEW_H * viewportScale),
              }}
            >
              <div
                className={styles.viewport}
                style={{
                  width: VIEW_W,
                  height: VIEW_H,
                  transform: `scale(${viewportScale})`,
                  transformOrigin: 'top left',
                }}
              >
            <canvas
              ref={canvasRef}
              width={VIEW_W}
              height={VIEW_H}
              className={styles.canvas}
              tabIndex={0}
              aria-label="Horse race. Use space or up arrow to jump. E to dash if riding Ember."
            />
              </div>
            </div>
          </div>
          <div className={styles.controls}>
            <span className={styles.keyHint}>Space Jump</span>
            {isMist && <span className={styles.keyHint}>Double jump</span>}
            {isEmber && <span className={styles.keyHint}>E Dash</span>}
            {(gameState === 'crashed' || gameState === 'lost') && (
              <>
                <span className={styles.resultMsg}>
                  {gameState === 'crashed' ? 'Crashed!' : 'The opponent won!'}
                </span>
                <button type="button" onClick={() => resetRace(true)} className={styles.primaryBtn}>
                  Retry
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className={styles.closeBtn}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  )
}
