import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Loading from './pages/Loading'
import IntroScreen from './pages/IntroScreen'
import Game from './pages/Game'
import Congratulations from './pages/Congratulations'

const STORAGE_KEYS = { gameCode: 'castle_game_code', playerId: 'castle_player_id', playerName: 'castle_player_name' }

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const [gameCode, setGameCode] = useState(() => localStorage.getItem(STORAGE_KEYS.gameCode) || '')
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(STORAGE_KEYS.playerId) || '')
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(STORAGE_KEYS.playerName) || '')

  // Dev: load session from URL ?code=...&player=...&name=... and go to game
  useEffect(() => {
    if (location.pathname !== '/' || !location.search) return
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const player = params.get('player')
    const name = params.get('name')
    if (code && player) {
      localStorage.setItem(STORAGE_KEYS.gameCode, code)
      localStorage.setItem(STORAGE_KEYS.playerId, player)
      localStorage.setItem(STORAGE_KEYS.playerName, name || 'Player')
      setGameCode(code)
      setPlayerId(player)
      setPlayerName(name || 'Player')
      navigate('/game', { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  // Sync from navigation state (e.g. after create/join) so Lobby/Game get correct props
  useEffect(() => {
    const state = location.state
    if (state?.gameCode) {
      localStorage.setItem(STORAGE_KEYS.gameCode, state.gameCode)
      setGameCode(state.gameCode)
    }
    if (state?.playerId) {
      localStorage.setItem(STORAGE_KEYS.playerId, state.playerId)
      setPlayerId(state.playerId)
    }
    if (state?.playerName) {
      localStorage.setItem(STORAGE_KEYS.playerName, state.playerName)
      setPlayerName(state.playerName)
    }
  }, [location.state])

  const saveSession = (code, id, name) => {
    if (code) localStorage.setItem(STORAGE_KEYS.gameCode, code)
    if (id) localStorage.setItem(STORAGE_KEYS.playerId, id)
    if (name) localStorage.setItem(STORAGE_KEYS.playerName, name)
    setGameCode(code || gameCode)
    setPlayerId(id || playerId)
    setPlayerName(name || playerName)
  }

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.gameCode)
    localStorage.removeItem(STORAGE_KEYS.playerId)
    localStorage.removeItem(STORAGE_KEYS.playerName)
    setGameCode('')
    setPlayerId('')
    setPlayerName('')
  }

  return (
    <Routes>
      <Route path="/" element={<Home onJoin={saveSession} />} />
      <Route path="/lobby" element={gameCode && playerId ? <Lobby gameCode={gameCode} playerId={playerId} playerName={playerName} onLeave={clearSession} /> : <Navigate to="/" replace />} />
      <Route path="/loading" element={gameCode && playerId ? <Loading /> : <Navigate to="/" replace />} />
      <Route path="/intro" element={gameCode && playerId ? <IntroScreen /> : <Navigate to="/" replace />} />
      <Route path="/game" element={gameCode && playerId ? <Game gameCode={gameCode} playerId={playerId} playerName={playerName} onLeave={clearSession} /> : <Navigate to="/" replace />} />
      <Route path="/congrats" element={<Congratulations onLeave={clearSession} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
