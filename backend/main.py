"""
Escape the Castle - Python FastAPI backend.
Game state stored in SQLite (server-side only). Leaderboard/state sent to client via API only.
Puzzle answers validated server-side; each of 19 rooms is unique.
Anyone can create or join games (no admin password).
"""
import asyncio
import json
import uuid
import time
from typing import Optional, Any
from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

import db as db_module
import rooms_data

# WebSocket connections only (in-memory); game data is in DB
connection_managers: dict[str, list[WebSocket]] = {}

TOTAL_ROOMS = rooms_data.TOTAL_ROOMS


class CreateGameRequest(BaseModel):
    player_name: str


class JoinGameRequest(BaseModel):
    player_name: str
    game_code: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_module.init_db()
    yield
    connection_managers.clear()


app = FastAPI(title="Escape the Castle API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def game_code():
    return "".join([str(uuid.uuid4()).replace("-", "")[:4].upper() for _ in range(2)])


async def broadcast_game_state(game_id: str):
    """Notify all connected clients for this game. Data read from DB."""
    if game_id not in connection_managers:
        return
    g = db_module.get_game(game_id)
    if not g:
        return
    payload = {
        "type": "game_state",
        "game": g,
        "leaderboard": get_leaderboard(game_id),
    }
    msg = json.dumps(payload)
    for ws in connection_managers[game_id][:]:
        try:
            await ws.send_text(msg)
        except Exception:
            pass


def get_leaderboard(game_id: str) -> list[dict]:
    g = db_module.get_game(game_id)
    if not g:
        return []
    players = list(g.get("players", {}).values())
    def key(p):
        completed = p.get("completed_rooms", [])
        cnt = len(completed) if isinstance(completed, list) else 0
        coins = p.get("coins", 0) or 0
        t = p.get("room_entered_at", 0) or 0
        # Score: rooms matter most (2 pts each), coins reward frugality (1 pt each)
        score = cnt * 2 + coins
        return (-score, t)
    players.sort(key=key)
    return [
        {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "current_room": p.get("current_room", 0),
            "completed_rooms": p.get("completed_rooms", []),
            "coins": p.get("coins", 0) or 0,
            "total_rooms": TOTAL_ROOMS,
            "finished_at": p.get("finished_at"),
            "room_entered_at": p.get("room_entered_at"),
        }
        for p in players
    ]


@app.post("/api/games")
def create_game(body: CreateGameRequest):
    """Create a new game. State stored in DB."""
    try:
        code = game_code()
        while db_module.game_exists(code):
            code = game_code()
        player_id = str(uuid.uuid4())
        now = time.time()
        db_module.create_game(code, now)
        db_module.add_player(player_id, code, body.player_name, now)
        return {
            "game_code": code,
            "player_id": player_id,
            "player_name": body.player_name,
            "total_rooms": TOTAL_ROOMS,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/games/join")
def join_game(body: JoinGameRequest):
    """Join existing game by code. If same name already in game, resume that player (no new user)."""
    gc = body.game_code.upper()
    if not db_module.game_exists(gc):
        raise HTTPException(status_code=404, detail="Game not found")
    existing = db_module.get_player_by_name(gc, body.player_name)
    if existing:
        return {
            "game_code": gc,
            "player_id": existing["player_id"],
            "player_name": existing["player_name"],
            "total_rooms": TOTAL_ROOMS,
        }
    player_id = str(uuid.uuid4())
    now = time.time()
    db_module.add_player(player_id, gc, body.player_name, now)
    return {
        "game_code": gc,
        "player_id": player_id,
        "player_name": body.player_name,
        "total_rooms": TOTAL_ROOMS,
    }


@app.get("/api/games/{game_code}")
def get_game(game_code: str):
    g = db_module.get_game(game_code.upper())
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        **g,
        "leaderboard": get_leaderboard(game_code.upper()),
        "total_rooms": TOTAL_ROOMS,
    }


class AdvanceRoomBody(BaseModel):
    player_id: str
    room_index: int
    puzzle_answer: Optional[str] = None  # required for all except torch_key


class JumpRoomBody(BaseModel):
    player_id: str
    room_index: int


class BribeBody(BaseModel):
    player_id: str


class SpendCoinBody(BaseModel):
    player_id: str
    purpose: str  # "tower_easy" | "bathhouse_50"


def _normalize(s: str) -> str:
    return (s or "").strip().lower().replace(" ", "")


def _validate_puzzle(room_index: int, puzzle_answer: Optional[str]) -> bool:
    """Validate puzzle answer against server-side data. Returns True if correct."""
    if room_index < 0 or room_index >= len(rooms_data.PUZZLE_ANSWERS):
        return False
    entry = rooms_data.PUZZLE_ANSWERS[room_index]
    ptype = entry.get("type", "")
    if ptype == "torch_key":
        return True  # no answer required
    if not puzzle_answer:
        return False
    raw = (puzzle_answer or "").strip()
    if ptype == "code_lock":
        code = entry.get("code", "")
        return raw.replace(" ", "") == code
    if ptype == "book_clue":
        ans = entry.get("answer", "")
        return _normalize(raw) == _normalize(ans)
    if ptype == "sequence":
        try:
            # Allow "4,0,1,3,2" or "[4,0,1,3,2]"
            part = raw.replace("[", "").replace("]", "").strip()
            nums = [int(x.strip()) for x in part.split(",") if x.strip()]
            correct = entry.get("order", [])
            return len(nums) == len(correct) and all(a == b for a, b in zip(nums, correct))
        except (ValueError, TypeError):
            return False
    if ptype == "throne_game":
        # Angles string e.g. "90,180,0" (order and value matter)
        correct = (entry.get("angles") or entry.get("answer") or "").strip()
        normalized = ",".join(x.strip() for x in raw.split(",") if x.strip())
        return normalized == correct
    if ptype == "jigsaw":
        try:
            part = raw.replace("[", "").replace("]", "").strip()
            nums = [int(x.strip()) for x in part.split(",") if x.strip()]
            correct = entry.get("order", list(range(20)))
            return len(nums) == len(correct) and all(a == b for a, b in zip(nums, correct))
        except (ValueError, TypeError):
            return False
    if ptype == "tower_climb":
        ans = entry.get("answer", "summit")
        return _normalize(raw) == _normalize(ans)
    if ptype == "chain_rhythm":
        try:
            data = json.loads(raw)
            order = data.get("order")
            correct_order = entry.get("order", [])
            if not isinstance(order, list) or len(order) != len(correct_order):
                return False
            if order != correct_order:
                return False
            return True
        except (json.JSONDecodeError, TypeError, KeyError):
            return False
    if ptype == "liquid_balance":
        ans = entry.get("answer", "balanced")
        return _normalize(raw) == _normalize(ans)
    if ptype == "guard_room_stealth":
        ans = entry.get("answer", "escaped")
        return _normalize(raw) == _normalize(ans)
    if ptype == "reality_shift":
        ans = entry.get("answer", "escaped")
        return _normalize(raw) == _normalize(ans)
    if ptype == "gallery_royal_code":
        try:
            part = raw.replace("[", "").replace("]", "").strip()
            nums = [int(x.strip()) for x in part.split(",") if x.strip()]
            correct = entry.get("order", [])
            return len(nums) == len(correct) and all(a == b for a, b in zip(nums, correct))
        except (ValueError, TypeError):
            return False
    if ptype == "royal_lineage":
        try:
            part = raw.replace("[", "").replace("]", "").strip()
            nums = [int(x.strip()) for x in part.split(",") if x.strip()]
            correct = entry.get("order", [])
            return len(nums) == len(correct) and all(a == b for a, b in zip(nums, correct))
        except (ValueError, TypeError):
            return False
    if ptype == "bubble_round":
        ans = entry.get("answer", "escaped")
        return _normalize(raw) == _normalize(ans)
    if ptype == "stables_race":
        ans = entry.get("answer", "escaped")
        return _normalize(raw) == _normalize(ans)
    return False


@app.post("/api/games/{game_code}/players/advance")
async def advance_room_with_player(game_code: str, body: AdvanceRoomBody):
    gc = game_code.upper()
    g = db_module.get_game(gc)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    p = g["players"].get(body.player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    current = p.get("current_room", 0)
    if body.room_index != current:
        raise HTTPException(status_code=400, detail="Wrong room index")
    if not _validate_puzzle(current, body.puzzle_answer):
        ptype = rooms_data.PUZZLE_ANSWERS[current].get("type", "")
        detail = (
            "Wrong rhythm. The bell rings; the guards are alerted." if ptype == "chain_rhythm" else
            "The bubble pops. You must reach the exit without popping." if ptype == "bubble_round" else
            "You did not win the race. Try again." if ptype == "stables_race" else
            "The light triggers a trap!" if ptype == "throne_game" else
            "Incorrect. Try again."
        )
        raise HTTPException(status_code=400, detail=detail)
    new_room, finished = db_module.advance_player(gc, body.player_id, current, TOTAL_ROOMS)
    await broadcast_game_state(gc)
    g2 = db_module.get_game(gc)
    p2 = g2 and g2.get("players", {}).get(body.player_id)
    completed = p2.get("completed_rooms", []) if p2 else list(range(new_room))
    coins = p2.get("coins", 0) or 0
    return {"current_room": new_room, "finished": finished, "completed_rooms": completed, "coins": coins}


@app.post("/api/games/{game_code}/players/jump")
async def jump_to_room(game_code: str, body: JumpRoomBody):
    """Jump to a room via map. Can only jump to current or upcoming rooms (not completed)."""
    gc = game_code.upper()
    g = db_module.get_game(gc)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    p = g["players"].get(body.player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    target = body.room_index
    completed = p.get("completed_rooms", [])
    if not isinstance(completed, list):
        completed = []
    if target in completed:
        raise HTTPException(status_code=400, detail="Cannot jump to a completed room")
    if target >= TOTAL_ROOMS:
        raise HTTPException(status_code=400, detail="Invalid room")
    db_module.set_player_room(gc, target, player_id=body.player_id)
    await broadcast_game_state(gc)
    return {"current_room": target}


class CompletePlayerBody(BaseModel):
    player_id: Optional[str] = None
    player_name: Optional[str] = None


@app.post("/api/games/{game_code}/players/complete")
async def mark_player_complete(game_code: str, body: CompletePlayerBody):
    """Dev: Mark a player as having completed all rooms. Use for testing Congratulations page."""
    gc = game_code.upper()
    g = db_module.get_game(gc)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    pid = body.player_id
    if not pid and body.player_name:
        existing = db_module.get_player_by_name(gc, body.player_name)
        if not existing:
            raise HTTPException(status_code=404, detail="Player not found")
        pid = existing["player_id"]
    if not pid:
        raise HTTPException(status_code=400, detail="Provide player_id or player_name")
    if pid not in g.get("players", {}):
        raise HTTPException(status_code=404, detail="Player not found")
    ok = db_module.mark_player_finished(gc, pid, TOTAL_ROOMS)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update")
    await broadcast_game_state(gc)
    return {"ok": True, "current_room": TOTAL_ROOMS, "finished": True, "player_id": pid}


@app.post("/api/games/{game_code}/players/spend-coin")
async def spend_coin_for_resume(game_code: str, body: SpendCoinBody):
    """Spend 1 coin for a purpose (tower_easy, bathhouse_50). Records purchase; persists across refresh."""
    gc = game_code.upper()
    if body.purpose not in ("tower_easy", "bathhouse_50", "jigsaw_easy", "guard_room_easy"):
        raise HTTPException(status_code=400, detail="Invalid purpose")
    g = db_module.get_game(gc)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    p = g["players"].get(body.player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    ok, coins_left = db_module.spend_coin_with_purpose(gc, body.player_id, body.purpose)
    if not ok:
        raise HTTPException(status_code=400, detail="Not enough coins" if coins_left < 1 else "Spend failed")
    await broadcast_game_state(gc)
    return {"success": True, "coins": coins_left}


@app.post("/api/games/{game_code}/players/bribe")
async def bribe_npc(game_code: str, body: BribeBody):
    """Spend 1 coin for a closer hint. Returns closer_hint for the player's current room."""
    gc = game_code.upper()
    g = db_module.get_game(gc)
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    p = g["players"].get(body.player_id)
    if not p:
        raise HTTPException(status_code=404, detail="Player not found")
    room_index = p.get("current_room", 0)
    rooms_data.build_rooms_public()
    rooms = rooms_data.ROOMS_PUBLIC or []
    room = rooms[room_index] if room_index < len(rooms) else {}
    closer_hint = room.get("closer_hint") or room.get("hint") or "Look around. The answer is here."
    ok, coins_left = db_module.spend_coin_for_bribe(gc, body.player_id, room_index, closer_hint)
    if not ok:
        raise HTTPException(status_code=400, detail="Not enough coins" if coins_left < 1 else "Bribe failed")
    await broadcast_game_state(gc)
    return {"success": True, "coins": coins_left, "closer_hint": closer_hint}


@app.get("/api/games/{game_code}/leaderboard")
def leaderboard(game_code: str):
    gc = game_code.upper()
    return {"leaderboard": get_leaderboard(gc), "total_rooms": TOTAL_ROOMS}


def _rooms_for_client():
    """Return room definitions with closer_hint stripped (only server-side for bribe)."""
    rooms_data.build_rooms_public()
    out = []
    for r in rooms_data.ROOMS_PUBLIC:
        room = {k: v for k, v in r.items() if k != "closer_hint"}
        room["has_closer_hint"] = bool(r.get("closer_hint"))
        out.append(room)
    return out


@app.get("/api/rooms")
def list_rooms():
    """Return room definitions (no answers). Each of 19 rooms is unique."""
    return {"rooms": _rooms_for_client(), "total_rooms": TOTAL_ROOMS}


@app.websocket("/ws/games/{game_code}")
async def websocket_game_live(websocket: WebSocket, game_code: str):
    await websocket.accept()
    gc = game_code.upper()
    if gc not in connection_managers:
        connection_managers[gc] = []
    connection_managers[gc].append(websocket)
    try:
        g = db_module.get_game(gc)
        if g:
            await websocket.send_text(json.dumps({
                "type": "game_state",
                "game": g,
                "leaderboard": get_leaderboard(gc),
            }))
        # Keepalive: send ping every 25s to prevent proxy/load-balancer idle timeout (often 60s)
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                try:
                    await websocket.send_text(json.dumps({"type": "ping", "ts": time.time()}))
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        if gc in connection_managers:
            try:
                connection_managers[gc].remove(websocket)
            except ValueError:
                pass


# Serve frontend static files (when built, e.g. in Docker)
_STATIC_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=_STATIC_DIR / "assets"), name="assets")
    _images = _STATIC_DIR / "images"
    if _images.exists():
        app.mount("/images", StaticFiles(directory=_images), name="images")
    _sounds = _STATIC_DIR / "sounds"
    if _sounds.exists():
        app.mount("/sounds", StaticFiles(directory=_sounds), name="sounds")

    @app.get("/{path:path}")
    def _serve_spa(path: str):
        """SPA fallback: serve index.html for non-API routes."""
        if path.startswith("api") or path.startswith("ws"):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(_STATIC_DIR / "index.html")
