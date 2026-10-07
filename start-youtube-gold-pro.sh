#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install --silent
fi

echo "Iniciando YouTube Gold Pro..."
node src/server.js &
SERVER_PID=$!

sleep 3

if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif command -v open > /dev/null; then
  open http://localhost:3000
fi

wait $SERVER_PID
