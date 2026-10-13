# Hcinco Discord Voice Dashboard v2.2 — Media Fix

Professional Node.js + React dashboard for controlling an official Discord bot.

## v2.2 media fix

- Removed the old `play-dl` SoundCloud path that could throw `Cannot read properties of undefined (reading 'client_id')`.
- Uses **yt-dlp + FFmpeg** for YouTube, SoundCloud and many public media pages.
- Supports **SoundCloud Track and Set/Playlist** links. Playlist/set links play the first item.
- Media is resolved **before** the bot joins voice, so a bad link does not cause the bot to join and instantly leave.
- The bot stays in the selected voice channel after playback finishes until **Stop & Leave** is pressed.
- Better playback error messages and media metadata.
- `yt-dlp` is downloaded from its official GitHub release automatically on first use when it is not already installed.
- FFmpeg is provided by the `ffmpeg-static` npm package.

## Important Discord limitation

Official Discord bot APIs support sending **audio** to voice channels. They do not expose bot Go Live / screen-share video. This project therefore plays the audio track of a video/media URL in voice. It does not use a user token or self-bot workaround.

## Windows quick start

1. Install Node.js 22.12+.
2. Extract the ZIP.
3. Run `CLEAN-INSTALL-WINDOWS.bat` once if upgrading from an older version.
4. Run `START-HCINCO.bat`.
5. Open Settings, save your Discord Bot Token, then Run Bot.
6. Open Voice Player, choose Server -> Voice Channel -> media URL -> Play in Voice.

The first YouTube/SoundCloud playback can take longer because the media engine may be downloaded automatically.

## Commands

```bash
npm run install:all
npm run dev
npm run backend
npm run frontend
```

## Supported links

Best supported: YouTube, SoundCloud, Vimeo, TikTok, Instagram public media and direct media files. Some sites may require cookies/login and therefore cannot be played by a server-side bot.

Created by **Hcinco**.
