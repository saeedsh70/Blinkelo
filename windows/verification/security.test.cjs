'use strict';
const {test, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const tls = require('node:tls');
const {once} = require('node:events');
const {EventEmitter} = require('node:events');
const {Readable} = require('node:stream');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../src/main/kdeconnect.js');
const mod = new Module(filename, module);
mod.filename = filename; mod.paths = module.paths;
// Real TLS on ephemeral loopback sockets: Windows/Hyper-V may reserve all KDE payload ports.
// Only the port numbers are translated in this fixture; production certificate/stream logic is unchanged.
const ports = new Map();
const testTls = Object.create(tls);
testTls.createServer = (...args) => {
  const server = tls.createServer(...args), listen = server.listen.bind(server);
  server.listen = (logical, host, done) => listen(0, '127.0.0.1', () => { ports.set(logical, server.address().port); done(); });
  return server;
};
testTls.connect = options => tls.connect({...options,port:ports.get(options.port) || options.port});
const requireOriginal = mod.require.bind(mod);
mod.require = name => name === 'tls' ? testTls : requireOriginal(name);
mod._compile(fs.readFileSync(filename, 'utf8') + '\nmodule.exports.Link=Link;module.exports.BtLink=BtLink;module.exports.btTranscript=btTranscript;', filename);
const {KdeConnect,Link,BtLink,btTranscript} = mod.exports;
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'island-security-'));
after(()=>fs.rmSync(work,{recursive:true,force:true}));
const fixtures = [];
function identity(name) {
  const k = new KdeConnect({dir:path.join(work,name)});
  k.loadIdentity(); fixtures.push(k); return k;
}
const pc = identity('pc'), phone = identity('phone'), foreign = identity('foreign');
after(()=>fixtures.forEach(k=>k.stop()));
function link(k, remote, bluetooth=false) {
  const info={deviceId:remote.deviceId,deviceName:'fixture',deviceType:'phone',certSha256:crypto.createHash('sha256').update(remote.ownCertDer).digest('hex'),certRaw:remote.ownCertDer,protocolVersion:8,btAuthenticated:bluetooth};
  if (bluetooth) Object.assign(info,{btSendKey:crypto.randomBytes(32),btReceiveKey:crypto.randomBytes(32),btSendContext:Buffer.from('fixture-out'),btReceiveContext:Buffer.from('fixture-in')});
  const control = new EventEmitter();
  for(const method of ['setEncoding','resume','setKeepAlive','destroy']) control[method]=()=>{};
  control.write=()=>true;
  const l=bluetooth?new BtLink(k,'AA:BB:CC:DD:EE:FF',info):new Link(k,control,info,'127.0.0.1');
  // This fixture exercises payload/frame code after pairing, without a native helper.
  const send = l.send;
  if (bluetooth) { l.send = () => true; k.btSend = () => true; }
  k.addLink(l); k.markPaired(l); l.send = send;
  return l;
}
async function listen(server) {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  ports.set(1740,server.address().port);return 1740;
}
test('payload sender rejects foreign certificate and still serves the genuine peer', {timeout:15000}, async()=>{
  const l=link(pc,phone);
  let announce; l.sock.write=text=>{announce=JSON.parse(text);};
  const promise=l.sendWithPayload('kdeconnect.share.request',{}, {size:6,open:()=>Readable.from([Buffer.from('secret')])});
  for(let i=0;!announce&&i<100;i++)await new Promise(r=>setTimeout(r,10));
  assert.ok(announce);
  let leaked=0;
  const bad=testTls.connect({host:'127.0.0.1',port:announce.payloadTransferInfo.port,...foreign.tlsOptions()});
  bad.on('error',()=>{});bad.on('data',b=>leaked+=b.length);await once(bad,'close');
  assert.equal(leaked,0);
  const good=testTls.connect({host:'127.0.0.1',port:announce.payloadTransferInfo.port,...phone.tlsOptions()});
  const data=[];good.on('data',b=>data.push(b));await once(good,'end');
  assert.equal(Buffer.concat(data).toString(),'secret'); assert.equal(await promise,true);l.close();
});
test('payload receivers reject wrong certificates, truncated data and preserve the destination', {timeout:15000}, async()=>{
  const l=link(pc,phone);
  const file=path.join(work,'received.bin');fs.writeFileSync(file,'existing');
  let server=tls.createServer({...foreign.tlsOptions(),requestCert:true}, s=>{s.on('error',()=>{});s.end('fake');});
  let port=await listen(server);
  assert.equal(await pc.fetchPayload(l,{payloadSize:4,payloadTransferInfo:{port}}),null);
  await new Promise(r=>server.close(r));
  server=tls.createServer({...phone.tlsOptions(),requestCert:true},s=>{s.on('error',()=>{});s.end('short');});
  port=await listen(server);
  assert.equal(await pc.fetchPayloadToFile(l,{payloadSize:100,payloadTransferInfo:{port}},file),false);
  assert.equal(fs.readFileSync(file,'utf8'),'existing');
  assert.equal(fs.readdirSync(work).some(x=>x.includes('.part-')),false);
  await new Promise(r=>server.close(r)); l.close();
});
test('payload receivers save valid bytes and empty files through authenticated sockets', {timeout:15000}, async()=>{
  const l=link(pc,phone);let bytes=Buffer.from('héllo 🌍 日本');
  const server=tls.createServer({...phone.tlsOptions(),requestCert:true},s=>{s.on('error',()=>{});s.end(bytes);});
  const port=await listen(server);
  assert.deepEqual(await pc.fetchPayload(l,{payloadSize:bytes.length,payloadTransferInfo:{port}}),bytes);
  bytes=Buffer.alloc(0);const file=path.join(work,'empty.bin');
  assert.equal(await pc.fetchPayloadToFile(l,{payloadSize:0,payloadTransferInfo:{port}},file),true);
  assert.equal(fs.statSync(file).size,0);
  await new Promise(r=>server.close(r));l.close();
});
test('two incoming files with the same name are both kept', {timeout:15000}, async()=>{
  const l=link(pc,phone);
  const dir=path.join(work,'downloads'), previousDir=pc.downloadDir;
  pc.downloadDir=()=>dir;
  const serve=async(logical,bytes)=>{
    const server=tls.createServer({...phone.tlsOptions(),requestCert:true},s=>{s.on('error',()=>{});s.end(bytes);});
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    ports.set(logical,server.address().port);return server;
  };
  const servers=[await serve(1741,Buffer.from('first photo')),await serve(1742,Buffer.from('second photo!'))];
  const shared=[];const onShare=e=>shared.push(e);pc.on('share',onShare);
  try {
    // both requests arrive together (the phone sends several files at once), so both pick a name before either is saved
    await Promise.all([
      pc.onShare(l,{payloadSize:11,payloadTransferInfo:{port:1741}},{filename:'photo.jpg'}),
      pc.onShare(l,{payloadSize:13,payloadTransferInfo:{port:1742}},{filename:'photo.jpg'}),
    ]);
    const files=fs.readdirSync(dir).sort();
    assert.deepEqual(files,['photo (2).jpg','photo.jpg']);
    assert.deepEqual(files.map(f=>fs.readFileSync(path.join(dir,f),'utf8')).sort(),['first photo','second photo!']);
    assert.equal(new Set(shared.map(e=>e.path)).size,2);
  } finally {
    pc.off('share',onShare);pc.downloadDir=previousDir;
    await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));l.close();
  }
});
test('Bluetooth payloads are paired-only, bounded, exact, ordered, and support empty files',()=>{
  const l=link(pc,phone,true), events=[];l.on('packet',p=>events.push(p));
  const header=(tid,size)=>l.line(JSON.stringify({type:'kdeconnect.share.request',body:{},payloadSize:size,payloadTransferInfo:{bt:tid}}));
  const chunk=(tid,data,last=true,seq=0)=>l.line(JSON.stringify({type:'island.chunk',body:{tid,seq,data,last}}));
  header('../../outside',13*1024*1024);assert.equal(l.pending.size,0);
  header('short',100);chunk('short','eA==');assert.equal(events.length,0);assert.equal(l.pending.size,0);
  header('bad',1);chunk('bad','@@==');assert.equal(l.pending.size,0);
  header('seq',1);chunk('seq','eA==',true,1);assert.equal(l.pending.size,0);
  header('empty',0);chunk('empty','');assert.equal(events[0]._payload.length,0);
  for(let i=0;i<50;i++)header('p'+i,100);
  assert.equal(l.pending.size,4);
  for(const tid of [...l.pending.keys()])l.dropPending(tid);
  header('disk',13*1024*1024);const partial=l.pending.get('disk').file;
  assert.ok(fs.existsSync(partial));
  delete pc.trusted[phone.deviceId];header('unpaired',100);assert.equal(l.pending.has('unpaired'),false);
  l.close();assert.equal(fs.existsSync(partial),false);
});
test('pair approval cannot move to a replaced connection or fingerprint',()=>{
  const l=link(pc,phone);pc.unpair(phone.deviceId);
  assert.equal(pc.requestPair(phone.deviceId),true);
  const changed={...l.info,certSha256:'wrong'};
  const bad=new Link(pc,l.sock,changed,'127.0.0.2');pc.addLink(bad);
  assert.equal(bad.closed,true);assert.equal(pc.links.get(phone.deviceId),l);
  l.close();assert.equal(pc.acceptPair(phone.deviceId),false);
  assert.equal(pc.pairTimers.has(phone.deviceId),false);
});
test('malformed re-pair cannot delete existing trust',()=>{
  const l=link(pc,phone);const before=pc.trusted[phone.deviceId];
  pc.onPair(l,{pair:true,timestamp:NaN});assert.equal(pc.trusted[phone.deviceId],before);
  l.close();
});
test('Bluetooth requires a fresh valid proof, and LAN trust can reconnect over authenticated Bluetooth',()=>{
  const address='AA:BB:CC:DD:EE:FF', remoteNonce='ab'.repeat(32);
  pc.trusted[phone.deviceId]={certSha256:crypto.createHash('sha256').update(phone.ownCertDer).digest('hex')};
  const sent=[];pc.btSend=(_address,line)=>{sent.push(JSON.parse(line));return true;};
  const start=()=>{
    pc.btOpened(address,'fixture');const hello=sent.at(-1).body;
    pc.btLine(address,JSON.stringify({type:'kdeconnect.identity',body:phone.identityBody({certificate:phone.ownCertDer.toString('base64'),btAuth:2,nonce:remoteNonce})}));
    return hello;
  };
  const makeProof=(hello,signer)=>{
    const sealed=crypto.publicEncrypt({key:pc.certPem,oaepHash:'sha256'},crypto.randomBytes(32));
    const transcript=btTranscript(phone.deviceId,pc.deviceId,remoteNonce,hello.nonce,crypto.createHash('sha256').update(phone.ownCertDer).digest('hex'),crypto.createHash('sha256').update(pc.ownCertDer).digest('hex'));
    return {key:sealed.toString('base64'),signature:crypto.sign('RSA-SHA256',Buffer.concat([transcript,sealed]),signer).toString('base64')};
  };
  let hello=start();
  pc.btLine(address,JSON.stringify({type:'island.bt.auth',body:makeProof(hello,foreign.keyPem)}));
  assert.equal(pc.btLinks.has(phone.deviceId),false);
  hello=start();
  const proof=makeProof(hello,phone.keyPem);
  pc.btLine(address,JSON.stringify({type:'island.bt.auth',body:proof}));
  assert.equal(pc.devices.get(phone.deviceId).paired,true);pc.btLinks.get(phone.deviceId).close();
  start();pc.btLine(address,JSON.stringify({type:'island.bt.auth',body:proof}));
  assert.equal(pc.btLinks.has(phone.deviceId),false);
});

