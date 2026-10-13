#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
[ -f server/.env ] || cp server/.env.example server/.env
[ -d node_modules ] || npm install
[ -d server/node_modules ] || npm install --prefix server
[ -d client/node_modules ] || npm install --prefix client
npm run dev
