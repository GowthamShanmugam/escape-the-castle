import { useState, useEffect, useRef, useCallback } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './PuzzleGuardRoomStealth.module.css'

const TICK_MS = 50
const PLAYER_W = 16
const PLAYER_H = 16
const GUARD_SIZE = 14
const WALK_SPEED = 0.8
const RUN_SPEED = 1.9
const VISION_ANGLE_DEG = 85
const VISION_RANGE = 90
const DETECTION_BUILDUP = 1 / 1.0   // per second when in cone
const DETECTION_DECAY = 0.6 / 1.0   // per second when not seen
const SHADOW_BUILDUP_MUL = 0.4      // in shadow: buildup reduced
const RUN_BUILDUP_MUL = 1.6         // when running: buildup increased
const CAPTURE_AT = 3
const EXIT_TOP = 24
const EXIT_WIDTH = 80

// Dark zones (x, y, w, h) – detection reduced when player center inside
const DARK_ZONES = [
  { x: 40, y: 120, w: 70, h: 50 },
  { x: 310, y: 100, w: 60, h: 60 },
  { x: 160, y: 200, w: 100, h: 40 },
  { x: 180, y: 70, w: 50, h: 45 },
  { x: 0, y: 230, w: 55, h: 45 },
  { x: 365, y: 140, w: 45, h: 55 },
]

// Solid obstacles (x, y, w, h) – block player movement, provide cover. Spread across 420×300 so none overlap.
const OBSTACLES = [
  { x: 50, y: 60, w: 28, h: 42 },
  { x: 135, y: 58, w: 26, h: 35 },
  { x: 220, y: 62, w: 28, h: 34 },
  { x: 305, y: 60, w: 26, h: 38 },
  { x: 370, y: 65, w: 24, h: 30 },
  { x: 48, y: 115, w: 30, h: 40 },
  { x: 142, y: 118, w: 28, h: 38 },
  { x: 215, y: 112, w: 30, h: 38 },
  { x: 298, y: 118, w: 26, h: 40 },
  { x: 362, y: 115, w: 22, h: 36 },
  { x: 52, y: 172, w: 32, h: 38 },
  { x: 148, y: 175, w: 28, h: 36 },
  { x: 212, y: 170, w: 30, h: 40 },
  { x: 292, y: 175, w: 26, h: 38 },
  { x: 358, y: 172, w: 24, h: 35 },
  { x: 55, y: 232, w: 34, h: 32 },
  { x: 145, y: 235, w: 30, h: 30 },
  { x: 220, y: 218, w: 32, h: 30 },
  { x: 288, y: 232, w: 28, h: 32 },
  { x: 360, y: 230, w: 26, h: 28 },
  { x: 268, y: 100, w: 26, h: 34 },
]

