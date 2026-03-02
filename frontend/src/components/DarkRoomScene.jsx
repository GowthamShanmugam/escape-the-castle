import { useState, useRef } from 'react'
import { playEffect } from '../audio/soundService'
import styles from './DarkRoomScene.module.css'

export default function DarkRoomScene({ room, backgroundImage, onSolve, onClose, onRequestHint }) {
  const [torchPos, setTorchPos] = useState({ x: 50, y: 50 })
  const [keyFound, setKeyFound] = useState(false)
  const [keyDragging, setKeyDragging] = useState(false)
  const [keyPosition, setKeyPosition] = useState({ x: 20, y: 80 })
  const [feedback, setFeedback] = useState(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const hotspots = room?.hotspots || []
  const doorHotspot = hotspots.find((h) => h.id === 'door')
  const keyHotspot = hotspots.find((h) => h.id === 'key')

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTorchPos({ x, y })
    /* Parallax: normalized offset from center (-1..1), max shift ~8px for mid layer */
    const nx = (x - 50) / 50
    const ny = (y - 50) / 50
    setParallax({ x: nx * 8, y: ny * 8 })
  }

  const handleHotspotClick = (hotspot) => {
    playEffect('click')
    if (hotspot.id === 'key') {
      setKeyFound(true)
      setKeyPosition({
        x: hotspot.left + hotspot.width / 2,
        y: hotspot.top + hotspot.height / 2,
      })
      setFeedback(hotspot.label ? `${hotspot.label}.` : '—')
      setTimeout(() => setFeedback(null), 1000)
      return
    }
    if (hotspot.id === 'door') {
      if (keyFound) setFeedback(hotspot.label ? `${hotspot.label}.` : '—')
      else setFeedback(hotspot.label ? `${hotspot.label}. Locked.` : 'Locked.')
      setTimeout(() => setFeedback(null), 1200)
      return
    }
    setFeedback(hotspot.label ? hotspot.label : '—')
    setTimeout(() => setFeedback(null), 1000)
  }

  const handleKeyDragStart = (e) => {
    if (!keyFound) return
    setKeyDragging(true)
    e.dataTransfer.setData('text/plain', 'key')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleKeyDragEnd = () => setKeyDragging(false)

  const handleDoorDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.getData('text/plain') === 'key' && keyFound) {
      onSolve()
    }
  }

  const handleDoorDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleSceneDragOver = (e) => {
    if (!keyDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setKeyPosition({ x, y })
  }

  return (
    <div
      ref={containerRef}
      className={styles.scene}
      onMouseMove={handleMouseMove}
      onDragOver={handleSceneDragOver}
    >
      {/* Parallax back layer: room background; darken via overlay (not filter) so only this layer is affected */}
      {backgroundImage && (
        <div
          className={styles.roomBackgroundWrapper}
          style={{
            transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
          }}
          aria-hidden
        >
          <div
            className={styles.roomBackground}
            style={{ backgroundImage: `url("${backgroundImage}")` }}
          />
          {/* Darken only the background image when key not found; objects stay untouched */}
          {!keyFound && (
            <div
              className={styles.backgroundDarken}
              aria-hidden
            />
          )}
        </div>
      )}
      {/* Parallax mid layer: furniture / objects */}
      <div
        className={styles.objectLayer}
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
        }}
        aria-hidden
      >
        <div className={keyFound ? `${styles.objectDoor} ${styles.objectDoorGlow}` : styles.objectDoor} />
        <div className={styles.objectWall} />
        <div className={styles.objectCrate} />
        <div className={styles.objectCrate2} />
        <div className={styles.objectCrate3} />
        <div className={styles.objectBarrel} />
        <div className={styles.objectBarrel2} />
        <div className={styles.objectShelf} />
        <div className={styles.objectChest} />
        <div className={styles.objectStool} />
        <div className={styles.objectSack} />
        <div className={styles.objectPillar} />
        <div className={styles.objectPillar2} />
        <div className={styles.objectTable} />
        <div className={styles.objectBucket} />
        <div className={styles.objectBucket2} />
        <div className={styles.objectBench} />
        <div className={styles.objectBox} />
        <div className={styles.objectBox2} />
        <div className={styles.objectChains} />
        <div className={styles.objectVase} />
        <div className={styles.objectVase2} />
        <div className={styles.objectRug} />
        <div className={styles.objectSconce} />
        <div className={styles.objectSconce2} />
        <div className={styles.objectPot} />
        <div className={styles.objectBasket} />
        <div className={styles.objectRope} />
        <div className={styles.objectJug} />
        <div className={styles.objectCup} />
        <div className={styles.objectLantern} />
        <div className={styles.objectBook} />
        {/* Decoys near key to confuse */}
        <div className={styles.objectDecoyHook} />
        <div className={styles.objectDecoyCoil} />
        <div className={styles.objectDecoyBottle} />
        <div className={styles.objectDecoyNail} />
        <div className={styles.objectDecoyRing} />
        <div className={styles.objectDecoyBox} />
        {/* Extra clutter — fill room ~80% */}
        <div className={styles.objectDecoyScroll} />
        <div className={styles.objectDecoyHammer} />
        <div className={styles.objectDecoyDagger} />
        <div className={styles.objectDecoyPurse} />
        <div className={styles.objectDecoyHourglass} />
        <div className={styles.objectDecoyQuill} />
        <div className={styles.objectDecoyInkwell} />
        <div className={styles.objectDecoyTorch} />
        <div className={styles.objectDecoyLock} />
        <div className={styles.objectDecoyHinge} />
        <div className={styles.objectDecoyCandlestick} />
        <div className={styles.objectDecoySmallChest} />
        <div className={styles.objectDecoySpoon} />
        <div className={styles.objectDecoyBowl} />
        <div className={styles.objectDecoyFlask} />
        <div className={styles.objectDecoyTinderbox} />
        <div className={styles.objectDecoyWhetstone} />
        <div className={styles.objectDecoyKey1} />
        <div className={styles.objectDecoyKey2} />
        <div className={styles.objectDecoyKey3} />
        <div className={styles.objectDecoyBuckle} />
        <div className={styles.objectDecoyChain} />
        <div className={styles.objectDecoyGoblet} />
        <div className={styles.objectDecoyPlate} />
        <div className={styles.objectDecoyBread} />
        <div className={styles.objectDecoyKnife} />
        <div className={styles.objectDecoyFork} />
        <div className={styles.objectDecoyCloth} />
        <div className={styles.objectDecoyBone} />
        <div className={styles.objectDecoyBottle2} />
        <div className={styles.objectDecoyCandle} />
        <div className={styles.objectDecoyScroll2} />
        <div className={styles.objectDecoyParchment} />
        <div className={styles.objectDecoyWax} />
        <div className={styles.objectDecoyRivet} />
        <div className={styles.objectDecoyHook2} />
        <div className={styles.objectDecoyCoil2} />
        <div className={styles.objectDecoyNail2} />
        <div className={styles.objectDecoyBolt} />
        <div className={styles.objectDecoyGear} />
        <div className={styles.objectDecoyStrap} />
        <div className={styles.objectDecoyLadle} />
        <div className={styles.objectDecoyPot2} />
        <div className={styles.objectDecoyCup2} />
        <div className={styles.objectDecoyBox3} />
        <div className={styles.objectDecoySack2} />
        <div className={styles.objectDecoyRope2} />
        <div className={styles.objectDecoyPin} />
        <div className={styles.objectDecoyThimble} />
        <div className={styles.objectDecoyNeedle} />
        <div className={styles.objectDecoyButton} />
        <div className={styles.objectDecoyRing2} />
        <div className={styles.objectDecoyBead} />
        <div className={styles.objectDecoyCoin} />
        <div className={styles.objectDecoyClip} />
        <div className={styles.objectDecoyFeather} />
        <div className={styles.objectDecoyStone} />
        <div className={styles.objectDecoyTwig} />
        <div className={styles.objectDecoyPebble} />
        <div className={styles.objectDecoyShell} />
        <div className={styles.objectDecoyCork} />
        <div className={styles.objectDecoyStraw} />
        <div className={styles.objectDecoySeed} />
        <div className={styles.objectDecoyNut} />
        <div className={styles.objectDecoyHorn} />
        <div className={styles.objectDecoyLeather} />
        <div className={styles.objectDecoyString} />
        <div className={styles.objectDecoyWool} />
        <div className={styles.objectDecoyAsh} />
        <div className={styles.objectDecoyEmber} />
        <div className={styles.objectDecoyDust} />
        <div className={styles.objectDecoyShard} />
        <div className={styles.objectDecoySplinter} />
        <div className={styles.objectDecoyScrap} />
        <div className={styles.objectDecoyChip} />
        <div className={styles.objectDecoySliver} />
        <div className={styles.objectDecoyFiber} />
        <div className={styles.objectDecoyThread} />
        <div className={styles.objectDecoyLint} />
        <div className={styles.objectDecoyCrumb} />
        <div className={styles.objectDecoyGrain} />
        <div className={styles.objectDecoySpice} />
        <div className={styles.objectDecoySalt} />
        <div className={styles.objectDecoyFlake} />
        <div className={styles.objectDecoyPebble2} />
        <div className={styles.objectDecoyMoss} />
        <div className={styles.objectDecoyRust} />
        <div className={styles.objectDecoyGrime} />
        <div className={styles.objectDecoySoot} />
        <div className={styles.objectDecoyChar} />
        <div className={styles.objectDecoyCinder} />
        <div className={styles.objectDecoySpur} />
        <div className={styles.objectDecoySpike} />
        <div className={styles.objectDecoyStud} />
        <div className={styles.objectDecoyLatch} />
        <div className={styles.objectDecoyHaspe} />
        <div className={styles.objectDecoyBrace} />
        <div className={styles.objectDecoyBracket} />
        <div className={styles.objectDecoyBand} />
        <div className={styles.objectDecoyStrap2} />
        <div className={styles.objectDecoyBelt} />
        <div className={styles.objectDecoyCord} />
        <div className={styles.objectDecoyTwine} />
        <div className={styles.objectDecoyYarn} />
        <div className={styles.objectDecoyRibbon} />
        <div className={styles.objectDecoyTape} />
        <div className={styles.objectDecoyPatch} />
        <div className={styles.objectDecoyScrap2} />
        <div className={styles.objectDecoyRag} />
        <div className={styles.objectDecoyWick} />
        <div className={styles.objectDecoyTallow} />
        <div className={styles.objectDecoyPitch} />
        <div className={styles.objectDecoyTar} />
        <div className={styles.objectDecoyResin} />
        <div className={styles.objectDecoyGum} />
        <div className={styles.objectDecoyPebble3} />
        <div className={styles.objectDecoyShard2} />
        <div className={styles.objectDecoyBead2} />
        <div className={styles.objectDecoyCoin2} />
        <div className={styles.objectDecoyClip2} />
        <div className={styles.objectDecoyPin2} />
        <div className={styles.objectDecoyNail3} />
        <div className={styles.objectDecoyRivet2} />
        <div className={styles.objectDecoyStud2} />
        <div className={styles.objectDecoyLatch2} />
        <div className={styles.objectDecoyBracket2} />
        <div className={styles.objectDecoyBand2} />
        <div className={styles.objectDecoyCord2} />
        <div className={styles.objectDecoyTwine2} />
        <div className={styles.objectDecoyYarn2} />
        <div className={styles.objectDecoyRibbon2} />
        <div className={styles.objectDecoyTape2} />
        <div className={styles.objectDecoyPatch2} />
        <div className={styles.objectDecoyScrap3} />
        <div className={styles.objectDecoyRag2} />
        <div className={styles.objectDecoyWick2} />
        <div className={styles.objectDecoyTallow2} />
        <div className={styles.objectDecoyPitch2} />
        <div className={styles.objectDecoyTar2} />
        <div className={styles.objectDecoyResin2} />
        <div className={styles.objectDecoyGum2} />
        <div className={styles.objectDecoyDust2} />
        <div className={styles.objectDecoyAsh2} />
        <div className={styles.objectDecoyEmber2} />
        <div className={styles.objectDecoyCinder2} />
        <div className={styles.objectDecoyChar2} />
        <div className={styles.objectDecoySoot2} />
        <div className={styles.objectDecoyGrime2} />
        <div className={styles.objectDecoyRust2} />
        <div className={styles.objectDecoyMoss2} />
        <div className={styles.objectDecoyFlake2} />
        <div className={styles.objectDecoySalt2} />
        <div className={styles.objectDecoySpice2} />
        <div className={styles.objectDecoyGrain2} />
        <div className={styles.objectDecoyCrumb2} />
        <div className={styles.objectDecoyLint2} />
        <div className={styles.objectDecoyThread2} />
        <div className={styles.objectDecoyFiber2} />
        <div className={styles.objectDecoySliver2} />
        <div className={styles.objectDecoyChip2} />
        <div className={styles.objectDecoyScrap4} />
        <div className={styles.objectDecoySplinter2} />
        <div className={styles.objectDecoyShard3} />
        <div className={styles.objectDecoyDust3} />
        <div className={styles.objectDecoyEmber3} />
        <div className={styles.objectDecoyAsh3} />
        <div className={styles.objectDecoyWool2} />
        <div className={styles.objectDecoyString2} />
        <div className={styles.objectDecoyLeather2} />
        <div className={styles.objectDecoyHorn2} />
        <div className={styles.objectDecoyNut2} />
        <div className={styles.objectDecoySeed2} />
        <div className={styles.objectDecoyStraw2} />
        <div className={styles.objectDecoyCork2} />
        <div className={styles.objectDecoyShell2} />
        <div className={styles.objectDecoyPebble4} />
        <div className={styles.objectDecoyStone2} />
        <div className={styles.objectDecoyTwig2} />
        <div className={styles.objectDecoyFeather2} />
        <div className={styles.objectDecoyNeedle2} />
        <div className={styles.objectDecoyButton2} />
        <div className={styles.objectDecoyRing3} />
        <div className={styles.objectDecoyBead3} />
        <div className={styles.objectDecoyCoin3} />
        <div className={styles.objectDecoyClip3} />
        <div className={styles.objectDecoyThimble2} />
        <div className={styles.objectDecoyPin3} />
        <div className={styles.objectDecoyNail4} />
        <div className={styles.objectDecoyRivet3} />
        <div className={styles.objectDecoyStud3} />
        <div className={styles.objectDecoyLatch3} />
        <div className={styles.objectDecoyBracket3} />
        <div className={styles.objectDecoyBand3} />
        <div className={styles.objectDecoySpur2} />
        <div className={styles.objectDecoySpike2} />
        <div className={styles.objectDecoyHaspe2} />
        <div className={styles.objectDecoyBrace2} />
        <div className={styles.objectDecoyStrap3} />
        <div className={styles.objectDecoyBelt2} />
        <div className={styles.objectDecoyCord3} />
        <div className={styles.objectDecoyTwine3} />
        <div className={styles.objectDecoyYarn3} />
        <div className={styles.objectDecoyRibbon3} />
        <div className={styles.objectDecoyTape3} />
        <div className={styles.objectDecoyPatch3} />
        <div className={styles.objectDecoyScrap5} />
        <div className={styles.objectDecoyRag3} />
        <div className={styles.objectDecoyWick3} />
        <div className={styles.objectDecoyTallow3} />
        <div className={styles.objectDecoyPebble5} />
        <div className={styles.objectDecoyShard4} />
        <div className={styles.objectDecoySplinter3} />
        <div className={styles.objectDecoyChip3} />
        <div className={styles.objectDecoySliver3} />
        <div className={styles.objectDecoyFiber3} />
        <div className={styles.objectDecoyThread3} />
        <div className={styles.objectDecoyLint3} />
        <div className={styles.objectDecoyCrumb3} />
        <div className={styles.objectDecoyGrain3} />
        <div className={styles.objectDecoySpice3} />
        <div className={styles.objectDecoySalt3} />
        <div className={styles.objectDecoyFlake3} />
        <div className={styles.objectDecoyMoss3} />
        <div className={styles.objectDecoyRust3} />
        <div className={styles.objectDecoyGrime3} />
        {!keyFound && <div className={styles.objectKey} />}
      </div>
      {/* Dust particles in torch beam — only when key not found */}
      {!keyFound && (
        <div
          className={styles.dustLayer}
          style={{ left: `${torchPos.x}%`, top: `${torchPos.y}%` }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.dustParticle} />
          ))}
        </div>
      )}
      {/* Dark cover + torch only while key not found; when key found, room stays lit so you can reach the door */}
      {!keyFound && (
        <>
          {/* Dark overlay: gradient draws the hole at torch (no mask); rest is solid black */}
          <div
            className={styles.darkCover}
            style={{
              background: `radial-gradient(circle at ${torchPos.x}% ${torchPos.y}%, transparent 0%, transparent 1.6%, #000 1.9%, #000 100%)`,
            }}
            aria-hidden
          />
          <div className={styles.torchLight} style={{ left: `${torchPos.x}%`, top: `${torchPos.y}%` }} />
        </>
      )}
      <div className={styles.sceneContent}>
        <p className={styles.sceneText}>{room?.scene || room?.atmosphere}</p>
        <p className={styles.instruction}>
          {keyFound ? 'Take it to the door.' : 'Move the torch through the darkness.'}
        </p>
      </div>

      {onRequestHint && (
        <button type="button" className={styles.hintBtn} onClick={onRequestHint}>
          🧙 Hint
        </button>
      )}

      {/* Render key hotspot last so it's on top and clickable (not behind crate/shelf) */}
      {hotspots
        .filter((h) => h.id !== 'key')
        .map((h) => (
          <button
            key={h.id}
            type="button"
            className={`${styles.hotspot} ${h.id === 'door' ? styles.door : ''}`}
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            onClick={() => handleHotspotClick(h)}
            onDrop={h.id === 'door' ? handleDoorDrop : undefined}
            onDragOver={h.id === 'door' ? handleDoorDragOver : undefined}
          />
        ))}
      {keyHotspot && !keyFound && (
        <button
          type="button"
          className={`${styles.hotspot} ${styles.keyHotspot}`}
          style={{
            left: `${keyHotspot.left}%`,
            top: `${keyHotspot.top}%`,
            width: `${keyHotspot.width}%`,
            height: `${keyHotspot.height}%`,
          }}
          onClick={() => handleHotspotClick(keyHotspot)}
        />
      )}

      {keyFound && (
        <div
          className={`${styles.draggableKey} ${keyDragging ? styles.dragging : ''}`}
          style={{ left: `${keyPosition.x}%`, top: `${keyPosition.y}%` }}
          draggable
          onDragStart={handleKeyDragStart}
          onDragEnd={handleKeyDragEnd}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/1/11/Key-dynamic-premium.png"
            alt="Key"
            className={styles.draggableKeyImg}
            draggable={false}
          />
        </div>
      )}

      {feedback && <div className={styles.feedback}>{feedback}</div>}
    </div>
  )
}
