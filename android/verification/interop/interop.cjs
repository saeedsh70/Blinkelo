'use strict';
// No modification to the Windows application. Uses its actual KdeConnect class.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dgram = require('node:dgram');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const windowsRoot = path.resolve(root, '../windows dynamic island');
const portable = ['Blinkelo', 'Dynamic Island'].map((d) => path.join(windowsRoot, d)).find((d) => fs.existsSync(path.join(d, 'resources/app/node_modules/node-forge'))) || path.join(windowsRoot, 'Blinkelo');
const forge = require(path.join(portable, 'resources/app/node_modules/node-forge'));
const { KdeConnect } = require(path.join(windowsRoot, 'source/src/main/kdeconnect'));
const javaHome = process.env.JAVA_HOME;
if (!javaHome) throw new Error('Set JAVA_HOME to a full JDK (17 or newer).');
const runtime = path.join(__dirname, 'runtime', crypto.randomUUID()); fs.mkdirSync(runtime, { recursive: true });

const sources = path.join(root, 'app/src/main/java/com/saeedsh/islandlink/core');
const classes = path.join(runtime, 'classes'); fs.mkdirSync(classes);
execFileSync(path.join(javaHome, 'bin/javac.exe'), ['--release', '8', '-d', classes, ...fs.readdirSync(sources).filter(f => f.endsWith('.java')).map(f => path.join(sources, f)), path.join(__dirname, 'WindowsHarness.java')], { stdio: 'inherit' });
function identity(id) {
  const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
  const key = forge.pki.privateKeyFromPem(pair.privateKey);
  const cert = forge.pki.createCertificate(); cert.publicKey = forge.pki.setRsaPublicKey(key.n, key.e); cert.serialNumber = '01';
  cert.validity.notBefore = new Date(Date.now() - 864e5); cert.validity.notAfter = new Date(Date.now() + 365 * 864e5);
  cert.setSubject([{ name: 'commonName', value: id }]); cert.setIssuer(cert.subject.attributes); cert.sign(key, forge.md.sha256.create());
  return { deviceId: id, certPem: forge.pki.certificateToPem(cert), keyPem: pair.privateKey, cert, key };
}
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitFor(predicate, label, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const found = predicate(); if (found) return found; await delay(30); }
  throw new Error(`Timed out: ${label}`);
}
async function run(direction) {
  const phoneId = crypto.randomUUID().replaceAll('-', ''), desktopId = crypto.randomUUID().replaceAll('-', '');
  const directory = path.join(runtime, direction); fs.mkdirSync(directory);
  const desktopIdentity = identity(desktopId), phoneIdentity = identity(phoneId);
  fs.writeFileSync(path.join(directory, 'identity.json'), JSON.stringify(desktopIdentity));
  const phoneFile = path.join(directory, 'phone'); fs.mkdirSync(phoneFile);
  fs.writeFileSync(path.join(phoneFile, 'identity.json'), JSON.stringify({deviceId: phoneId, key: crypto.createPrivateKey(phoneIdentity.keyPem).export({format: 'der', type: 'pkcs8'}).toString('base64'), cert: Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(phoneIdentity.cert)).getBytes(), 'binary').toString('base64')}));
  const desktopLogs = [];
  const windows = new KdeConnect({ dir: directory, log: message => desktopLogs.push(message) }); windows.loadIdentity(); windows.startTcp(1716);
  await waitFor(() => windows.tcpPort, 'Windows TCP listener');
  const events = [], windowsEvents = [], logs = [];
  for (const event of ['notification', 'battery', 'ping', 'media', 'notificationRemoved', 'pairRequest']) windows.on(event, value => windowsEvents.push({ event, value }));
  const java = spawn(path.join(javaHome, 'bin/java.exe'), ['-cp', classes, 'com.saeedsh.islandlink.core.WindowsHarness', phoneFile, phoneId, desktopId], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = ''; java.stdout.on('data', data => { buffer += data; let i; while ((i = buffer.indexOf('\n')) >= 0) { const line = buffer.slice(0, i); buffer = buffer.slice(i + 1); try { events.push(JSON.parse(line)); } catch {} } });
  java.stderr.on('data', data => logs.push(data.toString()));
  const command = value => java.stdin.write(JSON.stringify(value) + '\n');
  const current = () => events.filter(e => e.event === 'state').at(-1)?.peers.find(p => p.id === desktopId);
  const marker = () => events.length;
  const packet = (type, from) => events.slice(from).find(e => e.event === 'packet' && e.type === type);
  try {
    const started = await waitFor(() => events.find(e => e.event === 'started'), 'Java TCP listener');
    if (direction === 'windows-initiates') {
      await windows.connectTo('127.0.0.1', started.port, { deviceId: phoneId, protocolVersion: 8 });
    } else {
      command({ action: 'connect', port: windows.tcpPort, identity: windows.identityBody({tcpPort: windows.tcpPort}) });
    }
    await waitFor(() => current()?.connected && windows.links.has(phoneId), 'mutual TLS and encrypted identity');
    // Application data before pairing must not be dispatched.
    let mark = marker(); windows.links.get(phoneId).send('kdeconnect.ping', { message: 'must be ignored' }); await delay(200);
    assert.equal(packet('kdeconnect.ping', mark), undefined);
    windows.requestPair(phoneId);
    await waitFor(() => current()?.pairState === 'incoming', 'incoming pairing request');
    assert.equal(current().code, windows.devices.get(phoneId).verifyKey, 'verification codes must agree');
    command({ action: 'accept' });
    await waitFor(() => current()?.paired && windows.trusted[phoneId], 'pairing accepted');
    // Production Windows requests battery, notifications and MPRIS immediately after pairing.
    for (const type of ['kdeconnect.battery.request', 'kdeconnect.notification.request', 'kdeconnect.mpris.request']) await waitFor(() => packet(type, 0), type);
    command({ action: 'send', type: 'kdeconnect.battery', body: { currentCharge: 73, isCharging: true } });
    await waitFor(() => windows.devices.get(phoneId)?.battery === 73, 'battery state');
    command({ action: 'send', type: 'kdeconnect.notification', body: { id: 'test-notification', title: 'Test message ✓', text: 'Héllo from Android 🌍 日本', appName: 'Test', requestReplyId: 'reply-test', actions: ['Open'] } });
    const notification = await waitFor(() => windowsEvents.find(e => e.event === 'notification'), 'notification in Windows');
    assert.equal(notification.value.text, 'Héllo from Android 🌍 日本');
    mark = marker(); windows.notificationReply(phoneId, 'reply-test', 'Réply from Windows ✓');
    const reply = await waitFor(() => packet('kdeconnect.notification.reply', mark), 'quick reply command'); assert.equal(reply.body.message, 'Réply from Windows ✓');
    mark = marker(); windows.notificationDismiss(phoneId, 'test-notification');
    assert.equal((await waitFor(() => packet('kdeconnect.notification.request', mark), 'dismiss command')).body.cancel, 'test-notification');
    command({ action: 'send', type: 'kdeconnect.mpris', body: { playerList: ['Test Player'], supportAlbumArtPayload: false } });
    command({ action: 'send', type: 'kdeconnect.mpris', body: { player: 'Test Player', title: 'Test Track', artist: 'Test Artist', isPlaying: true, pos: 12000, length: 180000, canSeek: true } });
    await waitFor(() => windows.currentPlayer()?.title === 'Test Track', 'phone media state');
    mark = marker(); windows.mediaAction('Next');
    assert.equal((await waitFor(() => events.slice(mark).find(e => e.type === 'kdeconnect.mpris.request' && e.body.action), 'media control')).body.action, 'Next');
    mark = marker(); windows.findPhone(phoneId); await waitFor(() => packet('kdeconnect.findmyphone.request', mark), 'find phone');
    command({ action: 'send', type: 'kdeconnect.ping', body: { message: 'Android transport verified' } });
    await waitFor(() => windowsEvents.find(e => e.event === 'ping'), 'phone ping');
    // Disconnect/reconnect must preserve trust, and reject a replacement certificate for same ID.
    windows.links.get(phoneId).close(); await waitFor(() => !current()?.connected, 'disconnect');
    await delay(1600); // Respect the production 1.5-second handshake rate limit.
    await windows.connectTo('127.0.0.1', started.port, { deviceId: phoneId, protocolVersion: 8 });
    await waitFor(() => current()?.paired && current()?.connected, 'pinned reconnect');
    windows.links.get(phoneId).close(); await waitFor(() => !current()?.connected, 'disconnect for certificate change');
    const oldCert = windows.certPem, oldKey = windows.keyPem, replacement = identity(desktopId);
    windows.certPem = replacement.certPem; windows.keyPem = replacement.keyPem;
    await delay(1600);
    await windows.connectTo('127.0.0.1', started.port, { deviceId: phoneId, protocolVersion: 8 }).catch(() => {});
    await waitFor(() => events.find(e => e.event === 'log' && /certificate.*changed/.test(e.message)), 'changed certificate rejection');
    windows.certPem = oldCert; windows.keyPem = oldKey;
    await delay(1600);
    await windows.connectTo('127.0.0.1', started.port, { deviceId: phoneId, protocolVersion: 8 });
    await waitFor(() => current()?.paired && current()?.connected, 'reconnect with original certificate');
    command({ action: 'unpair' }); await waitFor(() => !current()?.paired && !windows.trusted[phoneId], 'unpair');
    command({ action: 'pair' }); await waitFor(() => windows.devices.get(phoneId)?.pairState === 'requestedByPeer', 'phone-initiated pairing');
    assert.equal(current().code, windows.devices.get(phoneId).verifyKey);
    windows.acceptPair(phoneId); await waitFor(() => current()?.paired, 'phone pairing accepted');
    const result = { direction, passed: true, checks: ['TLS + v8 secure identity', 'unpaired packet rejection', 'matching verification codes', 'pair both directions', 'battery', 'Unicode notification', 'quick reply', 'dismiss', 'MPRIS + controls', 'find phone', 'ping', 'pinned reconnect', 'changed certificate rejection', 'unpair'] };
    console.log(JSON.stringify(result)); return result;
  } catch (error) {
    fs.writeFileSync(path.join(directory, 'failure.json'), JSON.stringify({ events, desktopLogs, logs }, null, 2));
    console.error('Diagnostics: ' + path.join(directory, 'failure.json'));
    throw error;
  } finally {
    command({ action: 'quit' });
    await Promise.race([new Promise(resolve => java.once('exit', resolve)), delay(2000)]); if (java.exitCode === null) java.kill();
    windows.stop();
    if (logs.length) console.error(logs.join(''));
  }
}
(async () => {
  const results = [];
  for (const direction of ['windows-initiates', 'android-initiates']) { results.push(await run(direction)); await delay(300); }
  fs.writeFileSync(path.join(__dirname, 'interop-result.json'), JSON.stringify({ timestamp: new Date().toISOString(), runtime: 'Desktop JVM transport test against original Windows KdeConnect class; Android OS permissions and UI not exercised', results }, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
