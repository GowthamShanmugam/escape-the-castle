import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getGame, getRooms, advanceRoom, jumpRoom, bribeNpc } from '../api'
import { getNpcDialogue } from '../data/npcDialogues'
import RoomView from '../components/RoomView'
import RoomMap from '../components/RoomMap'
import Leaderboard from '../components/Leaderboard'
import GameTour from '../components/GameTour'
import NPCPopup from '../components/NPCPopup'
import PuzzleTorch from '../components/puzzles/PuzzleTorch'
import PuzzleBook from '../components/puzzles/PuzzleBook'
import PuzzleCode from '../components/puzzles/PuzzleCode'
import PuzzleDungeonCode from '../components/puzzles/PuzzleDungeonCode'
import PuzzleSequence from '../components/puzzles/PuzzleSequence'
import PuzzleThrone from '../components/puzzles/PuzzleThrone'
import PuzzleJigsaw from '../components/puzzles/PuzzleJigsaw'
import PuzzleTowerClimb from '../components/puzzles/PuzzleTowerClimb'
import PuzzleChainRhythm from '../components/puzzles/PuzzleChainRhythm'
import PuzzleLiquidBalance from '../components/puzzles/PuzzleLiquidBalance'
import PuzzleRealityShift from '../components/puzzles/PuzzleRealityShift'
import PuzzleBubbleRound from '../components/puzzles/PuzzleBubbleRound'
import PuzzleStablesRace from '../components/puzzles/PuzzleStablesRace'
import PuzzleGuardRoomStealth from '../components/puzzles/PuzzleGuardRoomStealth'
import PuzzleRoyalLineage from '../components/puzzles/PuzzleRoyalLineage'
import PuzzleGalleryRoyalCode from '../components/puzzles/PuzzleGalleryRoyalCode'
import { stopGameBackground, playEffect } from '../audio/soundService'
import styles from './Game.module.css'

const KNOWN_PUZZLE_TYPES = [
  'torch_key', 'book_clue', 'code_lock', 'sequence', 'throne_game', 'jigsaw', 'tower_climb',
  'chain_rhythm', 'liquid_balance', 'guard_room_stealth', 'royal_lineage', 'gallery_royal_code',
  'reality_shift', 'bubble_round', 'stables_race',
]

