import styles from './RoomMap.module.css'

export default function RoomMap({ rooms, currentRoomIndex, totalRooms, completedRooms = [], onRoomSelect }) {
  const completedSet = new Set(Array.isArray(completedRooms) ? completedRooms : [])
  const count = totalRooms || rooms?.length || 15
  const hasClickable = completedSet.size < count && onRoomSelect

  return (
    <div className={styles.roomMap}>
      <div className={styles.roomMapScroll}>
        <div className={styles.roomMapScrollInner}>
          <div className={styles.roomMapTitle}>Castle Map</div>
          {hasClickable && <span className={styles.roomMapHint}>Tap a room to jump there</span>}
          <div className={styles.roomMapTrack}>
            <span className={styles.roomMapLandmark} aria-hidden>🏰</span>
            <div className={styles.roomMapChips}>
              {Array.from({ length: count }, (_, i) => {
                const isCompleted = completedSet.has(i)
                const isCurrent = i === currentRoomIndex
                const isClickable = !isCompleted && onRoomSelect
                return (
                  <button
                    key={i}
                    type="button"
                    className={`
                      ${styles.roomMapChip}
                      ${isCompleted ? styles.roomMapChipCompleted : ''}
                      ${isCurrent ? styles.roomMapChipCurrent : ''}
                      ${!isCompleted && !isCurrent ? styles.roomMapChipUpcoming : ''}
                      ${isClickable ? styles.roomMapChipClickable : ''}
                    `}
                    disabled={!isClickable}
                    onClick={isClickable ? () => onRoomSelect(i) : undefined}
                    title={isClickable ? `Jump to room ${i + 1}` : undefined}
                    aria-label={isCompleted ? `Room ${i + 1} completed` : isCurrent ? `Room ${i + 1} current` : isClickable ? `Room ${i + 1} — click to jump` : `Room ${i + 1}`}
                  >
                    {isCompleted ? (
                      <span className={styles.roomMapChipCheck}>✓</span>
                    ) : (
                      <span className={styles.roomMapChipNum}>{i + 1}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <span className={styles.roomMapLandmark} aria-hidden>🚪</span>
          </div>
          <div className={styles.roomMapLabels}>
            <span>Entrance</span>
            <span className={styles.roomMapProgress}>Room {currentRoomIndex + 1}</span>
            <span>Escape</span>
          </div>
        </div>
      </div>
    </div>
  )
}
