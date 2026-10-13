import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, Bot, CheckCircle2, ChevronRight, CircleStop, ExternalLink, Globe2,
  Headphones, KeyRound, Link2, Loader2, Play, Radio, RefreshCw, Save, Server,
  Settings, ShieldCheck, Square, Volume2, Wifi, WifiOff, XCircle
} from 'lucide-react';
import './style.css';

const copy = {
  en: {
    appName: 'Hcinco Control', creator: 'Created by Hcinco', dashboard: 'Dashboard', control: 'Voice Player', settings: 'Settings',
    overview: 'Overview', subtitle: 'Professional Discord bot control center', workspace: 'WORKSPACE', botStatus: 'Bot status', online: 'Online', offline: 'Offline',
    starting: 'Starting…', guilds: 'Servers', playback: 'Playback', idle: 'Idle', resolving: 'Resolving', connecting: 'Connecting', paused: 'Paused', playing: 'Playing', finished: 'Finished', error: 'Error',
    botControl: 'Discord Bot', botControlSub: 'Start or stop the bot directly from this dashboard.', startBot: 'Run Bot', stopBot: 'Stop Bot', refresh: 'Refresh',
    tokenReady: 'Bot token is configured', tokenMissing: 'Bot token is not configured', goSettings: 'Open Settings',
    selectServer: 'Select server', selectServerHint: 'Choose one of the servers where your bot is already installed.', serverPlaceholder: 'Choose a Discord server…',
    selectVoice: 'Select voice channel', voicePlaceholder: 'Choose a voice channel…', members: 'members', noVoice: 'No voice channels were found.',
    mediaUrl: 'Video / media URL', mediaHint: 'YouTube, SoundCloud (track or playlist/set), Instagram/TikTok/Vimeo, or a direct media URL. Playlists start from the first item. The first playback may install the media engine automatically.',
    volume: 'Volume', playNow: 'Play in Voice', stopLeave: 'Stop & Leave', loadingChannels: 'Loading channels…',
    nowPlaying: 'Now playing', noPlayback: 'Nothing is playing right now.', joined: 'Bot joins the selected voice channel automatically.',
    limitationTitle: 'Discord video limitation', limitation: 'Official Discord bot APIs do not provide Go Live / screen-share video. This project plays the media audio in the voice channel. Video screen sharing would require unofficial client behavior and is intentionally not included.',
    botSettings: 'Bot credentials', botSettingsSub: 'Configure the Discord bot without editing source files.', botToken: 'Discord Bot Token', tokenPlaceholder: 'Paste a new bot token…',
    tokenHelp: 'The token is sent only to the Node.js backend and stored encrypted. It is never returned to the browser.', appId: 'Application / Client ID', appIdPlaceholder: 'Optional, used to build the Invite Bot link',
    autoStart: 'Automatically run the bot when the backend starts', saveSettings: 'Save settings', clearToken: 'Remove saved token', inviteBot: 'Invite Bot to Server',
    dashboardSecurity: 'Dashboard API security', dashboardKey: 'Dashboard API Key', dashboardKeyHint: 'Only needed if DASHBOARD_API_KEY is set in server/.env.', saveKey: 'Use key',
    configured: 'Configured', notConfigured: 'Not configured', apiProtected: 'API protection is enabled', apiOpen: 'API key protection is disabled (recommended only for local use).',
    permissions: 'Invite permissions: View Channels, Connect, Speak', chooseFirst: 'Start the bot first, then select a server and voice channel.',
    saved: 'Settings saved.', removed: 'Saved bot token removed.', invalidKey: 'Dashboard API key is invalid.', backendOffline: 'Backend is offline. Run START-HCINCO.bat and keep the Backend window open.',
  },
  fa: {
    appName: 'کنترل Hcinco', creator: 'ساخته شده توسط Hcinco', dashboard: 'داشبورد', control: 'پخش در ویس', settings: 'تنظیمات',
    overview: 'نمای کلی', subtitle: 'مرکز کنترل حرفه‌ای ربات دیسکورد', workspace: 'بخش مدیریت', botStatus: 'وضعیت ربات', online: 'آنلاین', offline: 'آفلاین',
    starting: 'در حال اجرا…', guilds: 'سرورها', playback: 'پخش', idle: 'متوقف', resolving: 'در حال بررسی لینک', connecting: 'در حال اتصال', paused: 'مکث', playing: 'در حال پخش', finished: 'تمام شد', error: 'خطا',
    botControl: 'ربات Discord', botControlSub: 'ربات را مستقیماً از همین داشبورد اجرا یا متوقف کنید.', startBot: 'Run Bot', stopBot: 'Stop Bot', refresh: 'بروزرسانی',
    tokenReady: 'توکن ربات تنظیم شده است', tokenMissing: 'توکن ربات تنظیم نشده است', goSettings: 'رفتن به تنظیمات',
    selectServer: 'انتخاب سرور', selectServerHint: 'یکی از سرورهایی که ربات از قبل داخل آن Add شده را انتخاب کنید.', serverPlaceholder: 'یک سرور Discord انتخاب کنید…',
    selectVoice: 'انتخاب Voice Channel', voicePlaceholder: 'یک کانال ویس انتخاب کنید…', members: 'نفر', noVoice: 'Voice Channel پیدا نشد.',
    mediaUrl: 'لینک ویدیو / مدیا', mediaHint: 'YouTube، SoundCloud (Track یا Set/Playlist)، Instagram، TikTok، Vimeo یا لینک مستقیم مدیا. برای Playlist اولین آیتم پخش می‌شود. بار اول ممکن است Media Engine به‌صورت خودکار نصب شود.',
    volume: 'ولوم', playNow: 'پخش در Voice', stopLeave: 'توقف و خروج', loadingChannels: 'در حال دریافت کانال‌ها…',
    nowPlaying: 'در حال پخش', noPlayback: 'در حال حاضر چیزی پخش نمی‌شود.', joined: 'ربات به صورت خودکار وارد Voice انتخاب‌شده می‌شود.',
    limitationTitle: 'محدودیت ویدیوی Discord', limitation: 'API رسمی ربات‌های Discord قابلیت Go Live یا Screen Share ویدیو را ارائه نمی‌دهد. این پروژه صدای مدیا را داخل Voice پخش می‌کند و عمداً از روش‌های غیررسمی User Client استفاده نمی‌کند.',
    botSettings: 'اطلاعات ربات', botSettingsSub: 'توکن ربات را بدون ویرایش فایل‌های سورس تنظیم کنید.', botToken: 'Discord Bot Token', tokenPlaceholder: 'توکن جدید ربات را وارد کنید…',
    tokenHelp: 'توکن فقط به بک‌اند Node.js ارسال و به صورت رمزگذاری‌شده ذخیره می‌شود و دوباره به مرورگر برگردانده نمی‌شود.', appId: 'Application / Client ID', appIdPlaceholder: 'اختیاری؛ برای ساخت لینک Invite Bot',
    autoStart: 'با اجرای بک‌اند، ربات به صورت خودکار Run شود', saveSettings: 'ذخیره تنظیمات', clearToken: 'حذف توکن ذخیره‌شده', inviteBot: 'Add Bot به سرور',
    dashboardSecurity: 'امنیت API داشبورد', dashboardKey: 'Dashboard API Key', dashboardKeyHint: 'فقط اگر DASHBOARD_API_KEY را در server/.env تنظیم کرده‌اید لازم است.', saveKey: 'استفاده از کلید',
    configured: 'تنظیم شده', notConfigured: 'تنظیم نشده', apiProtected: 'محافظت API فعال است', apiOpen: 'محافظت با API Key غیرفعال است؛ فقط برای اجرای لوکال پیشنهاد می‌شود.',
    permissions: 'دسترسی Invite: View Channels، Connect و Speak', chooseFirst: 'ابتدا ربات را Run کنید؛ سپس سرور و Voice را انتخاب کنید.',
    saved: 'تنظیمات ذخیره شد.', removed: 'توکن ذخیره‌شده حذف شد.', invalidKey: 'Dashboard API Key اشتباه است.', backendOffline: 'بک‌اند خاموش است. فایل START-HCINCO.bat را اجرا کنید و پنجره Backend را باز نگه دارید.',
  }
};

