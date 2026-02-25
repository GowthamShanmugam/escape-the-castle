/**
 * NPC dialogue shown after solving a room, keyed by the *next* room index (the room we're about to enter).
 * Each message references the previous room and foreshadows the next—one continuous story.
 */
const BY_ROOM = {
  1: "The key turns. Beyond the door: shelves of dust and vellum. The chronicles hold the next answer.",
  2: "The word midnight opened the lock. The kitchen lies ahead—cold hearths, and a steward's recipe.",
  3: "The runes align. Down you go. The dungeon remembers the old lord. The stone holds his story.",
  4: "The year 1847. The chains release. Above, the throne room—sunlight through stained glass.",
  5: "The mirrors align. The armory awaits. Shields and blades. This puzzle is trickier.",
  6: "The jigsaw falls into place. The tower rises above—climb to the summit.",
  7: "You reach the top. The chapel lies ahead. Bells and chains. Listen for the rhythm.",
  8: "The rhythm unlocks the door. The wine cellar—balance the casks, and the way opens.",
  9: "The cellar yields. The guard room awaits. Move in silence, or the sentinels will sound.",
  10: "You slip past the guards. Halfway through the castle. The nursery holds the royal lineage.",
  11: "The lineage is set. The gallery—portraits and a code only the royal hand can read.",
  12: "The gallery opens. The alchemy lab. Reality bends here. Trust your eyes.",
  13: "The lab releases you. The bathhouse steams ahead. One more trial.",
  14: "The bathhouse yields. The stables—the last door. Run, and you are free.",
}

const DEFAULTS = [
  "You did it. Turn the page. The next chapter awaits.",
  "Well done. The castle yields another step.",
  "Onto the next. Stay sharp.",
  "That's the way. The story continues.",
]

export function getNpcDialogue(nextRoomIndex) {
  if (BY_ROOM[nextRoomIndex] != null) {
    return BY_ROOM[nextRoomIndex]
  }
  if (nextRoomIndex >= 15) {
    return "You escaped the castle!"
  }
  return DEFAULTS[nextRoomIndex % DEFAULTS.length]
}
