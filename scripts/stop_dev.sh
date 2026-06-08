#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${API_PORT:-8010}"
WEB_PORT="${WEB_PORT:-5173}"
PID_DIR="$ROOT_DIR/.pids"

stop_pid_file() {
  local name="$1"
  local file="$PID_DIR/$name.pid"
  if [ -f "$file" ]; then
    local pid
    pid="$(cat "$file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $name pid $pid"
      kill "$pid" || true
    fi
    rm -f "$file"
  fi
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" || true)"
  if [ -n "$pids" ]; then
    echo "Stopping processes on port $port: $pids"
    kill $pids || true
  fi
}

stop_pid_file api
stop_pid_file web
stop_port "$API_PORT"
stop_port "$WEB_PORT"

echo "Stopped AIMediaAgent dev services."