function App() {
  const [lang, setLang] = useState(localStorage.getItem('hcinco-lang') || 'en');
  const [tab, setTab] = useState('overview');
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('hcinco-api-key') || '');
  const [keyDraft, setKeyDraft] = useState(sessionStorage.getItem('hcinco-api-key') || '');
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [channels, setChannels] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [url, setUrl] = useState('');
  const [volume, setVolume] = useState(1);
  const [tokenDraft, setTokenDraft] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [autoStart, setAutoStart] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState('');
  const [channelsBusy, setChannelsBusy] = useState(false);

  const t = copy[lang];
  const rtl = lang === 'fa';

  const api = async (path, options = {}) => {
    let response;
    try {
      response = await fetch(`/api${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
          ...options.headers,
        },
      });
    } catch (cause) {
      const error = new Error(t.backendOffline);
      error.code = 'BACKEND_OFFLINE';
      error.cause = cause;
      throw error;
    }
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const proxyFailure = response.status === 502 || response.status === 503 && !data.error;
      const error = new Error(proxyFailure ? t.backendOffline : (data.error || `HTTP ${response.status}`));
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };

  const flash = (message, kind = 'ok') => setNotice({ message, kind });

  const loadPublicHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Backend health check failed');
      setHealth(await response.json());
    } catch {
      setHealth({ ok: false, botOnline: false, tokenConfigured: false, apiKeyRequired: false });
    }
  };

  const loadAll = async ({ quiet = false } = {}) => {
    if (!quiet) setBusy('refresh');
    try {
      await loadPublicHealth();
      const [s, c] = await Promise.all([api('/status'), api('/config')]);
      setStatus(s);
      setConfig(c);
      setApplicationId(c.applicationId || '');
      setAutoStart(Boolean(c.autoStart));
      if (s.botOnline) {
        const gs = await api('/guilds');
        setGuilds(gs);
        if (guildId && !gs.some(g => g.id === guildId)) {
          setGuildId(''); setChannelId(''); setChannels([]);
        }
      } else {
        setGuilds([]); setChannels([]);
      }
    } catch (error) {
      if (error.status === 401) flash(t.invalidKey, 'error');
      else if (!quiet) flash(error.message, 'error');
    } finally {
      if (!quiet) setBusy('');
    }
  };

  useEffect(() => { loadPublicHealth(); }, []);
  useEffect(() => { loadAll({ quiet: true }); }, [apiKey]);
  useEffect(() => {
    const timer = setInterval(() => loadAll({ quiet: true }), 8000);
    return () => clearInterval(timer);
  }, [apiKey, guildId]);

  useEffect(() => {
    if (!guildId || !status?.botOnline) { setChannels([]); setChannelId(''); return; }
    let live = true;
    setChannelsBusy(true);
    api(`/guilds/${guildId}/channels`)
      .then(data => { if (live) { setChannels(data); if (!data.some(c => c.id === channelId)) setChannelId(''); } })
      .catch(error => { if (live) flash(error.message, 'error'); })
      .finally(() => { if (live) setChannelsBusy(false); });
    return () => { live = false; };
  }, [guildId, status?.botOnline]);

  const toggleLang = () => {
    const next = rtl ? 'en' : 'fa';
    localStorage.setItem('hcinco-lang', next);
    setLang(next);
  };

  const saveConfig = async () => {
    setBusy('save');
    try {
      const payload = { applicationId, autoStart };
      if (tokenDraft.trim()) payload.botToken = tokenDraft.trim();
      const next = await api('/config', { method: 'PUT', body: JSON.stringify(payload) });
      setConfig(next); setTokenDraft(''); await loadAll({ quiet: true }); flash(t.saved);
    } catch (error) { flash(error.message, 'error'); }
    finally { setBusy(''); }
  };

  const removeToken = async () => {
    setBusy('clear');
    try {
      await api('/bot/stop', { method: 'POST' }).catch(() => {});
      const next = await api('/config', { method: 'PUT', body: JSON.stringify({ clearToken: true, applicationId, autoStart: false }) });
      setConfig(next); setAutoStart(false); setStatus(await api('/status')); setGuilds([]); setChannels([]); flash(t.removed);
    } catch (error) { flash(error.message, 'error'); }
    finally { setBusy(''); }
  };

  const runBot = async () => {
    setBusy('startBot');
    try { setStatus(await api('/bot/start', { method: 'POST' })); await loadAll({ quiet: true }); flash(t.online); }
    catch (error) { flash(error.message, 'error'); }
    finally { setBusy(''); }
  };

  const stopBot = async () => {
    setBusy('stopBot');
    try { setStatus(await api('/bot/stop', { method: 'POST' })); setGuilds([]); setChannels([]); setGuildId(''); setChannelId(''); flash(t.offline); }
    catch (error) { flash(error.message, 'error'); }
    finally { setBusy(''); }
  };

  const startPlayback = async () => {
    setBusy('play');
    try {
      const next = await api('/playback/start', { method: 'POST', body: JSON.stringify({ url, guildId, channelId, volume: Number(volume) }) });
      setStatus(next); flash(t.playing);
    } catch (error) {
      if (error.data?.state) setStatus(error.data.state);
      flash(error.message, 'error');
    } finally { setBusy(''); }
  };

  const stopPlayback = async () => {
    setBusy('stopPlay');
    try { setStatus(await api('/playback/stop', { method: 'POST' })); flash(t.idle); }
    catch (error) { flash(error.message, 'error'); }
    finally { setBusy(''); }
  };

  const playbackStatus = status?.playback?.status || 'idle';
  const selectedGuild = guilds.find(g => g.id === guildId);
  const selectedChannel = channels.find(c => c.id === channelId);
  const appId = applicationId || config?.applicationId || status?.botId || '';
  const inviteUrl = useMemo(() => appId ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(appId)}&permissions=3146752&scope=bot%20applications.commands` : '', [appId]);

  const StatusPill = () => (
    <div className={`status-pill ${status?.botOnline ? 'online' : ''}`}>
      {status?.botOnline ? <Wifi size={15}/> : <WifiOff size={15}/>}<span>{status?.botOnline ? t.online : t.offline}</span>
    </div>
  );

  return (
    <div className="app" dir={rtl ? 'rtl' : 'ltr'}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Radio size={22}/></div><div className="brand-copy"><strong>HCINCO</strong><span>DISCORD CONTROL</span></div></div>
        <div className="sidebar-label">{t.workspace}</div>
        <nav>
          <button className={tab === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('overview')}><Activity/><span>{t.overview}</span></button>
          <button className={tab === 'control' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('control')}><Headphones/><span>{t.control}</span></button>
          <button className={tab === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('settings')}><Settings/><span>{t.settings}</span></button>
        </nav>
        <div className="side-bot">
          <div className={`avatar ${status?.botOnline ? 'live' : ''}`}>{status?.botAvatar ? <img src={status.botAvatar}/> : <Bot/>}</div>
          <div><b>{status?.botName || 'Discord Bot'}</b><span>{status?.botOnline ? t.online : t.offline}</span></div>
        </div>
        <div className="creator"><ShieldCheck size={15}/>{t.creator}</div>
      </aside>

      <main>
        <header>
          <div><div className="eyebrow">HCINCO / BOT OPERATIONS</div><h1>{tab === 'overview' ? t.dashboard : tab === 'control' ? t.control : t.settings}</h1><p>{t.subtitle}</p></div>
          <div className="header-actions"><button className="ghost-button" onClick={toggleLang}><Globe2 size={16}/>{rtl ? 'English' : 'فارسی'}</button><StatusPill/></div>
        </header>

        <section className="content">
          {notice && <div className={`notice ${notice.kind}`}><div>{notice.kind === 'error' ? <XCircle/> : <CheckCircle2/>}</div><span>{notice.message}</span><button onClick={() => setNotice(null)}>×</button></div>}

          {tab === 'overview' && <>
            <div className="metrics">
              <Metric icon={<Bot/>} label={t.botStatus} value={status?.botStarting ? t.starting : status?.botOnline ? t.online : t.offline} sub={status?.botName || (config?.hasToken ? t.tokenReady : t.tokenMissing)} tone="violet"/>
              <Metric icon={<Server/>} label={t.guilds} value={status?.guildCount ?? 0} sub={status?.botOnline ? t.configured : t.chooseFirst} tone="blue"/>
              <Metric icon={<Volume2/>} label={t.playback} value={t[playbackStatus] || playbackStatus} sub={selectedChannel?.name || t.noPlayback} tone="green"/>
            </div>

            <div className="grid two">
              <Card title={t.botControl} subtitle={t.botControlSub} icon={<Bot/>} action={<button className="icon-button" onClick={() => loadAll()}><RefreshCw className={busy === 'refresh' ? 'spin' : ''}/></button>}>
                <div className="bot-profile">
                  <div className={`large-avatar ${status?.botOnline ? 'live' : ''}`}>{status?.botAvatar ? <img src={status.botAvatar}/> : <Bot size={30}/>}</div>
                  <div className="bot-meta"><strong>{status?.botName || 'Discord Bot'}</strong><span>{config?.hasToken ? t.tokenReady : t.tokenMissing}</span></div>
                  <StatusPill/>
                </div>
                <div className="action-row">
                  {!status?.botOnline ? <button className="primary" disabled={!config?.hasToken || busy === 'startBot'} onClick={runBot}>{busy === 'startBot' ? <Loader2 className="spin"/> : <Play/>}{t.startBot}</button> : <button className="danger" disabled={busy === 'stopBot'} onClick={stopBot}>{busy === 'stopBot' ? <Loader2 className="spin"/> : <Square/>}{t.stopBot}</button>}
                  {!config?.hasToken && <button className="secondary" onClick={() => setTab('settings')}>{t.goSettings}<ChevronRight/></button>}
                </div>
              </Card>

              <Card title={t.nowPlaying} subtitle={t.joined} icon={<Radio/>}>
                {playbackStatus !== 'idle' ? <div className="now-playing">
                  <div className="wave"><i/><i/><i/><i/><i/></div>
                  <div className="playing-copy"><strong>{status?.playback?.title || selectedChannel?.name || status?.playback?.channelId || t.playback}</strong><span>{selectedChannel?.name ? `${selectedChannel.name} · ${status?.playback?.url || ''}` : status?.playback?.url}</span><small>{status?.playback?.message}</small></div>
                </div> : <div className="empty-state"><Headphones/><strong>{t.noPlayback}</strong><span>{t.joined}</span></div>}
                <button className="secondary full" onClick={() => setTab('control')}>{t.control}<ChevronRight/></button>
              </Card>
            </div>

            <div className="info-banner"><ShieldCheck/><div><strong>{t.limitationTitle}</strong><p>{t.limitation}</p></div></div>
          </>}

          {tab === 'control' && <div className="control-layout">
            <Card title={t.control} subtitle={t.selectServerHint} icon={<Headphones/>}>
              {!status?.botOnline && <div className="inline-warning"><WifiOff/><span>{t.chooseFirst}</span><button onClick={() => setTab(config?.hasToken ? 'overview' : 'settings')}>{config?.hasToken ? t.startBot : t.goSettings}</button></div>}

              <Field label={t.selectServer} icon={<Server/>}>
                <select value={guildId} disabled={!status?.botOnline} onChange={e => { setGuildId(e.target.value); setChannelId(''); }}>
                  <option value="">{t.serverPlaceholder}</option>{guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </Field>

              <Field label={t.selectVoice} icon={<Headphones/>}>
                <select value={channelId} disabled={!guildId || channelsBusy} onChange={e => setChannelId(e.target.value)}>
                  <option value="">{channelsBusy ? t.loadingChannels : t.voicePlaceholder}</option>
                  {channels.map(c => <option disabled={!c.canConnect || !c.canSpeak} key={c.id} value={c.id}>{c.name} · {c.members} {t.members}{(!c.canConnect || !c.canSpeak) ? ' · no permission' : ''}</option>)}
                </select>
              </Field>
              {guildId && !channelsBusy && channels.length === 0 && <p className="helper error-text">{t.noVoice}</p>}

              <Field label={t.mediaUrl} icon={<Link2/>}>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>
                <p className="helper">{t.mediaHint}</p>
              </Field>

              <Field label={`${t.volume} · ${Math.round(Number(volume) * 100)}%`} icon={<Volume2/>}>
                <input className="range" type="range" min="0.05" max="2" step="0.05" value={volume} onChange={e => setVolume(e.target.value)}/>
              </Field>

              <div className="action-row">
                <button className="primary" disabled={!status?.botOnline || !guildId || !channelId || !url.trim() || busy === 'play'} onClick={startPlayback}>{busy === 'play' ? <Loader2 className="spin"/> : <Play/>}{t.playNow}</button>
                <button className="secondary" disabled={playbackStatus === 'idle' || busy === 'stopPlay'} onClick={stopPlayback}>{busy === 'stopPlay' ? <Loader2 className="spin"/> : <CircleStop/>}{t.stopLeave}</button>
              </div>
            </Card>

            <div className="stack">
              <Card title={t.selectServer} subtitle={selectedGuild?.name || t.serverPlaceholder} icon={<Server/>}>
                {selectedGuild ? <div className="server-card">{selectedGuild.icon ? <img src={selectedGuild.icon}/> : <Server/>}<div><strong>{selectedGuild.name}</strong><span>{selectedGuild.memberCount} {t.members}</span></div></div> : <div className="empty-state compact"><Server/><span>{t.serverPlaceholder}</span></div>}
                {selectedChannel && <div className="channel-summary"><Headphones/><div><strong>{selectedChannel.name}</strong><span>{selectedChannel.members} {t.members}</span></div><CheckCircle2/></div>}
              </Card>
              <div className="info-banner small"><ShieldCheck/><div><strong>{t.limitationTitle}</strong><p>{t.limitation}</p></div></div>
            </div>
          </div>}

          {tab === 'settings' && <div className="settings-layout">
            <Card title={t.botSettings} subtitle={t.botSettingsSub} icon={<KeyRound/>}>
              <div className={`config-status ${config?.hasToken ? 'good' : ''}`}><span className="dot"/><b>{config?.hasToken ? t.tokenReady : t.tokenMissing}</b></div>
              <Field label={t.botToken} icon={<KeyRound/>}>
                <input type="password" autoComplete="new-password" value={tokenDraft} onChange={e => setTokenDraft(e.target.value)} placeholder={config?.hasToken ? '••••••••••••••••••••••••' : t.tokenPlaceholder}/>
                <p className="helper">{t.tokenHelp}</p>
              </Field>
              <Field label={t.appId} icon={<Bot/>}><input value={applicationId} onChange={e => setApplicationId(e.target.value.replace(/\D/g, ''))} placeholder={t.appIdPlaceholder}/></Field>
              <label className="switch-row"><input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)}/><span className="switch"/><span>{t.autoStart}</span></label>
              <div className="action-row">
                <button className="primary" disabled={busy === 'save'} onClick={saveConfig}>{busy === 'save' ? <Loader2 className="spin"/> : <Save/>}{t.saveSettings}</button>
                {config?.hasToken && <button className="danger subtle" disabled={busy === 'clear'} onClick={removeToken}>{t.clearToken}</button>}
              </div>
              {inviteUrl && <div className="invite-box"><div><strong>{t.inviteBot}</strong><span>{t.permissions}</span></div><a className="secondary" href={inviteUrl} target="_blank" rel="noreferrer"><ExternalLink/>{t.inviteBot}</a></div>}
            </Card>

            <Card title={t.dashboardSecurity} subtitle={health?.apiKeyRequired ? t.apiProtected : t.apiOpen} icon={<ShieldCheck/>}>
              <Field label={t.dashboardKey} icon={<ShieldCheck/>}>
                <input type="password" value={keyDraft} onChange={e => setKeyDraft(e.target.value)} placeholder={t.dashboardKeyHint}/>
                <p className="helper">{t.dashboardKeyHint}</p>
              </Field>
              <button className="secondary" onClick={() => { sessionStorage.setItem('hcinco-api-key', keyDraft); setApiKey(keyDraft); flash(t.configured); }}>{t.saveKey}</button>
              <div className="security-state"><ShieldCheck/><div><b>{health?.apiKeyRequired ? t.apiProtected : t.apiOpen}</b><span>{health?.apiKeyRequired ? 'server/.env → DASHBOARD_API_KEY' : 'Local development mode'}</span></div></div>
            </Card>
          </div>}
        </section>
        <footer>© {new Date().getFullYear()} Hcinco · Discord Bot Voice Dashboard · v2.2</footer>
      </main>
    </div>
  );
}

function Metric({ icon, label, value, sub, tone }) { return <article className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>; }
function Card({ title, subtitle, icon, action, children }) { return <article className="card"><div className="card-head"><div className="card-title"><div className="card-icon">{icon}</div><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{action}</div>{children}</article>; }
function Field({ label, icon, children }) { return <div className="field"><label>{icon}{label}</label>{children}</div>; }

createRoot(document.getElementById('root')).render(<App/>);
