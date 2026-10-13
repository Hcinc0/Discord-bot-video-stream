# Hcinco Discord Voice Dashboard v2

Professional bilingual (English default / Persian RTL) dashboard built with **React + Vite + Node.js + Express + discord.js**.

## What changed in v2
- Set/change the **Discord Bot Token from the website Settings page** — no bot token is required in `.env`.
- Bot token is stored by the backend using **AES-256-GCM encryption** and is never returned to the browser.
- **Run Bot / Stop Bot** controls from the dashboard.
- Optional **Auto-start** after the backend restarts.
- See every Discord **server (guild)** the bot is in.
- Select a server, then load its **Voice Channels**.
- Select a Voice Channel and play the **audio track** of a supported media URL in Discord voice.
- YouTube / SoundCloud support through `play-dl`, plus direct HTTP/HTTPS media streams.
- Direct URL protection rejects localhost/private network targets and validates redirects.
- Optional Application/Client ID field generates an **Invite Bot** button with View Channels + Connect + Speak permissions.
- English/Persian interface; English is the default language.
- Created by **Hcinco**.

## Important Discord limitation
Discord's official bot API does **not** provide Go Live / video screen sharing for bot accounts. This project therefore joins a Discord voice channel and sends the **audio** from the supplied video/media URL.

The project intentionally does not use Discord user tokens, self-bots, or unofficial user-client screen sharing. Those methods can violate Discord rules and are not included.

## Requirements
- Node.js 22.12+
- npm
- A Discord Application with a Bot created in Discord Developer Portal

## Install
From the project root:

```bash
npm install
npm run install:all
```

Copy the environment example:

### Windows PowerShell
```powershell
Copy-Item server/.env.example server/.env
```

### Linux / macOS
```bash
cp server/.env.example server/.env
```

`server/.env` only contains dashboard/server options:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DASHBOARD_API_KEY=
```

`DASHBOARD_API_KEY` is optional for local development. If you expose the dashboard on a network/server, set it to a long random secret and enter the same key on the website under Settings → Dashboard API Security.

## Run
```bash
npm run dev
```

Open:

- Dashboard: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`

## First setup inside the website
1. Open **Settings**.
2. Paste your **Discord Bot Token**.
3. Optional: paste the **Application / Client ID** to enable the Invite Bot button.
4. Optional: enable **Automatically run the bot when the backend starts**.
5. Click **Save settings**.
6. Click **Run Bot** on the Dashboard.
7. If the bot is not yet inside your server, use **Invite Bot to Server** or invite it from Discord Developer Portal.
8. Open **Voice Player**.
9. Select a Discord server.
10. Select a Voice Channel.
11. Paste the video/media URL.
12. Choose volume and click **Play in Voice**.

## Required Discord permissions
The bot needs at least:
- View Channels
- Connect
- Speak

Stage channels may require additional Discord-side speaker handling; normal Voice Channels are recommended.

## Supported media
The player is designed for:
- YouTube video links (audio track)
- SoundCloud track links
- Direct HTTP/HTTPS audio/video file or stream links

Media providers can change their delivery methods, so third-party URL playback may occasionally need a dependency update.

## Security
- Bot token is not stored in React/localStorage/sessionStorage.
- Bot token is encrypted server-side using AES-256-GCM.
- A random local encryption key is created at `server/data/.secret-key` on first use.
- Encrypted settings are stored at `server/data/settings.json`.
- Both files are ignored by Git.
- API responses only expose whether a token exists, never the token itself.
- Direct media URL fetching blocks private/local IP ranges to reduce SSRF risk.
- For public deployment, use HTTPS, a reverse proxy, firewall restrictions, and set `DASHBOARD_API_KEY`.

> The local encryption key and encrypted settings are on the same server. Encryption mainly protects against accidental token disclosure in configs/backups; OS-level access to both files still requires normal server security.

## Commands
| Command | Description |
| --- | --- |
| `npm install` | Install root tooling |
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run dev` | Start Node API + React development server |
| `npm run build` | Build the React production bundle |
| `npm start` | Start the Node backend |
| `npm run dev --prefix server` | Start backend in watch mode |
| `npm run dev --prefix client` | Start React/Vite only |

## Main API routes
- `GET /api/health` — backend/bot/token/security health
- `GET /api/status` — bot + playback state
- `GET /api/config` — safe configuration metadata
- `PUT /api/config` — save encrypted token, Application ID, auto-start
- `POST /api/bot/start` — log the bot into Discord
- `POST /api/bot/stop` — stop playback, disconnect voice, log out bot
- `GET /api/guilds` — list all servers the online bot is in
- `GET /api/guilds/:guildId/channels` — list voice/stage channels + permissions
- `POST /api/playback/start` — join selected voice and start audio playback
- `POST /api/playback/stop` — stop playback and leave voice

## Production frontend
```bash
npm run build
```

The frontend output is created in `client/dist`.

For deployment, serve `client/dist` with Nginx/Caddy/another web server and proxy `/api` to the Node backend on port `4000`.

**Created by Hcinco**