test('Bluetooth frames encrypt application data and reject replay or modification',()=>{
  const l=link(pc,phone,true),frames=[],delivered=[];
  l.info.btReceiveKey=l.info.btSendKey;l.info.btReceiveContext=l.info.btSendContext;
  pc.btSend=(_addr,line)=>{frames.push(line);return true;};
  l.on('packet',p=>delivered.push(p));
  assert.equal(l.send('test.private',{text:'PRIVATE_CONTENT'}),true);
  assert.equal(frames[0].includes('PRIVATE_CONTENT'),false);
  l.receiveWireLine(frames[0]);assert.equal(delivered[0].body.text,'PRIVATE_CONTENT');
  l.receiveWireLine(frames[0]);assert.equal(l.closed,true);
  const second=link(pc,phone,true);second.info.btReceiveKey=second.info.btSendKey;second.info.btReceiveContext=second.info.btSendContext;
  pc.btSend=(_addr,line)=>{frames.push(line);return true;};
  second.send('test.private',{text:'more private data'});
  const modified=JSON.parse(frames.at(-1)), data=Buffer.from(modified.body.data,'base64');data[0]^=1;
  modified.body.data=data.toString('base64');second.receiveWireLine(JSON.stringify(modified));
  assert.equal(second.closed,true);
});

