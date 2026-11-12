#!/bin/zsh
set -e

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Applying local D1 migrations..."
npx wrangler d1 migrations apply after-hours-crafts --local

echo "Starting After Hours Crafts at http://localhost:8788"
exec npm run dev
