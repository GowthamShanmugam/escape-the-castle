import { useState, useCallback, useMemo, useEffect } from 'react'
import styles from './PuzzleJigsaw.module.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Fallback: armory-themed SVG as data URL (shield/crest) when no image is provided or load fails
const FALLBACK_SVG = (
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">' +
    '<defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4a3728"/><stop offset="100%" style="stop-color:#2d1f14"/></linearGradient>' +
    '<linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#c9a227"/><stop offset="100%" style="stop-color:#8b6914"/></linearGradient></defs>' +
    '<rect width="400" height="400" fill="url(#g1)"/>' +
    '<path d="M200 40 L320 120 L320 220 L200 360 L80 220 L80 120 Z" fill="none" stroke="url(#g2)" stroke-width="12"/>' +
    '<path d="M200 80 L260 120 L260 200 L200 280 L140 200 L140 120 Z" fill="rgba(201,162,39,0.2)" stroke="#c9a227" stroke-width="4"/>' +
    '<circle cx="200" cy="180" r="35" fill="none" stroke="#c9a227" stroke-width="6"/>' +
    '<line x1="200" y1="145" x2="200" y2="215" stroke="#c9a227" stroke-width="4"/>' +
    '<line x1="165" y1="180" x2="235" y2="180" stroke="#c9a227" stroke-width="4"/>' +
    '</svg>'
  )
)

export default function PuzzleJigsaw({ onSolve, onClose, room, bribedHint }) {
  const rows = room?.jigsaw?.rows ?? 6
  const cols = room?.jigsaw?.cols ?? 6
  const imageUrl = room?.jigsaw?.imageUrl || null
  const instruction = room?.jigsaw?.instruction || 'Reassemble the shattered image by swapping pieces. Drag a piece onto another to swap.'

  const total = rows * cols
  const initialOrder = useMemo(() => shuffle(Array.from({ length: total }, (_, i) => i)), [total])

  const [order, setOrder] = useState(initialOrder)
  const [dragSlot, setDragSlot] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [wrong, setWrong] = useState(false)

  const imageSrc = imageUrl && !imageError ? imageUrl : FALLBACK_SVG

  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.onerror = () => setImageError(true)
    img.src = imageUrl
  }, [imageUrl])

  const handleDragStart = useCallback((e, slotIndex) => {
    setDragSlot(slotIndex)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(slotIndex))
    e.target.classList.add(styles.dragging)
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove(styles.dragging)
    setDragSlot(null)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e, dropSlotIndex) => {
    e.preventDefault()
    const dragSlotIndex = dragSlot !== null ? dragSlot : parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (Number.isNaN(dragSlotIndex) || dragSlotIndex === dropSlotIndex) {
      setDragSlot(null)
      return
    }
    setOrder((prev) => {
      const next = [...prev]
      const a = next[dragSlotIndex]
      next[dragSlotIndex] = next[dropSlotIndex]
      next[dropSlotIndex] = a
      return next
    })
    setWrong(false)
    setDragSlot(null)
  }, [dragSlot])

  const handleCheck = useCallback(async () => {
    setWrong(false)
    try {
      await onSolve(order.join(','))
    } catch {
      setWrong(true)
    }
  }, [order, onSolve])

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{room?.title ?? 'Armory'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <p className={styles.instruction}>{instruction}</p>

      {bribedHint && <p className={styles.closerClue}>{bribedHint}</p>}

      <div className={styles.referenceWrap} aria-hidden>
        <span className={styles.referenceLabel}>Reference</span>
        <div
          className={styles.referenceImage}
          style={{ backgroundImage: `url(${imageSrc})` }}
          title="Complete image for reference"
        />
      </div>

      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          aspectRatio: `${cols} / ${rows}`,
        }}
      >
        {order.map((pieceId, slotIndex) => {
          const row = Math.floor(pieceId / cols)
          const col = pieceId % cols
          // Correct sprite-style positioning: each tile is 1/(cols-1) and 1/(rows-1) step so tiles don't overlap
          const xPercent = cols > 1 ? (col / (cols - 1)) * 100 : 0
          const yPercent = rows > 1 ? (row / (rows - 1)) * 100 : 0
          return (
            <div
              key={`${slotIndex}-${order[slotIndex]}`}
              className={styles.piece}
              draggable
              onDragStart={(e) => handleDragStart(e, slotIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slotIndex)}
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${xPercent}% ${yPercent}%`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`Piece ${slotIndex + 1}, position ${slotIndex + 1} of ${total}`}
            />
          )
        })}
      </div>

      {wrong && <p className={styles.wrong}>Not quite. Keep rearranging the pieces.</p>}

      <div className={styles.actions}>
        <button type="button" onClick={handleCheck} className={styles.checkBtn}>
          Check alignment
        </button>
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  )
}
