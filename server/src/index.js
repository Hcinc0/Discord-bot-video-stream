import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice';
import play from 'play-dl';
import { z } from 'zod';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const settingsFile = path.join(dataDir, 'settings.json');
const keyFile = path.join(dataDir, '.secret-key');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 160, standardHeaders: true, legacyHeaders: false }));

const runtime = {
  client: null,
  starting: false,
  connection: null,
  player: null,
  directStream: null,
  playback: {
    status: 'idle',
    url: '',
    guildId: '',
    channelId: '',
    startedAt: null,
    message: '',
  },
  botError: '',
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function loadSettings() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(settingsFile, 'utf8');
    return { botToken: null, applicationId: '', autoStart: false, ...JSON.parse(raw) };
  } catch (error) {
    if (error.code === 'ENOENT') return { botToken: null, applicationId: '', autoStart: false };
    throw error;
  }
}

async function saveSettings(settings) {
  await ensureDataDir();
  await fs.writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
}

async function getEncryptionKey() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(keyFile, 'utf8');
    return Buffer.from(raw.trim(), 'base64');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const key = crypto.randomBytes(32);
    await fs.writeFile(keyFile, key.toString('base64'), { mode: 0o600 });
    return key;
  }
}

async function encryptToken(token) {
  const key = await getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return {
    cipherText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

async function decryptToken(payload) {
  if (!payload?.cipherText || !payload?.iv || !payload?.tag) return null;
  const key = await getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

function auth(req, res, next) {
  const key = (process.env.DASHBOARD_API_KEY || '').trim();
  if (!key) return next();
  if (req.get('x-api-key') !== key) return res.status(401).json({ error: 'Dashboard API key is invalid.' });
  next();
}

function isBotOnline() {
  return Boolean(runtime.client?.isReady());
}

function publicState() {
  return {
    botOnline: isBotOnline(),
    botStarting: runtime.starting,
    botName: runtime.client?.user?.username || null,
    botId: runtime.client?.user?.id || null,
    botAvatar: runtime.client?.user?.displayAvatarURL?.({ size: 128 }) || null,
    guildCount: runtime.client?.guilds?.cache?.size || 0,
    botError: runtime.botError,
    playback: { ...runtime.playback },
    capability: 'voice-audio',
  };
}

async function stopPlayback({ leave = true } = {}) {
  if (runtime.player) {
    try { runtime.player.stop(true); } catch {}
  }
  if (runtime.directStream) {
    try { runtime.directStream.destroy(); } catch {}
    runtime.directStream = null;
  }
  if (leave && runtime.connection) {
    try { runtime.connection.destroy(); } catch {}
    runtime.connection = null;
  }
  runtime.player = null;
  runtime.playback = { status: 'idle', url: '', guildId: '', channelId: '', startedAt: null, message: '' };
}

function buildClient() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  client.on('error', (error) => {
    runtime.botError = error?.message || 'Discord client error';
    console.error('[Discord]', runtime.botError);
  });
  client.on('shardError', (error) => {
    runtime.botError = error?.message || 'Discord gateway error';
    console.error('[Discord gateway]', runtime.botError);
  });
  return client;
}

async function startBot() {
  if (isBotOnline()) return publicState();
  if (runtime.starting) throw new Error('Bot is already starting.');

  const settings = await loadSettings();
  const token = await decryptToken(settings.botToken);
  if (!token) throw new Error('No bot token saved. Open Settings and save a bot token first.');

  runtime.starting = true;
  runtime.botError = '';
  const client = buildClient();
  runtime.client = client;

  try {
    await client.login(token);
    if (!client.isReady()) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Discord did not become ready in time.')), 20_000);
        client.once('ready', () => { clearTimeout(timer); resolve(); });
      });
    }
    if (!client.isReady()) throw new Error('Discord did not become ready in time.');
    return publicState();
  } catch (error) {
    try { client.destroy(); } catch {}
    runtime.client = null;
    runtime.botError = error?.message?.includes('TOKEN_INVALID') ? 'Invalid Discord bot token.' : (error?.message || 'Unable to start bot.');
    throw new Error(runtime.botError);
  } finally {
    runtime.starting = false;
  }
}

async function stopBot() {
  await stopPlayback({ leave: true });
  if (runtime.client) {
    try { runtime.client.destroy(); } catch {}
  }
  runtime.client = null;
  runtime.starting = false;
  runtime.botError = '';
  return publicState();
}

