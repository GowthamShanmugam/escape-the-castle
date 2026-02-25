import { useState } from 'react'
import { playEffect } from '../../audio/soundService'
import styles from './Puzzles.module.css'

export default function PuzzleBook({ onSolve, onClose, room, submitError, onClearError }) {
  const book = room?.book
  const [page, setPage] = useState(0)
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)
  const showWrong = wrong || !!submitError

  if (!book) {
    return (
      <div className={styles.puzzle}>
        <p>No book in this room.</p>
        <button type="button" onClick={onClose} className={styles.closeBtn}>Close</button>
      </div>
    )
  }

  const pages = book.pages || []
  const totalPages = pages.length
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    onSolve(answer.trim())
  }

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value)
    setWrong(false)
    onClearError?.()
  }

  return (
    <div className={styles.puzzle}>
      <h2 className={styles.bookTitle}>{book.title}</h2>
      <p className={styles.atmosphere}>{room?.atmosphere}</p>
      <div className={styles.openBook}>
        <div className={styles.bookSpine} />
        <div className={styles.bookSpread}>
          <div className={styles.bookPageLeft}>
            <span className={styles.pageNum}>— {page + 1} —</span>
          </div>
          <div className={styles.bookPageRight}>
            <p key={page} className={styles.bookProse}>{pages[page]}</p>
            <div className={styles.bookNav}>
              <button type="button" onClick={() => { setPage((p) => Math.max(0, p - 1)); playEffect('page') }} disabled={!canPrev}>← Previous</button>
              <span className={styles.pageNum}>Page {page + 1} of {totalPages}</span>
              <button type="button" onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); playEffect('page') }} disabled={!canNext}>Next →</button>
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={styles.answerForm}>
        <div>
          <input
            type="text"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Enter the word or code"
            className={showWrong ? styles.inputWrong : ''}
          />
          {(showWrong && (submitError || wrong)) && (
            <p className={styles.bookWrongMessage} aria-live="polite">
              {submitError || 'The lock does not turn.'}
            </p>
          )}
        </div>
        <button type="submit">Unlock door</button>
      </form>
      <button type="button" onClick={onClose} className={styles.closeBtn}>Close</button>
    </div>
  )
}