test('file success waits for the intended receiver to confirm storage', async()=>{
  const l=link(pc,phone);pc.devices.get(phone.deviceId).island={features:['transfer-ack']};
  let body;
  l.sendWithPayload=async(_type,b)=>{body=b;return true;};
  let settled=false;const promise=pc.sendPayload(phone.deviceId,'kdeconnect.share.request',{}, {size:1}).then(ok=>{settled=true;return ok;});
  await new Promise(r=>setImmediate(r));assert.equal(settled,false);
  const other=link(pc,foreign);
  pc.onPacket(other,{type:'island.transfer.result',body:{id:body.transferId,ok:true}});
  await new Promise(r=>setImmediate(r));assert.equal(settled,false);
  pc.onPacket(l,{type:'island.transfer.result',body:{id:body.transferId,ok:false}});
  assert.equal(await promise,false);assert.equal(pc.transferAcks.size,0);
  l.close();other.close();
});

test('Bluetooth rejects oversized outgoing files before opening the source',async()=>{
  const l=link(pc,phone,true);let opened=false;
  assert.equal(await l.sendWithPayload('kdeconnect.share.request',{}, {size:150*1024*1024+1,open:()=>{opened=true;}}),false);
  assert.equal(opened,false);l.close();
});

test('multiple timers cancel by ID and offline deletions survive restart',()=>{
  const {PhoneLink}=require('../src/main/phonelink');
  const packets=[], events=[], kde=new EventEmitter();
  kde.sendIsland=(type,body)=>packets.push({type,body});kde.sendTo=()=>true;
  const options={kde,settings:{data:{phone:{}}},toIsland:(_type,e)=>events.push(e),timerFile:path.join(work,'timers.json')};
  const bridge=new PhoneLink(options),now=Date.now();
  bridge.timerFromIsland({op:'start',timer:{syncId:'A',duration:60,endsAt:now+60000}});
  bridge.onPhoneTimer({body:{id:'B',duration:90000,remaining:90000,state:'running',updated:now}});
  assert.equal(bridge.timers.size,2);assert.equal(bridge.timer.id,'A');
  bridge.timerFromIsland({op:'stop',timer:{syncId:'A'}});
  assert.ok(packets.find(p=>p.body.id==='A'&&p.body.state==='cancel'));
  assert.equal(bridge.timers.has('B'),true);bridge.dispose();
  const restored=new PhoneLink(options);
  restored.onPhoneTimer({body:{id:'A',state:'running',remaining:50000,updated:now-1}});
  assert.equal(restored.timers.has('A'),false);assert.equal(restored.timers.has('B'),true);restored.dispose();
});

