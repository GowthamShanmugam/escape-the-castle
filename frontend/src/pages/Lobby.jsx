import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGame } from '../api'
import styles from './Lobby.module.css'

export default function Lobby({ gameCode, playerId, playerName, onLeave }) {
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getGame(gameCode)
      .then((data) => { if (!cancelled) setGame(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [gameCode])

  const players = game ? Object.values(game.players || {}) : []
  const INTRO_SEEN_KEY = 'castle_intro_seen'
  const startGame = () => {
    if (sessionStorage.getItem(INTRO_SEEN_KEY)) {
      navigate('/game')
    } else {
      navigate('/intro')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Lobby</h1>
        <p className={styles.gameCode}>Game code: <strong>{gameCode}</strong></p>
        <p className={styles.hint}>Share this code so others can join. When ready, start the game.</p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.players}>
          <h2>Players ({players.length})</h2>
          <ul>
            {players.map((p) => (
              <li key={p.player_id} className={p.player_id === playerId ? styles.you : ''}>
                {p.player_name} {p.player_id === playerId && '(you)'}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={startGame} className={styles.primary}>Start Game</button>
          <button type="button" onClick={onLeave} className={styles.secondary}>Leave</button>
        </div>
      </div>
    </div>
  )
}
