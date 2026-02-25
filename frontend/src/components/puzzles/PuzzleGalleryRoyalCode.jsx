import { useState } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './PuzzleGalleryRoyalCode.module.css'

const DEFAULT_PAINTINGS = [
  { role: 'ancestor', emoji: '👴', clues: { red: { type: 'symbol', value: 0 }, blue: { type: 'position', value: 1 }, green: { type: 'next', value: 'queen' } } },
  { role: 'queen', emoji: '👸', clues: { red: { type: 'symbol', value: 2 }, blue: { type: 'position', value: 2 }, green: { type: 'next', value: 'king' } } },
  { role: 'king', emoji: '🤴', clues: { red: { type: 'symbol', value: 1 }, blue: { type: 'position', value: 3 }, green: { type: 'next', value: 'princess' } } },
  { role: 'princess', emoji: '👧', clues: { red: { type: 'symbol', value: 4 }, blue: { type: 'position', value: 4 }, green: { type: 'next', value: 'prince' } } },
  { role: 'prince', emoji: '👦', clues: { red: { type: 'symbol', value: 3 }, blue: { type: 'position', value: 5 }, green: { type: 'next', value: null } } },
  { role: 'traitor', emoji: '😈', clues: { red: { type: 'symbol', value: null }, blue: { type: 'position', value: null }, green: { type: 'next', value: null } } },
]
const DEFAULT_SYMBOLS = [
  { id: 0, emoji: '🦁', label: 'Lion' },
  { id: 1, emoji: '⚔️', label: 'Sword' },
  { id: 2, emoji: '👑', label: 'Crown' },
  { id: 3, emoji: '🐦‍⬛', label: 'Raven' },
  { id: 4, emoji: '🛡️', label: 'Shield' },
]
const LIGHT_LABELS = { red: '🔴 Red', blue: '🔵 Blue', green: '🟢 Green' }
const OBFUSCATED_LABELS = { red: 'Shard A', blue: 'Shard B', green: 'Shard C' }
const POSITION_LABELS = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }

