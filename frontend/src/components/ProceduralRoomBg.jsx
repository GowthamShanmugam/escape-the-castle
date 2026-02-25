import styles from './ProceduralRoomBg.module.css'

const ROOM_VARIANTS = [
  'entrance', 'library', 'kitchen', 'dungeon', 'throne', 'armory', 'tower',
  'chapel', 'wineCellar', 'guardRoom', 'nursery', 'gallery', 'alchemyLab',
  'bathhouse', 'stables',
]

export default function ProceduralRoomBg({ variant = 'library', className = '' }) {
  const v = ROOM_VARIANTS.includes(variant) ? variant : 'library'
  return (
    <div className={`${styles.wrapper} ${className}`} aria-hidden>
      <div className={`${styles.base} ${styles[v]}`} />
    </div>
  )
}
