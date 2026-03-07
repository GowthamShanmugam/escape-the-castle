"""
SQLite database for Escape the Castle.
All game and player state lives here — never exposed to the client except via API responses.
Connection pool for 60+ concurrent players.
"""
import json
import sqlite3
import os
import queue
import threading

import rooms_data

DB_PATH = os.environ.get("CASTLE_DB_PATH", os.path.join(os.path.dirname(__file__), "castle.db"))

# Pool: 30 connections for 60 players (not all hit DB at same instant)
POOL_SIZE = int(os.environ.get("CASTLE_DB_POOL_SIZE", "30"))
_pool: queue.Queue[sqlite3.Connection] | None = None
_pool_lock = threading.Lock()


def _make_conn():
    # check_same_thread=False: FastAPI runs sync endpoints in thread pool; pool created in main thread
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


class _PooledConn:
    """Wrapper that returns the real connection to the pool on close()."""

    def __init__(self, conn: sqlite3.Connection, q: queue.Queue):
        self._conn = conn
        self._pool = q
        self._closed = False

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        if not self._closed:
            self._closed = True
            try:
                self._conn.rollback()
                self._pool.put_nowait(self._conn)
            except Exception:
                self._conn.close()


def get_conn() -> sqlite3.Connection:
    """Get a connection from the pool. Caller must conn.close() when done (returns to pool)."""
    global _pool
    with _pool_lock:
        if _pool is None:
            _pool = queue.Queue(maxsize=POOL_SIZE)
            for _ in range(POOL_SIZE):
                _pool.put(_make_conn())
    try:
        conn = _pool.get(timeout=30.0)
        return _PooledConn(conn, _pool)
    except queue.Empty:
        return _make_conn()


def _infer_completed_rooms(current_room: int, finished_at) -> list:
    """Backward compat: infer completed_rooms for players created before we tracked it."""
    if finished_at is not None:
        return list(range(rooms_data.TOTAL_ROOMS))
    return list(range(current_room))


def clear_all_games():
    """Delete all games and their players. Use for reset/cleanup."""
    conn = get_conn()
    try:
        conn.execute("DELETE FROM players")
        conn.execute("DELETE FROM games")
        conn.commit()
    finally:
        conn.close()


