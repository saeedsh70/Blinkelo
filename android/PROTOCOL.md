# Blinkelo Link protocol

> Blinkelo (Windows, formerly Dynamic Island) and Blinkelo Link (Android, formerly Island Link). Packet types keep their `island.` prefix
> for compatibility; the `app` field of `island.hello` is now `"Blinkelo"` / `"Blinkelo Link"` and is informational only.

Blinkelo Link speaks **KDE Connect protocol v8** and adds a set of `island.*` packets plus a Bluetooth transport.
Any KDE Connect client keeps working with Blinkelo, and Blinkelo Link keeps working with KDE Connect desktops;
the extra features light up when both ends announce them in `island.hello`.

## Transport

### Wi-Fi (standard KDE Connect)
- Discovery: UDP broadcast of a `kdeconnect.identity` packet to port **1716** (plus mDNS `_kdeconnect._udp`).
- The side that *received* the UDP identity opens TCP to the sender's `tcpPort` (1716–1764), writes its identity in
  plain text and becomes the **TLS server**; the accepting side reads that identity and becomes the **TLS client**.
- Protocol v8: after the TLS handshake both sides send their identity again inside TLS; both must agree on the version.
- Certificates are self-signed (CN = device id). A paired device is pinned by the SHA-256 of its certificate.
- Pairing: `kdeconnect.pair {pair:true, timestamp}`. Verification code = first 8 hex chars (upper case) of
  `sha256(bigger SPKI ‖ smaller SPKI ‖ timestamp)`, shown on both screens.
- Payloads: the sender listens on a free port in **1739–1764** and puts `payloadSize` and
  `payloadTransferInfo: {port}` on the packet; the receiver connects with TLS (client role) and reads exactly
  `payloadSize` bytes.

### Bluetooth (Blinkelo Link extension)
- The phone runs an RFCOMM server, service UUID **`a8d1f0c2-6b7e-4f1a-9c3d-2e5b7a9c1d40`**, name `Blinkelo Link`.
- Blinkelo connects as a client to phones that are paired in Windows (major device class "phone"), only while no
  Blinkelo Link phone is reachable over Wi-Fi, or for two minutes after "Bluetooth search" is pressed.
- OS-bonded RFCOMM supplies radio encryption. Application authentication additionally requires both sides to send
  `kdeconnect.identity` with `bluetooth:true`, `certificate` (base64 DER), `btAuth:2`, and a fresh 32-byte random
  `nonce` (64 lowercase hex characters). A public certificate alone does not authorize a Bluetooth connection.
- After checking the certificate CN and pinned fingerprint, each side generates a random 32-byte directional
  seed and encrypts it to its peer's RSA public key with OAEP (SHA-256 and MGF1-SHA-256, empty label).
  It sends `island.bt.auth {key, signature}`, both base64. The signature uses SHA256withRSA / RSA PKCS#1 v1.5
  over the UTF-8 transcript followed immediately by the encrypted seed bytes.
  Transcript fields are separated by newlines and end with a newline: `island.bt.auth.v2`, sender device ID, receiver device ID,
  sender nonce, receiver nonce, sender certificate SHA256 hex fingerprint, receiver certificate SHA256 hex fingerprint.
  Both proofs must verify before application messages. LAN trust can then be reused on Bluetooth without unpairing.
  Legacy Bluetooth peers without proofs are rejected; both apps must be from this release or newer.
- The directional AES key is SHA256(seed || transcript). All subsequent packets (including pair requests and
  chunks) travel as `island.bt.frame {seq, data}` with AES-256-GCM. The 12-byte IV is four zero bytes followed by
  the sequence as an unsigned 64-bit big-endian integer; AAD is that direction's transcript. Data is base64
  ciphertext followed by the 16-byte GCM tag. Each direction starts at zero and requires the exact next integer
  (maximum 2^53-1); authentication failure or replay closes the link. This protects content from a relay as well
  as from certificate copying; no application packet is accepted in plaintext. The RSA exchange does not provide
  forward secrecy against later compromise of a long-term private key.
- Payloads travel inline: the packet carries `payloadSize` and `payloadTransferInfo: {bt: "<tid>"}`, followed by
  `island.chunk {tid, seq, data, last}` packets (`data` = base64 of up to 48 KiB, `seq` counts from 0).
  Chunks may interleave with normal packets. Both sides advertise `maxBluetoothPayload` in identity, capped at
  150 MiB. Invalid sizes, sequences and premature final chunks are rejected; zero-byte payloads use an empty
  final chunk. Unpaired links cannot allocate storage. Assemblers bound pending transfers, memory and reserved
  bytes and delete stalled or unused temporary files.

When both links are up, packets go over Wi-Fi. Island peers advertise `islandPortFallback:1` in identity;
only between peers advertising this extension may ephemeral ports (1024–65535) be used when all standard
control or payload ports are unavailable. Standard KDE peers retain the usual port ranges. Every separate
LAN payload TLS connection must present the same pinned certificate as its paired control link.

## Capabilities

`island.hello` is exchanged right after a paired link comes up:

```json
{ "app": "Blinkelo Link", "version": "1.0.0", "platform": "android", "model": "Samsung SM-S921B",
  "features": ["mousepad", "presenter", "systemvolume", "runcommand", "sysinfo", "apps", "screenshot", "pcmedia",
               "tasks", "timers", "camera", "pcnotify", "findpc", "bluetooth", "clipboard-image", "transfer-ack"] }
```
The PC answers with its own `island.hello` (`app: "Blinkelo"`, `platform: "windows"`, `hostname`).

