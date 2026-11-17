# Blinkelo for Windows

A lively, animated island for the top of the Windows screen that tells you what's happening with a blink: media, notifications, phone calls and messages, timers, weather, a dashboard with widgets, a subtitle finder and a gaming mode. It works with the **Blinkelo Link** Android app (in [`../android`](../android)) or with the standard KDE Connect app, so Phone Link is optional.

Version **1.0.0** · Electron 45 · Windows 10/11

## Features

| Feature | What it does |
|---|---|
| 🎵 Now playing | Spotify, browsers (YouTube), Media Player and any app that uses Windows media controls, classic players such as VLC, PotPlayer, MPC-HC/BE, KMPlayer, GOM, mpv and Winamp, and music playing on your phone. Title in the compact pill, cover art, seekable progress bar, previous/play/next |
| 📊 Real visualizer | Bars driven by the actual system audio output, coloured from the cover art |
| ✨ Glow | A halo in the cover's colours that breathes with the music |
| 👀 Blink animations | Blinkelo says hello at start, blinks for every new event and (optionally) peeks around while idle |
| 📱 Phone notifications | From Blinkelo Link, KDE Connect or Phone Link, with icons, click-to-open and quick reply |
| 📞 Incoming calls | Contact photo and pulsing rings; answer/decline through Phone Link or silence the ringer through Blinkelo Link / KDE Connect. Right-click a call to decline |
| 🔔 Windows notifications | Telegram Desktop, WhatsApp, Outlook and more, with a queue and history |
| 🔊 Volume HUD | Scroll over the island to change the system volume; drag the bar |
| 🔋 Battery | Charger plugged/unplugged and low-battery alerts; phone battery in the dashboard |
| ⇪ Caps Lock / Num Lock | On/off indicator |
| 📋 Clipboard | "Copied" confirmation with preview, text and image history; password-manager copies are hidden |
| 🎙️ Privacy indicator | Orange/green dot while an app uses the microphone or camera |
| ⏱️ Timer and stopwatch | Live progress ring, sound when finished; timers are shared with the phone |
| 💧 Two activities at once | Music + timer split the island into two bubbles with a gooey effect |
| 🗂️ File shelf | Drop files on the island and drag them out later; send them to the phone |
| 🖥️ Dashboard | Home (clock, date, weather, shortcuts, player, system monitor, widgets), notifications, apps, planner, weather, tools, shelf and clipboard |
| 🧩 Widgets | Crypto prices (CoinGecko), news from any RSS feed, world clocks |
| 📅 Planner | Month calendar, tasks with optional time and reminders, synced with the phone |
| ⛅ Weather | Current temperature next to the clock, hourly and 5-day forecast (Open-Meteo, no account needed) |
| 🚀 App shortcuts | Installed apps, files and websites in the Apps tab and the home quick row |
| 💬 Subtitles | Notices the video playing in a desktop player, finds subtitles (SubDL, OpenSubtitles, Podnapisi), converts them to UTF-8 and lets you drag them onto the player |
| 🎮 Gaming mode | One-click optimizer (power plan, Game Mode, closing chosen apps, memory trim, priority), an overlay bar with FPS, 1% low, frame time, CPU/GPU usage and temperatures, VRAM, RAM, ping and play time, automatic game detection, a game library and session summaries |
| 🎬 Fullscreen aware | Hides over fullscreen games and videos (except incoming calls) |
| 🌙 Do Not Disturb | Respects Windows Focus / DND |
| 🌍 Languages | English, العربية, Türkçe, Español, Русский, 简体中文 |

### Controls

- **Click** the island: open the current activity (music, timer, notification…) or the dashboard
- **Drag**: move the island along the top edge (reset it to the center from the tray or settings)
- **Right-click**: dashboard (on an incoming call: decline)
- **Middle-click**: play/pause
- **Scroll**: volume
- **`Ctrl + Alt + Space`**: toggle the dashboard (configurable)
- **`Ctrl + Shift + G`**: show/hide the gaming overlay bar (configurable)

## Run from source

