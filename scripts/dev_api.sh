#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR/apps/api"
export PYTHONPATH="$ROOT_DIR:$PWD"
uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
