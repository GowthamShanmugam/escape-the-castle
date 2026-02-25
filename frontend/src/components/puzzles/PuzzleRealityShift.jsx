import { useState, useEffect, useCallback, useRef } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './PuzzleRealityShift.module.css'

const ROWS = 7
const COLS = 7

// Rotate 90° CW: new[r][c] = old[cols-1-c][r] => old (or,oc) moves to new (oc, cols-1-or)
function rotatePos([r, c], cols) {
  return [c, cols - 1 - r]
}

// Mirror left-right: new[r][c] = old[r][cols-1-c]
function mirrorPos([r, c], cols) {
  return [r, COLS - 1 - c]
}

// Rotate top-left 4×4 quadrant 90° CW: (r,c) → (c, 3-r) for r,c in 0..3
function rotateQuadrantPos([r, c]) {
  if (r <= 3 && c <= 3) return [c, 3 - r]
  return [r, c]
}

function posKey([r, c]) {
  return `${r},${c}`
}

function canReachExit(walls, player, exitPos) {
  if (player[0] === exitPos[0] && player[1] === exitPos[1]) return true
  if (walls.has(posKey(player)) || walls.has(posKey(exitPos))) return false
  const visited = new Set([posKey(player)])
  const queue = [[...player]]
  while (queue.length > 0) {
    const [r, c] = queue.shift()
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (nr === exitPos[0] && nc === exitPos[1]) return true
      const k = posKey([nr, nc])
      if (!walls.has(k) && !visited.has(k)) {
        visited.add(k)
        queue.push([nr, nc])
      }
    }
  }
  return false
}