## Standard packets used

| Packet | Direction | Notes |
|---|---|---|
| `kdeconnect.notification` / `.request` / `.reply` / `.action` | phone ⇄ PC | phone notifications, icon as payload |
| `kdeconnect.mpris` / `.request` | phone ⇄ PC | phone media on the PC, album art as payload |
| `kdeconnect.telephony` / `.request_mute` | phone ⇄ PC | incoming calls |
| `kdeconnect.sms.request` | PC → phone | `{sendSms, phoneNumber, messageBody}` |
| `kdeconnect.battery` / `.request` | phone ⇄ PC | |
| `kdeconnect.findmyphone.request` | PC → phone | ring the phone |
| `kdeconnect.clipboard` | both | `{content}` |
| `kdeconnect.share.request` | both | `{url}` / `{text}` / file payload with `{filename}`; photos from the phone camera add `island: {camera: true}` |
| `kdeconnect.mousepad.request` | phone → PC | `dx/dy`, `scroll`, `singleclick`, `doubleclick`, `rightclick`, `middleclick`, `singlehold`, `singlerelease`, `key`, `specialKey`, modifiers `ctrl/alt/shift/super`; extension: `vk` (Windows virtual-key code, e.g. media keys) |
| `kdeconnect.presenter` | phone → PC | pointer motion |
| `kdeconnect.systemvolume` / `.request` | both | `{sinkList:[{name, description, volume, maxVolume, muted, enabled}]}`, `{name, volume}`, `{name, muted}` |
| `kdeconnect.runcommand` / `.request` | both | `commandList` is a JSON string `{key: {name, command}}`; built-in keys below |

Built-in commands (always offered by Blinkelo): `island.lock`, `island.sleep`, `island.monitoroff`,
`island.restart`, `island.shutdown`, `island.signout`. Custom commands are configured on the PC.

## Island packets

| Packet | Direction | Body |
|---|---|---|
| `island.sysinfo.request` | phone → PC | `{subscribe: bool}` — subscription lasts 25 s, renew every 10 s |
| `island.sysinfo` | PC → phone | `{cpu, ram, ramUsed, ramTotal (GB), gpu, gpuTemp, netDown, netUp (B/s), battery, charging, hostname, uptime, volume, muted}` every 2 s |
| `island.apps.request` | phone → PC | `{}` |
| `island.apps` | PC → phone | `{deck:1, apps:[{id, name, kind, icon (data URL or null), color, glyph, size ("1x1"\|"2x1"\|"2x2"), hint}]}` — `deck:1` and the last four fields come from Blinkelo 1.5+; kind is file/aumid/url/hotkey/media/action/command/text |
| `island.apps.launch` | phone → PC | `{id}` |
| `island.screenshot.request` | phone → PC | `{}` |
| `island.screenshot` | PC → phone | JPEG payload, `{w, h}`; `{error:true}` on failure |
| `island.media` | PC → phone | `{present, title, artist, album, status, source, position, duration, canPlay, canPause, canNext, canPrev, canSeek, artKey, art?, keepArt?}` — `art` (data URL) is sent once per `artKey` |
| `island.media.request` | phone → PC | `{action: playpause|play|pause|next|prev|seek, position?}` |
| `island.tasks` | both | `{op:"sync", tasks:[…], tombstones:{id: at}}`, `{op:"upsert", task}`, `{op:"remove", id, at}` |
| `island.timer` | both | `{id, label, duration (ms), remaining (ms), state, origin, updated (ms)}`; state is running/cancel/done |
| `island.findpc` | phone → PC | `{action: start|stop}` |
| `island.findpc.state` | PC → phone | `{ringing: bool}` |
| `island.camera.request` | PC → phone | `{mode:"photo"}` — the photo comes back as a share with `island.camera` |
| `island.pcnotify` | PC → phone | `{id, app, title, text, time, icon?}` or `{id, cancel:true}` |
| `island.clipboard.image` | both | PNG payload |
| `island.chunk` | both (Bluetooth) | `{tid, seq, data, last}` |

### Shared planner merge rule
Every task carries `updated` (ms). Removing a task leaves a tombstone `{id: at}` (kept 30 days).
On `upsert`, the incoming task wins if its `updated` is newer than the local copy and newer than any tombstone;
on `remove`, the local task is deleted if it was not edited after `at`. `sync` applies all tombstones, then all tasks.
Both sides send a full `sync` on connect, so edits made while apart converge.

### Transfer completion and timer reconciliation

When both sides advertise `transfer-ack`, file shares carry `body.transferId`. After saving and publishing the
complete file, the receiver sends `island.transfer.result {id: transferId, ok: true}`; failures use `ok:false`.
An acknowledgement is accepted only from the intended paired device. Local queue completion alone is not
reported as successful delivery. The extension is optional for standard KDE peers.

Timers are stored by ID, with a monotonic-per-edit `updated` timestamp. Cancellation/expiry leaves a tombstone
for 30 days. Reconnect replays tombstones before running timers, and equal/older updates cannot reset a timer
or revive a cancelled one. Windows keeps the full timer list and highlights one; each ID can be selected/cancelled.
Pausing the highlighted Windows timer cancels its running copy on the phone; resuming sends a newer running update.
