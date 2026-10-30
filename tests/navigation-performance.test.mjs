import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {databaseMemo} from '../lib/platform/database-memo.mjs';
import {visiblePolling} from '../lib/visible-polling.mjs';
import {migrate} from '../lib/platform/migrate.mjs';
import {demoEnabled} from '../lib/platform/demo.mjs';

test('optimized prototype preview needs both explicit flags and a loopback host',()=>{
 const before={NODE_ENV:process.env.NODE_ENV,VIDYA_DEMO_MODE:process.env.VIDYA_DEMO_MODE,VIDYA_LOCAL_PREVIEW:process.env.VIDYA_LOCAL_PREVIEW};
 try{
  process.env.NODE_ENV='production';process.env.VIDYA_DEMO_MODE='1';delete process.env.VIDYA_LOCAL_PREVIEW;
  assert.equal(demoEnabled('127.0.0.1:3001'),false);
  process.env.VIDYA_LOCAL_PREVIEW='1';assert.equal(demoEnabled('127.0.0.1:3001'),true);
  for(const host of ['vidya.example','192.168.1.10:3001','127.0.0.1.evil.example',''])assert.equal(demoEnabled(host),false);
  process.env.VIDYA_DEMO_MODE='0';assert.equal(demoEnabled('localhost:3001'),false);
 }finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
});

test('model-input revision ignores job timestamps and detects policy edits from another connection',()=>{
 const folder=mkdtempSync(join(tmpdir(),'vidya-input-revision-')),file=join(folder,'db.sqlite');
 const first=new DatabaseSync(file),second=new DatabaseSync(file);
 try{
  first.exec(readFileSync('db/schema.sql','utf8'));migrate(first);migrate(first);
  let calls=0;const read=databaseMemo(first,()=>{calls++;return first.prepare('SELECT configuration FROM anomaly_policy WHERE id=1').get().configuration},()=>first.prepare('SELECT revision FROM analysis_input_revision WHERE id=1').get().revision);
  const original=read(2026);assert.equal(read(2026),original);assert.equal(calls,1);
  second.exec("INSERT INTO platform_jobs VALUES('test','2026-10-31')");assert.equal(read(2026),original);assert.equal(calls,1);
  second.exec("UPDATE anomaly_policy SET configuration='{}' WHERE id=1");assert.equal(read(2026),'{}');assert.equal(calls,2);
  first.exec("BEGIN; UPDATE anomaly_policy SET configuration='[]'; ROLLBACK");assert.equal(read(2026),'{}');assert.equal(calls,2);
  assert.equal(first.prepare("SELECT count(*) n FROM sqlite_master WHERE type='trigger' AND name LIKE 'analysis_revision_%'").get().n,30);
 }finally{second.close();first.close();rmSync(folder,{recursive:true,force:true})}
});

test('derived fingerprint cache invalidates for own writes, other connections, and rollback',()=>{
 const folder=mkdtempSync(join(tmpdir(),'vidya-navigation-')),file=join(folder,'db.sqlite');
 const first=new DatabaseSync(file),second=new DatabaseSync(file);
 try{
  first.exec('CREATE TABLE records(value INTEGER); INSERT INTO records VALUES(1)');
  let calls=0;const read=databaseMemo(first,()=>{calls++;return first.prepare('SELECT sum(value) n FROM records').get().n});
  assert.equal(read(2026),1);assert.equal(read(2026),1);assert.equal(calls,1);
  first.exec('UPDATE records SET value=2');assert.equal(read(2026),2);assert.equal(calls,2);
  second.exec('UPDATE records SET value=3');assert.equal(read(2026),3);assert.equal(calls,3);
  first.exec('BEGIN; UPDATE records SET value=4; ROLLBACK');assert.equal(read(2026),3);assert.equal(calls,4);
 }finally{second.close();first.close();rmSync(folder,{recursive:true,force:true})}
});

test('background polling pauses hidden tabs, never overlaps, and cancels on unmount',async()=>{
 const doc=new EventTarget(),win=new EventTarget();doc.visibilityState='visible';
 const timers=new Map();let next=0,calls=0,finish,signal;
 const cleanup=visiblePolling(async input=>{calls++;signal=input;await new Promise(resolve=>{finish=resolve})},()=>30000,{document:doc,window:win,setTimeout:(fn,delay)=>{timers.set(++next,{fn,delay});return next},clearTimeout:id=>timers.delete(id)});
 assert.equal(calls,1);win.dispatchEvent(new Event('focus'));assert.equal(calls,1);
 finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,30000);
 doc.visibilityState='hidden';doc.dispatchEvent(new Event('visibilitychange'));assert.equal(timers.size,0);win.dispatchEvent(new Event('focus'));assert.equal(calls,1);
 doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));assert.equal(calls,2);
 cleanup();assert.equal(signal.aborted,true);finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(timers.size,0);
 win.dispatchEvent(new Event('focus'));assert.equal(calls,2);
});

test('a hidden tab does not perform even its first background request',()=>{
 const doc=new EventTarget(),win=new EventTarget();doc.visibilityState='hidden';let calls=0;
 const cleanup=visiblePolling(async()=>{calls++},()=>1000,{document:doc,window:win});
 assert.equal(calls,0);cleanup();
});
