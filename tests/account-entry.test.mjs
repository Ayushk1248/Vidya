import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {accountEntryDestination} from '../lib/platform/account-entry.mjs';
import {portals,demoCookie} from '../lib/platform/portals.mjs';

test('real account entry follows its assigned role rather than a stale student perspective',()=>{
 assert.equal(accountEntryDestination({role:'aicte_admin'},'/dashboard'),'/portal/aicte/dashboard');
 assert.equal(accountEntryDestination({role:'aicte_admin'},'/dashboard',true),'/portal/aicte/access');
 assert.equal(accountEntryDestination({role:'student'},'/verification'),'/portal/students/verification');
 assert.equal(accountEntryDestination({role:'student'},'/verification',true),'/administrator?error=administrator_required');
 assert.equal(accountEntryDestination(undefined,'/dashboard'),'/onboarding');
 assert.equal(accountEntryDestination(undefined,'/dashboard',true),'/administrator?error=administrator_required');
});

const compiled=ts.transpileModule(readFileSync('app/auth/workspace/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function loadRoute({user,role,error}){
 const cleared=[],calls=[];
 const dependencies={
  'next/server':{NextResponse:{redirect:url=>({url:url.href,cookies:{set:(name,_value,options)=>cleared.push({name,maxAge:options.maxAge})},headers:{set:()=>{}}})}},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user},error})}})},
  '@/lib/auth/oauth-flow.mjs':{oauthOrigin:()=> 'http://127.0.0.1:3001'},
  '@/lib/platform/repository.mjs':{actorFor:id=>{calls.push(['actor',id]);return role?{user_id:id,role}:undefined}},
  '@/lib/platform/owner-migration.mjs':{migrateVerifiedOwner:verified=>calls.push(['migration',verified.id])},
  '@/lib/platform/workflows.mjs':{syncProfile:verified=>calls.push(['profile',verified.id])},
  '@/lib/platform/workspace-navigation':{workspaceHome:()=>'/dashboard'},
  '@/lib/platform/account-entry.mjs':{accountEntryDestination},
  '@/lib/platform/portals.mjs':{portals,demoCookie},
 };
 const routeModule={exports:{}};new Function('require','module','exports',compiled)(name=>{if(!(name in dependencies))throw new Error('Unexpected dependency '+name);return dependencies[name]},routeModule,routeModule.exports);
 return {GET:routeModule.exports.GET,cleared,calls};
}
test('verified admin entry expires every demo cookie and uses the authenticated UUID',async()=>{
 const route=loadRoute({user:{id:'verified-account'},role:'aicte_admin'});
 const response=await route.GET(new Request('http://127.0.0.1:3001/auth/workspace?administrator=1&portal=students'));
 assert.equal(response.url,'http://127.0.0.1:3001/portal/aicte/access');
 assert.deepEqual(route.cleared.map(c=>c.name).sort(),[...Object.keys(portals).map(demoCookie),'vidya-demo','vidya-portal'].sort());
 assert.ok(route.cleared.every(c=>c.maxAge===0));
 assert.deepEqual(route.calls,[['migration','verified-account'],['profile','verified-account'],['actor','verified-account']]);
});
test('missing or invalid authentication cannot route into administrator access or change any profile',async()=>{
 for(const options of [{user:null},{user:{id:'untrusted'},role:'aicte_admin',error:{message:'expired'}}]){
  const route=loadRoute(options),response=await route.GET(new Request('http://127.0.0.1:3001/auth/workspace?administrator=1'));
  assert.equal(response.url,'http://127.0.0.1:3001/administrator/sign-in?error=auth_exchange_failed');
  assert.deepEqual(route.calls,[]);assert.deepEqual(route.cleared,[]);
 }
});
