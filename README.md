# Hcinco Discord Stream Control Dashboard

A bilingual (English default / Persian RTL) React + Node.js Discord bot administration dashboard.

## Important Discord limitation
**Discord's official bot API does not support Go Live / screen-sharing video in voice channels.** This project intentionally does **not** claim to stream videos. The Start button submits a validated request and receives HTTP 501 with an honest explanation. No self-bot, user token, or unofficial Discord client is included. If you need actual screen sharing, use the Discord desktop client manually or investigate an authorized alternative integration.

## Requirements
- Node.js 20.19+ (recommended Node.js 22)
- npm
- Discord bot application token (from Discord Developer Portal)
- Discord server (guild) ID

## Installation
```bash
npm install
npm run install:all
cp server/.env.example server/.env
```
On Windows PowerShell use `Copy-Item server/.env.example server/.env`.

Edit `server/.env`:
```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN
DISCORD_GUILD_ID=YOUR_GUILD_ID
DASHBOARD_API_KEY=YOUR_LONG_RANDOM_SECRET
```
Never expose your bot token in React code or commit `.env`.

## Discord setup
1. Create an application at https://discord.com/developers/applications.
2. Add a bot and copy its bot token to `DISCORD_BOT_TOKEN`.
3. Invite the bot to your server using OAuth2 URL Generator with `bot` scope and minimal permissions, e.g. View Channels.
4. Enable Developer Mode in Discord and copy the server ID to `DISCORD_GUILD_ID`.
5. Start the dashboard. Open Settings and enter the `DASHBOARD_API_KEY` you set on the server. The key is stored in browser sessionStorage only.

## Run in development
```bash
npm run dev
```
Dashboard: http://localhost:5173
API health: http://localhost:4000/api/health

## Build
```bash
npm run build
```
Static production files appear in `client/dist`. Host them using a static web server and proxy `/api` to the Node API on port 4000. Set `CLIENT_ORIGIN` to the production dashboard origin, serve via HTTPS, and restrict API access.

## Commands
| Command | Description |
| --- | --- |
| `npm install` | Install root dev tooling |
| `npm run install:all` | Install server and client dependencies |
| `npm run dev` | Run API and React dev server |
| `npm run build` | Build production frontend |
| `npm start` | Start backend |
| `npm run dev --prefix server` | Backend hot reload |
| `npm run dev --prefix client` | Frontend only |

## API
All endpoints except `/api/health` require `x-api-key` matching `DASHBOARD_API_KEY`.
- `GET /api/health` — health and bot connectivity
- `GET /api/status` — bot and request status
- `GET /api/channels` — voice/stage channels in configured guild
- `POST /api/stream/start` — validates `{ "url": "https://...", "channelId": "..." }`, returns `501 Not Implemented` because Discord Go Live is not available through the official bot API
- `POST /api/stream/stop` — clears the request state (does not end a real stream)

## Security and production notes
- Use HTTPS, a long random API key, firewall rules and a reverse proxy.
- API key in sessionStorage is suitable for a local/admin demo, not multi-user production authentication. For public deployments replace with a proper authenticated backend session and authorization.
- URL validation is syntactic; the backend never fetches user-supplied URLs (avoids SSRF in this version).
- State is in memory and resets on restart.
- Do not use Discord user tokens or self-bot automation.

**Created by Hcinco**
