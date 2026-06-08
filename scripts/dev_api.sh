#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../apps/api"
export PYTHONPATH="$PWD"
uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload

