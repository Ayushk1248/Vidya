import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { db } from '../lib/platform/db.mjs';
import { institutions,institution,programs,enrolments,enrolment,actorFor } from '../lib/platform/repository.mjs';
import { may } from '../lib/platform/access.mjs';
import { encrypt,decrypt,maskApaar,maskPassport } from '../lib/platform/crypto.mjs';
const admin={role:'aicte_admin'};
const operator={role:'institution_operator',institution_id:'INST001'};
const head={role:'institution_head',institution_id:'INST002'};
const regional={role:'regional_officer',region:'North'};
const student={role:'student',student_id:'STU00001'};
const verifier={role:'external_verifier'};
const d=db();
test('unrelated email/profile and deletion service modules remain unchanged',()=>{
 const baseline=JSON.parse(readFileSync('tests/auth-baseline.json','utf8'));
 for(const [file,hash] of Object.entries(baseline)) assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash,file);
});
test('seed counts and database foreign keys',()=>{
 for(const [table,count] of Object.entries({institutions:100,programs:300,intake_approvals:1200,students:5000,mock_registry:5000,enrolments:20000,validation_rules:14}))
   assert.equal(d.prepare(`SELECT count(*) n FROM ${table}`).get().n,count,table);
 assert.deepEqual(d.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('institution A cannot enumerate, open or fetch institution B records',()=>{
 assert.deepEqual(institutions(operator).map(i=>i.id),['INST001']);
 assert.throws(()=>institution(operator,'INST002'),/not found/);
 assert.throws(()=>programs(operator,'INST002'),/not found/);
 assert.throws(()=>enrolments(operator,{institutionId:'INST002'}),/not found/);
 const foreign=d.prepare("SELECT id FROM enrolments WHERE institution_id='INST002' AND academic_year=2026 LIMIT 1").get();
 assert.throws(()=>enrolment(operator,foreign.id),/not found/);
 assert.ok(enrolments(operator).rows.every(e=>e.institution_id==='INST001'));
 assert.ok(enrolments(head).rows.every(e=>e.institution_id==='INST002'));
});
test('region, student, verifier and unknown role are scoped independently',()=>{
 assert.equal(institutions(admin).length,100);
 assert.equal(institutions(regional).length,20);
 assert.ok(institutions(regional).every(i=>i.region==='North'));
 assert.throws(()=>institution(regional,'INST003'),/not found/);
 assert.equal(enrolments(student).total,1);
 assert.ok(enrolments(student).rows.every(e=>e.student_id==='STU00001'));
 assert.throws(()=>institutions(student),/denied/);
 assert.throws(()=>enrolments(verifier),/denied/);
 assert.throws(()=>institutions({role:'invented'}),/denied/);
 assert.equal(actorFor('unassigned-user'),undefined);
});
test('role capabilities separate operator, sign-off, configuration, and consent',()=>{
 assert.equal(may(operator,'upload'),true); assert.equal(may(operator,'signoff'),false);
 assert.equal(may(head,'signoff'),true); assert.equal(may(head,'configure_rules'),false);
 assert.equal(may(admin,'configure_rules'),true); assert.equal(may(regional,'review_anomaly'),true);
 assert.equal(may(verifier,'request_consent'),true); assert.equal(may(verifier,'decide_consent'),false);
 assert.equal(may(student,'decide_consent'),true);
});
test('database prevents unscoped or incorrectly scoped roles',()=>{
 assert.throws(()=>d.prepare("INSERT INTO role_assignments(user_id,role) VALUES('test-invalid','institution_operator')").run(),/CHECK/);
 assert.throws(()=>d.prepare("INSERT INTO role_assignments(user_id,role,institution_id) VALUES('test-invalid','aicte_admin','INST001')").run(),/CHECK/);
});
test('sensitive columns are authenticated ciphertext and API rows exclude contacts',()=>{
 const row=d.prepare('SELECT * FROM students LIMIT 1').get();
 for(const field of ['mobile_cipher','email_cipher','passport_cipher']) assert.match(row[field],/^v1:/);
 assert.match(decrypt(row.email_cipher),/@example.invalid$/);
 const encrypted=encrypt('synthetic-secret');assert.equal(decrypt(encrypted),'synthetic-secret');
 const parts=encrypted.split(':');const body=Buffer.from(parts[3],'base64');body[0]^=1;parts[3]=body.toString('base64');
 assert.throws(()=>decrypt(parts.join(':')));
 const record=enrolments(operator).rows[0];assert.match(record.apaar,/^XXXX-XXXX-\d{4}$/);
 assert.equal('email_cipher' in record,false);assert.equal('mobile_cipher' in record,false);assert.equal('passport_cipher' in record,false);
 assert.equal(maskApaar(null),'Missing');assert.equal(maskPassport('ZZ0000001'),'XXXXX01');
});
test('intake fixture is exactly 62 within intake plus 3 TFW at intake 60',()=>{
 const p=programs(admin,'INST005').find(p=>p.id==='INST005-P1');
 assert.equal(p.approved_intake,60);assert.equal(p.within_count,62);assert.equal(p.supernumerary_count,3);
 assert.equal(p.within_count-p.approved_intake,2);
 const tfw=d.prepare("SELECT count(*) n FROM enrolments WHERE program_id='INST005-P1' AND academic_year=2026 AND scheme='TFW'").get().n;
 assert.equal(tfw,3);
});
test('cross-institution duplicate and anomaly data are planted',()=>{
 const duplicate=d.prepare(`SELECT count(DISTINCT e.institution_id) n FROM enrolments e JOIN students s ON s.id=e.student_id
 WHERE s.apaar=(SELECT apaar FROM students WHERE id='STU00251') AND e.academic_year=2026`).get();assert.equal(duplicate.n,2);
 for(const id of ['INST001','INST002','INST003','INST004']) {
  const count=y=>d.prepare('SELECT count(*) n FROM enrolments WHERE institution_id=? AND academic_year=?').get(id,y).n;
  assert.ok(count(2026)/count(2025)>=5);
 }
 assert.equal(d.prepare('SELECT count(*) n FROM seed_fixtures').get().n,15);
});
test('SQL injection does not bypass scope and invalid years are rejected',()=>{
 assert.throws(()=>institution(operator,"INST001' OR 1=1 --"),/not found/);
 assert.throws(()=>enrolments(operator,{year:NaN+''}),/Invalid year/);
 assert.throws(()=>enrolments(operator,{year:9999}),/Invalid year/);
});
