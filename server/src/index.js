import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { z } from 'zod';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 90 }));
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const state = { status: 'idle', url: '', channelId: '', startedAt: null, message: '' };
const safeState = () => ({ ...state, botOnline: client.isReady(), botName: client.user?.username || null, capability: 'control-only' });
const auth = (req, res, next) => {
  const key = process.env.DASHBOARD_API_KEY;
  if (!key || key === 'change-this-long-random-key') return res.status(503).json({ error: 'Configure DASHBOARD_API_KEY on server' });
  if (req.get('x-api-key') !== key) return res.status(401).json({ error: 'Unauthorized' });
  next();
};
app.get('/api/health', (_, res) => res.json({ ok: true, botOnline: client.isReady() }));
app.use('/api', auth);
app.get('/api/status', (_, res) => res.json(safeState()));
app.get('/api/channels', async (_, res) => {
  try {
    if (!client.isReady()) return res.json([]);
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const channels = await guild.channels.fetch();
    res.json([...channels.values()].filter(c => c && [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type)).map(c => ({ id: c.id, name: c.name, type: c.type })));
  } catch (e) { res.status(500).json({ error: 'Unable to fetch channels' }); }
});
const requestSchema = z.object({ url: z.string().url().max(2048).refine(v => ['http:', 'https:'].includes(new URL(v).protocol)), channelId: z.string().regex(/^\d{17,22}$/) });
app.post('/api/stream/start', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid URL or channel ID' });
  if (!client.isReady()) return res.status(503).json({ error: 'Discord bot is offline' });
  // Official Discord bot APIs do not expose Go Live/screen-share video streaming.
  // Never claim to have started a stream. This is a control-panel request preview.
  state.status = 'unsupported'; state.url = parsed.data.url; state.channelId = parsed.data.channelId;
  state.message = 'Discord official bot API does not support video screen sharing / Go Live.';
  res.status(501).json({ error: state.message, state: safeState() });
});
app.post('/api/stream/stop', (_, res) => { Object.assign(state, { status: 'idle', url: '', channelId: '', startedAt: null, message: '' }); res.json(safeState()); });
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Hcinco API listening on ${port}`));
if (process.env.DISCORD_BOT_TOKEN) client.login(process.env.DISCORD_BOT_TOKEN).catch(e => console.error('Discord login failed:', e.message));
else console.warn('DISCORD_BOT_TOKEN is missing; dashboard demo mode.');
