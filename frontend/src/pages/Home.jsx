import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame, joinGame } from '../api'
import styles from './Home.module.css'

export default function Home({ onJoin }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('join') // 'join' | 'create' — players join; only admin can create
  const [playerName, setPlayerName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!playerName.trim()) return setError('Enter your name')
    if (!adminPassword.trim()) return setError('Admin password required to create a game')
    setLoading(true)
    try {
      const data = await createGame(playerName.trim(), adminPassword.trim())
      onJoin(data.game_code, data.player_id, data.player_name)
      navigate('/lobby', { state: { gameCode: data.game_code, playerId: data.player_id, playerName: data.player_name } })
    } catch (err) {
      setError(err.message || 'Could not create game')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    if (!playerName.trim()) return setError('Enter your name')
    if (!gameCode.trim()) return setError('Enter game code')
    setLoading(true)
    try {
      const data = await joinGame(gameCode.trim(), playerName.trim())
      onJoin(data.game_code, data.player_id, data.player_name)
      navigate('/lobby', { state: { gameCode: data.game_code, playerId: data.player_id, playerName: data.player_name } })
    } catch (err) {
      setError(err.message || 'Could not join game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <span className={styles.crown} aria-hidden>👑</span>
        <h1 className={styles.title}>Escape the Castle</h1>
        <p className={styles.subtitle}>Enter the castle. Solve its puzzles. Escape or perish.</p>

        <div className={styles.tabs}>
          <button type="button" className={mode === 'join' ? styles.tabActive : styles.tab} onClick={() => setMode('join')}>Join Game</button>
          <button type="button" className={mode === 'create' ? styles.tabActive : styles.tab} onClick={() => setMode('create')}>Create Game (Admin)</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className={styles.form}>
            <label>Your name</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name" autoFocus />
            <label>Game code</label>
            <input type="text" value={gameCode} onChange={e => setGameCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3D4" maxLength={8} />
            <button type="submit" disabled={loading}>Join Game</button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className={styles.form}>
            <label>Your name</label>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Knight or nickname" />
            <label>Admin password</label>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Admin password" />
            <button type="submit" disabled={loading}>Create & Enter Lobby</button>
          </form>
        )}
      </div>
    </div>
  )
}
