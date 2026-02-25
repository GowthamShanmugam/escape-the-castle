import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { playEffect } from '../audio/soundService'
import { getGame } from '../api'
import Leaderboard from '../components/Leaderboard'
import styles from './Congratulations.module.css'

const CONFETTI = ['🏆', '✨', '🎉', '⭐', '👑', '💫', '🌟', '🎊']

export default function Congratulations({ onLeave }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const fromState = location.state || {}
  const gameCode = fromState.gameCode || params.get('gameCode') || params.get('code')
  const playerId = fromState.playerId || params.get('playerId') || params.get('player')
  const [leaderboard, setLeaderboard] = useState(fromState.leaderboard || [])
  const [totalRooms, setTotalRooms] = useState(fromState.totalRooms ?? 15)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const bgX = useTransform(mouseX, [0, 1], [-20, 20])
  const bgY = useTransform(mouseY, [0, 1], [-15, 15])
  const cardX = useTransform(mouseX, [0, 1], [-8, 8])
  const cardY = useTransform(mouseY, [0, 1], [-6, 6])
  const crownRotate = useTransform(mouseX, [0, 0.5, 1], [-5, 0, 5])

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }
  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  useEffect(() => {
    if (!gameCode || !playerId) {
      navigate('/', { replace: true })
      return
    }
    if (fromState.leaderboard) return
    setLoading(true)
    getGame(gameCode)
      .then((data) => {
        setLeaderboard(data.leaderboard || [])
        setTotalRooms(data.total_rooms ?? 15)
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false))
  }, [gameCode, playerId, navigate])

  if (!gameCode || !playerId) return null
  if (loading) return <div className={styles.wrapper}><p className={styles.loading}>Loading…</p></div>

  const rank = leaderboard.findIndex((e) => e.player_id === playerId) + 1

  const handleBack = () => {
    playEffect('click')
    onLeave?.()
    navigate('/', { replace: true })
  }

  const stagger = { staggerChildren: 0.08, delayChildren: 0.2 }
  const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Parallax background layers */}
      <motion.div className={styles.bgLayer} style={{ x: bgX, y: bgY }}>
        <div className={styles.bgGradient} />
        <div className={styles.bgOrbs} />
      </motion.div>

      {/* Floating confetti */}
      <div className={styles.confettiLayer} aria-hidden>
        {CONFETTI.map((emoji, i) => (
          <motion.span
            key={i}
            className={styles.confetti}
            style={{
              left: `${12 + i * 11}%`,
              top: `${8 + (i % 5) * 18}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.7, 1, 0.7],
              y: [0, -20, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Card with parallax */}
      <motion.div
        className={styles.card}
        style={{ x: cardX, y: cardY }}
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className={styles.cardInner}
        >
          <motion.div
            className={styles.crown}
            variants={item}
            style={{ rotate: crownRotate }}
          >
            🏆
          </motion.div>
          <motion.h1 className={styles.title} variants={item}>You Escaped the Castle!</motion.h1>
          <motion.p className={styles.subtitle} variants={item}>
            You escaped. The castle's secrets remain behind you—but you are free.
          </motion.p>
          <motion.p className={styles.rank} variants={item}>
            You finished in position <strong>#{rank}</strong>
          </motion.p>
          {gameCode && (
            <motion.p className={styles.gameCode} variants={item}>
              Game code: <strong>{gameCode}</strong>
            </motion.p>
          )}
          {leaderboard.length > 0 && (
            <motion.div className={styles.leaderboardWrap} variants={item}>
              <Leaderboard leaderboard={leaderboard} totalRooms={totalRooms} youId={playerId} />
            </motion.div>
          )}
          <motion.div variants={item}>
            <motion.button
              type="button"
              onClick={handleBack}
              className={styles.backBtn}
              whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(201, 162, 39, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Home
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
