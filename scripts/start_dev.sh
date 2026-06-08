#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${API_PORT:-8010}"
WEB_PORT="${WEB_PORT:-5173}"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

if [ -f /opt/anaconda3/etc/profile.d/conda.sh ]; then
  # shellcheck disable=SC1091
  source /opt/anaconda3/etc/profile.d/conda.sh
  conda activate "${CONDA_ENV:-AIMedia}"
fi

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" || true)"
  if [ -n "$pids" ]; then
    echo "Stopping existing process on port $port: $pids"
    kill $pids || true
  fi
  for _ in {1..20}; do
    if ! lsof -ti tcp:"$port" >/dev/null 2>&1; then
      return
    fi
    sleep 0.2
  done
}

stop_port "$API_PORT"
stop_port "$WEB_PORT"

echo "Starting API on http://127.0.0.1:$API_PORT"
(
  cd "$ROOT_DIR/apps/api"
  export PYTHONPATH="$ROOT_DIR:$PWD"
  nohup python -m uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT" \
    > "$LOG_DIR/api.log" 2>&1 < /dev/null &
  echo $! > "$PID_DIR/api.pid"
)

echo "Starting H5 on http://127.0.0.1:$WEB_PORT"
(
  cd "$ROOT_DIR/apps/web"
  if [ ! -d node_modules ]; then
    npm install
  fi
  nohup npm run dev -- --host 127.0.0.1 --port "$WEB_PORT" \
    > "$LOG_DIR/web.log" 2>&1 < /dev/null &
  echo $! > "$PID_DIR/web.pid"
)

sleep 5

echo
echo "Service status:"
if curl -s "http://127.0.0.1:$API_PORT/health" >/dev/null; then
  echo "API: OK http://127.0.0.1:$API_PORT"
else
  echo "API: FAILED, see $LOG_DIR/api.log"
fi

if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$WEB_PORT" | grep -q "200"; then
  echo "H5 : OK http://127.0.0.1:$WEB_PORT"
else
  echo "H5 : FAILED, see $LOG_DIR/web.log"
fi

echo
echo "Logs:"
echo "API: $LOG_DIR/api.log"
echo "H5 : $LOG_DIR/web.log"
