import { useNavigate } from 'react-router-dom'
import StoryIntro from './StoryIntro'
import { setIntroSoundsActive } from '../audio/soundService'

const INTRO_SEEN_KEY = 'castle_intro_seen'

export default function IntroScreen() {
  const navigate = useNavigate()
  return (
    <StoryIntro
      onComplete={() => {
        setIntroSoundsActive(false)
        sessionStorage.setItem(INTRO_SEEN_KEY, '1')
        navigate('/game', { replace: true, state: { fromIntro: true } })
      }}
    />
  )
}
