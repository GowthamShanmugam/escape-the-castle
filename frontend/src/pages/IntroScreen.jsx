import { useNavigate } from 'react-router-dom'
import StoryIntro from './StoryIntro'

const INTRO_SEEN_KEY = 'castle_intro_seen'

export default function IntroScreen() {
  const navigate = useNavigate()
  return (
    <StoryIntro
      onComplete={() => {
        sessionStorage.setItem(INTRO_SEEN_KEY, '1')
        navigate('/game', { replace: true })
      }}
    />
  )
}
