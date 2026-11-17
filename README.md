<p align="center">
  <img src="windows/assets/brand/blinkelo-icon.svg" width="112" alt="Blinkelo icon">
</p>

<h1 align="center">Blinkelo</h1>

<p align="center">A lively, animated island for Windows that tells you with a blink — plus <b>Blinkelo Link</b>, its Android companion.</p>

Blinkelo sits at the top of your screen and morphs with spring physics to show what's happening: the song that's playing (with a real audio visualizer and a glow in the cover's colours), notifications, phone messages and calls, timers, weather, clipboard, file shelf, subtitles for the video you're watching and live stats while you game. Click it for a full dashboard with widgets, a planner and app shortcuts.

The phone connection is built in: Blinkelo implements the open KDE Connect protocol, so it works with the **Blinkelo Link** Android app in this repository (Wi-Fi or Bluetooth) or with the standard KDE Connect app. Phone Link is optional.

## Repository

| Folder | What's inside |
|---|---|
| [`windows/`](windows) | **Blinkelo for Windows** 2.0.0 — Electron app + native Windows helper (PowerShell/C#) |
| [`android/`](android) | **Blinkelo Link** 1.1.0 — Android companion app (Java, no third-party libraries) |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history of both apps |

## Highlights

- 🎵 Now playing from Spotify, browsers, classic players (VLC, PotPlayer, MPC-HC…) and your phone, with a real visualizer
- 👀 Blink animations: a hello at start, a blink for every new event, optional idle peeks
- 📱 Phone notifications with quick reply, incoming calls, phone music and battery
- 🖱️ Control the PC from the phone: touchpad, keyboard, media, apps, presentation mode, power
- 🗓️ Planner and timers shared between the PC and the phone
- 💬 Automatic subtitle finder for desktop video players
- 🎮 Gaming mode: one-click optimizer and an overlay bar with FPS, temperatures and usage
- 🧩 Widgets: crypto prices, RSS news, world clocks · ⛅ weather by Open-Meteo
- 🌍 English, العربية, Türkçe, Español, Русский, 简体中文

## Quick start

**Windows** (Node.js 20+):

```powershell
cd windows
npm install
npm run dev
```

**Android** (Android Studio, API 35 SDK): open the `android` folder and press **Run**, or run `./gradlew assembleDebug`.

See [`windows/README.md`](windows/README.md) and [`android/README.md`](android/README.md) for details, pairing and troubleshooting.

## License

[MIT](LICENSE) © 2026 SaeedSH
