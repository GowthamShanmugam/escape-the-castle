import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { getRoomSceneConfig } from '../data/roomScenes'
import ProceduralRoomBg from './ProceduralRoomBg'
import ImageBackground from './ImageBackground'
import styles from './AnimatedRoomScene.module.css'

function useParallaxOffset(mouseX, mouseY, intensity) {
  const range = intensity * 24
  const x = useSpring(useTransform(mouseX, [0, 1], [-range, range]))
  const y = useSpring(useTransform(mouseY, [0, 1], [-range, range]))
  return { x, y }
}

export default function AnimatedRoomScene({ room, roomIndex, onInteract, onSolveFromScene }) {
  const config = getRoomSceneConfig(roomIndex)

  if (config.useDarkRoom) {
    return null
  }

  if (config.placeholder) {
    const title = room?.title || `Room ${(roomIndex ?? 0) + 1}`
    return (
      <div
        className={styles.room}
        data-testid="room-placeholder"
        onClick={() => onInteract(room?.puzzle_type || 'find_key', roomIndex, room)}
      >
        <div className={styles.roomInner}>
          <div className={styles.roomPlaceholder}>
            <h2>{title}</h2>
            {(room?.scene_preview || room?.scene) && (
              <p className={styles.sceneText}>{room.scene_preview || room.scene}</p>
            )}
            {!room?.scene && room?.atmosphere && <p className={styles.atmosphere}>{room.atmosphere}</p>}
            <p className={styles.clickHint}>Ask the NPC for a hint — then open the puzzle</p>
          </div>
        </div>
      </div>
    )
  }

  const { type, variant, src, effects = [] } = config
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const bg = useParallaxOffset(mouseX, mouseY, 0.12)
  const mid = useParallaxOffset(mouseX, mouseY, 0.22)
  const fg = useParallaxOffset(mouseX, mouseY, 0.35)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }
  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <div
      ref={containerRef}
      className={styles.room}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        if (room?.hotspots?.length && e.target.closest(`.${styles.hotspot}`)) return
        onInteract(room?.puzzle_type || 'find_key', roomIndex, room)
      }}
    >
      <div className={styles.roomInner}>
        <motion.div className={styles.layerBg} style={{ x: bg.x, y: bg.y }}>
          {type === 'image' && src ? (
            <ImageBackground src={src} overlay={true} />
          ) : (
            <ProceduralRoomBg variant={variant || 'library'} />
          )}
          <div
            className={styles.bgGradient}
            aria-hidden
          />
        </motion.div>
        <motion.div className={styles.layerMid} style={{ x: mid.x, y: mid.y }}>
          <div className={styles.midShade} />
        </motion.div>
        <motion.div className={styles.layerFg} style={{ x: fg.x, y: fg.y }}>
          <div className={styles.fgShade} />
        </motion.div>
        <div className={styles.vignette} aria-hidden />
        <div className={styles.grain} aria-hidden />
        {effects.includes('dust') && (
          <div className={styles.dustLayer} aria-hidden>
            {[
              [12, 8], [67, 22], [34, 45], [89, 33], [5, 58], [52, 72], [23, 18], [78, 55],
              [41, 62], [91, 12], [18, 78], [61, 35], [8, 42], [72, 68], [35, 85],
            ].map(([left, top], i) => (
              <div key={i} className={styles.dust} style={{ '--i': i, left: `${left}%`, top: `${top}%` }} />
            ))}
          </div>
        )}
        {effects.includes('steam') && (
          <div className={styles.steamLayer} aria-hidden>
            <div className={styles.steam} />
            <div className={`${styles.steam} ${styles.steam2}`} />
          </div>
        )}
        {effects.includes('chain') && (
          <div className={styles.chainSway} aria-hidden />
        )}
        {effects.includes('shadow') && (
          <div className={styles.ambientShadow} aria-hidden />
        )}
        {effects.includes('library') && (
          <div className={styles.libraryPaperOverlay} aria-hidden />
        )}
        {effects.includes('kitchen') && (
          <div className={styles.kitchenWarmOverlay} aria-hidden />
        )}
        {effects.includes('dungeon') && (
          <div className={styles.dungeonColdOverlay} aria-hidden />
        )}
        {effects.includes('firefly') && (
          <div className={styles.fireflyLayer} aria-hidden>
            {[
              [15, 12], [72, 18], [38, 52], [85, 40], [8, 65], [55, 78], [28, 22], [62, 58],
              [45, 35], [90, 8], [20, 72], [68, 42], [12, 48], [78, 65],
            ].map(([left, top], i) => (
              <div key={i} className={styles.firefly} style={{ '--i': i, left: `${left}%`, top: `${top}%` }} />
            ))}
          </div>
        )}
        {room?.hotspots?.length > 0 && (
          <div className={styles.hotspotsLayer}>
            {room.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                className={styles.hotspot}
                style={{
                  left: `${h.left}%`,
                  top: `${h.top}%`,
                  width: `${h.width}%`,
                  height: `${h.height}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onInteract(room?.puzzle_type || 'find_key', roomIndex, room)
                }}
              >
                <span className={styles.hotspotLabel}>{h.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className={styles.overlay}>
          <h2 className={styles.overlayTitle}>{room?.title || `Room ${roomIndex + 1}`}</h2>
          {(room?.scene_preview || room?.scene) && (
            <p className={styles.overlayScene}>{room.scene_preview || room.scene}</p>
          )}
          <p className={styles.clickHint}>Ask the NPC for a hint — click to open the puzzle</p>
        </div>
      </div>
    </div>
  )
}
