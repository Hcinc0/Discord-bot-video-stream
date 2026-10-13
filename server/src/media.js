import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.resolve(__dirname, '../bin');
const MAX_STDERR = 8_000;
const DIRECT_MEDIA_RE = /\.(?:mp3|m4a|aac|ogg|opus|wav|flac|mp4|m4v|webm|mov|mkv)(?:$|[?#])/i;

function trimError(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > MAX_STDERR ? text.slice(-MAX_STDERR) : text;
}

function isPrivateIp(address) {
  if (!address) return true;
  if (address === '::1' || address === '0.0.0.0' || address === '::') return true;
  if (address.startsWith('10.') || address.startsWith('127.') || address.startsWith('169.254.') || address.startsWith('192.168.')) return true;
  const parts = address.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  const a = address.toLowerCase();
  return a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80:');
}

export async function assertSafeMediaUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Media URL is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP/HTTPS media URLs are allowed.');
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host === 'localhost.localdomain') throw new Error('Local network URLs are not allowed.');

  // Popular media sites are public and may resolve through CDNs that change frequently.
  const known = ['youtube.com', 'youtu.be', 'soundcloud.com', 'instagram.com', 'tiktok.com', 'twitch.tv', 'vimeo.com'];
  if (known.some((domain) => host === domain || host.endsWith(`.${domain}`))) return url;

  const addresses = await dns.lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('Private/local network media URLs are not allowed.');
  }
  return url;
}

async function exists(file) {
  try { await fs.access(file, fsSync.constants.X_OK); return true; } catch { return false; }
}

function platformBinary() {
  if (process.platform === 'win32') return { name: 'yt-dlp.exe', asset: 'yt-dlp.exe' };
  if (process.platform === 'darwin') return { name: 'yt-dlp_macos', asset: 'yt-dlp_macos' };
  return { name: 'yt-dlp', asset: 'yt-dlp' };
}

function systemYtDlp() {
  const command = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  try {
    const result = spawnSync(command, ['--version'], { windowsHide: true, encoding: 'utf8', timeout: 4_000 });
    return result.status === 0 ? command : null;
  } catch { return null; }
}

async function downloadFile(url, target) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Hcinco-Discord-Voice-Dashboard/2.2' },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok || !response.body) throw new Error(`yt-dlp download failed with HTTP ${response.status}.`);

  const tmp = `${target}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  const handle = await fs.open(tmp, 'w');
  try {
    const nodeStream = Readable.fromWeb(response.body);
    for await (const chunk of nodeStream) await handle.write(chunk);
  } finally {
    await handle.close();
  }
  if (process.platform !== 'win32') await fs.chmod(tmp, 0o755);
  await fs.rename(tmp, target);
}

let ytDlpPromise = null;
export async function ensureYtDlp() {
  if (process.env.YT_DLP_PATH) {
    if (!await exists(process.env.YT_DLP_PATH)) throw new Error(`YT_DLP_PATH does not point to an executable file: ${process.env.YT_DLP_PATH}`);
    return process.env.YT_DLP_PATH;
  }

  const { name, asset } = platformBinary();
  const local = path.join(binDir, name);
  if (await exists(local)) return local;
  const system = systemYtDlp();
  if (system) return system;

  if (!ytDlpPromise) {
    ytDlpPromise = (async () => {
      console.log('[Media] yt-dlp was not found. Downloading official binary…');
      const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`;
      try {
        await downloadFile(downloadUrl, local);
        console.log(`[Media] yt-dlp installed at ${local}`);
        return local;
      } catch (error) {
        try { await fs.rm(local, { force: true }); } catch {}
        throw new Error(`Unable to install yt-dlp automatically. ${error.message}`);
      }
    })().finally(() => { ytDlpPromise = null; });
  }
  return ytDlpPromise;
}

function runCapture(command, args, { timeout = 45_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;
    const timer = setTimeout(() => {
      killedByTimeout = true;
      try { child.kill('SIGKILL'); } catch {}
    }, timeout);
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr = trimError(stderr + chunk.toString()); });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (killedByTimeout) return reject(new Error('Media resolver timed out.'));
      if (code !== 0) return reject(new Error(trimError(stderr) || `Media resolver exited with code ${code}.`));
      resolve({ stdout, stderr });
    });
  });
}

function friendlyYtDlpError(message) {
  const text = trimError(message);
  if (/Unsupported URL/i.test(text)) return 'This website/link is not supported by the media resolver. Try YouTube, SoundCloud, or a direct media URL.';
  if (/Sign in|login|cookies|age.restricted/i.test(text)) return 'This media needs login/cookies or is age restricted. Use a public media link.';
  if (/Private video|private track|not available/i.test(text)) return 'This media is private or unavailable.';
  if (/HTTP Error 403|Forbidden/i.test(text)) return 'The media host refused access (HTTP 403). Try another public link.';
  if (/Unable to extract|extractor/i.test(text)) return `Could not extract this media. Update yt-dlp and try again. ${text.split('\n').slice(-1)[0] || ''}`.trim();
  return text || 'Unable to resolve media URL.';
}

