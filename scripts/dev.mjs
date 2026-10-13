import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = new Set();
let stopping = false;

function run(name, cwd) {
  const child = spawn(npm, ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  children.add(child);
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) {
      console.error(`\n[Hcinco] ${name} exited (${signal || `code ${code}`}).`);
      console.error(`[Hcinco] Run "npm run ${name === 'backend' ? 'backend' : 'frontend'}" to see that service by itself.\n`);
    }
  });
  child.on('error', (error) => console.error(`[Hcinco] Could not start ${name}:`, error.message));
  return child;
}

function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try { child.kill('SIGINT'); } catch {}
  }
  setTimeout(() => process.exit(0), 500).unref();
}

console.log(`[Hcinco] Node ${process.version}`);
console.log('[Hcinco] Starting backend on http://127.0.0.1:4000');
console.log('[Hcinco] Starting dashboard on http://localhost:5173');
console.log('[Hcinco] Keep this terminal open. Ctrl+C stops both services.\n');

run('backend', path.join(root, 'server'));
run('frontend', path.join(root, 'client'));

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