// Guard definitions: mixed directions so no safe “one side” – left, right, and exit approach all covered
const GUARD_PATHS = [
  { personality: 'walker', waypoints: [{ x: 320, y: 80 }, { x: 80, y: 80 }, { x: 80, y: 220 }, { x: 320, y: 220 }] },
  { personality: 'walker', waypoints: [{ x: 80, y: 140 }, { x: 80, y: 260 }, { x: 340, y: 260 }, { x: 340, y: 140 }] },
  { personality: 'drifter', waypoints: [{ x: 280, y: 160 }, { x: 120, y: 160 }, { x: 200, y: 200 }, { x: 200, y: 120 }] },
  { personality: 'inspector', waypoints: [{ x: 300, y: 150 }, { x: 200, y: 150 }, { x: 200, y: 100 }, { x: 200, y: 150 }, { x: 100, y: 150 }] },
  { personality: 'walker', waypoints: [{ x: 300, y: 55 }, { x: 120, y: 55 }, { x: 120, y: 170 }, { x: 300, y: 170 }] },
  { personality: 'walker', waypoints: [{ x: 55, y: 100 }, { x: 55, y: 240 }, { x: 55, y: 100 }] },
  { personality: 'walker', waypoints: [{ x: 365, y: 180 }, { x: 365, y: 80 }, { x: 365, y: 180 }] },
  { personality: 'walker', waypoints: [{ x: 80, y: 220 }, { x: 320, y: 220 }, { x: 320, y: 80 }, { x: 80, y: 80 }] },
  { personality: 'walker', waypoints: [{ x: 340, y: 140 }, { x: 340, y: 260 }, { x: 80, y: 260 }, { x: 80, y: 140 }] },
  { personality: 'drifter', waypoints: [{ x: 120, y: 120 }, { x: 200, y: 180 }, { x: 280, y: 120 }, { x: 200, y: 240 }] },
  { personality: 'walker', waypoints: [{ x: 120, y: 55 }, { x: 300, y: 55 }, { x: 300, y: 170 }, { x: 120, y: 170 }] },
  { personality: 'walker', waypoints: [{ x: 55, y: 240 }, { x: 55, y: 100 }, { x: 55, y: 240 }] },
  { personality: 'walker', waypoints: [{ x: 365, y: 80 }, { x: 365, y: 180 }, { x: 365, y: 80 }] },
  { personality: 'inspector', waypoints: [{ x: 100, y: 150 }, { x: 210, y: 150 }, { x: 210, y: 90 }, { x: 210, y: 150 }, { x: 320, y: 150 }] },
  { personality: 'walker', waypoints: [{ x: 250, y: 100 }, { x: 170, y: 100 }, { x: 170, y: 240 }, { x: 250, y: 240 }] },
  { personality: 'drifter', waypoints: [{ x: 200, y: 60 }, { x: 350, y: 200 }, { x: 70, y: 200 }, { x: 200, y: 130 }] },
  { personality: 'walker', waypoints: [{ x: 380, y: 120 }, { x: 380, y: 250 }, { x: 40, y: 250 }, { x: 40, y: 120 }] },
  { personality: 'walker', waypoints: [{ x: 150, y: 200 }, { x: 270, y: 200 }, { x: 270, y: 70 }, { x: 150, y: 70 }] },
  { personality: 'drifter', waypoints: [{ x: 90, y: 180 }, { x: 330, y: 90 }, { x: 330, y: 230 }, { x: 90, y: 230 }] },
]

function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax) * (180 / Math.PI)
}

function inVisionCone(guardX, guardY, guardAngleDeg0Up, px, py, range, halfAngleDeg) {
  const dx = px - guardX
  const dy = py - guardY
  const dist = Math.hypot(dx, dy)
  if (dist > range) return false
  const toPlayer = angleBetween(guardX, guardY, px, py)
  const guardMath = guardAngleDeg0Up - 90
  let diff = Math.abs(((toPlayer - guardMath + 180) % 360) - 180)
  if (diff > 180) diff = 360 - diff
  return diff <= halfAngleDeg
}

function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function canMoveTo(px, py) {
  return !OBSTACLES.some((o) => rectOverlap(px, py, PLAYER_W, PLAYER_H, o.x, o.y, o.w, o.h))
}

