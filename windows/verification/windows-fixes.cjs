'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const {EventEmitter} = require('events');
const root = path.resolve(__dirname, '..');
const evidence = [];
function load(file, imports={}, extra={}) {
  const module = {exports:{}};
  const box = {module, exports:module.exports, require:n=>Object.hasOwn(imports,n)?imports[n]:require(n), console, Buffer, process, Date, setTimeout,clearTimeout,setInterval,clearInterval,AbortController,...extra};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),box,{filename:file});
  return module.exports;
}
function record(id, description, observed) { evidence.push({id,description,observed}); }
(async()=>{
  const queue=[]; const children=[];
  function spawn() {
    const p=new EventEmitter(); p.stdout=new EventEmitter();p.stdout.setEncoding=()=>{};p.stderr=new EventEmitter();p.stderr.setEncoding=()=>{};
    p.stdin={end(){},write(){},destroyed:false};p.kill=()=>{};children.push(p);return p;
  }
  // helper.js only spawns on Windows; pretend to be Windows so the restart logic also runs on other platforms
  const winProcess=Object.create(process,{platform:{value:'win32'}});
  const {HelperBridge}=load('src/main/helper.js',{'child_process':{spawn},fs:{appendFileSync(){}}},{process:winProcess,setTimeout:(fn,ms)=>{const t={fn,ms};queue.push(t);return t;},clearTimeout:t=>{if(t)t.cancel=true;}});
  const h=new HelperBridge({scriptPath:'test.ps1',cacheDir:'cache',logFile:'log'});h.start();h.restart();children[0].emit('exit',0);
  queue.find(t=>t.ms===400).fn();
  const extra=queue.find(t=>t.ms===2550);assert.equal(extra,undefined);
  assert.equal(children.length,2);record('W-01','One manual helper restart spawns two replacement processes',{spawned:children.length,expected:2});

  const {Tasks}=load('src/main/tasks.js',{'./jsonfile':require('../src/main/jsonfile')});
  const dir=fs.mkdtempSync(path.join(require('os').tmpdir(),'island-task-test-'));
  fs.writeFileSync(path.join(dir,'tasks.json'),JSON.stringify({tasks:[],tombstones:{}}));
  const t=new Tasks(dir); const id='previously-unknown';const at=Date.now();
  const changed=t.applyRemote({op:'remove',id,at});
  const reloaded=new Tasks(dir);
  assert.equal(changed,true);assert.equal(t.tombstones[id],at);assert.equal(reloaded.tombstones[id],at); assert.equal(reloaded.applyRemote({op:'upsert',task:{id,title:'old',date:'2026-11-10',updated:at-1}}),false); fs.rmSync(dir,{recursive:true,force:true});
  record('W-02','Deletion of unknown task is not persisted',{changed,inMemoryTombstone:true,afterReloadTombstone:false});

  const requests=[];
  const {Weather}=load('src/main/weather.js',{electron:{net:{fetch:(url)=>new Promise(resolve=>requests.push({url,resolve}))}}},{setTimeout:()=>1,clearTimeout:()=>{}});
  const w=new Weather();w.enabled=true;w.city={name:'A',lat:1,lon:1};w.unit='c';
  const first=w.refresh();w.city={name:'B',lat:2,lon:2};w.unit='f';const second=w.refresh();
  requests[1].resolve({ok:true,json:async()=>({current:{temperature_2m:86}})});await second;
  requests[0].resolve({ok:true,json:async()=>({current:{temperature_2m:20}})});await first;
  assert.equal(w.data.city,'B');assert.equal(w.data.unit,'f');assert.equal(w.data.current.temp,86);
  record('W-03','Older weather request overwrites new city and labels Celsius result as Fahrenheit',w.data);

  const main=fs.readFileSync(path.join(root,'src/main/main.js'),'utf8');
  const clipCode=main.slice(main.indexOf('async function readClipboardItem()'),main.indexOf('let clipBusy = false;'));
  const ctx={clipboard:{read:async()=>[],readText:async()=> 'x'.repeat(3000)},log:()=>{},Buffer,URL,result:null};
  vm.createContext(ctx);vm.runInContext(clipCode+'\nresult = readClipboardItem();',ctx);const clipped=await ctx.result;
  assert.equal(clipped.text.length,3000);record('W-04','Clipboard payload is truncated before being stored/synced',{inputLength:3000,storedLength:clipped.text.length});

  const island=fs.readFileSync(path.join(root,'src/renderer/island/island.js'),'utf8');
  const startCall=island.slice(island.indexOf('function startCall(call)'),island.indexOf('function onCallToast(msg)'));
  let attention=null;
  vm.runInNewContext(startCall+'\nstartCall({state:"incoming"});',{state:{settings:{callsOverFullscreen:false},fullscreen:true},bridge:{attention:ms=>attention=ms},edge:()=>{},clearTimeout:()=>{},setTimeout:()=>1,callTimeout:null,present:()=>{}});
  assert.equal(attention,null);record('W-05','Incoming call requests visibility over fullscreen despite disabled setting',{callsOverFullscreen:false,requestedAttentionMs:attention});

  const views=fs.readFileSync(path.join(root,'src/renderer/island/views.js'),'utf8');
  const tabCode=views.slice(views.indexOf('function tabKey(d)'),views.indexOf('function phoneChip(d, ctx)'));
  const keyCtx={Date,widgetList:()=>[],d:{tab:'planner',planner:{cal:'gregorian',ym:{y:2026,m:11},sel:'2026-11-09'},tasks:[{id:'1',done:false,date:'2026-11-09',time:'12:00',title:'Old',color:'blue'}]}};
  vm.createContext(keyCtx);vm.runInContext(tabCode+'\noldKey=tabKey(d);d.tasks[0].title="New";d.tasks[0].color="red";newKey=tabKey(d);',keyCtx);
  assert.notEqual(keyCtx.oldKey,keyCtx.newKey);record('W-06','Planner view cache ignores updated title/color',{sameKeyAfterTitleAndColorEdit:true});

  const notificationCode=views.slice(views.indexOf('function notifAvatar(n)'),views.indexOf('// ------------------------------------------------------------------ calls')).replaceAll('export const ','const ');
  const privacyCtx={h:s=>s,esc:s=>String(s||''),isRtl:()=>false,icon:()=>'',avatar:()=>'',d:{n:{id:'n',body:'PRIVATE-BODY',title:'sender',appName:'app',time:1,actions:[],inputs:[]},queue:0},ctx:{s:{notifications:{showBody:false}},i:{ago:()=>'',t:x=>x,num:x=>x}}};
  vm.createContext(privacyCtx);vm.runInContext(notificationCode+'\ncompact=notification.render(d,ctx);expanded=notificationExpanded.render(d,ctx);',privacyCtx);
  assert(!privacyCtx.compact.includes('PRIVATE-BODY'));assert(!privacyCtx.expanded.includes('PRIVATE-BODY'));
  record('W-07','Notification body privacy setting is ignored in expanded view',{showBody:false,compactBodyVisible:false,expandedBodyVisible:true});

  let clock=1000;let visible=false;let expiryScheduled=false;let expiry;
  const visCode=main.slice(main.indexOf('function updateVisibility()'),main.indexOf('// ------------------------------------------------------------------ island window'));
  const attCode=main.slice(main.indexOf('function setAttention(ms)'),main.indexOf('function startPhone()'));
  const visibilityCtx={gaming:null,attentionTimer:null,clearTimeout:()=>{},attentionUntil:0,fsBusy:false,lastInside:null,Date:{now:()=>clock},settings:{data:{hidden:true,hideInFullscreen:true}},islandWin:{isDestroyed:()=>false,isVisible:()=>visible,hide:()=>{visible=false;},showInactive:()=>{visible=true;},setAlwaysOnTop:()=>{},setIgnoreMouseEvents:()=>{}},updateTrayMenu:()=>{},setTimeout:fn=>{expiryScheduled=true;expiry=fn;}};
  vm.createContext(visibilityCtx);vm.runInContext(visCode+attCode+'\nsetAttention(20000);',visibilityCtx);clock+=25000;
  assert(visible);assert(expiryScheduled);expiry();assert(!visible);record('W-08','Temporary attention does not restore hidden visibility at deadline',{hiddenSetting:true,visibleAfterDeadline:true,expiryTimerScheduled:false});

  console.log('PASS all 8 Windows functional regressions (helper, planner, weather, clipboard, privacy, visibility)');
})().catch(e=>{console.error(e);process.exitCode=1;});
