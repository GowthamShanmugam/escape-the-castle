import { useState, useRef } from 'react'
import { playEffect } from '../audio/soundService'
import styles from './DarkRoomScene.module.css'

export default function DarkRoomScene({ room, backgroundImage, onSolve, onClose, onRequestHint }) {
  const [torchPos, setTorchPos] = useState({ x: 50, y: 50 })
  const [keyFound, setKeyFound] = useState(false)
  const [keyDragging, setKeyDragging] = useState(false)
  const [keyPosition, setKeyPosition] = useState({ x: 20, y: 80 })
  const [feedback, setFeedback] = useState(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const hotspots = room?.hotspots || []
  const doorHotspot = hotspots.find((h) => h.id === 'door')
  const keyHotspot = hotspots.find((h) => h.id === 'key')

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTorchPos({ x, y })
    /* Parallax: normalized offset from center (-1..1), max shift ~8px for mid layer */
    const nx = (x - 50) / 50
    const ny = (y - 50) / 50
    setParallax({ x: nx * 8, y: ny * 8 })
  }

  const handleHotspotClick = (hotspot) => {
    playEffect('click')
    if (hotspot.id === 'key') {
      setKeyFound(true)
      setKeyPosition({
        x: hotspot.left + hotspot.width / 2,
        y: hotspot.top + hotspot.height / 2,
      })
      setFeedback(hotspot.label ? `${hotspot.label}.` : '—')
      setTimeout(() => setFeedback(null), 1000)
      return
    }
    if (hotspot.id === 'door') {
      if (keyFound) setFeedback(hotspot.label ? `${hotspot.label}.` : '—')
      else setFeedback(hotspot.label ? `${hotspot.label}. Locked.` : 'Locked.')
      setTimeout(() => setFeedback(null), 1200)
      return
    }
    setFeedback(hotspot.label ? hotspot.label : '—')
    setTimeout(() => setFeedback(null), 1000)
  }

  const handleKeyDragStart = (e) => {
    if (!keyFound) return
    setKeyDragging(true)
    e.dataTransfer.setData('text/plain', 'key')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleKeyDragEnd = () => setKeyDragging(false)

  const handleDoorDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.getData('text/plain') === 'key' && keyFound) {
      onSolve()
    }
  }

  const handleDoorDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleSceneDragOver = (e) => {
    if (!keyDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setKeyPosition({ x, y })
  }

  return (
    <div
      ref={containerRef}
      className={styles.scene}
      onMouseMove={handleMouseMove}
      onDragOver={handleSceneDragOver}
    >
      {/* Parallax back layer: room background; darken via overlay (not filter) so only this layer is affected */}
      {backgroundImage && (
        <div
          className={styles.roomBackgroundWrapper}
          style={{
            transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
          }}
          aria-hidden
        >
          <div
            className={styles.roomBackground}
            style={{ backgroundImage: `url("${backgroundImage}")` }}
          />
          {/* Darken only the background image when key not found; objects stay untouched */}
          {!keyFound && (
            <div
              className={styles.backgroundDarken}
              aria-hidden
            />
          )}
        </div>
      )}
      {/* Parallax mid layer: furniture / objects */}
      <div
        className={styles.objectLayer}
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
        }}
        aria-hidden
      >
        <div className={keyFound ? `${styles.objectDoor} ${styles.objectDoorGlow}` : styles.objectDoor} />
        <div className={styles.objectWall} />
        <div className={styles.objectCrate} />
        <div className={styles.objectCrate2} />
        <div className={styles.objectCrate3} />
        <div className={styles.objectBarrel} />
        <div className={styles.objectBarrel2} />
        <div className={styles.objectShelf} />
        <div className={styles.objectChest} />
        <div className={styles.objectStool} />
        <div className={styles.objectSack} />
        <div className={styles.objectPillar} />
        <div className={styles.objectPillar2} />
        <div className={styles.objectTable} />
        <div className={styles.objectBucket} />
        <div className={styles.objectBucket2} />
        <div className={styles.objectBench} />
        <div className={styles.objectBox} />
        <div className={styles.objectBox2} />
        <div className={styles.objectChains} />
        <div className={styles.objectVase} />
        <div className={styles.objectVase2} />
        <div className={styles.objectRug} />
        <div className={styles.objectSconce} />
        <div className={styles.objectSconce2} />
        <div className={styles.objectPot} />
        <div className={styles.objectBasket} />
        <div className={styles.objectRope} />
        <div className={styles.objectJug} />
        <div className={styles.objectCup} />
        <div className={styles.objectLantern} />
        <div className={styles.objectBook} />
        {/* Decoys near key to confuse */}
        <div className={styles.objectDecoyHook} />
        <div className={styles.objectDecoyCoil} />
        <div className={styles.objectDecoyBottle} />
        <div className={styles.objectDecoyNail} />
        <div className={styles.objectDecoyRing} />
        <div className={styles.objectDecoyBox} />
        {!keyFound && <div className={styles.objectKey} />}
      </div>
      {/* Dust particles in torch beam — only when key not found */}
      {!keyFound && (
        <div
          className={styles.dustLayer}
          style={{ left: `${torchPos.x}%`, top: `${torchPos.y}%` }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.dustParticle} />
          ))}
        </div>
      )}
      {/* Dark cover + torch only while key not found; when key found, room stays lit so you can reach the door */}
      {!keyFound && (
        <>
          {/* Dark overlay: gradient draws the hole at torch (no mask); rest is solid black */}
          <div
            className={styles.darkCover}
            style={{
              background: `radial-gradient(circle at ${torchPos.x}% ${torchPos.y}%, transparent 0%, transparent 2%, #000 2.2%, #000 100%)`,
            }}
            aria-hidden
          />
          <div className={styles.torchLight} style={{ left: `${torchPos.x}%`, top: `${torchPos.y}%` }} />
        </>
      )}
      <div className={styles.sceneContent}>
        <p className={styles.sceneText}>{room?.scene || room?.atmosphere}</p>
        <p className={styles.instruction}>
          {keyFound ? 'Take it to the door.' : 'Move the torch through the darkness.'}
        </p>
      </div>

      {onRequestHint && (
        <button type="button" className={styles.hintBtn} onClick={onRequestHint}>
          🧙 Hint
        </button>
      )}

      {/* Render key hotspot last so it's on top and clickable (not behind crate/shelf) */}
      {hotspots
        .filter((h) => h.id !== 'key')
        .map((h) => (
          <button
            key={h.id}
            type="button"
            className={`${styles.hotspot} ${h.id === 'door' ? styles.door : ''}`}
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            onClick={() => handleHotspotClick(h)}
            onDrop={h.id === 'door' ? handleDoorDrop : undefined}
            onDragOver={h.id === 'door' ? handleDoorDragOver : undefined}
          />
        ))}
      {keyHotspot && !keyFound && (
        <button
          type="button"
          className={`${styles.hotspot} ${styles.keyHotspot}`}
          style={{
            left: `${keyHotspot.left}%`,
            top: `${keyHotspot.top}%`,
            width: `${keyHotspot.width}%`,
            height: `${keyHotspot.height}%`,
          }}
          onClick={() => handleHotspotClick(keyHotspot)}
        />
      )}

      {keyFound && (
        <div
          className={`${styles.draggableKey} ${keyDragging ? styles.dragging : ''}`}
          style={{ left: `${keyPosition.x}%`, top: `${keyPosition.y}%` }}
          draggable
          onDragStart={handleKeyDragStart}
          onDragEnd={handleKeyDragEnd}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/1/11/Key-dynamic-premium.png"
            alt="Key"
            className={styles.draggableKeyImg}
            draggable={false}
          />
        </div>
      )}

      {feedback && <div className={styles.feedback}>{feedback}</div>}
    </div>
  )
}