export async function probeMedia(url) {
  const safeUrl = await assertSafeMediaUrl(url);
  if (DIRECT_MEDIA_RE.test(safeUrl.pathname + safeUrl.search)) {
    return { title: path.basename(safeUrl.pathname) || 'Direct media', duration: null, webpageUrl: safeUrl.toString(), extractor: 'direct' };
  }

  const ytDlp = await ensureYtDlp();
  try {
    const { stdout } = await runCapture(ytDlp, [
      '--dump-single-json', '--skip-download', '--playlist-items', '1', '--no-warnings', '--socket-timeout', '15', '--', safeUrl.toString(),
    ], { timeout: 60_000 });
    const info = JSON.parse(stdout);
    const entry = Array.isArray(info.entries) && info.entries.length ? info.entries[0] : info;
    const playlistTitle = entry !== info && info.title ? String(info.title) : '';
    const itemTitle = String(entry?.title || entry?.fulltitle || info.title || info.fulltitle || 'Media');
    return {
      title: (playlistTitle && playlistTitle !== itemTitle ? `${playlistTitle} — ${itemTitle}` : itemTitle).slice(0, 300),
      duration: Number.isFinite(entry?.duration) ? entry.duration : (Number.isFinite(info.duration) ? info.duration : null),
      webpageUrl: entry?.webpage_url || info.webpage_url || safeUrl.toString(),
      extractor: entry?.extractor_key || entry?.extractor || info.extractor_key || info.extractor || 'yt-dlp',
    };
  } catch (error) {
    throw new Error(friendlyYtDlpError(error.message));
  }
}

async function fetchSafeStream(initialUrl, redirectsLeft = 5) {
  const safeUrl = await assertSafeMediaUrl(initialUrl);
  const response = await fetch(safeUrl, {
    redirect: 'manual',
    headers: { 'user-agent': 'Mozilla/5.0 HcincoDiscordBot/2.2' },
    signal: AbortSignal.timeout(20_000),
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

function makeFfmpeg(inputMode = 'pipe') {
  if (!ffmpegPath) throw new Error('FFmpeg binary was not found. Run npm install in the server folder again.');
  const args = ['-hide_banner', '-loglevel', 'warning'];
  if (inputMode === 'pipe') args.push('-i', 'pipe:0');
  args.push('-vn', '-map_metadata', '-1', '-ac', '2', '-ar', '48000', '-f', 's16le', 'pipe:1');
  const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr = trimError(stderr + chunk.toString()); });
  return { child, getError: () => trimError(stderr) };
}

export async function createAudioPipeline(url, mediaInfo = null) {
  const safeUrl = await assertSafeMediaUrl(url);
  const processes = [];
  let inputStream = null;
  let ytDlp = null;
  let ytDlpError = '';

  if (DIRECT_MEDIA_RE.test(safeUrl.pathname + safeUrl.search)) {
    inputStream = await fetchSafeStream(safeUrl.toString());
  } else {
    const ytDlpPath = await ensureYtDlp();
    ytDlp = spawn(ytDlpPath, [
      '--playlist-items', '1', '--no-warnings', '--no-progress', '--socket-timeout', '15',
      '-f', 'bestaudio/best', '-o', '-', '--', safeUrl.toString(),
    ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    ytDlp.stderr.on('data', (chunk) => { ytDlpError = trimError(ytDlpError + chunk.toString()); });
    inputStream = ytDlp.stdout;
    processes.push(ytDlp);
  }

  const ffmpeg = makeFfmpeg('pipe');
  processes.push(ffmpeg.child);
  inputStream.pipe(ffmpeg.child.stdin);

  let fatal = null;
  let ytDlpExitCode = null;
  let ffmpegExitCode = null;
  const onInputError = (error) => { fatal = error; try { ffmpeg.child.stdin.destroy(error); } catch {} };
  inputStream.on('error', onInputError);
  ffmpeg.child.stdin.on('error', () => {}); // EPIPE is expected when stopping playback.
  if (ytDlp) {
    ytDlp.on('error', onInputError);
    ytDlp.on('close', (code) => { ytDlpExitCode = code; });
  }
  ffmpeg.child.on('error', (error) => { fatal = error; });
  ffmpeg.child.on('close', (code) => { ffmpegExitCode = code; });

  const cleanup = () => {
    try { inputStream.unpipe?.(ffmpeg.child.stdin); } catch {}
    try { inputStream.destroy?.(); } catch {}
    for (const proc of processes) {
      try { if (!proc.killed) proc.kill('SIGKILL'); } catch {}
    }
  };

  const describeError = () => {
    if (fatal?.message) return fatal.message;
    if (ytDlp && ytDlpExitCode !== null && ytDlpExitCode !== 0) return friendlyYtDlpError(ytDlpError);
    if (ffmpegExitCode !== null && ffmpegExitCode !== 0) return ffmpeg.getError() || `FFmpeg exited with code ${ffmpegExitCode}.`;
    return '';
  };

  return {
    stream: ffmpeg.child.stdout,
    cleanup,
    describeError,
    meta: mediaInfo || { title: 'Media', duration: null, webpageUrl: safeUrl.toString(), extractor: ytDlp ? 'yt-dlp' : 'direct' },
  };
}

export async function toolsStatus() {
  let ytDlp = null;
  if (process.env.YT_DLP_PATH && await exists(process.env.YT_DLP_PATH)) ytDlp = process.env.YT_DLP_PATH;
  if (!ytDlp) {
    const { name } = platformBinary();
    const local = path.join(binDir, name);
    if (await exists(local)) ytDlp = local;
  }
  if (!ytDlp) ytDlp = systemYtDlp();
  return { ffmpeg: Boolean(ffmpegPath), ytDlp: Boolean(ytDlp), ytDlpPath: ytDlp || null };
}
