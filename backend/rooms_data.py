"""
Unique puzzle data for all 15 rooms. Answers are server-only; public data is sent to client.
"""
TOTAL_ROOMS = 15

# Server-only: correct answers per room (validated on advance). 15 rooms.
PUZZLE_ANSWERS = [
    {"type": "torch_key"},  # 0 Entrance Hall
    {"type": "book_clue", "answer": "midnight"},  # 1 Library
    {"type": "sequence", "order": [1, 4, 0, 3, 2]},  # 2 Kitchen
    {"type": "code_lock", "code": "1847"},  # 3 Dungeon
    {"type": "throne_game", "angles": "90,180,0,270"},  # 4 Throne Room
    {"type": "jigsaw", "order": list(range(20))},  # 5 Armory
    {"type": "tower_climb", "answer": "summit"},  # 6 Tower
    {"type": "chain_rhythm", "order": [2, 0, 4, 1, 3], "intervals_ms": [800, 600, 800, 600], "tolerance_ms": 400},  # 7 Chapel
    {"type": "liquid_balance", "answer": "balanced"},  # 8 Wine Cellar
    {"type": "guard_room_stealth", "answer": "escaped"},  # 9 Guard Room
    {"type": "royal_lineage", "order": [0, 2, 1, 3, 4]},  # 10 Nursery
    {"type": "gallery_royal_code", "order": [0, 2, 1, 4, 3]},  # 11 Gallery
    {"type": "reality_shift", "answer": "escaped"},  # 12 Alchemy Lab
    {"type": "bubble_round", "answer": "escaped"},  # 13 Bathhouse
    {"type": "stables_race", "answer": "escaped"},  # 14 Stables
]

# Sequence symbols: only Kitchen (2) uses sequence type. Other rooms use their own types with labels in room config.
SEQUENCE_ROOM_INDICES = [2]
SEQUENCE_LABELS = [
    ["α", "β", "γ", "δ", "ε"],  # Kitchen (runes; clue gives order via recipe)
]

def _seq_labels(room_index: int):
    if room_index in SEQUENCE_ROOM_INDICES:
        idx = SEQUENCE_ROOM_INDICES.index(room_index)
        return SEQUENCE_LABELS[idx]
    return SEQUENCE_LABELS[0]  # fallback

