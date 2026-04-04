# GigEase SQLite setup

## Prerequisites

- Python 3.10 or newer
- CSV files `T001_enriched.csv` … `T008_enriched.csv` in the **repository root** (sibling of the `database/` folder)

## Install

From the **repository root** (`GIGEASE-GUIDEWIRE-DATASET`):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r database/requirements.txt
```

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r database/requirements.txt
```

## Build the database

```bash
python database/setup_db.py
```

This creates **`gigease.db`** in the repository root (next to the CSV files).

### Options

```bash
# Custom database path
python database/setup_db.py --db ./data/my_gigease.db

# CSV files in another folder
python database/setup_db.py --csv-dir ./path/to/csvs

# List files that would load (no DB write)
python database/setup_db.py --dry-run
```

## Verify

```bash
sqlite3 gigease.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

See `example_queries.sql` for more checks.