export default function PuzzleRealityShift({ onSolve, onClose, room }) {
  const cfg = room?.reality_shift || {}
  const instruction = cfg.instruction || 'Stand on an artifact and press E to transform the room. Move: WASD or arrows. Reach the exit.'

  const [walls, setWalls] = useState(() => {
    const w = cfg.walls || []
    return new Set(w.map(([r, c]) => posKey([r, c])))
  })
  const [player, setPlayer] = useState(() => cfg.playerStart || [1, 2])
  const [exitPos, setExitPos] = useState(() => cfg.exit || [5, 5])
  const [artifacts, setArtifacts] = useState(() => {
    const a = cfg.artifacts || []
    return a.map(({ r, c, type }) => ({ r, c, type }))
  })
  const maxActivations = cfg.maxActivations ?? null
  const [activationsUsed, setActivationsUsed] = useState(0)

  const initial = useCallback(() => ({
    walls: new Set((cfg.walls || []).map(([r, c]) => posKey([r, c]))),
    player: [...(cfg.playerStart || [1, 2])],
    exit: [...(cfg.exit || [5, 5])],
    artifacts: (cfg.artifacts || []).map(({ r, c, type }) => ({ r, c, type })),
  }), [cfg.walls, cfg.playerStart, cfg.exit, cfg.artifacts])

  const isWall = (r, c) => walls.has(posKey([r, c]))
  const isExit = (r, c) => r === exitPos[0] && c === exitPos[1]
  const getArtifactAt = (r, c) => artifacts.find((a) => a.r === r && a.c === c)

  const getTransformFn = useCallback((type) => {
    if (type === 'rotate') return (pos) => rotatePos(pos, COLS)
    if (type === 'mirror') return (pos) => mirrorPos(pos, COLS)
    if (type === 'rotate_quadrant') return rotateQuadrantPos
    return (pos) => rotatePos(pos, COLS)
  }, [])

  const applyTransform = useCallback((transformFn) => {
    setWalls((prev) => {
      const next = new Set()
      prev.forEach((key) => {
        const [r, c] = key.split(',').map(Number)
        const [nr, nc] = transformFn([r, c])
        next.add(posKey([nr, nc]))
      })
      return next
    })
    setPlayer(([r, c]) => transformFn([r, c]))
    setExitPos(([r, c]) => transformFn([r, c]))
    setArtifacts((prev) => prev.map(({ r, c, type }) => {
      const [nr, nc] = transformFn([r, c], COLS)
      return { r: nr, c: nc, type }
    }))
  }, [])

  const activateArtifact = useCallback((type) => {
    if (maxActivations != null && activationsUsed >= maxActivations) return
    const fn = getTransformFn(type)
    if (fn) {
      applyTransform(fn)
      playEffect('click')
      setActivationsUsed((u) => u + 1)
    }
  }, [applyTransform, getTransformFn, maxActivations, activationsUsed])

  const tryMove = useCallback((dr, dc) => {
    const [r, c] = player
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
    if (walls.has(posKey([nr, nc]))) return
    setPlayer([nr, nc])
  }, [player, walls])

  const requiredMinActivations = cfg.requiredMinActivations ?? 0
  const hasPlayedFailRef = useRef(false)

  useEffect(() => {
    const [r, c] = player
    if (r === exitPos[0] && c === exitPos[1]) {
      if (activationsUsed < requiredMinActivations) {
        return
      }
      hasPlayedFailRef.current = false
      playEffect('success')
      onSolve('escaped')
    }
  }, [player, exitPos, onSolve, activationsUsed, requiredMinActivations])

  const isStuck = maxActivations != null &&
    activationsUsed >= maxActivations &&
    (player[0] !== exitPos[0] || player[1] !== exitPos[1]) &&
    !canReachExit(walls, player, exitPos)

  useEffect(() => {
    if (isStuck && !hasPlayedFailRef.current) {
      hasPlayedFailRef.current = true
      playEffect('fail')
    }
  }, [isStuck])

  useEffect(() => {
    if (activationsUsed === 0) hasPlayedFailRef.current = false
  }, [activationsUsed])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault()
        tryMove(-1, 0)
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault()
        tryMove(1, 0)
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault()
        tryMove(0, -1)
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault()
        tryMove(0, 1)
      } else if (k === 'e') {
        e.preventDefault()
        const art = getArtifactAt(player[0], player[1])
        if (art) activateArtifact(art.type)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tryMove, player, getArtifactAt, activateArtifact])

  const handleReset = () => {
    playEffect('click')
    const init = initial()
    setWalls(init.walls)
    setPlayer(init.player)
    setExitPos(init.exit)
    setArtifacts(init.artifacts)
    setActivationsUsed(0)
  }

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Alchemy Lab'}</h2>
      <p className={styles.instruction}>{instruction}</p>
      {cfg.howToPlay && (
        <details className={styles.howToPlay}>
          <summary>How to play</summary>
          <p>{cfg.howToPlay}</p>
        </details>
      )}

      {(maxActivations != null || requiredMinActivations > 0) && (
        <p className={styles.activations}>
          Artifacts used: {activationsUsed}
          {requiredMinActivations > 0 && (
            <span className={styles.activationsHint}> (need {requiredMinActivations} to reach exit)</span>
          )}
        </p>
      )}
      {isStuck && (
        <p className={styles.retryHint}>Wrong sequence. No path to exit. Press Reset to try again.</p>
      )}

      <div className={styles.legend}>
        <span title="Rotates the entire room 90° clockwise">↻ Rotate</span>
        <span title="Rotates the top-left 4×4 quadrant 90°">⟲ Quadrant</span>
        <span title="Mirrors the entire room left-right">⇄ Mirror</span>
      </div>
      <div
        className={styles.grid}
        style={{ '--rows': ROWS, '--cols': COLS }}
        role="grid"
        aria-label="Reality Shift puzzle grid"
      >
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS)
          const c = i % COLS
          const art = getArtifactAt(r, c)
          let cellClass = styles.cell
          if (isWall(r, c)) cellClass += ` ${styles.cellWall}`
          else if (r === player[0] && c === player[1]) cellClass += ` ${styles.cellPlayer}`
          else if (isExit(r, c)) cellClass += ` ${styles.cellExit}`
          else if (art) cellClass += ` ${styles.cellArtifact} ${styles[`artifact${art.type.charAt(0).toUpperCase() + art.type.slice(1)}`]}`

          return (
            <div
              key={i}
              className={cellClass}
              role="gridcell"
              aria-label={isWall(r, c) ? 'Wall' : r === player[0] && c === player[1] ? 'Player (you)' : isExit(r, c) ? 'Exit' : art ? `${art.type} artifact` : 'Empty'}
            >
              {r === player[0] && c === player[1] && <span className={styles.cellLabel}>YOU</span>}
              {isExit(r, c) && <span className={styles.cellLabel}>EXIT</span>}
              {art && <span className={styles.artifactIcon} aria-hidden>{art.type === 'rotate' ? '↻' : art.type === 'rotate_quadrant' ? '⟲' : '⇄'}</span>}
            </div>
          )
        })}
      </div>

      <div className={styles.controls}>
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
