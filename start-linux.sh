#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node scripts/check-node.mjs
[ -f server/.env ] || cp server/.env.example server/.env
[ -d server/node_modules ] || npm install --prefix server
[ -d client/node_modules ] || npm install --prefix client
npm run dev
