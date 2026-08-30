#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DB_FILE="$APP_DIR/antipig.db"
BACKUP_DIR="$APP_DIR/backups"
BACKUP_FILE="$BACKUP_DIR/$(date +%Y-%m-%d_%H%M%S).db"

if [[ ! -f "$DB_FILE" ]]; then
    echo "データベースが見つかりません: $DB_FILE" >&2
    exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "sqlite3コマンドがインストールされていません" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
chmod 600 "$BACKUP_FILE"

echo "バックアップを作成しました: $BACKUP_FILE"