# Public room config: what the client receives (no answers)
def get_rooms_public():
    return [
        {
            "index": 0,
            "title": "Entrance Hall",
            "puzzle_type": "torch_key",
            "hint": "Pitch black. The torch is the only light.",
            "closer_hint": "Move the torch across the darkness. A small metal object lies near the floor.",
            "atmosphere": "Stone echoes. Iron scrapes somewhere ahead.",
            "scene": "Crowded hall—crates, barrels, chest, table, shelf, bench, stool, sack, pillars, chains, buckets, vases, pot, basket, candle, rope, jug, cup, lantern, book, rug, sconces. One heavy door.",
            "hotspots": [
                {"id": "door", "label": "Door", "left": 78, "top": 18, "width": 18, "height": 56},
                {"id": "key", "label": "Key", "left": 20, "top": 64, "width": 3, "height": 5},
                {"id": "crate", "label": "Crate", "left": 8, "top": 50, "width": 10, "height": 16},
                {"id": "barrel", "label": "Barrel", "left": 50, "top": 66, "width": 9, "height": 14},
                {"id": "shelf", "label": "Shelf", "left": 56, "top": 8, "width": 16, "height": 12},
                {"id": "wall", "label": "Wall", "left": 2, "top": 6, "width": 9, "height": 32},
                {"id": "chest", "label": "Chest", "left": 42, "top": 20, "width": 10, "height": 8},
                {"id": "stool", "label": "Stool", "left": 20, "top": 72, "width": 6, "height": 5},
                {"id": "pillar", "label": "Pillar", "left": 64, "top": 40, "width": 5, "height": 22},
                {"id": "sack", "label": "Sack", "left": 6, "top": 78, "width": 8, "height": 9},
                {"id": "crate2", "label": "Crate", "left": 12, "top": 28, "width": 9, "height": 10},
                {"id": "table", "label": "Table", "left": 44, "top": 30, "width": 14, "height": 6},
                {"id": "bucket", "label": "Bucket", "left": 72, "top": 28, "width": 5, "height": 6},
                {"id": "barrel2", "label": "Barrel", "left": 24, "top": 36, "width": 8, "height": 10},
                {"id": "bench", "label": "Bench", "left": 4, "top": 42, "width": 10, "height": 5},
                {"id": "box", "label": "Box", "left": 60, "top": 94, "width": 5, "height": 5},
                {"id": "chains", "label": "Chains", "left": 70, "top": 52, "width": 4, "height": 18},
                {"id": "vase", "label": "Vase", "left": 52, "top": 22, "width": 4, "height": 6},
                {"id": "rug", "label": "Rug", "left": 42, "top": 85, "width": 16, "height": 9},
                {"id": "sconce", "label": "Sconce", "left": 76, "top": 46, "width": 2, "height": 7},
                {"id": "pillar2", "label": "Pillar", "left": 38, "top": 6, "width": 3, "height": 14},
                {"id": "pot", "label": "Pot", "left": 36, "top": 51, "width": 4, "height": 4},
                {"id": "basket", "label": "Basket", "left": 40, "top": 44, "width": 5, "height": 4},
                {"id": "crate3", "label": "Crate", "left": 35, "top": 43, "width": 3, "height": 5},
                {"id": "candle", "label": "Candle", "left": 52, "top": 45, "width": 4, "height": 6},
                {"id": "box2", "label": "Box", "left": 61, "top": 22, "width": 4, "height": 4},
                {"id": "sconce2", "label": "Sconce", "left": 73, "top": 44, "width": 3, "height": 7},
                {"id": "bucket2", "label": "Bucket", "left": 68, "top": 24, "width": 3, "height": 4},
                {"id": "vase2", "label": "Vase", "left": 26, "top": 22, "width": 4, "height": 5},
                {"id": "rope", "label": "Rope", "left": 16, "top": 69, "width": 3, "height": 5},
                {"id": "jug", "label": "Jug", "left": 56, "top": 22, "width": 4, "height": 5},
                {"id": "cup", "label": "Cup", "left": 70, "top": 38, "width": 3, "height": 4},
                {"id": "lantern", "label": "Lantern", "left": 60, "top": 79, "width": 4, "height": 5},
                {"id": "book", "label": "Book", "left": 46, "top": 38, "width": 4, "height": 3},
            ],
        },
        {
            "index": 1,
            "title": "Library",
            "puzzle_type": "book_clue",
            "hint": "The chronicles hold the key. Read with care.",
            "closer_hint": "The chronicle names the hour the walls fell. One word opens the lock.",
            "atmosphere": "Dust and vellum. The candle gutters.",
            "scene": "Tall shelves. An open volume lies on the desk—the Chronicles of the North Tower.",
            "scene_preview": "Tall shelves. An open volume lies on the desk.",
            "book": {
                "title": "Chronicles of the North Tower",
                "pages": [
                    "The siege lasted forty days. Lord Aldric had ordered every gate sealed and the granaries rationed. By the third week the men were eating horseflesh and the children had ceased to cry. The chronicler writes that on the night the walls were breached, a single bell rang at midnight.",
                    "It was midnight when the word passed through the ranks like a shiver. Those who had fled to the chapel swore they heard footsteps on the stair long after the keep had fallen. The key, it is said, was thrown into the well by the last of the guard. None could say whether he meant to deny the conquerors or to preserve it for another age.",
                    "In the years that followed, the new lord had the well sealed and the chapel reconsecrated. The chronicles were locked in this library. Only the keeper knows the binding that opens the door to the lower levels. Seek the word that marks the hour of the fall.",
                ],
            },
        },
        {
            "index": 2,
            "title": "Kitchen",
            "puzzle_type": "sequence",
            "hint": "The steward's recipe holds the order. Read his hand.",
            "closer_hint": "First what preserves, then what quenches thirst, then what feeds the host, then what flavours, then what cooks.",
            "atmosphere": "Cold hearths. The smell of old smoke and salt. The steward's recipe names the runes: α grain, β salt, γ flame, δ herb, ε water.",
            "scene": "Cold hearths. A recipe lies in the kitchen. The runes are marked: α for grain, β for salt, γ for flame, δ for herb, ε for water. Open the puzzle to read the steward's hand.",
            "scene_preview": "Cold hearths. A recipe lies in the kitchen. Open the puzzle to read the steward's hand.",
            "sequence": {
                "labels": _seq_labels(2),
                "instruction": "Set the runes in the order the steward set the five.",
                "rune_key": "α grain, β salt, γ flame, δ herb, ε water",
            },
        },
        {
            "index": 3,
            "title": "Dungeon",
            "puzzle_type": "code_lock",
            "hint": "The carving holds the digits—but perhaps not in the order they appear.",
            "closer_hint": "The lock answers to the year the old lord died. Four digits.",
            "atmosphere": "Damp stone. The chains have left their mark. Words are scratched into the stone.",
            "scene": "In the seventh year he died. He had one son. Eight years had passed before the rebellion. The fourth year brought the plague. Words are carved into the wall.",
            "scene_preview": "Damp stone. Words are carved into the wall.",
            "code_lock": {"digits": 4, "instruction": "Enter the four-digit code. The carving holds the key."},
        },
        {
            "index": 4,
            "title": "Throne Room",
            "puzzle_type": "throne_game",
            "hint": "Sunlight through the stained glass must strike the royal symbols. Rotate the mirrors to align the light.",
            "closer_hint": "First mirror: a quarter of the wheel. Second: half the circle. Third: as the smith left it. Fourth: three quarters round.",
            "atmosphere": "Coloured light falls through the high windows. Shields and mirrors line the chamber—one wrong angle and the mechanism may trigger a trap.",
            "scene": "Coloured light falls through the stained glass. Mirrors line the chamber—rotate them to align the light.",
            "scene_preview": "Coloured light falls through the stained glass. Mirrors line the chamber.",
            "throne_game": {
                "instruction": "Click each mirror to rotate (0°, 90°, 180°, 270°). Align the light with the symbols.",
                "numMirrors": 4,
                "trapMessage": "The light triggers a trap!",
                "symbols": "⚜ 👑 ⚜",
            },
        },
        {
            "index": 5,
            "title": "Armory",
            "puzzle_type": "jigsaw",
            "hint": "A shattered coat of arms hangs on the wall.",
            "closer_hint": "Drag a piece onto another to swap. Reassemble the image to unlock the door.",
            "atmosphere": "Rust and leather. A broken crest lies in fragments.",
            "scene": "The armory holds a shattered coat of arms.",
            "jigsaw": {
                "rows": 4,
                "cols": 5,
                "imageUrl": "/images/armory-jigsaw.jpg",
                "instruction": "Drag a piece onto another to swap. Reassemble the image. You have 10 checks—wrong 10 times and the puzzle reshuffles.",
            },
        },
        {
            "index": 6,
            "title": "Tower",
            "puzzle_type": "tower_climb",
            "hint": "The archer watches. Your strength will not last.",
            "atmosphere": "Cold wind buffets the stone. Above, an archer patrols and looses arrows.",
            "scene": "The tower face rises before you. Handholds and ledges offer a path—but the archer watches from above.",
            "tower_climb": {
                "instruction": "↑↓←→ or arrow keys to climb. Dodge the archer's arrows—stamina depletes as you go. Reach the summit to unlock the door.",
                "staminaMax": 100,
                "staminaDrain": 0.9,
                "staminaRefill": 0.5,
                "windStrength": 0.8,
                "arrowInterval": 4000,
                "arrowSpeed": 0.82,
                "arrowsPerVolley": 4,
                "arrowVolleyDelay": 280,
                "areaHeight": 480,
                "easyMode": {
                    "arrowInterval": 4500,
                    "arrowsPerVolley": 3,
                    "arrowVolleyDelay": 600,
                    "areaHeight": 420,
                },
            },
        },
        {
            "index": 7,
            "title": "Chapel",
            "puzzle_type": "chain_rhythm",
            "hint": "Strike the hanging chains. Wrong rhythm rings the bell.",
            "closer_hint": "Watch the blinks—they show which chain is correct. Strike in sequence with steady rhythm.",
            "atmosphere": "Cold hearths. Hanging metal chains. Wrong rhythm: the bell tower rings.",
            "scene": "Five chains hang from the stone. The right sequence at the right rhythm produces a deep resonance. Wrong rhythm: the bell rings and the puzzle resets.",
            "chain_rhythm": {
                "labels": ["I", "II", "III", "IV", "V"],
                "instruction": "Click chains to strike. Wrong chain resets the sequence.",
                "feedback_order": [2, 0, 4, 1, 3],
            },
        },
        {
            "index": 8,
            "title": "Wine Cellar",
            "puzzle_type": "liquid_balance",
            "hint": "Five stone vats are connected by pipes. Equal liquid in all five unlocks the mechanism.",
            "closer_hint": "Balance all five vats at the carved marks. One pipe drips—it behaves differently.",
            "atmosphere": "Cobwebs and cork. Five vats, pipes between them. Valve wheels turn; liquid moves.",
            "scene": "Five vats stand in a row, linked by pipes. Watch the levels through the slits. When the surfaces align at the carved marks, the mechanism unlocks.",
            "liquid_balance": {
                "instruction": "Click valve wheels to open/close pipes. Balance all five vats at the marks.",
                "vat_count": 5,
                "balance_threshold": 4,
                "stable_ticks": 22,
                "initial_levels": [95, 70, 40, 15, 2],
                "ambient_leak_scale": 0.15,
            },
        },
        {
            "index": 9,
            "title": "Guard Room",
            "puzzle_type": "guard_room_stealth",
            "hint": "Guards patrol the room. Stay out of their sight.",
            "closer_hint": "Stay in shadow. Move when they look away. Shift to run only when you must.",
            "atmosphere": "Weapons on the walls. Guards walk the floor. The exit door is across the room.",
            "scene": "Reach the far door without being seen. If they see you too long, they take you.",
            "guard_room_stealth": {
                "instruction": "Reach the exit without being caught. Move: W or ↑ up, S or ↓ down, A or ← left, D or → right. Shift to run.",
                "guardCount": 14,
                "roomWidth": 420,
                "roomHeight": 300,
            },
        },
        {
            "index": 10,
            "title": "Nursery",
            "puzzle_type": "royal_lineage",
            "hint": "The door bears a crest lock. The lineage scroll tells the order of reign—not birth.",
            "closer_hint": "Use the scroll clues to deduce reign order. The canopy shows which symbol belongs to which ruler.",
            "atmosphere": "The heir's nursery. An illuminated lineage scroll on the desk; wax seals and wooden crest medallions. On the door, a circular lock with five crest slots.",
            "scene": "Before a ruler learns swordplay, they must understand their bloodline. The scroll records who did not see peace, who did not rule first or last, who followed war, who did not follow the Founder, and who came after Justice.",
            "royal_lineage": {
                "instruction": "Set the crests in the order of reign. Use the scroll to deduce the sequence.",
                "rulers": [
                    {"name": "King Aldric", "title": "the Founder", "symbol": "🏰"},
                    {"name": "Queen Seraphine", "title": "the Peacemaker", "symbol": "🕊️"},
                    {"name": "King Rowan", "title": "the Conqueror", "symbol": "⚔️"},
                    {"name": "King Cedric", "title": "the Just", "symbol": "⚖️"},
                    {"name": "Princess Elowen", "title": "the Heir", "symbol": "🌹"},
                ],
                "scrollClues": [
                    "The Founder did not see peace in his lifetime.",
                    "The Conqueror did not rule first, nor did he rule last.",
                    "The Peacemaker ruled immediately after a time of war.",
                    "The Just did not follow the Founder directly.",
                    "The Rose came after Justice.",
                ],
                "canopySymbols": ["🏰", "🕊️", "⚔️", "⚖️", "🌹"],
            },
        },
        {
            "index": 11,
            "title": "Gallery",
            "puzzle_type": "gallery_royal_code",
            "hint": "Each portrait has a symbol and a position. One lies.",
            "closer_hint": "Use the coloured glass shards on each portrait. Cross-check—one portrait bears false marks.",
            "atmosphere": "Oil portraits of the Founder, Queen, King, Princess, Prince, and the Traitor. Three glass shards by a torch.",
            "scene": "Find which symbol goes in each position.",
            "gallery_royal_code": {
                "lights": ["red", "blue", "green"],
                "obfuscateLights": True,
                "symbols": [
                    {"id": 0, "emoji": "🦁", "label": "Lion"},
                    {"id": 1, "emoji": "⚔️", "label": "Sword"},
                    {"id": 2, "emoji": "👑", "label": "Crown"},
                    {"id": 3, "emoji": "🐦‍⬛", "label": "Raven"},
                    {"id": 4, "emoji": "🛡️", "label": "Shield"},
                ],
                "order": [0, 2, 1, 4, 3],
                "paintings": [
                    {"role": "ancestor", "emoji": "👴", "clues": {"red": {"type": "symbol", "value": 0}, "blue+green": {"type": "position", "value": 1}}},
                    {"role": "queen", "emoji": "👸", "clues": {"blue+red": {"type": "symbol", "value": 2}, "blue": {"type": "position", "value": 2}}},
                    {"role": "king", "emoji": "🤴", "clues": {"red": {"type": "symbol", "value": 1}, "blue": {"type": "position", "value": 3}}},
                    {"role": "princess", "emoji": "👧", "clues": {"green+red": {"type": "symbol", "value": 4}, "blue": {"type": "position", "value": 4}}},
                    {"role": "prince", "emoji": "👦", "clues": {"green+red": {"type": "symbol", "value": 3}, "blue+green": {"type": "position", "value": 5}}},
                    {"role": "traitor", "emoji": "😈", "clues": {"red": {"type": "symbol", "value": 2}, "blue": {"type": "position", "value": 1}, "blue+red": {"type": "position", "value": 3}}},
                ],
            },
        },
        {
            "index": 12,
            "title": "Alchemy Lab",
            "puzzle_type": "reality_shift",
            "hint": "Reality bends here. Trust the artifacts—each one changes the path.",
            "closer_hint": "First use Rotate (↻), then Rotate (↻) again. You need to guess the remaining three steps.",
            "atmosphere": "Stone walls. A glowing exit. Three glowing artifacts—Rotate, Quadrant, and Mirror—hum with power. The exit is visible but unreachable.",
            "scene": "Stone walls. A glowing exit. Artifacts hum with power—stand on one and press E to transform the room.",
            "scene_preview": "Stone walls. A glowing exit. Three artifacts hum with power.",
            "reality_shift": {
                "instruction": "Reach the green EXIT. Move: WASD or arrows. Stand on an artifact and press E to transform the room.",
                "howToPlay": "GOAL: Reach the green EXIT tile. Move with WASD. Stand on an artifact and press E to transform the room.",
                "rows": 7,
                "cols": 7,
                "walls": [[0, 0], [0, 3], [1, 3], [2, 0], [2, 4], [2, 5], [4, 1], [4, 5], [5, 4], [5, 6], [6, 5]],
                "playerStart": [1, 1],
                "exit": [5, 5],
                "artifacts": [
                    {"r": 1, "c": 2, "type": "rotate"},
                    {"r": 2, "c": 2, "type": "rotate_quadrant"},
                    {"r": 0, "c": 2, "type": "mirror"},
                ],
                "maxActivations": 5,
                "requiredMinActivations": 5,
            },
        },
        {
            "index": 13,
            "title": "Bathhouse",
            "puzzle_type": "bubble_round",
            "hint": "The bubble is fragile. Steam vents and blades line the path.",
            "atmosphere": "A magical bathhouse chamber. Steam vents hiss. The only way forward is inside a fragile enchanted bubble.",
            "scene": "The Steam Passage. Float through in the bubble. Reach the exit.",
            "scene_preview": "The Steam Passage. A fragile bubble floats through steam and hazards.",
            "bubble_round": {
                "instruction": "Hold ↑ to rise, ↓ to fall. Avoid steam, spikes, and blades. Reach the exit without popping.",
                "scrollSpeed": 1.8,
                "gravity": 0.04,
                "liftForce": 0.38,
                "buoyancy": 0.12,
                "airDamping": 0.97,
                "maxVelocity": 2.0,
            },
        },
        {
            "index": 14,
            "title": "Stables",
            "puzzle_type": "stables_race",
            "hint": "Only the fastest mind may ride the fastest horse. Investigate the track, choose wisely, and win the Royal Trial Race.",
            "closer_hint": "The track favors stamina and steady footing. Choose the horse that excels in mud.",
            "atmosphere": "Abandoned royal stables. War horses once trained here. One massive gate blocks the exit. An ancient rule: only the fastest mind may ride the fastest horse.",
            "scene": "Investigate the track map and weather. Choose your horse. Win the underground trial race to open the gate.",
            "stables_race": {
                "instruction": "Check track map and weather. Choose a horse. During race: Space to jump.",
                "trackFavor": "mud",
                "trackMap": "The lower tunnel is long and muddy. The upper section has scattered hay bales.",
                "weatherNote": "Heavy rain soaked the lower tunnel.",
                "horses": [
                    {"name": "Ember", "speed": 1.4, "jump": 0.7, "stamina": 0.6, "special": "Quick dash", "favor": "flat"},
                    {"name": "Stone", "speed": 0.8, "jump": 1.2, "stamina": 1.3, "special": "Thrives in mud", "favor": "mud"},
                    {"name": "Mist", "speed": 1.0, "jump": 1.0, "stamina": 1.0, "special": "Double jump", "favor": "jump"}
                ],
            },
        },
    ]


# Build rooms list: 15 rooms from get_rooms_public()
ROOMS_PUBLIC = None

def build_rooms_public():
    global ROOMS_PUBLIC
    if ROOMS_PUBLIC is not None:
        return ROOMS_PUBLIC
    base = get_rooms_public()
    ROOMS_PUBLIC = base[:TOTAL_ROOMS]
    for i, r in enumerate(ROOMS_PUBLIC):
        r["index"] = i
        r.setdefault("scene", (r.get("atmosphere") or "") + " " + (r.get("hint") or ""))
    return ROOMS_PUBLIC
