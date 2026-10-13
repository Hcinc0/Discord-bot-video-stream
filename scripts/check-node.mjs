const [major, minor] = process.versions.node.split('.').map(Number);
const ok = major > 22 || (major === 22 && minor >= 12);
console.log(`Detected Node.js ${process.version}`);
if (!ok) {
  console.error('\nHcinco Dashboard requires Node.js 22.12.0 or newer for the current Discord voice engine.');
  console.error('Install Node.js 22 LTS/current, reopen PowerShell, then run START-HCINCO.bat again.\n');
  process.exit(1);
}
console.log('Node.js version is compatible.');
