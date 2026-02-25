import DarkRoomScene from './DarkRoomScene'
import AnimatedRoomScene from './AnimatedRoomScene'
import { getRoomSceneConfig } from '../data/roomScenes'
import styles from './RoomView.module.css'

export default function RoomView({ room, roomIndex, onInteract, onSolveFromScene, onRequestHint }) {
  const isDarkRoomWithHotspots = room?.puzzle_type === 'torch_key' && room?.hotspots?.length > 0

  if (isDarkRoomWithHotspots) {
    const sceneConfig = getRoomSceneConfig(0)
    return (
      <div className={styles.room}>
        <DarkRoomScene
          room={room}
          backgroundImage={sceneConfig?.backgroundImage}
          onSolve={() => onSolveFromScene?.(roomIndex)}
          onClose={() => {}}
          onRequestHint={onRequestHint}
        />
      </div>
    )
  }

  return (
    <AnimatedRoomScene
      room={room}
      roomIndex={roomIndex}
      onInteract={onInteract}
      onSolveFromScene={onSolveFromScene}
    />
  )
}