function isPrivateIp(address) {
  if (address === '::1' || address === '0.0.0.0' || address === '::') return true;
  if (address.startsWith('10.') || address.startsWith('127.') || address.startsWith('169.254.') || address.startsWith('192.168.')) return true;
  const parts = address.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  const a = address.toLowerCase();
  return a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80:');
}

async function assertSafeMediaUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP/HTTPS media URLs are allowed.');
  if (['localhost', 'localhost.localdomain'].includes(url.hostname.toLowerCase())) throw new Error('Local network URLs are not allowed.');
  if (/(^|\.)youtube\.com$/i.test(url.hostname) || /(^|\.)youtu\.be$/i.test(url.hostname) || /(^|\.)soundcloud\.com$/i.test(url.hostname)) return url;
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Private/local network media URLs are not allowed.');
  return url;
}

async function fetchSafeStream(initialUrl, redirectsLeft = 4) {
  const safeUrl = await assertSafeMediaUrl(initialUrl);
  const response = await fetch(safeUrl, {
    redirect: 'manual',
    headers: { 'user-agent': 'Hcinco-Discord-Voice-Dashboard/2.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirectsLeft <= 0) throw new Error('Too many media redirects.');
    const location = response.headers.get('location');
    if (!location) throw new Error('Invalid media redirect.');
    return fetchSafeStream(new URL(location, safeUrl).toString(), redirectsLeft - 1);
  }
  if (!response.ok || !response.body) throw new Error(`Media server returned HTTP ${response.status}.`);
  return Readable.fromWeb(response.body);
}

async function createMediaResource(url) {
  const type = await play.validate(url);
  if (type === 'yt_video' || type === 'so_track') {
    const source = await play.stream(url, { discordPlayerCompatibility: true });
    return { resource: createAudioResource(source.stream, { inputType: source.type, inlineVolume: true }), stream: source.stream };
  }
  const stream = await fetchSafeStream(url);
  return { resource: createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true }), stream };
}

app.get('/api/health', async (_req, res) => {
  const settings = await loadSettings();
  res.json({ ok: true, botOnline: isBotOnline(), tokenConfigured: Boolean(settings.botToken), apiKeyRequired: Boolean((process.env.DASHBOARD_API_KEY || '').trim()) });
});

app.use('/api', auth);

app.get('/api/status', (_req, res) => res.json(publicState()));

app.get('/api/config', async (_req, res) => {
  const settings = await loadSettings();
  res.json({
    hasToken: Boolean(settings.botToken),
    applicationId: settings.applicationId || '',
    autoStart: Boolean(settings.autoStart),
    apiKeyRequired: Boolean((process.env.DASHBOARD_API_KEY || '').trim()),
  });
});

const configSchema = z.object({
  botToken: z.string().trim().min(20).max(300).optional(),
  applicationId: z.string().trim().regex(/^\d{17,22}$/).or(z.literal('')).optional(),
  autoStart: z.boolean().optional(),
  clearToken: z.boolean().optional(),
});

app.put('/api/config', async (req, res) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid settings payload.' });

  const current = await loadSettings();
  if ((parsed.data.botToken || parsed.data.clearToken) && isBotOnline()) await stopBot();
  if (parsed.data.botToken) current.botToken = await encryptToken(parsed.data.botToken);
  if (parsed.data.clearToken) current.botToken = null;
  if (typeof parsed.data.applicationId === 'string') current.applicationId = parsed.data.applicationId;
  if (typeof parsed.data.autoStart === 'boolean') current.autoStart = parsed.data.autoStart;
  await saveSettings(current);

  res.json({ hasToken: Boolean(current.botToken), applicationId: current.applicationId || '', autoStart: Boolean(current.autoStart) });
});

app.post('/api/bot/start', async (_req, res) => {
  try { res.json(await startBot()); }
  catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/bot/stop', async (_req, res) => {
  res.json(await stopBot());
});

app.get('/api/guilds', async (_req, res) => {
  if (!isBotOnline()) return res.status(503).json({ error: 'Bot is offline.' });
  const guilds = [...runtime.client.guilds.cache.values()]
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 128 }) || null,
      memberCount: guild.memberCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json(guilds);
});