export default function PuzzleGalleryRoyalCode({ room, onSolve, onClose }) {
  const config = room?.gallery_royal_code || {}
  const paintings = config.paintings ?? DEFAULT_PAINTINGS
  const symbols = config.symbols ?? DEFAULT_SYMBOLS
  const lights = config.lights ?? ['red', 'blue', 'green']

  const obfuscate = config.obfuscateLights === true
  const [selectedLights, setSelectedLights] = useState([])
  const [zoomedIndex, setZoomedIndex] = useState(null)
  const codeLength = (config.order ?? [0, 2, 1, 4, 3]).length
  const [symbolOrder, setSymbolOrder] = useState(() =>
    Array.from({ length: codeLength }, (_, i) => i)
  )
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [wrongFeedback, setWrongFeedback] = useState(false)

  const lightKey = selectedLights.length === 0
    ? null
    : selectedLights.length === 1
      ? selectedLights[0]
      : [...selectedLights].sort().join('+')
  const zoomedPainting = zoomedIndex != null ? paintings[zoomedIndex] : null
  const clue = zoomedPainting && lightKey
    ? (zoomedPainting.clues || {})[lightKey]
    : null

  const handleLightClick = (light) => {
    playEffect('click')
    setSelectedLights((prev) => {
      if (prev.includes(light)) return prev.filter((l) => l !== light)
      if (prev.length >= 2) return [prev[1], light]
      return [...prev, light]
    })
  }

  const handleFrameClick = (index) => {
    playEffect('click')
    setZoomedIndex(index)
  }

  const handleCloseZoom = () => {
    playEffect('close')
    setZoomedIndex(null)
  }

  const handleSlotClick = (position) => {
    if (selectedSlot === null) {
      setSelectedSlot(position)
      return
    }
    if (selectedSlot === position) {
      setSelectedSlot(null)
      return
    }
    playEffect('click')
    const next = [...symbolOrder]
    const a = symbolOrder[selectedSlot]
    next[selectedSlot] = next[position]
    next[position] = a
    setSymbolOrder(next)
    setSelectedSlot(null)
  }

  const handleSubmit = () => {
    const correctOrder = config.order ?? [0, 2, 1, 4, 3]
    const correct =
      symbolOrder.length === correctOrder.length &&
      symbolOrder.every((v, i) => v === correctOrder[i])
    if (correct) {
      playEffect('success')
      onSolve(symbolOrder.join(','))
    } else {
      playEffect('fail')
      setWrongFeedback(true)
      setTimeout(() => setWrongFeedback(false), 2200)
    }
  }

  function renderClue() {
    if (!clue) {
      return <p className={styles.zoomClueEmpty}>Nothing visible.</p>
    }
    if (clue.type === 'next' && (clue.value === null || clue.value === undefined)) {
      return (
        <div className={styles.zoomClue}>
          <span className={styles.zoomClueLabel}>Next in line:</span>
          <span className={styles.zoomClueNext}>— Last in line</span>
        </div>
      )
    }
    if (clue.value === null || clue.value === undefined) {
      return <p className={styles.zoomClueEmpty}>Nothing visible.</p>
    }
    if (clue.type === 'symbol') {
      const sym = symbols[clue.value]
      return (
        <div className={styles.zoomClue}>
          <span className={styles.zoomClueLabel}>Symbol:</span>
          <span className={styles.zoomClueSymbol}>{sym?.emoji ?? '?'}</span>
        </div>
      )
    }
    if (clue.type === 'position') {
      return (
        <div className={styles.zoomClue}>
          <span className={styles.zoomClueLabel}>Position:</span>
          <span className={styles.zoomCluePosition}>{POSITION_LABELS[clue.value] ?? clue.value}</span>
        </div>
      )
    }
    if (clue.type === 'next') {
      const nextRole = (clue.value || '').toLowerCase()
      const nextPainting = paintings.find((p) => (p.role || '').toLowerCase() === nextRole)
      return (
        <div className={styles.zoomClue}>
          <span className={styles.zoomClueLabel}>Next in line:</span>
          <span className={styles.zoomClueNext}>{nextPainting?.emoji ?? clue.value} {nextRole}</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.puzzle}>
      <h2>{room?.title ?? 'Gallery'}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>

      <div className={styles.galleryRoom}>
        {selectedLights.length > 0 && (
          <div
            className={styles.colorOverlay}
            style={{
              backgroundColor:
                selectedLights.length === 2
                  ? selectedLights.includes('red') && selectedLights.includes('blue')
                    ? 'rgba(100, 55, 105, 0.25)'
                    : selectedLights.includes('red') && selectedLights.includes('green')
                      ? 'rgba(105, 85, 55, 0.25)'
                      : 'rgba(50, 90, 110, 0.25)'
                  : selectedLights[0] === 'red'
                    ? 'rgba(160, 50, 50, 0.2)'
                    : selectedLights[0] === 'blue'
                      ? 'rgba(50, 60, 160, 0.2)'
                      : 'rgba(50, 120, 60, 0.2)',
            }}
            aria-hidden
          />
        )}
        <div className={styles.torchWrap}>
          <span className={styles.torch} title="Torch">🔥</span>
        </div>
        <div className={styles.shards}>
          {lights.map((light) => (
            <button
              key={light}
              type="button"
              className={`${styles.shard} ${styles['shard' + light.charAt(0).toUpperCase() + light.slice(1)]} ${selectedLights.includes(light) ? styles.shardActive : ''}`}
              onClick={() => handleLightClick(light)}
              title={obfuscate ? undefined : `${light} light`}
              aria-pressed={selectedLights.includes(light)}
            >
              {obfuscate ? (OBFUSCATED_LABELS[light] ?? light) : (LIGHT_LABELS[light] ?? light)}
            </button>
          ))}
        </div>
        <p className={styles.shardHint}>
          Find which symbol goes in each position (I through V).
        </p>

        <div className={styles.frames}>
          {paintings.map((p, i) => (
            <button
              key={p.role}
              type="button"
              className={styles.frame}
              onClick={() => handleFrameClick(i)}
              title={`${p.role} portrait`}
            >
              <span className={styles.frameEmoji}>{p.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {zoomedIndex !== null && (
        <div className={styles.zoomBackdrop} onClick={handleCloseZoom} role="presentation">
          <div className={styles.zoomModal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.zoomClose} onClick={handleCloseZoom} aria-label="Back">
              ← Back
            </button>
            <div className={styles.zoomFrame}>
              <span className={styles.zoomEmoji}>{zoomedPainting?.emoji}</span>
              {lightKey ? renderClue() : (
                <p className={styles.zoomHint}>Look closely at the portrait.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.enterCode} ${wrongFeedback ? styles.wrongFeedback : ''}`}>
        <p className={styles.enterCodeLabel}>
          Enter the code: arrange the {codeLength} symbols in order (I through {['I','II','III','IV','V'][codeLength - 1] ?? codeLength}).
        </p>
        <div className={styles.symbolRow}>
          {symbolOrder.map((symbolId, position) => (
            <button
              key={`${position}-${symbolId}`}
              type="button"
              className={`${styles.symbolBtn} ${selectedSlot === position ? styles.symbolBtnSelected : ''}`}
              onClick={() => handleSlotClick(position)}
            >
              {symbols[symbolId]?.emoji ?? symbolId}
            </button>
          ))}
        </div>
        <p className={styles.swapHint}>Click two positions to swap.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.solveBtn} onClick={handleSubmit}>
            Submit code
          </button>
        </div>
      </div>

      <button type="button" onClick={onClose} className={styles.closeBtn}>
        Close
      </button>
    </div>
  )
}
