import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'vidya-account-roles-'));process.env.PLATFORM_DB=join(directory,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');
const {encrypt}=await import('../lib/platform/crypto.mjs');
const {syncProfile,accessQueue,reviewAccess,requestAccess}=await import('../lib/platform/workflows.mjs');
const {managedAccounts,changeAccountRole,assignmentScope}=await import('../lib/platform/account-roles.mjs');
const {actorFor}=await import('../lib/platform/repository.mjs');
const d=db();after(()=>{d.close();rmSync(directory,{recursive:true,force:true})});
for(const [id,region] of [['A','North'],['B','South']]){
 d.prepare('INSERT INTO institutions VALUES(?,?,?,?,?,?,1)').run(id,'Synthetic '+id,region,'State','City','Engineering');
 d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+'P',id,'Engineering','UG');
}
d.prepare("INSERT INTO scheme_caps VALUES('WITHIN',100,'Within')").run();
for(const [id,institution] of [['STU00001','A'],['STU00002','B'],['STU00003','A']]){
 d.prepare('INSERT INTO students(id,name,dob,mobile_cipher,mobile_hash,email_cipher,nationality,category) VALUES(?,?,?,?,?,?,?,?)').run(id,'Synthetic Student','2005-01-01',encrypt('0000000000'),'hash',encrypt('student@example.invalid'),'IN','GENERAL');
 d.prepare('INSERT INTO enrolments(id,student_id,institution_id,program_id,academic_year,admission_date,submitted_at,scheme) VALUES(?,?,?,?,?,?,?,?)').run('E'+id,id,institution,institution+'P',2026,'2026-08-01','2026-08-01','WITHIN');
}
for(const [id,email] of [['admin','admin@example.invalid'],['candidate','Student.Test@example.invalid'],['other','other@example.invalid'],['demo-aicte_admin','demo@example.invalid']])syncProfile({id,email,user_metadata:{display_name:id}});
d.prepare("INSERT INTO role_assignments(user_id,role) VALUES('admin','aicte_admin')").run();
d.prepare("INSERT INTO role_assignments(user_id,role) VALUES('demo-aicte_admin','aicte_admin')").run();
const admin=actorFor('admin');
const change=(user,role,extra={})=>changeAccountRole(admin,{user_id:user,role,note:'Affiliation checked for role reassignment',designation:'Synthetic Officer',expected_assignment:assignmentScope(actorFor(user)),...extra});

test('only AICTE administrators can search encrypted profile emails or assign roles',()=>{
 for(const role of ['student','institution_head','system_admin','regional_officer','external_verifier']){
  const actor={user_id:'outside',role};assert.throws(()=>managedAccounts(actor,'student'),/Only AICTE/);assert.throws(()=>changeAccountRole(actor,{}),/Only AICTE/);
 }
 assert.deepEqual(managedAccounts(admin,'s').accounts,[]);
 const result=managedAccounts(admin,'STUDENT.TEST@EXAMPLE.INVALID').accounts;
 assert.equal(result.length,1);assert.equal(result[0].user_id,'candidate');assert.equal(result[0].email,'Student.Test@example.invalid');assert.equal(result[0].assignment,null);assert.equal('email_cipher' in result[0],false);
 assert.deepEqual(managedAccounts(admin,'demo@example').accounts,[]);
});
test('student links validate institution and duplicate ownership before changing access',()=>{
 assert.throws(()=>change('candidate','student',{student_id:'STU00002',institution_id:'A'}),/not enrolled/);assert.equal(actorFor('candidate'),undefined);
 change('candidate','student',{student_id:'STU00001',institution_id:'A'});assert.equal(actorFor('candidate').student_id,'STU00001');
 assert.throws(()=>change('other','student',{student_id:'STU00001',institution_id:'A'}),/already linked/);assert.equal(actorFor('other'),undefined);
 assert.equal(accessQueue(admin).requests.find(r=>r.user_id==='candidate').status,'approved');
});
test('changing a student role revokes old sharing, keeps records and records an audit reason',()=>{
 const before=actorFor('candidate');
 d.prepare("INSERT INTO consent_requests(id,verifier_id,student_id,purpose,requested_fields,status,expires_at) VALUES('C1','v','STU00001','Synthetic check','[]','approved','2099-01-01')").run();
 change('candidate','institution_operator',{institution_id:'B'});
 assert.equal(actorFor('candidate').institution_id,'B');assert.equal(actorFor('candidate').student_id,null);
 assert.equal(d.prepare("SELECT status FROM consent_requests WHERE id='C1'").get().status,'revoked');
 assert.equal(d.prepare('SELECT count(*) n FROM enrolments').get().n,3);
 const audit=JSON.parse(d.prepare("SELECT details FROM audit_events WHERE action='access.role_changed' AND entity_id='candidate' ORDER BY sequence DESC LIMIT 1").get().details);
 assert.equal(audit.before.role,before.role);assert.equal(audit.after.role,'institution_operator');assert.match(audit.note,/Affiliation/);
 assert.ok(d.prepare("SELECT id FROM notifications WHERE user_id='candidate'").get());
});
test('self changes, stale edits, missing accounts and invalid scopes are rejected atomically',()=>{
 assert.throws(()=>change('admin','student'),/own role/);
 assert.throws(()=>change('demo-aicte_admin','student'),/demonstration roles/);
 assert.throws(()=>change('missing','aicte_admin'),/sign in/);
 assert.throws(()=>change('candidate','regional_officer',{region:'Unknown'}),/valid region/);
 const before=actorFor('candidate');
 assert.throws(()=>changeAccountRole(admin,{user_id:'candidate',role:'aicte_admin',designation:'Officer',note:'Verified promotion',expected_assignment:null}),/changed since/);
 assert.deepEqual(actorFor('candidate'),before);
 assert.throws(()=>change('candidate','aicte_admin',{note:'short'}),/10 characters/);
 assert.throws(()=>change('candidate','__proto__'),/valid role/);
});
test('registered accounts can change to administrator and back without bypassing pending-request review',()=>{
 const pending=requestAccess('other',{role:'external_verifier',organisation:'Synthetic Org',reason:'Synthetic request for access'});
 change('other','aicte_admin');assert.equal(actorFor('other').role,'aicte_admin');
 assert.throws(()=>reviewAccess(admin,pending.id,'approved','Old request must not be replayed'),/already been reviewed/);
 change('other','regional_officer',{region:'North'});assert.equal(actorFor('other').region,'North');assert.equal(actorFor('other').institution_id,null);
 change('other','awarding_body',{institution_id:'A'});assert.equal(actorFor('other').institution_id,'A');assert.equal(actorFor('other').region,null);
});
test('MFA scope is tied to the current role and institution, not just the email session',()=>{
 const before=assignmentScope(actorFor('candidate'));
 change('candidate','institution_head',{institution_id:'A'});
 assert.notEqual(assignmentScope(actorFor('candidate')),before);
 assert.notEqual(assignmentScope({...actorFor('candidate'),institution_id:'B'}),assignmentScope(actorFor('candidate')));
});