app.get('/api/guilds/:guildId/channels', async (req, res) => {
  if (!isBotOnline()) return res.status(503).json({ error: 'Bot is offline.' });
  if (!/^\d{17,22}$/.test(req.params.guildId)) return res.status(400).json({ error: 'Invalid guild ID.' });
  const guild = runtime.client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Guild not found.' });
  try {
    const channels = await guild.channels.fetch();
    const me = guild.members.me;
    const voice = [...channels.values()]
      .filter((channel) => channel && [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type))
      .map((channel) => {
        const permissions = me ? channel.permissionsFor(me) : null;
        return {
          id: channel.id,
          name: channel.name,
          type: channel.type === ChannelType.GuildStageVoice ? 'stage' : 'voice',
          canConnect: permissions ? permissions.has(PermissionsBitField.Flags.Connect) : false,
          canSpeak: permissions ? permissions.has(PermissionsBitField.Flags.Speak) : false,
          members: channel.members?.size || 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(voice);
  } catch {
    res.status(500).json({ error: 'Unable to load voice channels.' });
  }
});

const playbackSchema = z.object({
  url: z.string().url().max(2048),
  guildId: z.string().regex(/^\d{17,22}$/),
  channelId: z.string().regex(/^\d{17,22}$/),
  volume: z.number().min(0.05).max(2).default(1),
});

app.post('/api/playback/start', async (req, res) => {
  const parsed = playbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid media URL, guild, channel, or volume.' });
  if (!isBotOnline()) return res.status(503).json({ error: 'Bot is offline. Start the bot first.' });

  const { url, guildId, channelId, volume } = parsed.data;
  try {
    await assertSafeMediaUrl(url);
    const guild = runtime.client.guilds.cache.get(guildId);
    if (!guild) throw new Error('Selected server is not available to this bot.');
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isVoiceBased()) throw new Error('Selected channel is not a voice channel.');
    if (channel.guildId !== guildId) throw new Error('Voice channel does not belong to the selected server.');

    const me = guild.members.me;
    const permissions = me ? channel.permissionsFor(me) : null;
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) throw new Error('Bot does not have Connect permission in this voice channel.');
    if (channel.type !== ChannelType.GuildStageVoice && !permissions?.has(PermissionsBitField.Flags.Speak)) throw new Error('Bot does not have Speak permission in this voice channel.');

    await stopPlayback({ leave: true });
    runtime.playback = { status: 'loading', url, guildId, channelId, startedAt: null, message: 'Preparing media…' };

    const connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });
    runtime.connection = connection;
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    runtime.player = player;
    connection.subscribe(player);

    const { resource, stream } = await createMediaResource(url);
    runtime.directStream = stream;
    if (resource.volume) resource.volume.setVolume(volume);

    player.on('error', (error) => {
      console.error('[Audio player]', error.message);
      runtime.playback.status = 'error';
      runtime.playback.message = error.message || 'Audio playback failed.';
    });
    player.on(AudioPlayerStatus.Playing, () => {
      runtime.playback.status = 'playing';
      runtime.playback.startedAt = new Date().toISOString();
      runtime.playback.message = 'Audio is playing in the selected Discord voice channel.';
    });
    player.on(AudioPlayerStatus.Paused, () => {
      runtime.playback.status = 'paused';
      runtime.playback.message = 'Playback is paused because there is no voice subscriber.';
    });
    player.on(AudioPlayerStatus.Idle, () => {
      if (runtime.playback.status !== 'idle') {
        runtime.playback.status = 'finished';
        runtime.playback.message = 'Playback finished.';
      }
    });

    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 20_000);
    res.json(publicState());
  } catch (error) {
    const message = error?.message || 'Unable to start playback.';
    await stopPlayback({ leave: true });
    runtime.playback = { status: 'error', url, guildId, channelId, startedAt: null, message };
    res.status(400).json({ error: message, state: publicState() });
  }
});

app.post('/api/playback/stop', async (_req, res) => {
  await stopPlayback({ leave: true });
  res.json(publicState());
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

process.on('unhandledRejection', (error) => console.error('[Unhandled rejection]', error));
process.on('uncaughtException', (error) => console.error('[Uncaught exception]', error));

app.listen(port, host, async () => {
  console.log(`Hcinco Control API listening on http://127.0.0.1:${port}`);
  console.log(`Node.js ${process.version} | PID ${process.pid}`);
  try {
    const settings = await loadSettings();
    if (settings.autoStart && settings.botToken) {
      console.log('Auto-starting Discord bot…');
      await startBot();
      console.log(`Discord bot online as ${runtime.client?.user?.tag || runtime.client?.user?.username}`);
    }
  } catch (error) {
    console.error('Auto-start failed:', error.message);
  }
});
