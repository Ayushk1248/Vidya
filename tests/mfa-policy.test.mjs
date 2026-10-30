import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {requiresPrivilegedMfa} from '../lib/platform/mfa-policy.mjs';
import {assignmentScope} from '../lib/platform/account-roles.mjs';

function environment(mode,nodeEnv,action){
 const before={VIDYA_DEMO_MODE:process.env.VIDYA_DEMO_MODE,NODE_ENV:process.env.NODE_ENV};
 process.env.VIDYA_DEMO_MODE=mode;process.env.NODE_ENV=nodeEnv;
 return Promise.resolve().then(action).finally(()=>{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value}});
}
const admin={user_id:'verified-real-admin',role:'aicte_admin',institution_id:null,region:null,student_id:null};

test('signed-in privileged accounts can use the explicit localhost prototype without an authenticator',()=>environment('1','development',()=>{
 for(const role of ['aicte_admin','regional_officer','institution_head','system_admin'])for(const host of ['127.0.0.1:3001','localhost:3001'])assert.equal(requiresPrivilegedMfa({...admin,role},host),false);
}));
test('authenticator enforcement remains in production, on remote hosts and outside explicit prototype mode',async()=>{
 await environment('1','production',()=>assert.equal(requiresPrivilegedMfa(admin,'localhost:3001'),true));
 await environment('0','development',()=>assert.equal(requiresPrivilegedMfa(admin,'127.0.0.1:3001'),true));
 await environment('1','development',()=>{for(const host of ['vidya.example','127.0.0.1.evil.example','', '192.168.1.10:3001'])assert.equal(requiresPrivilegedMfa(admin,host),true)});
});
const compiled=ts.transpileModule(readFileSync('lib/platform/mfa-session.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function session(host,token){
 let cookieReads=0;const dependencies={
  'next/headers':{headers:async()=>({get:()=>host}),cookies:async()=>{cookieReads++;return {get:()=>({value:'test-token'})}}},
  './tokens.mjs':{unseal:()=>token},'./account-roles.mjs':{assignmentScope},'./mfa-policy.mjs':{requiresPrivilegedMfa},
 };
 const scope={exports:{}};new Function('require','module','exports',compiled)(name=>{if(!(name in dependencies))throw new Error('Unexpected import '+name);return dependencies[name]},scope,scope.exports);
 return {verify:scope.exports.privilegedSession,cookieReads:()=>cookieReads};
}
test('the shared page and API gate accepts the local administrator without reading or fabricating MFA cookies',()=>environment('1','development',async()=>{
 const gate=session('127.0.0.1:3001',null);assert.equal(await gate.verify(admin),true);assert.equal(gate.cookieReads(),0);
}));
test('required MFA still rejects missing, wrong-user and stale-role sessions',()=>environment('0','development',async()=>{
 for(const token of [null,{id:'other',scope:assignmentScope(admin)},{id:admin.user_id,scope:assignmentScope({...admin,role:'student'})}])assert.equal(await session('localhost:3001',token).verify(admin),false);
 assert.equal(await session('localhost:3001',{id:admin.user_id,scope:assignmentScope(admin)}).verify(admin),true);
}));
