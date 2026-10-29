import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const directory=mkdtempSync(path.join(os.tmpdir(),'vidya-suggestions-'));
process.env.PLATFORM_DB=path.join(directory,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');
const {encrypt}=await import('../lib/platform/crypto.mjs');
const {dataSuggestions}=await import('../lib/platform/suggestions.mjs');
const d=db();after(()=>{d.close();rmSync(directory,{recursive:true,force:true})});
for(const [id,region] of [['INST001','North'],['INST002','South']]){
 d.prepare('INSERT INTO institutions(id,name,region,state,district,institution_type) VALUES(?,?,?,?,?,?)').run(id,'Synthetic '+id,region,region+' State','City','Private');
 d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+'-P1',id,'Synthetic Computing','UG');
 d.prepare('INSERT INTO intake_approvals VALUES(?,?,?,?,?)').run(id+'-P1',2026,60,1,'2026-10-31');
}
d.prepare('INSERT INTO scheme_caps VALUES(?,?,?)').run('WITHIN',100,'Within approved intake');
for(const [id,institution,apaar] of [['STU00001','INST001','990000000001'],['STU00002','INST002','990000000002'],['STU00003','INST001','990000000003']]){
 const name='Synthetic '+id,dob='2004-01-01';
 d.prepare('INSERT INTO students(id,name,dob,apaar,mobile_cipher,mobile_hash,email_cipher,nationality,category) VALUES(?,?,?,?,?,?,?,?,?)').run(id,name,dob,apaar,encrypt('0000000000'),'hash',encrypt('synthetic@example.invalid'),'IN','GENERAL');
 d.prepare('INSERT INTO mock_registry VALUES(?,?,?,1)').run(apaar,name,dob);
 d.prepare('INSERT INTO enrolments(id,student_id,institution_id,program_id,academic_year,admission_date,submitted_at,scheme) VALUES(?,?,?,?,?,?,?,?)').run('E-'+id,id,institution,institution+'-P1',2026,'2026-08-01','2026-09-01','WITHIN');
}
d.prepare("INSERT INTO role_assignments(user_id,role,student_id) VALUES('demo-student','student','STU00001')").run();
const operator={user_id:'operator',role:'institution_operator',institution_id:'INST001'},admin={user_id:'admin',role:'aicte_admin'},student={user_id:'demo-student',role:'student',student_id:'STU00001'};

test('dataset suggestions retain institution, region and student scope',()=>{
 assert.equal(dataSuggestions(admin,{kind:'institution'}).options.length,2);
 assert.deepEqual(dataSuggestions(operator,{kind:'institution'}).options.map(o=>o.value),['INST001']);
 assert.deepEqual(dataSuggestions({...admin,role:'regional_officer',region:'South'},{kind:'institution'}).options.map(o=>o.value),['INST002']);
 assert.deepEqual(dataSuggestions(student,{kind:'student'}).options.map(o=>o.value),['STU00001']);
 assert.equal(dataSuggestions(operator,{kind:'student',institution:'INST002'}).options.length,0);
 assert.equal(dataSuggestions(operator,{kind:'program',institution:"INST002' OR 1=1--"}).options.length,0);
});

test('registration recommends only unlinked identities at the selected college in demo mode',()=>{
 assert.deepEqual(dataSuggestions(null,{kind:'student',institution:'INST001',demo:true}).options.map(o=>o.value),['STU00003']);
 const result=dataSuggestions(null,{kind:'student',institution:'INST002',demo:true});
 assert.equal(result.options[0].institution_id,'INST002');assert.equal(result.options[0].value,'STU00002');
 assert.equal(result.options[0].data,undefined);assert.equal(result.options[0].apaar,undefined);
 assert.equal(dataSuggestions(null,{kind:'student',institution:'INST001',demo:false}).options.length,0);
});

test('verifiers and technical admins cannot use suggestions to browse records',()=>{
 for(const role of ['external_verifier','system_admin'])for(const kind of ['student','institution','program','identity_dob','certificate'])assert.equal(dataSuggestions({user_id:'test',role},{kind,student:'STU00001'}).options.length,0);
 assert.equal(dataSuggestions({role:'external_verifier'},{kind:'apaar',demo:false}).options.length,0);
 assert.equal(dataSuggestions({role:'external_verifier'},{kind:'apaar',demo:true}).options[0].value,'990000000001');
});

test('identity recommendations match one scoped student rather than mixing records',()=>{
 assert.equal(dataSuggestions(operator,{kind:'identity_name',student:'STU00001'}).options[0].value,'Synthetic STU00001');
 assert.equal(dataSuggestions(operator,{kind:'apaar',student:'STU00001'}).options[0].value,'990000000001');
 assert.equal(dataSuggestions(operator,{kind:'identity_dob',student:'STU00002'}).options.length,0);
 assert.equal(dataSuggestions(student,{kind:'identity_name',student:'STU00003'}).options.length,0);
});

test('complete upload examples come from matching scoped draft and registry records',()=>{
 const data=dataSuggestions(operator,{kind:'upload_example',demo:true}).options[0].data;
 assert.equal(data.student_id,'STU00001');assert.equal(data.program_id,'INST001-P1');
 assert.equal(data.name,'Synthetic STU00001');assert.equal(data.apaar,'990000000001');assert.equal(data.dob,'2004-01-01');
 assert.equal(data.email,'synthetic@example.invalid');assert.equal(data.mobile,'0000000000');assert.equal(data.category,'GENERAL');
 assert.throws(()=>dataSuggestions(operator,{kind:'upload_example',demo:false}),/local synthetic demo/);
 assert.equal(dataSuggestions(operator,{kind:'upload_example',demo:true,institution:'INST002'}).options.length,0);
});
