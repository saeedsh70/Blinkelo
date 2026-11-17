# Blinkelo Link for Android

The companion app for [Blinkelo for Windows](../windows). It speaks the KDE Connect protocol (so it also works with KDE Connect desktop) and adds Bluetooth links, full remote control of the PC and features shared between the phone and the island.

Version **1.0.1** (versionCode 9) · Android 8.0 (API 26) or newer · no third-party libraries, Android SDK only

## Features

### Phone → PC
- **Phone notifications** on the island, with the app icon, quick reply and action buttons
- **Incoming calls** with contact name and photo; silence the ringer from the PC
- **Phone music** on the island with cover art and playback controls
- Phone battery, **ring the phone** from the PC (even on silent)
- **Shared clipboard** (text and images), send files, links and text from any app's Share menu
- **Photo to PC**: take a photo with the phone camera and it lands on the island shelf and the PC clipboard (the PC can also ask for one)

### Control the PC from the phone
- **Touchpad** with pointer acceleration, click, double-click, right-click, two-finger scroll and drag
- Live **keyboard**, send text, shortcuts (copy, paste, Win+D, Alt+Tab…) and F-keys
- **PC media control** with cover art, seek bar and volume, plus a media notification on the lock screen
- **Apps**: launch the island's app shortcuts from the phone
- **Power**: lock, sleep, screen off, restart, shut down, sign out and custom commands
- **Presentation mode** with the volume keys for next/previous slide and a talk timer
- **Screenshot** of the PC sent to the phone
- Live **CPU / RAM / GPU / network** stats
- **PC gaming**: live stats, game library and session summaries from the island's gaming mode
- Quick Settings tiles: clipboard, lock PC, remote

### Shared with Windows
- **Shared planner**: tasks sync both ways, reminders on both devices
- **Shared timers**: a timer started on either side counts down and rings on both
- **Find my PC**: make the PC ring (the island turns red until you stop it)
- **PC notifications on the phone** (Outlook, Teams…)
- **Files from the island to the phone**, with progress on the island

Languages: English, العربية, Türkçe, Español, Русский, 简体中文.

## Build

1. Install [Android Studio](https://developer.android.com/studio) (Ladybug 2024.2 or newer) with the Android 15 (API 35) SDK. Gradle must run on **JDK 17 or 21**: lint (and therefore release builds) fails on JDK 24 and newer. Recent Android Studio versions bundle JDK 25, so set **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** to a JDK 17 or 21 (*Download JDK…* if none is listed). On the command line, point `JAVA_HOME` to it.
2. **File → Open** this `android` folder (the one that contains `settings.gradle`) and wait for Gradle sync.
3. **Run ▶** to install on a connected phone (USB debugging on), or **Build → Build APK(s)**. The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

From the command line:

```bash
./gradlew assembleDebug lintDebug      # Windows: gradlew.bat assembleDebug lintDebug
```

Lint errors stop the build; the report is in `app/build/reports/lint-results-debug.html`.

### Release signing

Android installs an update only if it is signed with the same key as the installed app, so a published APK needs a key you keep forever. Create one once (outside the repository, and back it up):

```powershell
keytool -genkeypair -keystore C:\keys\blinkelo-release.jks -alias blinkelo -keyalg RSA -keysize 4096 -validity 36500 -dname "CN=Blinkelo"
```

Then create `android/keystore.properties` (git-ignored):

```properties
storeFile=C:/keys/blinkelo-release.jks
keyAlias=blinkelo
storePassword=...
keyPassword=...
```

The passwords can also come from the environment variables `BLINKELO_STORE_PASSWORD` / `BLINKELO_KEY_PASSWORD` instead. `./gradlew assembleRelease` then writes a signed `app/build/outputs/apk/release/app-release.apk`. Without `keystore.properties`, release builds are signed with your local debug key (for testing only) and Gradle prints a warning.

### Rebuilding the UI

The app's interface is a WebView page. The prebuilt bundle is committed in `app/src/main/assets/ui`; run this only after changing files in `ui/`:

```bash
npm install -g esbuild   # or set ESBUILD=/path/to/esbuild
sh tools/build-ui.sh
```

## Setup

1. Start Blinkelo on the PC (Settings → Phone connection must be on).
2. Open Blinkelo Link. The welcome screen asks for permissions one by one (notifications, notification access, phone and SMS, Bluetooth, battery optimization). Anything you skip only disables that feature.
3. Put the phone and the PC on the same Wi-Fi. The PC shows up under **Devices** → **Pair** → confirm the 8-digit code on the island.
4. If the PC doesn't show up, use **Add by IP** with the address shown in Blinkelo → Settings → Phone connection, and allow network access if Windows asks.

### Bluetooth (no Wi-Fi)

1. Pair the phone once in **Windows Settings → Bluetooth & devices → Add device**.
2. In the app, keep **Settings → Bluetooth connection** on (default).
3. In Blinkelo → Settings → Phone connection press **Bluetooth search** (it looks for two minutes) and pair.
4. From then on the PC connects over Bluetooth whenever Wi-Fi is unavailable and switches back to Wi-Fi when it returns. Everything — even file transfer up to 150 MB — works over Bluetooth, just slower.

## Project layout

```
android/
├─ app/src/main/java/com/saeedsh/islandlink/
│  ├─ core/            protocol (no Android dependencies): KDE Connect v8, TLS, pairing, Wi-Fi and Bluetooth links
│  ├─ LinkService      foreground connection service
│  ├─ Plugins          packet routing and features
│  ├─ Bridge / MainActivity   WebView ↔ Java bridge
│  └─ …                notifications, media, calls, files, timers, planner, tiles
├─ app/src/main/assets/ui/    built user interface (HTML/CSS/JS)
├─ ui/                        user interface source
├─ tools/build-ui.sh          rebuilds the UI bundle (needs Node.js and esbuild)
├─ verification/              protocol, feature, interop and UI checks
├─ PROTOCOL.md                protocol notes and the island.* packets
└─ build.gradle, settings.gradle, gradlew
```

The package id `com.saeedsh.islandlink` and the `island.*` protocol names are kept from the app's earlier name (Island Link) so existing installs upgrade in place and stay paired.

## Troubleshooting

- **PC not found**: both devices on the same network; VPNs and router "AP isolation" block discovery → use **Add by IP**. Open TCP/UDP 1716 and TCP 1739–1764 in the firewall.
- **Connected, but files from the PC fail**: the PC's Windows Firewall blocks incoming connections (typical when the Wi-Fi is set to *Public* in Windows). See *Troubleshooting* in the [Windows README](../windows/README.md#troubleshooting).
- **Connection drops after a while**: turn off battery optimization for Blinkelo Link.
- **Notifications don't reach the PC**: grant *Notification access* in the app's Permissions page.
- **Bluetooth doesn't connect**: the phone must be paired in Windows and the app must be open (or its service running); check the *Bluetooth* row in Blinkelo → Settings → Status.
