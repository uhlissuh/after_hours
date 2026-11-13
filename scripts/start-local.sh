#!/bin/zsh
set -e

cd "$(dirname "$0")/.."

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Applying local D1 migrations..."
CI=true npm run migrate:local

echo "Starting After Hours Crafts at http://localhost:8788"
exec npm run dev