Requirements: Windows 10/11, [Node.js](https://nodejs.org) 20 or newer.

```powershell
cd windows
npm install
npm run dev      # bundles the UI with esbuild, then starts Electron
```

`npm start` starts Electron without rebuilding the UI bundles, and `npm test` runs the checks in `verification/`.

The first start takes a few seconds while the Windows helper (PowerShell + C#) compiles; later starts are instant. If Windows asks about network access, choose **Allow** — connecting the phone over Wi-Fi needs it.

On the first run Blinkelo asks for your language, then your city for the weather, then shows how to connect a phone. Everything except the language is optional. The **Try it** menu (tray icon or settings) shows every activity — music, message, call, weather, pairing request, timer… — without a phone.

### Build a release

```powershell
npm run package                                 # uses node_modules/electron/dist (from npm install / npm ci)
npm run package -- --electron C:\path\to\electron-v45.2.3-win32-x64   # or any unpacked Electron of the same version
```

This writes `dist\Blinkelo-<version>-win-x64\` (portable: run `Blinkelo.exe`) and `dist\Blinkelo-<version>-win-x64.zip` for GitHub Releases. Only the runtime files and the production dependencies are included, and the exe gets the Blinkelo icon and version info. Blinkelo registers *Start with Windows* for the copy that ran last, so unzip it to its final folder before the first start.

## Connecting a phone

Blinkelo implements the open **KDE Connect** protocol itself, so nothing else is needed on the PC. On the phone use either:

- **Blinkelo Link** (recommended) — the companion app in [`../android`](../android), with Bluetooth, remote control of the PC, shared planner and timers, file and photo transfer.
- **KDE Connect** from Google Play or F-Droid.

1. Put the phone and the PC on the **same Wi-Fi** network and open the app on the phone. Your PC appears in its device list. (If it doesn't, use *Add device by IP* with the address shown in **Settings → Phone connection**.)
2. Tap **Pair**. A pairing request with a **verification code** appears on the island; confirm it if the code matches.
3. Grant the requested permissions on the phone (notification access, media control, telephony).

Notes: with KDE Connect you can't *answer* a call from the PC — the island shows it and can silence the ringer. If Phone Link is also connected, the island uses Phone Link's answer button for that call. A message delivered by both Phone Link and KDE Connect is shown only once. The connection is TLS-encrypted and only phones you paired can send data.

For Bluetooth (no Wi-Fi): pair the phone once in Windows Bluetooth settings, then use **Settings → Phone connection → Bluetooth search**.

## Phone Link (optional)

If you also use Phone Link, its messages and calls appear in the island and you can **answer calls** from the island:

1. Enable notifications and **calls** in Phone Link (calls need Bluetooth).
2. Keep Phone Link notifications on in **Settings → System → Notifications**.
3. Keep the Phone Link call banner enabled — the island presses its buttons for you.

## Gaming mode notes

- The FPS counter uses ETW and needs membership of the **Performance Log Users** group (or running as administrator). The **Allow** button in settings does this with one UAC prompt; sign out and back in once afterwards. If RivaTuner (bundled with MSI Afterburner) is running, FPS is read from it.
- Windows doesn't expose the real CPU temperature without a driver; run LibreHardwareMonitor or HWiNFO (with Shared Memory enabled). NVIDIA GPU temperature is read with `nvidia-smi`.
- Nothing can be drawn over a game in *exclusive* fullscreen. Choose borderless or windowed in the game's settings, or let RivaTuner show the stats inside the game.
- Every optimization is reversible and applies to the current Windows account only.

## Troubleshooting

- **Settings → Status** shows the state of every part (media, audio, notifications, call control, phone link, weather).
- Logs live in `%APPDATA%\Blinkelo\logs` (`main.log` and `helper.log`). Attach them to bug reports.
- **Classic players (VLC…)**: play/pause state is inferred from the audio output and the buttons send media keys. If a player ignores media keys, enable its *global hotkeys* option.
- **Phone not found**: both devices on the same Wi-Fi (not a guest network), allow Blinkelo on **Private** networks in Windows Firewall, try *Add by IP*. Close any other app that uses port 1716 (for example KDE Connect desktop).
- **Connected, but files or screenshots from the PC never reach the phone**: Windows probably blocks Blinkelo's incoming connections. This happens when the Wi-Fi is set to **Public** and the Windows Firewall prompt was closed or answered with *Cancel*: Windows then adds a *Block* rule. The PC can still connect to the phone, but the phone cannot connect back. Fix one of these:
  - set your home Wi-Fi to **Private** (Settings → Network & internet → Wi-Fi → your network → *Private network*), or
  - in **Windows Security → Firewall & network protection → Allow an app through firewall**, tick Blinkelo for the network type you use, and remove any *Blinkelo* rule set to *Block* in *Advanced settings → Inbound Rules*.
  Blinkelo needs incoming TCP/UDP 1716 and TCP 1739–1764 from your local network.
- **Bluetooth doesn't connect**: the phone must be paired in Windows Bluetooth settings and Blinkelo Link must be open or running in the background. Check the *Bluetooth* row in **Settings → Status**.
- **Mouse control from the phone doesn't work on some windows**: Windows doesn't let a normal app control windows started with *Run as administrator*; run Blinkelo as administrator too.
- **Crypto prices or news don't load**: press *Try again* in the widget or pick another feed.
- **Lost the island**: use **Reset to center** or **Show island** in the tray menu.

## Project layout

```
windows/
├─ src/main/              Electron main process: windows, settings, tray, KDE Connect / Blinkelo Link,
│                         weather, shortcuts, widgets, tasks, subtitles, gaming mode
├─ src/preload/           context-isolated bridges for the renderer windows
├─ src/renderer/island/   the island UI: spring engine, activities, animations (bundled to island.bundle.js)
├─ src/renderer/settings/ settings window and onboarding (settings.src.js → settings.js)
├─ src/renderer/gamebar/  slim overlay bar shown over games
├─ src/renderer/shared/   blink animation kit, fonts
├─ src/shared/            UI strings for every language, shared helpers
├─ native/                Windows helper (PowerShell + C#): media, audio, notifications, UI Automation,
│                         mouse/keyboard input, Bluetooth, gaming (ETW FPS, sensors, power plans)
├─ assets/                icons, tray images, Inter font
└─ verification/          automated checks (npm test)
```

The settings profile is stored in `%APPDATA%\Blinkelo`.

## Credits

Built by **SaeedSH** · Inter font (SIL OFL 1.1) · Lucide icons (ISC) · KDE Connect protocol · weather data by Open-Meteo · crypto prices by CoinGecko
