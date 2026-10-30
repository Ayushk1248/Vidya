import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {roles} from '../lib/platform/access.mjs';
import {portalPath,rolePortal} from '../lib/platform/portals.mjs';
async function sourceModule(file){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
const {roleGuide,guideStorageKey,checkedGuideSteps}=await sourceModule('lib/platform/role-guides.ts');
const {workspaceNavigation,workspaceHome}=await sourceModule('lib/platform/workspace-navigation.ts');
test('all role guides stay within the existing role navigation and preserve portal scope',()=>{
 for(const role of Object.keys(roles)){
  const guide=roleGuide(role),allowed=new Set(workspaceNavigation(role).map(link=>link.href));assert.ok(guide);assert.equal(guide.steps.length,3);
  assert.equal(new Set(guide.steps.map(step=>step.id)).size,3);
  for(const step of guide.steps){assert.ok(allowed.has(step.href),role+': '+step.href);assert.ok(step.title&&step.description&&step.action);assert.ok(portalPath(step.href,rolePortal(role)).startsWith('/portal/'+rolePortal(role)+'/'));assert.ok(!step.href.startsWith('/api/'))}
 }
 assert.equal(roleGuide('unknown'),null);assert.equal(roleGuide('__proto__'),null);
 assert.equal(workspaceHome('student'),'/verification','the guide does not change returning-user routing');
});
test('manual guide progress is isolated per user and role and ignores invalid saved values',()=>{
 assert.notEqual(guideStorageKey('ONE','student'),guideStorageKey('TWO','student'));
 assert.notEqual(guideStorageKey('ONE','student'),guideStorageKey('ONE','aicte_admin'));
 const steps=roleGuide('student').steps,id=steps[0].id;
 assert.deepEqual(checkedGuideSteps(JSON.stringify([id,id,'unknown',null,12]),steps),[id]);
 for(const raw of [null,'bad JSON','{}','true'])assert.deepEqual(checkedGuideSteps(raw,steps),[]);
});
test('all new guide text has a Hindi translation',()=>{
 const dictionary=JSON.parse(readFileSync('lib/ui-hindi.json','utf8'));
 for(const role of Object.keys(roles)){const guide=roleGuide(role);for(const text of [guide.summary,...guide.steps.flatMap(step=>[step.title,step.description,step.action])])assert.ok(dictionary[text],'Missing Hindi text: '+text)}
});
