const API = '/api'

async function parseError(res) {
  try {
    const j = await res.json()
    return j.detail || j.message || 'Request failed'
  } catch {
    return res.statusText || `Failed (${res.status})`
  }
}

export async function createGame(playerName) {
  const res = await fetch(`${API}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name: playerName }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function joinGame(gameCode, playerName) {
  const res = await fetch(`${API}/games/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_code: gameCode.trim().toUpperCase(), player_name: playerName }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getGame(gameCode) {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameCode)}`)
  if (!res.ok) throw new Error('Game not found')
  return res.json()
}

export async function advanceRoom(gameCode, playerId, roomIndex, puzzleAnswer = null) {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameCode)}/players/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_id: playerId,
      room_index: roomIndex,
      puzzle_answer: puzzleAnswer ?? undefined,
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function jumpRoom(gameCode, playerId, roomIndex) {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameCode)}/players/jump`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, room_index: roomIndex }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function spendCoinForResume(gameCode, playerId, purpose) {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameCode)}/players/spend-coin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, purpose }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function bribeNpc(gameCode, playerId) {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameCode)}/players/bribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getRooms() {
  const res = await fetch(`${API}/rooms`)
  if (!res.ok) throw new Error('Failed to load rooms')
  return res.json()
}

export function wsGameLive(gameCode, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const ws = new WebSocket(`${protocol}//${host}/ws/games/${gameCode}`)
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      onMessage(data)
    } catch (_) {}
  }
  return ws
}