def init_db():
    conn = get_conn()
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=-64000")
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS games (
                game_code TEXT PRIMARY KEY,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS players (
                player_id TEXT PRIMARY KEY,
                game_code TEXT NOT NULL,
                player_name TEXT NOT NULL,
                current_room INTEGER NOT NULL DEFAULT 0,
                completed_rooms TEXT,
                room_entered_at REAL,
                finished_at REAL,
                coins INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (game_code) REFERENCES games(game_code)
            );
            CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_code);
        """)
        conn.commit()
        try:
            conn.execute("ALTER TABLE players ADD COLUMN completed_rooms TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE players ADD COLUMN coins INTEGER NOT NULL DEFAULT 0")
            conn.commit()
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE players ADD COLUMN bribed_hints TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE players ADD COLUMN coin_spends TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass
    finally:
        conn.close()


def game_exists(game_code: str) -> bool:
    conn = get_conn()
    try:
        r = conn.execute("SELECT 1 FROM games WHERE game_code = ?", (game_code.upper(),)).fetchone()
        return r is not None
    finally:
        conn.close()


def create_game(game_code: str, created_at: float) -> None:
    conn = get_conn()
    try:
        conn.execute("INSERT INTO games (game_code, created_at) VALUES (?, ?)", (game_code, created_at))
        conn.commit()
    finally:
        conn.close()


def get_player_by_name(game_code: str, player_name: str) -> dict | None:
    """Return existing player in this game with matching name (case-insensitive), or None."""
    gc = game_code.upper()
    name = (player_name or "").strip()
    if not name:
        return None
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT player_id, player_name, current_room, completed_rooms, room_entered_at, finished_at, coins, bribed_hints, coin_spends FROM players WHERE game_code = ? AND LOWER(TRIM(player_name)) = LOWER(TRIM(?))",
            (gc, name),
        ).fetchone()
        if not row:
            return None
        cr = row["completed_rooms"]
        if cr:
            try:
                completed = json.loads(cr)
            except (TypeError, ValueError):
                completed = _infer_completed_rooms(row["current_room"], row["finished_at"])
        else:
            completed = _infer_completed_rooms(row["current_room"], row["finished_at"])
        bh = row["bribed_hints"] if "bribed_hints" in row.keys() else None
        try:
            bribed_hints = json.loads(bh) if bh else {}
        except (TypeError, ValueError):
            bribed_hints = {}
        cs = row["coin_spends"] if "coin_spends" in row.keys() else None
        try:
            coin_spends = json.loads(cs) if cs else {}
        except (TypeError, ValueError):
            coin_spends = {}
        return {
            "player_id": row["player_id"],
            "player_name": row["player_name"],
            "current_room": row["current_room"],
            "completed_rooms": completed,
            "room_entered_at": row["room_entered_at"],
            "finished_at": row["finished_at"],
            "coins": (row["coins"] or 0) if "coins" in row.keys() else 0,
            "bribed_hints": bribed_hints,
            "coin_spends": coin_spends,
        }
    finally:
        conn.close()


def add_player(player_id: str, game_code: str, player_name: str, room_entered_at: float) -> None:
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO players (player_id, game_code, player_name, current_room, completed_rooms, room_entered_at, finished_at, coins) VALUES (?, ?, ?, 0, '[]', ?, NULL, 0)",
            (player_id, game_code.upper(), player_name, room_entered_at),
        )
        conn.commit()
    finally:
        conn.close()


def get_game(game_code: str) -> dict | None:
    gc = game_code.upper()
    conn = get_conn()
    try:
        row = conn.execute("SELECT game_code, created_at FROM games WHERE game_code = ?", (gc,)).fetchone()
        if not row:
            return None
        players_rows = conn.execute(
            "SELECT player_id, player_name, current_room, completed_rooms, room_entered_at, finished_at, coins, bribed_hints, coin_spends FROM players WHERE game_code = ?",
            (gc,),
        ).fetchall()
        players = {}
        for r in players_rows:
            cr = r["completed_rooms"]
            if cr:
                try:
                    completed = json.loads(cr)
                except (TypeError, ValueError):
                    completed = []
            else:
                completed = _infer_completed_rooms(r["current_room"], r["finished_at"])
            bh = r["bribed_hints"] if "bribed_hints" in r.keys() else None
            try:
                bribed_hints = json.loads(bh) if bh else {}
            except (TypeError, ValueError):
                bribed_hints = {}
            cs = r["coin_spends"] if "coin_spends" in r.keys() else None
            try:
                coin_spends = json.loads(cs) if cs else {}
            except (TypeError, ValueError):
                coin_spends = {}
            players[r["player_id"]] = {
                "player_id": r["player_id"],
                "player_name": r["player_name"],
                "current_room": r["current_room"],
                "completed_rooms": completed,
                "room_entered_at": r["room_entered_at"],
                "finished_at": r["finished_at"],
                "coins": (r["coins"] or 0) if "coins" in r.keys() else 0,
                "bribed_hints": bribed_hints,
                "coin_spends": coin_spends,
            }
        return {
            "game_code": row["game_code"],
            "players": players,
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


def get_player_game_code(player_id: str) -> str | None:
    """Return game_code for the game this player is in, or None if not found."""
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT game_code FROM players WHERE player_id = ?",
            (player_id,),
        ).fetchone()
        return row["game_code"] if row else None
    finally:
        conn.close()


def set_player_room(game_code: str, room: int, *, player_id: str | None = None, player_name: str | None = None) -> bool:
    """Set a player's current_room (by player_id or player_name). Returns True if a row was updated."""
    n = set_all_players_room(game_code, room, player_id=player_id, player_name=player_name)
    return n > 0


def set_all_players_room(
    game_code: str, room: int, *, player_id: str | None = None, player_name: str | None = None
) -> int:
    """Set current_room for all matching players (by player_id or player_name). Returns number of rows updated."""
    gc = game_code.upper()
    import time
    now = time.time()
    conn = get_conn()
    try:
        if player_id:
            cur = conn.execute(
                "UPDATE players SET current_room = ?, room_entered_at = ?, finished_at = NULL WHERE game_code = ? AND player_id = ?",
                (room, now, gc, player_id),
            )
        elif player_name:
            cur = conn.execute(
                "UPDATE players SET current_room = ?, room_entered_at = ?, finished_at = NULL WHERE game_code = ? AND player_name = ?",
                (room, now, gc, player_name),
            )
        else:
            return 0
        conn.commit()
        return cur.rowcount
    finally:
        conn.close()


