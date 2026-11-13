#!/bin/zsh
set -e

cd "$(dirname "$0")"

echo "Applying pending migrations to the LIVE After Hours Crafts database."
echo "Wrangler will show the migrations and ask you to confirm."
npm run migrate:production
