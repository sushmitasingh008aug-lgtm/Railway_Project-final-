#!/usr/bin/env bash
# ==============================================================================
# Permanent Static Domain Launcher (Ngrok) for Automatic Block Planning System
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -E '^(NGROK_AUTHTOKEN|NGROK_DOMAIN|PORT)=' "$ENV_FILE" | xargs 2>/dev/null)
fi

DOMAIN="${NGROK_DOMAIN:-silent-disgrace-chunk.ngrok-free.dev}"
PORT="${PORT:-3000}"
BIN="$HOME/.local/bin/ngrok"

if [ ! -f "$BIN" ]; then
    BIN="$(which ngrok 2>/dev/null || true)"
fi

if [ -z "$BIN" ]; then
    echo "Error: ngrok binary not found in ~/.local/bin or system PATH."
    exit 1
fi

if [ -n "$NGROK_AUTHTOKEN" ]; then
    "$BIN" config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null 2>&1 || true
fi

echo "🚀 Starting Ngrok Permanent Static Tunnel on https://$DOMAIN -> http://localhost:$PORT"
exec "$BIN" http --url="$DOMAIN" "$PORT"
