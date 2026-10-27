import os from 'node:os';
import path from 'node:path';
import {mkdtempSync,rmSync} from 'node:fs';
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const directory=mkdtempSync(path.join(os.tmpdir(),'vidya-workflows-'));
process.env.PLATFORM_DB=path.join(directory,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');
const {encrypt}=await import('../lib/platform/crypto.mjs');
const {requestAccess,reviewAccess,revokeAccess,accessQueue,syncProfile,requestConsent,decideConsent,consentResult,consentList,overview,limit}=await import('../lib/platform/workflows.mjs');
const {actorFor}=await import('../lib/platform/repository.mjs');
const d=db();
after(()=>{d.close();rmSync(directory,{recursive:true,force:true})});
for(const [id,region] of [['A','North'],['B','South']]){
 d.prepare('INSERT INTO institutions(id,name,region,state,district,institution_type) VALUES(?,?,?,?,?,?)').run(id,`Synthetic ${id}`,region,'State','City','Private');
 d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(`${id}-P1`,id,'Computer Science','Undergraduate');
 d.prepare('INSERT INTO intake_approvals VALUES(?,?,?,?,?)').run(`${id}-P1`,2026,60,1,'2026-09-30');
}
d.prepare('INSERT INTO scheme_caps VALUES(?,?,?)').run('WITHIN',100,'Within intake');
for(const [id,inst,apaar] of [['STU00001','A','990000000001'],['STU00002','B','990000000002']]){
 d.prepare('INSERT INTO students(id,name,dob,apaar,mobile_cipher,mobile_hash,email_cipher,passport_cipher,nationality,category) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,'Synthetic Student','2005-01-01',apaar,encrypt('0000000000'),'hash',encrypt('student@example.invalid'),null,'IN','DOMESTIC');
 d.prepare('INSERT INTO enrolments(id,student_id,institution_id,program_id,academic_year,admission_date,submitted_at,scheme) VALUES(?,?,?,?,?,?,?,?)').run(`E-${id}`,id,inst,`${inst}-P1`,2026,'2026-08-01','2026-09-01','WITHIN');
}
const admin={user_id:'admin',role:'aicte_admin'},head={user_id:'head',role:'institution_head',institution_id:'A'};
for(const id of ['admin','head','operator','outside','student','wrong-student','verifier','another-student','candidate-admin','self'])syncProfile({id,email:`${id}@example.invalid`,user_metadata:{display_name:id}});
const request=(user,role,extra={})=>requestAccess(user,{role,reason:'Synthetic workflow testing',designation:'Test position',...extra}).id;
test('requesting a role never grants it automatically',()=>{
 const id=request('operator','institution_operator',{institution_id:'A'});assert.equal(actorFor('operator'),undefined);
 assert.throws(()=>request('operator','institution_operator',{institution_id:'A'}),/already awaiting/);
 assert.equal(accessQueue(head).requests.length,1);
 reviewAccess(head,id,'approved','Verified affiliation in synthetic test');
 assert.equal(actorFor('operator').institution_id,'A');assert.equal(actorFor('operator').role,'institution_operator');
 assert.throws(()=>reviewAccess(head,id,'approved','Repeat approval'),/already been reviewed/);
});
test('heads cannot approve another institution, AICTE roles, or their own request',()=>{
 const id=request('outside','institution_operator',{institution_id:'B'});assert.throws(()=>reviewAccess(head,id,'approved','Approve foreign institution'),/not found/);
 const adminRequest=request('candidate-admin','aicte_admin');assert.throws(()=>reviewAccess(head,adminRequest,'approved','Escalation attempt'),/not found/);
 const own=request('self','institution_operator',{institution_id:'A'});assert.throws(()=>reviewAccess({...head,user_id:'self'},own,'approved','Approve own request'),/own request/);
 assert.throws(()=>accessQueue({role:'institution_operator',institution_id:'A'}),/Only AICTE/);
});
test('rejection retains no privileges and permits a corrected request',()=>{
 const id=accessQueue(admin).requests.find(r=>r.user_id==='outside').id;reviewAccess(admin,id,'rejected','Affiliation not verified');assert.equal(actorFor('outside'),undefined);
 const second=request('outside','institution_operator',{institution_id:'B'});assert.notEqual(id,second);reviewAccess(admin,second,'approved','Affiliation now verified');
});
test('student linking checks institution and prevents duplicate ownership',()=>{
 const wrong=request('wrong-student','student',{institution_id:'A',student_id:'STU00002'});assert.throws(()=>reviewAccess(admin,wrong,'approved','Check student mapping'),/not enrolled/);
 const id=request('student','student',{institution_id:'A',student_id:'STU00001'});reviewAccess(head,id,'approved','Student identity confirmed');assert.equal(actorFor('student').student_id,'STU00001');
 const duplicate=request('another-student','student',{institution_id:'A',student_id:'STU00001'});assert.throws(()=>reviewAccess(admin,duplicate,'approved','Duplicate student claim'),/already linked/);
});
test('approved verifier gets no data without student approval',()=>{
 const id=request('verifier','external_verifier',{organisation:'Synthetic Verification Ltd'});reviewAccess(admin,id,'approved','Organisation verified for demo');
 const actor=actorFor('verifier');const consent=requestConsent(actor,{apaar:'990000000001',purpose:'Synthetic internship verification',fields:['name','program','dob']});
 assert.throws(()=>consentResult(actor,consent.id),/active student approval/);
 assert.equal(consentList(actor)[0].student_id,undefined);
 assert.throws(()=>requestConsent(actor,{apaar:'990000000001',purpose:'Synthetic request',fields:['email_cipher']}),/supported fields/);
});
test('only the linked student can decide; results contain exactly approved fields',()=>{
 const verifier=actorFor('verifier'),student=actorFor('student');const id=consentList(student)[0].id;
 assert.throws(()=>decideConsent({...student,student_id:'STU00002'},id,'approved',['name']),/not found/);
 assert.throws(()=>decideConsent(student,id,'approved',['apaar']),/requested fields/);
 decideConsent(student,id,'approved',['name','program']);const result=consentResult(verifier,id);assert.deepEqual(Object.keys(result.fields).sort(),['name','program']);
 assert.throws(()=>consentResult({...verifier,user_id:'another-verifier'},id),/not found/);
 decideConsent(student,id,'revoked');assert.throws(()=>consentResult(verifier,id),/active student approval/);
});
test('rejected and expired consent cannot expose data',()=>{
 const verifier=actorFor('verifier'),student=actorFor('student');const req=()=>requestConsent(verifier,{apaar:'990000000001',purpose:'Synthetic verification test',fields:['name']}).id;
 const rejected=req();decideConsent(student,rejected,'rejected');assert.throws(()=>consentResult(verifier,rejected),/active student approval/);
 const expired=req();decideConsent(student,expired,'approved',['name']);d.prepare('UPDATE consent_requests SET expires_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z',expired);assert.throws(()=>consentResult(verifier,expired),/active student approval/);
 assert.equal(consentList(verifier).find(r=>r.id===expired).status,'expired');
});
test('overview aggregates respect institution and regional scope',()=>{
 const local=overview(head);assert.equal(local.directory.length,1);assert.equal(local.summary.total,1);assert.equal(local.directory[0].id,'A');
 assert.equal(overview(admin).summary.total,2);assert.equal(overview({role:'regional_officer',region:'South'}).directory[0].id,'B');
 assert.throws(()=>overview({role:'external_verifier'}),/denied/);
});
test('revocation is scoped and takes effect immediately',()=>{
 assert.throws(()=>revokeAccess(head,'outside','Wrong institution revocation'),/only operators/);
 revokeAccess(head,'operator','Operator left the institution');assert.equal(actorFor('operator'),undefined);
 assert.throws(()=>revokeAccess(admin,'admin','Remove own access'),/own account/);
});
test('rate limiter rejects excess actions',()=>{limit('test',2);limit('test',2);assert.throws(()=>limit('test',2),/Too many/)});
test('workflow audit events form a verifiable hash chain',()=>{
 const verify=()=>{let previous='0'.repeat(64);for(const row of d.prepare('SELECT * FROM audit_events ORDER BY sequence').all()){
 const hash=createHash('sha256').update(JSON.stringify([row.actor_id,row.action,row.entity_id,row.details,row.created_at,previous])).digest('hex');if(row.previous_hash!==previous||hash!==row.event_hash)return false;previous=hash;}return true;};
 assert.equal(verify(),true);d.prepare("UPDATE audit_events SET action='tampered' WHERE sequence=1").run();assert.equal(verify(),false);
});
test('owner transfer requires the original verified email and matching project, and runs once',async()=>{
 const {migrateVerifiedOwner}=await import('../lib/platform/owner-migration.mjs');
 const previousUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const url=previousUrl||'https://test-project.example.invalid';process.env.NEXT_PUBLIC_SUPABASE_URL=url;
 d.prepare("INSERT INTO role_assignments(user_id,role) VALUES('old-owner','aicte_admin')").run();
 d.prepare('INSERT INTO owner_migrations(old_user_id,project_url,email_cipher) VALUES(?,?,?)').run('old-owner',url,encrypt('owner@example.invalid'));
 const owner={id:'new-owner',email:'owner@example.invalid',email_confirmed_at:'2026-10-25T00:00:00Z'};
 assert.equal(migrateVerifiedOwner({...owner,email_confirmed_at:undefined}),false);
 assert.equal(migrateVerifiedOwner({...owner,email:'other@example.invalid'}),false);
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://other.example.invalid';
 try{assert.equal(migrateVerifiedOwner(owner),false)}finally{process.env.NEXT_PUBLIC_SUPABASE_URL=url}
 assert.equal(actorFor('new-owner'),undefined);
 assert.equal(migrateVerifiedOwner(owner),true);
 assert.equal(actorFor('new-owner').role,'aicte_admin');assert.equal(actorFor('old-owner'),undefined);
 assert.equal(migrateVerifiedOwner(owner),false);
 if(previousUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=previousUrl;
});
