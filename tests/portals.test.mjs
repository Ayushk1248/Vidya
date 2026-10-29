import test from 'node:test';
import assert from 'node:assert/strict';
import {portals,validPortal,rolePortal,portalPath,parsePortalPath,requestPortal,portalApiPath,demoCookie,demoIdentity} from '../lib/platform/portals.mjs';
import {seal,unseal} from '../lib/platform/tokens.mjs';

test('each role belongs to one portal, with operator/head grouped under institutions',()=>{
 const roles=Object.values(portals).flatMap(p=>p.roles);assert.equal(roles.length,8);assert.equal(new Set(roles).size,8);
 assert.equal(rolePortal('student'),'students');assert.equal(rolePortal('institution_operator'),'institutions');assert.equal(rolePortal('institution_head'),'institutions');assert.equal(rolePortal('aicte_admin'),'aicte');assert.equal(rolePortal('external_verifier'),'verifiers');
 assert.equal(validPortal('__proto__'),null);assert.equal(rolePortal('unknown'),null);
});
test('portal URLs preserve paths without prefixing APIs or external links',()=>{
 assert.equal(portalPath('/verification?year=2026','students'),'/portal/students/verification?year=2026');
 assert.equal(portalPath('/api/platform/consents','students'),'/api/platform/consents');
 assert.equal(portalPath('//evil.example','students'),'//evil.example');
 assert.deepEqual(parsePortalPath('/portal/institutions/uploads'),{category:'institutions',path:'/uploads'});
 assert.equal(parsePortalPath('/portal/unknown/uploads'),null);
 assert.equal(portalApiPath('/api/platform/certificates?preview=CERT001#page=1','institutions'),'/api/platform/certificates?preview=CERT001&portal=institutions#page=1');
 assert.equal(portalApiPath('/api/platform/certificates?portal=students','institutions'),'/api/platform/certificates?portal=institutions');
 assert.equal(portalApiPath('https://other.example/api/private','students'),'https://other.example/api/private');
});
test('API portal context is taken only from a matching-origin portal tab',()=>{
 assert.equal(requestPortal('http://127.0.0.1:3001/api/platform/consents','http://127.0.0.1:3001/portal/students/verification'),'students');
 assert.equal(requestPortal('http://127.0.0.1:3001/api/platform/consents','https://evil.example/portal/aicte/dashboard'),null);
 assert.equal(requestPortal('http://127.0.0.1:3001/portal/verifiers/verification','http://127.0.0.1:3001/portal/students/verification'),'verifiers');
});
test('simultaneous student and verifier tokens remain separate and cannot cross categories',()=>{
 const cookies=new Map([['students',seal({id:'demo-student'},'demo')],['verifiers',seal({id:'demo-external_verifier'},'demo')]].map(([category,value])=>[demoCookie(category),value]));
 assert.equal(cookies.size,2);
 assert.equal(demoIdentity('students',unseal(cookies.get(demoCookie('students')),'demo')),'demo-student');
 assert.equal(demoIdentity('verifiers',unseal(cookies.get(demoCookie('verifiers')),'demo')),'demo-external_verifier');
 assert.equal(demoIdentity('students',unseal(cookies.get(demoCookie('verifiers')),'demo')),null);
 assert.equal(demoIdentity('students',unseal(cookies.get(demoCookie('students'))+'bad','demo')),null);
});
