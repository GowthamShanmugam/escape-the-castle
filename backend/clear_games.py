#!/usr/bin/env python3
"""Delete all games and players from the DB. Run from backend/."""
import db

if __name__ == "__main__":
    db.clear_all_games()
    print("All games and players deleted.")