def advance_player(game_code: str, player_id: str, current_room: int, total_rooms: int) -> tuple[int, bool]:
    """Advance player to next room. Adds current_room to completed_rooms. Returns (new_room, finished)."""
    gc = game_code.upper()
    import time
    now = time.time()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT completed_rooms FROM players WHERE game_code = ? AND player_id = ?",
            (gc, player_id),
        ).fetchone()
        completed = []
        if row and row["completed_rooms"]:
            try:
                completed = json.loads(row["completed_rooms"])
            except (TypeError, ValueError):
                completed = list(range(current_room))
        else:
            completed = list(range(current_room))
        if current_room not in completed:
            completed.append(current_room)
            completed.sort()
        completed_json = json.dumps(completed)
        # Award 1 coin for solving a room
        conn.execute(
            "UPDATE players SET coins = COALESCE(coins, 0) + 1 WHERE game_code = ? AND player_id = ?",
            (gc, player_id),
        )
        if current_room >= total_rooms - 1:
            conn.execute(
                "UPDATE players SET current_room = ?, completed_rooms = ?, finished_at = ? WHERE game_code = ? AND player_id = ?",
                (total_rooms, completed_json, now, gc, player_id),
            )
            conn.commit()
            return total_rooms, True
        # Skip any already-completed rooms (e.g. when finishing a room you jumped back to)
        new_room = current_room + 1
        while new_room < total_rooms and new_room in completed:
            new_room += 1
        if new_room >= total_rooms:
            conn.execute(
                "UPDATE players SET current_room = ?, completed_rooms = ?, finished_at = ? WHERE game_code = ? AND player_id = ?",
                (total_rooms, completed_json, now, gc, player_id),
            )
            conn.commit()
            return total_rooms, True
        conn.execute(
            "UPDATE players SET current_room = ?, completed_rooms = ?, room_entered_at = ? WHERE game_code = ? AND player_id = ?",
            (new_room, completed_json, now, gc, player_id),
        )
        conn.commit()
        return new_room, False
    finally:
        conn.close()


def spend_coin(game_code: str, player_id: str) -> tuple[bool, int]:
    """Spend 1 coin. Returns (success, coins_remaining)."""
    gc = game_code.upper()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT coins FROM players WHERE game_code = ? AND player_id = ?",
            (gc, player_id),
        ).fetchone()
        if not row:
            return False, 0
        coins = row["coins"] or 0
        if coins < 1:
            return False, coins
        new_coins = coins - 1
        conn.execute(
            "UPDATE players SET coins = ? WHERE game_code = ? AND player_id = ?",
            (new_coins, gc, player_id),
        )
        conn.commit()
        return True, new_coins
    finally:
        conn.close()


def spend_coin_with_purpose(game_code: str, player_id: str, purpose: str) -> tuple[bool, int]:
    """Spend 1 coin for a specific purpose (tower_easy, bathhouse_50). Records the purchase.
    If already purchased for this purpose, returns success without deducting. Returns (success, coins_remaining)."""
    gc = game_code.upper()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT coins, coin_spends FROM players WHERE game_code = ? AND player_id = ?",
            (gc, player_id),
        ).fetchone()
        if not row:
            return False, 0
        coins = row["coins"] or 0
        cs = row["coin_spends"] if "coin_spends" in row.keys() else None
        try:
            coin_spends = json.loads(cs) if cs else {}
        except (TypeError, ValueError):
            coin_spends = {}
        if coin_spends.get(purpose):
            return True, coins
        if coins < 1:
            return False, coins
        coin_spends[purpose] = True
        new_coins = coins - 1
        conn.execute(
            "UPDATE players SET coins = ?, coin_spends = ? WHERE game_code = ? AND player_id = ?",
            (new_coins, json.dumps(coin_spends), gc, player_id),
        )
        conn.commit()
        return True, new_coins
    finally:
        conn.close()


def spend_coin_for_bribe(game_code: str, player_id: str, room_index: int, closer_hint: str) -> tuple[bool, int]:
    """Spend 1 coin for a bribe and record the closer hint. Returns (success, coins_remaining)."""
    gc = game_code.upper()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT coins, bribed_hints FROM players WHERE game_code = ? AND player_id = ?",
            (gc, player_id),
        ).fetchone()
        if not row:
            return False, 0
        coins = row["coins"] or 0
        if coins < 1:
            return False, coins
        bh = row["bribed_hints"] if "bribed_hints" in row.keys() else None
        try:
            bribed_hints = json.loads(bh) if bh else {}
        except (TypeError, ValueError):
            bribed_hints = {}
        bribed_hints[str(room_index)] = closer_hint
        new_coins = coins - 1
        conn.execute(
            "UPDATE players SET coins = ?, bribed_hints = ? WHERE game_code = ? AND player_id = ?",
            (new_coins, json.dumps(bribed_hints), gc, player_id),
        )
        conn.commit()
        return True, new_coins
    finally:
        conn.close()


def mark_player_finished(game_code: str, player_id: str, total_rooms: int) -> bool:
    """Mark a player as having completed all rooms. For dev/testing."""
    gc = game_code.upper()
    import time
    now = time.time()
    completed = json.dumps(list(range(total_rooms)))
    conn = get_conn()
    try:
        cur = conn.execute(
            "UPDATE players SET current_room = ?, completed_rooms = ?, finished_at = ? WHERE game_code = ? AND player_id = ?",
            (total_rooms, completed, now, gc, player_id),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
