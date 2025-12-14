#!/usr/bin/env bash
set -e

echo "Starting Aurora OSI API..."

exec uvicorn main:app \
  --host 0.0.0.0 \
  --port ${PORT:-10000}
