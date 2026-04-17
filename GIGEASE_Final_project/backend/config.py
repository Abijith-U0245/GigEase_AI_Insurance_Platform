"""Runtime config from environment."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

GIGEASE_DB_PATH = os.getenv("GIGEASE_DB_PATH", "../database/gigease.db")
