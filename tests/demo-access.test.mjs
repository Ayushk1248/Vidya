import os from 'node:os';
import path from 'node:path';
import {mkdtempSync,rmSync} from 'node:fs';
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
const directory=mkdtempSync(path.join(os.tmpdir(),'vidya-demo-access-'));
process.env.PLATFORM_DB=path.join(directory,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');
const {ensureDemoAccounts}=await import('../lib/platform/demo.mjs');
const {revokeAccess}=await import('../lib/platform/workflows.mjs');
const {actorFor}=await import('../lib/platform/repository.mjs');
const d=db();
after(()=>{d.close();rmSync(directory,{recursive:true,force:true})});
d.prepare('INSERT INTO institutions(id,name,region,state,district,institution_type) VALUES(?,?,?,?,?,?)').run('INST001','Synthetic Demo Institute','North','State','City','Private');
d.prepare('INSERT INTO students(id,name,dob,mobile_cipher,mobile_hash,email_cipher,nationality,category) VALUES(?,?,?,?,?,?,?,?)').run('STU00001','Synthetic Student','2005-01-01','unused','unused','unused','IN','DOMESTIC');

test('entering another demo role never recreates a revoked role',()=>{
 ensureDemoAccounts();assert.ok(actorFor('demo-external_verifier'));
 revokeAccess(actorFor('demo-aicte_admin'),'demo-external_verifier','Synthetic verifier access revoked');
 assert.equal(actorFor('demo-external_verifier'),undefined);
 ensureDemoAccounts();ensureDemoAccounts();
 assert.equal(actorFor('demo-external_verifier'),undefined);assert.ok(actorFor('demo-student'));
});

test('explicit demo setup can restore revoked fixtures',()=>{
 ensureDemoAccounts({restoreRevoked:true});assert.equal(actorFor('demo-external_verifier').role,'external_verifier');
});

test('demo setup never duplicates a student identity linked to a real account',()=>{
 d.prepare("DELETE FROM role_assignments WHERE user_id='demo-student'").run();
 d.prepare('INSERT INTO role_assignments(user_id,role,student_id) VALUES(?,?,?)').run('synthetic-real-account','student','STU00001');
 ensureDemoAccounts({restoreRevoked:true});
 assert.equal(actorFor('demo-student'),undefined);
 assert.equal(d.prepare("SELECT count(*) n FROM role_assignments WHERE role='student' AND student_id='STU00001'").get().n,1);
});
