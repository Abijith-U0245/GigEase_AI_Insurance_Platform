"""SQLite access via aiosqlite — one table per worker (T001_enriched … T008_enriched)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

import aiosqlite

from config import BACKEND_DIR, GIGEASE_DB_PATH

_p = Path(GIGEASE_DB_PATH)
DB_PATH = str(_p.resolve() if _p.is_absolute() else (BACKEND_DIR / _p).resolve())

WORKER_TABLES = {
    "T001": "T001_enriched",
    "T002": "T002_enriched",
    "T003": "T003_enriched",
    "T004": "T004_enriched",
    "T005": "T005_enriched",
    "T006": "T006_enriched",
    "T007": "T007_enriched",
    "T008": "T008_enriched",
}


async def ping_db() -> bool:
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("SELECT 1")
        return True
    except Exception:
        return False


async def _row_to_dict(cursor: aiosqlite.Cursor, row: tuple) -> dict:
    cols = [d[0] for d in cursor.description]
    return dict(zip(cols, row))


async def fetch_all_workers() -> List[dict]:
    """Latest week row for each of the 8 workers."""
    results: List[dict] = []
    async with aiosqlite.connect(DB_PATH) as db:
        for _worker_id, table in WORKER_TABLES.items():
            async with db.execute(
                f'SELECT * FROM "{table}" ORDER BY week_start_date DESC LIMIT 1'
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    results.append(await _row_to_dict(cursor, row))
    return results


async def fetch_worker_latest(worker_id: str) -> Optional[dict]:
    """Most recent week row for one worker."""
    table = WORKER_TABLES.get(worker_id)
    if not table:
        return None
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            f'SELECT * FROM "{table}" ORDER BY week_start_date DESC LIMIT 1'
        ) as cursor:
            row = await cursor.fetchone()
            return await _row_to_dict(cursor, row) if row else None


async def fetch_worker_all_weeks(worker_id: str) -> List[dict]:
    """All weeks for one worker, oldest first — for simulation."""
    table = WORKER_TABLES.get(worker_id)
    if not table:
        return []
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            f'SELECT * FROM "{table}" ORDER BY week_start_date ASC'
        ) as cursor:
            rows = await cursor.fetchall()
            return [await _row_to_dict(cursor, row) for row in rows]


async def fetch_worker_week(worker_id: str, week_start_date: str) -> Optional[dict]:
    """One specific week for one worker."""
    table = WORKER_TABLES.get(worker_id)
    if not table:
        return None
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            f'SELECT * FROM "{table}" WHERE week_start_date = ?',
            (week_start_date,),
        ) as cursor:
            row = await cursor.fetchone()
            return await _row_to_dict(cursor, row) if row else None


async def fetch_all_weeks_all_workers() -> List[dict]:
    """All rows from all 8 workers — for admin simulation and ICR."""
    results: List[dict] = []
    async with aiosqlite.connect(DB_PATH) as db:
        for _worker_id, table in WORKER_TABLES.items():
            async with db.execute(
                f'SELECT * FROM "{table}" ORDER BY week_start_date ASC'
            ) as cursor:
                rows = await cursor.fetchall()
                for row in rows:
                    results.append(await _row_to_dict(cursor, row))
    return results


async def get_pool():
    """No-op — kept so main.py lifespan does not break."""
    return None


async def close_pool():
    """No-op — kept for API compatibility with previous asyncpg pool lifecycle."""
    return None
