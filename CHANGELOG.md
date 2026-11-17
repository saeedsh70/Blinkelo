# Changelog

## Blinkelo for Windows

### 2.0.0 — Blinkelo
- New name and identity: the app is now **Blinkelo** (windows, tray, about page, all languages, Windows app id `com.saeedsh.blinkelo`, `Blinkelo.exe`). The phone app is now **Blinkelo Link**; the protocol and the Android package id are unchanged, so paired phones keep working.
- Settings move to `%APPDATA%\Blinkelo`. On the first start, settings, phone pairing, tasks, timers, the shelf and saved keys are copied from `%APPDATA%\Dynamic Island` (the old folder is left untouched); the result is logged in `migrated-from.json` and `main.log`.
- New icon: a black island with two glowing eyes, one of them winking (`assets/brand/*.svg`), plus a simplified version for small sizes and the tray.
- Blinkelo's eyes (optional): while idle the island opens its eyes every minute or two, looks around, blinks or winks and goes back to sleep, squashing and stretching with spring physics. A full "hello" plays at start.
- Every new event — notification, message, call, pairing request, received file, new song, finished timer, game summary, subtitle ready — arrives with a blink: the content closes to a glowing line and opens on the news, coloured by the kind of event. The tray icon blinks too.
- Settings → Appearance: *Hello at start* (on), *Blinkelo's eyes* (off), *Blink for new events* (on). The animations respect Windows "Animation effects".
- Fixes: the clock no longer flashes before the hello at start; dragging the island works while a long song title scrolls.
- Shared animation kit `src/renderer/shared/blink.js` / `blink.css` (also used by the Android app).

### 1.8.0 — Gaming guide and phone gaming
- Step-by-step gaming guide in the gaming tab.
- Live game stats, the game library, commands and session summaries on Blinkelo Link.

### 1.7.5 — Real Full Screen games
- In *Automatic* mode, RivaTuner's in-game text is used when Windows reports a game as exclusive fullscreen and RivaTuner is running; otherwise the island's own bar is shown.
- The helper checks every second whether RivaTuner is running and switches the bar accordingly; no more flicker when a game briefly loses the foreground; foreground changes are logged.

### 1.7.4 — Game bar without RivaTuner
- *Automatic* mode always uses the island's own overlay bar; the optimizer no longer starts RivaTuner by itself. The bar is brought back on top every two seconds.

### 1.7.3 — Fixes
- Games from the library start with the executable that actually ran before, in the registered working folder, with a fallback when the process exits within 10 seconds. Games no longer inherit Electron's environment variables. Every launch attempt is logged.

### 1.7.2 — Fixes
- No "write after end" error on quit; the overlay bar comes back when RivaTuner is missing; CPU/GPU temperatures are read after 24.9+ days of uptime; gaming optimizations are restored on quit (and completed on the next start if interrupted); `helper.log` rotates at 2 MB and a crash-looping helper backs off.

### 1.7.1 — Game library and exclusive fullscreen
- Game library (Steam, Epic, GOG, Ubisoft, played games, custom) with launch from the island, and RivaTuner on-screen display for exclusive fullscreen games.

### 1.7.0 — Gaming mode
- One-click optimizer (power plan, Game Mode, closing chosen apps, memory trim, priority, Xbox Game Bar recording), fully reversible.
- Click-through overlay bar with FPS, 1% low, frame time, CPU/GPU usage and temperatures, GPU power, VRAM, RAM, ping, clock, play time and battery.
- Automatic game detection, *My games* / *Never a game* lists, quiet island while playing, session summaries.

### 1.6.0 — Subtitles
- Detects the video playing in desktop players and finds subtitles from SubDL, OpenSubtitles and Podnapisi in up to three languages, converts them to UTF-8 and offers them for drag and drop onto the player.

### 1.5.0 — Glass theme, editable home, deck
- Frosted-glass theme with adjustable transparency, an editable home grid and a configurable key deck.

### 1.4.1
- File channel bound to the paired device's certificate, Bluetooth verified with a fresh identity-key signature, incomplete file transfers rejected.
- Task deletion survives restarts, clipboard text is kept in full, multiple timers sync by id, the hide-notification-text setting applies everywhere, and several smaller fixes.

### 1.4 — Blinkelo Link
- Companion Android app with Bluetooth links, PC remote control (touchpad, keyboard, shortcuts, media, apps, presentation mode, screenshots, live stats, power and custom commands), shared planner and timers, find my PC, phone tools on the island, file/photo/link transfer, shared clipboard and PC notifications on the phone.

### 1.3.1
- More reliable icons for Microsoft Store apps and `.lnk` shortcuts.

### 1.3
- Compact system monitor; widgets for crypto prices, news feeds and world clocks; persistent "Clear all"; app icons; image clipboard history; the Planner tab with tasks and reminders.

### 1.2
- Left-click fix for the non-focusable island window, soft glow, song title in the compact pill, support for classic players (VLC 3, PotPlayer, MPC-HC/BE, KMPlayer, GOM, mpv, Winamp).

### 1.1
- Multiple languages, direct phone connection without Phone Link, movable island, compact and hidden modes, app shortcuts, weather, and many fixes.

## Blinkelo Link for Android

### 1.1.0
- Renamed from Island Link to **Blinkelo Link** (app name, service notification, Bluetooth service, all texts). The package id, signing key and `island.*` protocol are unchanged so the app upgrades in place and stays paired.
- New icon (launcher, Android 13 monochrome and status bar).
- Blinkelo's face on the home screen: eyes closed until the PC connects, waking up with a wink; the about logo says hello, follows your finger and winks when touched.
- Received files are saved in `Download/Blinkelo`.

### 1.0.5
- PC gaming page: live stats, game library and session summaries.

### 1.0.3
- Bluetooth authentication with digital signatures, a fixed target PC, no clashing timer notifications, offline cancel kept, proper service stop and screen-reader labels.

### 1.0.2
- Fixed a crash in "Connect to your PC" (network discovery moved off the main thread).