export default function PuzzleGuardRoomStealth({ room, onSolve, onClose }) {
  const cfg = room?.guard_room_stealth || {}
  const roomWidth = cfg.roomWidth ?? 420
  const roomHeight = cfg.roomHeight ?? 300
  const instruction = cfg.instruction || 'Reach the exit without being caught. Move: W or ↑ up, S or ↓ down, A or ← left, D or → right. Shift to run.'

  const [status, setStatus] = useState('playing')
  const [detection, setDetection] = useState(0)
  const [playerX, setPlayerX] = useState(roomWidth / 2 - PLAYER_W / 2)
  const [playerY, setPlayerY] = useState(roomHeight - PLAYER_H - 30)
  const keysRef = useRef({ up: false, down: false, left: false, right: false, run: false })
  const playerXRef = useRef(roomWidth / 2 - PLAYER_W / 2)
  const playerYRef = useRef(roomHeight - PLAYER_H - 30)
  const detectionRef = useRef(0)
  const detectionTierRef = useRef(0)
  const guardsRef = useRef(
    GUARD_PATHS.map((p) => {
      const wps = p.waypoints
      const next = wps[1] ?? wps[0]
      const angle = angleBetween(wps[0].x, wps[0].y, next.x, next.y) + 90
      return {
        x: wps[0].x,
        y: wps[0].y,
        waypoints: wps,
        wpIndex: 0,
        angle,
        personality: p.personality,
        pauseUntil: 0,
        inspectPhase: 0,
      }
    })
  )
  const [guards, setGuards] = useState(() => guardsRef.current.map((g) => ({ ...g })))

  const reset = useCallback(() => {
    setStatus('playing')
    setDetection(0)
    detectionRef.current = 0
    detectionTierRef.current = 0
    playerXRef.current = roomWidth / 2 - PLAYER_W / 2
    playerYRef.current = roomHeight - PLAYER_H - 30
    setPlayerX(playerXRef.current)
    setPlayerY(playerYRef.current)
    guardsRef.current = GUARD_PATHS.map((p) => {
      const wps = p.waypoints
      const next = wps[1] ?? wps[0]
      const angle = angleBetween(wps[0].x, wps[0].y, next.x, next.y) + 90
      return {
        x: wps[0].x,
        y: wps[0].y,
        waypoints: wps,
        wpIndex: 0,
        angle,
        personality: p.personality,
        pauseUntil: 0,
        inspectPhase: 0,
      }
    })
    setGuards(guardsRef.current.map((g) => ({ ...g })))
  }, [roomWidth, roomHeight])

  useEffect(() => {
    if (status === 'fail') playEffect('fail')
  }, [status])

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = true
      if (k === 'arrowdown' || k === 's') keysRef.current.down = true
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = true
      if (k === 'arrowright' || k === 'd') keysRef.current.right = true
      if (k === 'shift') keysRef.current.run = true
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'shift'].includes(k)) e.preventDefault()
    }
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') keysRef.current.up = false
      if (k === 'arrowdown' || k === 's') keysRef.current.down = false
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = false
      if (k === 'arrowright' || k === 'd') keysRef.current.right = false
      if (k === 'shift') keysRef.current.run = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (status !== 'playing') return

    const interval = setInterval(() => {
      const dt = TICK_MS / 1000
      const prevX = playerXRef.current
      const prevY = playerYRef.current
      let px = prevX
      let py = prevY
      const k = keysRef.current
      const speed = k.run ? RUN_SPEED : WALK_SPEED
      if (k.up) py -= speed
      if (k.down) py += speed
      if (k.left) px -= speed
      if (k.right) px += speed
      px = Math.max(0, Math.min(roomWidth - PLAYER_W, px))
      py = Math.max(0, Math.min(roomHeight - PLAYER_H, py))
      if (!canMoveTo(px, py)) {
        if (canMoveTo(px, prevY)) py = prevY
        else if (canMoveTo(prevX, py)) px = prevX
        else {
          px = prevX
          py = prevY
        }
      }
      playerXRef.current = px
      playerYRef.current = py
      setPlayerX(px)
      setPlayerY(py)

      const centerX = px + PLAYER_W / 2
      const centerY = py + PLAYER_H / 2
      const inShadow = DARK_ZONES.some((z) => pointInRect(centerX, centerY, z.x, z.y, z.w, z.h))

      const gList = guardsRef.current
      const now = Date.now() / 1000
      const halfAngle = VISION_ANGLE_DEG / 2

      for (let i = 0; i < gList.length; i++) {
        const guard = gList[i]
        if (guard.pauseUntil > now) continue
        const wps = guard.waypoints
        const next = wps[(guard.wpIndex + 1) % wps.length]
        const dx = next.x - guard.x
        const dy = next.y - guard.y
        const dist = Math.hypot(dx, dy)
        if (dist < 2) {
          guard.wpIndex = (guard.wpIndex + 1) % wps.length
          guard.angle = angleBetween(guard.x, guard.y, next.x, next.y) + 90
          if (guard.personality === 'drifter' && Math.random() < 0.35) {
            guard.pauseUntil = now + 0.5 + Math.random() * 1.2
            if (Math.random() < 0.5) guard.angle += 45 + Math.random() * 90
          }
          if (guard.personality === 'inspector' && Math.random() < 0.2) {
            guard.pauseUntil = now + 0.8
            guard.angle += 90
          }
        } else {
          const v = Math.min(0.6, dist * 0.05)
          guard.x += (dx / dist) * v
          guard.y += (dy / dist) * v
        }
        guard.angle = angleBetween(guard.x, guard.y, next.x, next.y) + 90
      }
      setGuards(gList.map((g) => ({ ...g })))

      let seen = false
      for (let i = 0; i < gList.length; i++) {
        const g = gList[i]
        const gcx = g.x + GUARD_SIZE / 2
        const gcy = g.y + GUARD_SIZE / 2
        if (inVisionCone(gcx, gcy, g.angle, centerX, centerY, VISION_RANGE, halfAngle)) {
          seen = true
          break
        }
      }

      let rate = seen ? DETECTION_BUILDUP : -DETECTION_DECAY
      if (seen && inShadow) rate *= SHADOW_BUILDUP_MUL
      if (seen && k.run) rate *= RUN_BUILDUP_MUL
      let d = detectionRef.current + rate * dt
      d = Math.max(0, Math.min(CAPTURE_AT, d))
      detectionRef.current = d
      setDetection(d)
      const tier = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : 3
      if (tier > detectionTierRef.current && tier < 3) {
        detectionTierRef.current = tier
        playEffect('tick')
      } else if (tier === 3) {
        detectionTierRef.current = 3
      }

      if (d >= CAPTURE_AT) {
        playEffect('guard')
        setStatus('fail')
        return
      }
      if (py <= EXIT_TOP + PLAYER_H && centerX >= roomWidth / 2 - EXIT_WIDTH / 2 && centerX <= roomWidth / 2 + EXIT_WIDTH / 2) {
        playEffect('success')
        setStatus('success')
        onSolve('escaped')
        return
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [status, roomWidth, roomHeight, onSolve])

  const exitLeft = roomWidth / 2 - EXIT_WIDTH / 2

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{room?.title ?? 'Guard Room'}</h2>
      <p className={styles.instruction}>{instruction}</p>
      <p className={styles.keyHint}>
        <kbd>W</kbd> <kbd>↑</kbd> up &nbsp; <kbd>S</kbd> <kbd>↓</kbd> down &nbsp; <kbd>A</kbd> <kbd>←</kbd> left &nbsp; <kbd>D</kbd> <kbd>→</kbd> right &nbsp; <kbd className={styles.shiftKey}>Shift</kbd> run
      </p>

      <div className={styles.hud}>
        <div className={styles.detectionLabel}>Detection</div>
        <div className={styles.detectionTrack}>
          <div
            className={styles.detectionBar}
            style={{
              width: `${(detection / CAPTURE_AT) * 100}%`,
              background: detection < 1 ? 'rgba(200,180,0,0.8)' : detection < 2 ? 'rgba(220,120,0,0.9)' : 'rgba(200,40,40,0.95)',
            }}
          />
        </div>
        <span className={styles.detectionHint}>
          {detection < 1 ? 'Suspicion' : detection < 2 ? 'Alert' : 'Almost caught…'}
        </span>
      </div>

      <div className={styles.room} style={{ width: roomWidth, height: roomHeight }}>
        <div className={styles.roomBg} />
        {DARK_ZONES.map((z, i) => (
          <div key={i} className={styles.shadow} style={{ left: z.x, top: z.y, width: z.w, height: z.h }} aria-hidden />
        ))}
        {OBSTACLES.map((o, i) => (
          <div key={i} className={styles.obstacle} style={{ left: o.x, top: o.y, width: o.w, height: o.h }} aria-hidden />
        ))}
        <div className={styles.exitZone} style={{ left: exitLeft, top: 0, width: EXIT_WIDTH, height: EXIT_TOP + 10 }}>
          Exit
        </div>
        {status === 'playing' &&
          guards.map((g, i) => (
            <div key={i} className={styles.guardWrap} style={{ left: g.x, top: g.y }}>
              <div
                className={styles.visionCone}
                style={{
                  left: GUARD_SIZE / 2 - VISION_RANGE,
                  top: GUARD_SIZE / 2 - VISION_RANGE,
                  width: VISION_RANGE * 2,
                  height: VISION_RANGE * 2,
                  transform: `rotate(${g.angle}deg)`,
                }}
                aria-hidden
              />
              <div
                className={styles.guard}
                style={{
                  width: GUARD_SIZE,
                  height: GUARD_SIZE,
                  transform: `rotate(${g.angle}deg)`,
                }}
                aria-hidden
              />
            </div>
          ))}
        {status === 'playing' && (
          <div
            className={styles.player}
            style={{ left: playerX, top: playerY, width: PLAYER_W, height: PLAYER_H }}
            aria-hidden
          />
        )}
      </div>

      {status === 'fail' && (
        <div className={styles.result}>
          <p className={styles.failMsg}>Caught! The guards have you.</p>
          <button type="button" className={styles.retryBtn} onClick={() => { playEffect('click'); reset(); }}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={() => { playEffect('click'); onClose(); }} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
