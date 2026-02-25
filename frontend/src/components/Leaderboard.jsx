import styles from './Leaderboard.module.css'

export default function Leaderboard({ leaderboard = [], totalRooms = 15, youId }) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Leaderboard</h2>
      <ul className={styles.list}>
        {leaderboard.map((entry, i) => {
          const isYou = entry.player_id === youId
          const finished = entry.current_room >= totalRooms
          return (
            <li key={entry.player_id} className={`${styles.item} ${isYou ? styles.you : ''} ${finished ? styles.finished : ''}`}>
              <span className={styles.rank}>#{i + 1}</span>
              <span className={styles.name}>{entry.player_name} {isYou && '(you)'}</span>
              <span className={styles.room}>
                {finished ? '🏆 ' : ''}{(entry.completed_rooms?.length ?? 0)}/{totalRooms} · {entry.coins ?? 0} 🪙
              </span>
            </li>
          )
        })}
      </ul>
      {leaderboard.length === 0 && <p className={styles.empty}>No players yet.</p>}
    </div>
  )
}
