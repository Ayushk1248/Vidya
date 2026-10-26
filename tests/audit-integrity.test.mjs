import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'vidya-audit-check-'));process.env.PLATFORM_DB=join(folder,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');const {audit}=await import('../lib/platform/workflows.mjs');const {checkAuditIntegrity}=await import('../lib/platform/audit-integrity.mjs');
const d=db(),admin={role:'aicte_admin'};test.after(()=>{d.close();rmSync(folder,{recursive:true,force:true})});
test('Admin-only whole-chain check detects edits and missing interior events without modifying the log',()=>{
 for(const role of ['institution_head','institution_operator','regional_officer','student','external_verifier'])assert.throws(()=>checkAuditIntegrity({role}),/Only AICTE Admin/);
 assert.equal(checkAuditIntegrity(admin).status,'empty');
 for(let i=0;i<105;i++)audit('test-admin','test.synthetic','TEST'+i,{synthetic:true});
 assert.equal(checkAuditIntegrity(admin).checked,105);
 const original=d.prepare('SELECT details FROM audit_events WHERE sequence=2').get().details;
 d.prepare("UPDATE audit_events SET details='changed' WHERE sequence=2").run();
 const broken=checkAuditIntegrity(admin);assert.equal(broken.status,'broken');assert.equal(broken.first_broken_sequence,2);assert.equal(broken.checked,1);
 assert.equal(d.prepare('SELECT details FROM audit_events WHERE sequence=2').get().details,'changed');
 d.prepare('UPDATE audit_events SET details=? WHERE sequence=2').run(original);assert.equal(checkAuditIntegrity(admin).status,'valid');
 d.prepare('DELETE FROM audit_events WHERE sequence=50').run();assert.equal(checkAuditIntegrity(admin).first_broken_sequence,51);
 assert.equal(d.prepare('SELECT count(*) n FROM audit_events').get().n,104);
});
