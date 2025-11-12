#!/bin/sh
set -eu

# Where we expect persistence
DATA_DIR="/app/data"

# Effective DB path the app will use
DB_PATH="${DATABASE_PATH:-/app/data/playlists.db}"

# Normalise: BusyBox readlink supports -f on Alpine
# If readlink -f fails, fall back to the raw path
if REAL_DB_PATH=$(readlink -f -- "$DB_PATH" 2>/dev/null); then
  DB_PATH="$REAL_DB_PATH"
fi

DB_DIR=$(dirname -- "$DB_PATH")

echo "Startup: DATA_DIR=$DATA_DIR"
echo "Startup: DATABASE_PATH=$DB_PATH"

# 1) /app/data must be a mount
if command -v mountpoint >/dev/null 2>&1; then
  mountpoint -q "$DATA_DIR" || {
    echo "Fatal: $DATA_DIR is not a mounted volume." >&2
    exit 1
  }
else
  awk '{print $5}' /proc/self/mountinfo | grep -xq "$DATA_DIR" || {
    echo "Fatal: $DATA_DIR is not a mounted volume (no mountpoint tool)." >&2
    exit 1
  }
fi

# 2) DB must live under /app/data
case "$DB_PATH" in
  /app/data/*) ;;
  *)
    echo "Fatal: DATABASE_PATH ($DB_PATH) is not under $DATA_DIR." >&2
    echo "Set DATABASE_PATH to something like /app/data/playlists.db" >&2
    exit 1
    ;;
esac

# 3) The DB directory itself must be on a mount (handles nested subdirs)
if command -v mountpoint >/dev/null 2>&1; then
  mountpoint -q "$DB_DIR" || {
    echo "Fatal: DB directory ($DB_DIR) is not a mount-backed path." >&2
    exit 1
  }
else
  awk '{print $5}' /proc/self/mountinfo | grep -xq "$DB_DIR" || {
    echo "Fatal: DB directory ($DB_DIR) is not a mount-backed path." >&2
    exit 1
  }
fi

mkdir -p "$DB_DIR"
exec "$@"
