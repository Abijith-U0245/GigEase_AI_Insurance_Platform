#!/usr/bin/env python3
"""
GigEase — SQLite database setup from enriched CSV files.

Loads each T*_enriched.csv into gigease.db with table name = file stem (e.g. T001_enriched).

Usage (from repository root):
    pip install -r database/requirements.txt
    python database/setup_db.py

Options:
    python database/setup_db.py --db path/to/custom.db
    python database/setup_db.py --csv-dir path/to/csv/folder
"""

from __future__ import annotations

import argparse
import logging
import sqlite3
import sys
from pathlib import Path

import pandas as pd

# Default: repository root (parent of database/)
DEFAULT_PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_NAME = "gigease.db"
CSV_PATTERN = "T*_enriched.csv"

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build SQLite database from GigEase enriched CSV files.",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=None,
        help=f"SQLite database file path (default: <project-root>/{DEFAULT_DB_NAME})",
    )
    parser.add_argument(
        "--csv-dir",
        type=Path,
        default=None,
        help="Directory containing T*_enriched.csv (default: project root)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List CSV files that would be loaded without writing the database",
    )
    return parser.parse_args()


def discover_csv_files(csv_dir: Path) -> list[Path]:
    if not csv_dir.is_dir():
        raise FileNotFoundError(f"CSV directory does not exist or is not a directory: {csv_dir}")
    files = sorted(csv_dir.glob(CSV_PATTERN))
    if not files:
        raise FileNotFoundError(f"No files matching {CSV_PATTERN!r} in {csv_dir}")
    return files


def load_one_table(conn: sqlite3.Connection, csv_path: Path) -> int:
    """Read CSV with UTF-8 and write to SQLite; returns row count."""
    table_name = csv_path.stem
    if not table_name:
        raise ValueError(f"Invalid file name (empty stem): {csv_path}")

    # UTF-8 per requirements; utf-8-sig strips BOM if present (common with Excel exports)
    df = pd.read_csv(csv_path, encoding="utf-8-sig")

    df.to_sql(table_name, conn, if_exists="replace", index=False)
    return len(df)


def main() -> int:
    args = parse_args()
    project_root = DEFAULT_PROJECT_ROOT
    csv_dir = (args.csv_dir or project_root).resolve()
    db_path = (args.db or (project_root / DEFAULT_DB_NAME)).resolve()

    try:
        csv_files = discover_csv_files(csv_dir)
    except FileNotFoundError as e:
        logger.error("%s", e)
        return 1

    if args.dry_run:
        print("Dry run - would load:")
        for p in csv_files:
            print(f"  {p.name} -> table {p.stem!r}")
        return 0

    db_path.parent.mkdir(parents=True, exist_ok=True)
    failures: list[tuple[str, str]] = []

    try:
        with sqlite3.connect(db_path) as conn:
            for csv_path in csv_files:
                name = csv_path.name
                table = csv_path.stem
                try:
                    n = load_one_table(conn, csv_path)
                    print(f"Success: loaded {name} -> table {table!r} ({n} rows)")
                except UnicodeDecodeError as e:
                    msg = f"UTF-8 decode error: {e}"
                    logger.error("Failed %s: %s", name, msg)
                    failures.append((name, msg))
                except pd.errors.EmptyDataError:
                    msg = "CSV is empty"
                    logger.error("Failed %s: %s", name, msg)
                    failures.append((name, msg))
                except Exception as e:
                    msg = str(e)
                    logger.error("Failed %s: %s", name, msg)
                    failures.append((name, msg))

            conn.commit()
    except sqlite3.Error as e:
        logger.error("SQLite error: %s", e)
        return 1

    if failures:
        print("\nCompleted with errors:")
        for name, err in failures:
            print(f"  - {name}: {err}")
        return 1

    print(f"\nDatabase ready: {db_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