export default function Game({ gameCode, playerId, playerName, onLeave }) {
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [rooms, setRooms] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [puzzleOpen, setPuzzleOpen] = useState(null) // { type, roomIndex, room }
  const [npcPopup, setNpcPopup] = useState(null) // { message } after advancing a room
  const [error, setError] = useState('')
  const [puzzleSubmitError, setPuzzleSubmitError] = useState(null)
  const [chainRhythmKey, setChainRhythmKey] = useState(0)
  const [optimisticRoomIndex, setOptimisticRoomIndex] = useState(null)
  const wsRef = useRef(null)

  const totalRooms = rooms.length || 15
  const me = game?.players?.[playerId]
  const bribedHints = me?.bribed_hints ?? {}
  const currentRoomIndex = me?.current_room ?? 0
  const completedCount = me?.completed_rooms?.length ?? 0
  const isFinished = currentRoomIndex >= totalRooms && completedCount >= totalRooms
  const displayRoomIndex = Math.min(currentRoomIndex, totalRooms - 1)
  const shownRoomIndex = optimisticRoomIndex ?? displayRoomIndex
  const currentRoom = rooms[shownRoomIndex]

  useEffect(() => {
    getRooms().then((r) => setRooms(r.rooms || []))
  }, [])

  useEffect(() => {
    return () => stopGameBackground()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (puzzleOpen) {
        closePuzzle()
      } else if (npcPopup) {
        setNpcPopup(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [puzzleOpen, npcPopup])

  useEffect(() => {
    function load() {
      getGame(gameCode)
        .then((data) => {
          setGame(data)
          setLeaderboard(data.leaderboard || [])
        })
        .catch((e) => setError(e.message))
    }
    load()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws/games/${gameCode}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.game) setGame(data.game)
        if (data.leaderboard) setLeaderboard(data.leaderboard)
      } catch (_) {}
    }
    return () => { ws.close() }
  }, [gameCode])

  const openPuzzle = (type, roomIndex, room) => {
    playEffect('open')
    setPuzzleOpen({ type, roomIndex, room })
  }
  const closePuzzle = (skipCloseSound = false) => {
    if (!skipCloseSound) playEffect('close')
    setPuzzleOpen(null)
    setPuzzleSubmitError(null)
  }

  const applyAdvanceResult = (result) => {
    setGame((prev) => {
      if (!prev?.players?.[playerId]) return prev
      const updated = {
        ...prev.players[playerId],
        current_room: result.current_room,
        ...(result.finished ? { finished_at: Date.now() / 1000 } : {}),
        ...(result.completed_rooms && { completed_rooms: result.completed_rooms }),
        ...(result.coins != null && { coins: result.coins }),
      }
      return {
        ...prev,
        players: { ...prev.players, [playerId]: updated },
      }
    })
    setLeaderboard((prev) =>
      prev.map((p) =>
        p.player_id === playerId
          ? { ...p, current_room: result.current_room, completed_rooms: result.completed_rooms ?? p.completed_rooms, coins: result.coins ?? p.coins }
          : p
      )
    )
  }

  const handlePuzzleSolved = async (puzzleAnswer = null) => {
    if (!puzzleOpen) return
    const { roomIndex } = puzzleOpen
    setError('')
    try {
      const result = await advanceRoom(gameCode, playerId, roomIndex, puzzleAnswer)
      applyAdvanceResult(result)
      playEffect('success')
      closePuzzle(true)
      if (!result.finished) {
        setNpcPopup({ message: getNpcDialogue(roomIndex + 1), dismissAfterMs: 5000 })
      }
    } catch (e) {
      playEffect('fail')
      setError(e.message)
      if (puzzleOpen?.type === 'book_clue') {
        setPuzzleSubmitError('The lock does not turn.')
      }
      if (puzzleOpen?.type === 'sequence') {
        setPuzzleSubmitError('The larder stays shut.')
      }
      if (puzzleOpen?.type === 'code_lock' && puzzleOpen?.roomIndex === 3) {
        setPuzzleSubmitError('The chains hold.')
      }
      if (puzzleOpen?.type === 'chain_rhythm') {
        setChainRhythmKey((k) => k + 1)
      }
      if (puzzleOpen?.type === 'bubble_round') {
        setPuzzleSubmitError('The bubble pops. Try again.')
      }
    }
  }

  if (isFinished) {
    stopGameBackground()
    navigate('/congrats', {
      replace: true,
      state: { gameCode, playerId, leaderboard, totalRooms },
    })
    return null
  }

  return (
    <div className={styles.wrapper}>
      <GameTour onReady={!!(game && rooms.length > 0)} />
      <aside className={styles.sidebar}>
        <p className={styles.gameCode} data-tour-id="tour-gamecode">Game code: <strong>{gameCode}</strong></p>
        <p className={styles.coins} data-tour-id="tour-coins">🪙 {me?.coins ?? 0} coins</p>
        <button
          type="button"
          className={styles.hintBtn}
          data-tour-id="tour-hint"
          onClick={() => {
            playEffect('click')
            const roomIdx = shownRoomIndex
            const alreadyBribed = bribedHints[roomIdx] ?? bribedHints[String(roomIdx)]
            const hint = alreadyBribed ?? (currentRoom?.hint || 'Look around. The answer is here.')
            const hasCloserHint = currentRoom?.has_closer_hint && !alreadyBribed
            setNpcPopup({
              message: hint,
              dismissAfterMs: 8000,
              coins: me?.coins ?? 0,
              closerHint: hasCloserHint,
              onBribe: hasCloserHint && (me?.coins ?? 0) >= 1
                ? async () => {
                    try {
                      const res = await bribeNpc(gameCode, playerId)
                      setGame((prev) => {
                        if (!prev?.players?.[playerId]) return prev
                        return {
                          ...prev,
                          players: {
                            ...prev.players,
                            [playerId]: {
                              ...prev.players[playerId],
                              coins: res.coins,
                              bribed_hints: { ...(prev.players[playerId]?.bribed_hints ?? {}), [roomIdx]: res.closer_hint },
                            },
                          },
                        }
                      })
                      setLeaderboard((prev) =>
                        prev.map((p) => (p.player_id === playerId ? { ...p, coins: res.coins } : p))
                      )
                      setNpcPopup((pop) => pop && { ...pop, message: res.closer_hint, dismissAfterMs: 8000, coins: res.coins, closerHint: null, onBribe: null })
                      playEffect('click')
                    } catch (e) {
                      playEffect('fail')
                      setError(e.message)
                    }
                  }
                : null,
            })
          }}
        >
          🧙 Ask NPC for hint
        </button>
        <div data-tour-id="tour-leaderboard">
          <Leaderboard leaderboard={leaderboard} totalRooms={totalRooms} youId={playerId} />
        </div>
        <div data-tour-id="tour-map">
          <div className={styles.roomProgress}>
            Room {shownRoomIndex + 1} of {totalRooms}
          </div>
          <RoomMap
          rooms={rooms}
          currentRoomIndex={shownRoomIndex}
          totalRooms={totalRooms}
          completedRooms={me?.completed_rooms ?? []}
          onRoomSelect={async (roomIndex) => {
            if (roomIndex === shownRoomIndex) return
            setPuzzleOpen(null)
            setNpcPopup(null)
            setError('')
            setOptimisticRoomIndex(roomIndex)
            playEffect('click')
            try {
              const result = await jumpRoom(gameCode, playerId, roomIndex)
              applyAdvanceResult(result)
              setOptimisticRoomIndex(null)
            } catch (e) {
              setOptimisticRoomIndex(null)
              playEffect('fail')
              setError(e.message)
            }
          }}
        />
        </div>
        <button type="button" onClick={() => { playEffect('click'); onLeave?.() }} className={styles.leaveBtn} data-tour-id="tour-leave">Leave Game</button>
      </aside>

      <main className={styles.main} role="main" data-tour-id="tour-gamearea">
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.roomContainer}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={shownRoomIndex}
              className={styles.roomWrap}
              initial={{ opacity: 0, scale: 0.98, x: 16 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.99, x: -16 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <RoomView
                room={currentRoom}
                roomIndex={shownRoomIndex}
                onInteract={openPuzzle}
                onRequestHint={() => {
                  playEffect('click')
                  const roomIdx = shownRoomIndex
                  const hint = bribedHints[roomIdx] ?? bribedHints[String(roomIdx)] ?? (currentRoom?.hint || 'Look around. The answer is here.')
                  const hasCloserHint = currentRoom?.has_closer_hint && !bribedHints[roomIdx] && !bribedHints[String(roomIdx)]
                  setNpcPopup({
                    message: hint,
                    dismissAfterMs: 8000,
                    coins: me?.coins ?? 0,
                    closerHint: hasCloserHint,
                    onBribe: hasCloserHint && (me?.coins ?? 0) >= 1
                      ? async () => {
                          try {
                            const res = await bribeNpc(gameCode, playerId)
                            setGame((prev) => {
                              if (!prev?.players?.[playerId]) return prev
                              return {
                                ...prev,
                                players: {
                                  ...prev.players,
                                  [playerId]: {
                                    ...prev.players[playerId],
                                    coins: res.coins,
                                    bribed_hints: { ...(prev.players[playerId]?.bribed_hints ?? {}), [roomIdx]: res.closer_hint },
                                  },
                                },
                              }
                            })
                            setLeaderboard((prev) =>
                              prev.map((p) => (p.player_id === playerId ? { ...p, coins: res.coins } : p))
                            )
                            setNpcPopup((pop) => pop && { ...pop, message: res.closer_hint, dismissAfterMs: 8000, coins: res.coins, closerHint: null, onBribe: null })
                            playEffect('click')
                          } catch (e) {
                            playEffect('fail')
                            setError(e.message)
                          }
                        }
                      : null,
                  })
                }}
                onSolveFromScene={async (idx) => {
                  setError('')
                  try {
                    const result = await advanceRoom(gameCode, playerId, idx, null)
                    applyAdvanceResult(result)
                    playEffect('success')
                    if (!result.finished) {
                      setNpcPopup({ message: getNpcDialogue(idx + 1), dismissAfterMs: 5000 })
                    }
                  } catch (e) {
                    playEffect('fail')
                    setError(e.message)
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {npcPopup && (
          <NPCPopup
            key={npcPopup.onBribe ? 'npc-hint' : 'npc-bribed'}
            message={npcPopup.message}
            onDismiss={() => setNpcPopup(null)}
            dismissAfterMs={npcPopup.dismissAfterMs}
            coins={npcPopup.coins}
            onBribe={npcPopup.onBribe}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {puzzleOpen && (
          <motion.div
            className={styles.modalBackdrop}
            onClick={closePuzzle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={puzzleOpen.roomIndex === 3 ? styles.modalDungeon : puzzleOpen.roomIndex === 4 ? styles.modalThrone : styles.modal}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className={styles.modalHeaderBar}>
                <button
                  type="button"
                  className={styles.hintBtnModal}
                  onClick={() => {
                    playEffect('click')
                    const room = puzzleOpen?.room
                    const roomIdx = puzzleOpen?.roomIndex ?? currentRoomIndex
                    const alreadyBribed = bribedHints[roomIdx] ?? bribedHints[String(roomIdx)]
                    const hint = alreadyBribed ?? (room?.hint || 'Look around. The answer is here.')
                    const hasCloserHint = room?.has_closer_hint && !alreadyBribed
                    setNpcPopup({
                      message: hint,
                      dismissAfterMs: 8000,
                      coins: me?.coins ?? 0,
                      closerHint: hasCloserHint,
                      onBribe: hasCloserHint && (me?.coins ?? 0) >= 1
                        ? async () => {
                            try {
                              const res = await bribeNpc(gameCode, playerId)
                              setGame((prev) => {
                                if (!prev?.players?.[playerId]) return prev
                                return {
                                  ...prev,
                                  players: {
                                    ...prev.players,
                                    [playerId]: {
                                      ...prev.players[playerId],
                                      coins: res.coins,
                                      bribed_hints: { ...(prev.players[playerId]?.bribed_hints ?? {}), [roomIdx]: res.closer_hint },
                                    },
                                  },
                                }
                              })
                              setLeaderboard((prev) =>
                                prev.map((p) => (p.player_id === playerId ? { ...p, coins: res.coins } : p))
                              )
                              setNpcPopup((pop) => pop && { ...pop, message: res.closer_hint, dismissAfterMs: 8000, coins: res.coins, closerHint: null, onBribe: null })
                              playEffect('click')
                            } catch (e) {
                              playEffect('fail')
                              setError(e.message)
                            }
                          }
                        : null,
                    })
                  }}
                >
                  🧙 Hint
                </button>
                <button type="button" className={styles.closeModal} onClick={closePuzzle} aria-label="Close">×</button>
              </div>
              <div className={styles.modalBody}>
              {puzzleOpen.type === 'torch_key' && (
                <PuzzleTorch onSolve={() => handlePuzzleSolved(null)} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'book_clue' && (
                <PuzzleBook
                  onSolve={handlePuzzleSolved}
                  onClose={closePuzzle}
                  room={puzzleOpen.room}
                  submitError={puzzleSubmitError}
                  onClearError={() => setPuzzleSubmitError(null)}
                />
              )}
              {puzzleOpen.type === 'code_lock' && (
                puzzleOpen.roomIndex === 3
                  ? <PuzzleDungeonCode
                    onSolve={handlePuzzleSolved}
                    onClose={closePuzzle}
                    room={puzzleOpen.room}
                    submitError={puzzleSubmitError}
                    onClearError={() => setPuzzleSubmitError(null)}
                  />
                  : <PuzzleCode onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'sequence' && (
                <PuzzleSequence
                  onSolve={handlePuzzleSolved}
                  onClose={closePuzzle}
                  room={puzzleOpen.room}
                  submitError={puzzleSubmitError}
                  onClearError={() => setPuzzleSubmitError(null)}
                />
              )}
              {puzzleOpen.type === 'throne_game' && (
                <PuzzleThrone onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'jigsaw' && (
                <PuzzleJigsaw
                  onSolve={handlePuzzleSolved}
                  onClose={closePuzzle}
                  room={puzzleOpen.room}
                  bribedHint={bribedHints[puzzleOpen.roomIndex] ?? bribedHints[String(puzzleOpen.roomIndex)]}
                />
              )}
              {puzzleOpen.type === 'tower_climb' && (
                <PuzzleTowerClimb onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'chain_rhythm' && (
                <PuzzleChainRhythm
                  key={chainRhythmKey}
                  onSolve={handlePuzzleSolved}
                  onClose={closePuzzle}
                  room={puzzleOpen.room}
                />
              )}
              {puzzleOpen.type === 'liquid_balance' && (
                <PuzzleLiquidBalance onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'reality_shift' && (
                <PuzzleRealityShift onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'guard_room_stealth' && (
                <PuzzleGuardRoomStealth onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'royal_lineage' && (
                <PuzzleRoyalLineage onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'gallery_royal_code' && (
                <PuzzleGalleryRoyalCode onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'bubble_round' && (
                <PuzzleBubbleRound onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {puzzleOpen.type === 'stables_race' && (
                <PuzzleStablesRace onSolve={handlePuzzleSolved} onClose={closePuzzle} room={puzzleOpen.room} />
              )}
              {!KNOWN_PUZZLE_TYPES.includes(puzzleOpen.type) && (
                <GenericPuzzle type={puzzleOpen.type} onSolve={() => handlePuzzleSolved(null)} onClose={closePuzzle} />
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GenericPuzzle({ type, onSolve, onClose }) {
  return (
    <div className={styles.genericPuzzle}>
      <h2>Puzzle: {type}</h2>
      <p>Solve this puzzle to unlock the door.</p>
      <button type="button" onClick={onSolve}>I solved it — Open door</button>
      <button type="button" onClick={onClose} className={styles.secondary}>Close</button>
    </div>
  )
}
