# راهنمای فارسی Hcinco Discord Voice Dashboard v2

این پروژه با **Node.js + React** ساخته شده و زبان اصلی پنل English است؛ از داخل خود پنل می‌توان زبان را روی فارسی قرار داد.

## امکانات نسخه جدید

- ست کردن **Discord Bot Token از داخل تنظیمات سایت**؛ دیگر نیازی نیست توکن را داخل `.env` قرار بدهید.
- ذخیره توکن در بک‌اند به صورت رمزگذاری‌شده با AES-256-GCM.
- دکمه **Run Bot** و **Stop Bot** داخل سایت.
- گزینه Auto-start برای آنلاین شدن خودکار بات بعد از اجرای بک‌اند.
- نمایش همه سرورهایی که بات داخل آن‌ها عضو است.
- انتخاب سرور و سپس انتخاب Voice Channel همان سرور.
- وارد کردن لینک ویدیو/مدیا و پخش **صدای آن** داخل Voice Channel.
- پشتیبانی طراحی‌شده برای YouTube، SoundCloud و لینک مستقیم فایل/استریم HTTP/HTTPS.
- تنظیم Volume.
- امکان وارد کردن Application/Client ID و ساخت دکمه Add/Invite Bot.
- نام سازنده: **Hcinco**.

## محدودیت مهم Discord

API رسمی ربات‌های Discord قابلیت **Screen Share / Go Live ویدیو** را در اختیار Bot Account قرار نمی‌دهد. بنابراین این نسخه صدای ویدیو یا مدیا را داخل Voice پخش می‌کند.

برای Screen Share واقعی باید از رفتار User Client یا روش‌های غیررسمی استفاده شود که داخل این پروژه قرار داده نشده است.

## نصب

داخل پوشه اصلی پروژه:

```bash
npm install
npm run install:all
```

بعد فایل env را بسازید.

### ویندوز PowerShell

```powershell
Copy-Item server/.env.example server/.env
```

### Linux / macOS

```bash
cp server/.env.example server/.env
```

فایل `server/.env`:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DASHBOARD_API_KEY=
```

توکن بات داخل این فایل قرار نمی‌گیرد. توکن را از خود سایت وارد می‌کنید.

`DASHBOARD_API_KEY` اختیاری است. اگر پروژه فقط روی سیستم خودتان اجرا می‌شود می‌تواند خالی باشد. اگر داشبورد را روی سرور عمومی قرار می‌دهید یک رمز طولانی برای آن تنظیم کنید.

## اجرای پروژه

```bash
npm run dev
```

سپس بروید به:

`http://localhost:5173`

## راه‌اندازی بات از سایت

1. وارد **Settings** شوید.
2. Discord Bot Token را وارد کنید.
3. در صورت نیاز Application / Client ID را وارد کنید تا دکمه Invite Bot فعال شود.
4. اگر می‌خواهید بات بعد از هر بار اجرای بک‌اند خودکار آنلاین شود، Auto-start را فعال کنید.
5. روی **Save settings** بزنید.
6. به Dashboard بروید و **Run Bot** را بزنید.
7. اگر بات داخل سرور نیست، از دکمه **Add/Invite Bot** استفاده کنید.
8. وارد **Voice Player** شوید.
9. سرور را انتخاب کنید.
10. Voice Channel را انتخاب کنید.
11. لینک ویدیو/مدیا را وارد کنید.
12. Volume را انتخاب و **Play in Voice** را بزنید.

## دسترسی‌های بات

حداقل این Permissionها لازم است:

- View Channels
- Connect
- Speak

برای نتیجه بهتر از Voice Channel معمولی استفاده کنید؛ Stage Channel ممکن است مدیریت Speaker جداگانه لازم داشته باشد.

## محل ذخیره توکن

توکن در React ذخیره نمی‌شود. بک‌اند توکن را رمزگذاری می‌کند و این فایل‌ها را می‌سازد:

- `server/data/settings.json`
- `server/data/.secret-key`

این فایل‌ها داخل `.gitignore` هستند و نباید در Git آپلود شوند.

## دستورات پروژه

```bash
npm install
npm run install:all
npm run dev
npm run build
npm start
npm run dev --prefix server
npm run dev --prefix client
```

**Created by Hcinco**
