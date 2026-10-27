import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
process.env.PLATFORM_DB=join(mkdtempSync(join(tmpdir(),'vidya-plan-')),'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');const {encrypt}=await import('../lib/platform/crypto.mjs');
const {reportData,exportReport,reportFilterOptions}=await import('../lib/platform/reports.mjs');
const {createClient,integrationActor,revokeClient,accessToken}=await import('../lib/platform/integrations.mjs');
const {totp,beginMfa,confirmMfa}=await import('../lib/platform/mfa.mjs');
const {seal,unseal}=await import('../lib/platform/tokens.mjs');
const {demoEnabled}=await import('../lib/platform/demo.mjs');
const {createCase,caseList,updateCase}=await import('../lib/platform/cases.mjs');
const {notifications,markRead}=await import('../lib/platform/notifications.mjs');
const {institutions}=await import('../lib/platform/repository.mjs');
const {saveDetails,detailsFor}=await import('../lib/platform/details.mjs');
const d=db(),head={user_id:'HEAD',role:'institution_head',institution_id:'A'},other={user_id:'OTHER',role:'institution_head',institution_id:'B'},admin={user_id:'ADMIN',role:'aicte_admin'},regional={user_id:'REGION',role:'regional_officer',region:'North'};
d.prepare("INSERT INTO scheme_caps VALUES('WITHIN',100,'Within intake')").run();
for(const id of ['A','B']){d.prepare('INSERT INTO institutions VALUES(?,?,?,?,?,?,1)').run(id,'Synthetic '+id,id==='A'?'North':'South','Demo state','Demo','Engineering');d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+'P',id,'Synthetic program','UG');d.prepare('INSERT INTO intake_approvals VALUES(?,2026,60,1,?)').run(id+'P','2026-12-31');d.prepare('INSERT INTO students VALUES(?,?,?,?,?,?,?,?,?,?,1)').run(id+'S','Synthetic person','2004-01-01','99000000000'+(id==='A'?'1':'2'),encrypt('0000000000'),'hash',encrypt('student@example.invalid'),null,'IN','GENERAL');d.prepare('INSERT INTO enrolments VALUES(?,?,?,?,2026,?,?,?,\'draft\',1,0)').run(id+'E',id+'S',id,id+'P','2026-08-01','2026-08-01','WITHIN')}
d.prepare('INSERT INTO role_assignments VALUES(?,?,?,?,?)').run('HEAD','institution_head','A',null,null);
test('purpose-bound signed sessions reject modifications, wrong purpose and expiry',()=>{const token=seal({id:'u'},'demo');assert.equal(unseal(token,'demo').id,'u');assert.equal(unseal(token+'x','demo'),null);assert.equal(unseal(token,'mfa'),null);assert.equal(unseal(seal({id:'u'},'demo',-1),'demo'),null)});
test('demo mode requires explicit local configuration and is disabled in production',()=>{const prior=process.env.NODE_ENV;process.env.NODE_ENV='development';process.env.VIDYA_DEMO_MODE='1';assert.equal(demoEnabled('127.0.0.1:3001'),true);assert.equal(demoEnabled('evil.example'),false);process.env.NODE_ENV='production';assert.equal(demoEnabled('localhost:3001'),false);if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior});
test('TOTP matches the RFC vector, rejects replay and consumes recovery codes once',()=>{assert.equal(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',1),'287082');const setup=beginMfa('MFA-USER'),code=totp(setup.secret),result=confirmMfa('MFA-USER',code);assert.equal(result.recovery_codes.length,8);assert.throws(()=>confirmMfa('MFA-USER',code));assert.equal(confirmMfa('MFA-USER',result.recovery_codes[0]).verified,true);assert.throws(()=>confirmMfa('MFA-USER',result.recovery_codes[0]))});
test('API keys and OAuth tokens are institution scoped; revocation takes effect immediately',()=>{assert.throws(()=>createClient(other,'A','Forbidden client'));const client=createClient(head,'A','Synthetic ERP'),token=accessToken(client.id,client.secret);for(const headers of [{'x-api-key':client.api_key},{authorization:'Bearer '+token.access_token}])assert.equal(integrationActor(new Request('http://localhost/api',{headers})).institution_id,'A');revokeClient(head,client.id);assert.throws(()=>integrationActor(new Request('http://localhost/api',{headers:{authorization:'Bearer '+token.access_token}})))});
test('technical administrator cannot browse student institutions; awarding bodies remain scoped',()=>{assert.throws(()=>institutions({role:'system_admin'}));assert.deepEqual(institutions({role:'awarding_body',institution_id:'A'}).map(i=>i.id),['A'])});
test('reports enforce scope before aggregation and export readable multi-page PDF/CSV',async()=>{const data=reportData(head,{type:'intake',year:2026});assert.equal(data.rows.length,1);assert.equal(data.rows[0][0],'Synthetic A');assert.equal(reportData(head,{institution:'B'}).rows.length,0);assert.throws(()=>reportData({role:'external_verifier'}));const pdf=await exportReport(head,{type:'intake',format:'pdf'});assert.ok((await PDFDocument.load(pdf.bytes)).getPageCount()>0);assert.match((await exportReport(head,{format:'csv'})).bytes.toString(),/Synthetic A/);assert.throws(()=>reportData(head,{year:'bad'}))});
test('report search accepts college names and IDs while suggestions and exports preserve scope',async()=>{
 for(const institution of ['A',' a ','Synthetic A',' synthetic a ','thetic A']){
  const report=reportData(admin,{institution});assert.equal(report.rows.length,1,institution);assert.equal(report.rows[0][0],'Synthetic A');assert.equal(report.filter_summary,'Synthetic A');
 }
 assert.equal(reportData(admin,{institution:'Synthetic',program:'synthetic program'}).rows.length,2);
 assert.equal(reportData(admin,{institution:'A Synthetic'}).rows.length,1,'search words can appear in any order');
 assert.equal(reportData(admin,{institution:'%'}).rows.length,0,'wildcards are literal');
 assert.equal(reportData(admin,{institution:"' OR 1=1 --"}).rows.length,0);
 assert.equal(reportData(admin,{institution:'does not exist'}).rows.length,0);
 assert.equal(reportData(regional,{institution:'Synthetic B'}).rows.length,0);
 assert.equal(reportData(admin,{institution:'Synthetic A',state:'demo STATE',program:'ap'}).rows.length,1);
 assert.deepEqual(reportFilterOptions(regional).institutions.map(i=>i.id),['A']);
 assert.deepEqual(reportFilterOptions(head).programs.map(p=>p.id),['AP']);
 assert.throws(()=>reportFilterOptions({role:'external_verifier'}));
 for(const type of ['intake','apaar','category','pending','excess','compliance','anomalies']){
  assert.ok(reportData(admin,{type,institution:'Synthetic A'}).rows.every(row=>row[0]==='Synthetic A'),type);
 }
 const csv=await exportReport(admin,{institution:'Synthetic A',format:'csv'});
 assert.match(csv.bytes.toString(),/Synthetic A/);assert.doesNotMatch(csv.bytes.toString(),/Synthetic B/);assert.match(csv.filename,/Synthetic-A/);
 const pdf=await exportReport(admin,{institution:'Synthetic A',format:'pdf'});assert.equal((await PDFDocument.load(pdf.bytes)).getPageCount(),1);
});
test('officer cases and notifications cannot cross institution boundaries',()=>{const c=createCase(regional,{institution_id:'A',rule_code:'V08',summary:'Explain the synthetic excess admissions'});assert.throws(()=>createCase(regional,{institution_id:'B',summary:'Not in this officer region'}));assert.equal(caseList(other).cases.length,0);assert.throws(()=>updateCase(other,{id:c.id,note:'Unauthorized response'}));updateCase(head,{id:c.id,note:'These synthetic records are being reviewed'});assert.equal(caseList(admin).cases[0].status,'responded');const notification=notifications(head)[0];assert.ok(notification);assert.throws(()=>markRead(other,notification.id));markRead(head,notification.id);assert.ok(notifications(head)[0].read_at)});
test('extended demographics preserve independent categories and encrypt parent names',()=>{saveDetails('AE',{gender:'F',year_of_study:'2',admission_mode:'Lateral',social_category:'OBC',nri_status:'Y',oci_status:'N',fn_status:'N',enrolment_status:'Transferred',status_date:'2026-09-01',parent_name:'Synthetic Parent',admission_date:'2026-08-01'});const r=detailsFor('AE');assert.equal(r.social_category,'OBC');assert.equal(r.nri_status,'Y');assert.equal(r.year_of_study,2);assert.equal(r.parent_name,'Synthetic Parent');assert.match(d.prepare('SELECT parent_name_cipher FROM student_details').get().parent_name_cipher,/^v1:/)});
test('legacy constraint migration preserves roles and rules without foreign-key damage',async()=>{const {migrate}=await import('../lib/platform/migrate.mjs'),legacy=new DatabaseSync(':memory:');legacy.exec(readFileSync('db/schema.sql','utf8').replaceAll(",'critical','info'",'').replaceAll(",'awarding_body'",'').replaceAll(",'system_admin'",''));legacy.prepare("INSERT INTO role_assignments(user_id,role) VALUES('old-admin','aicte_admin')").run();legacy.prepare("INSERT INTO validation_rules(code,title,severity) VALUES('V08','Excess','error')").run();migrate(legacy);assert.equal(legacy.prepare('SELECT role FROM role_assignments').get().role,'aicte_admin');assert.equal(legacy.prepare('SELECT severity FROM validation_rules').get().severity,'critical');assert.deepEqual(legacy.prepare('PRAGMA foreign_key_check').all(),[]);legacy.close()});
test('separate signed checkpoint detects removal of an otherwise valid audit suffix',async()=>{const {checkpoint}=await import('../lib/platform/admin.mjs'),{checkAuditIntegrity}=await import('../lib/platform/audit-integrity.mjs');assert.equal(checkAuditIntegrity(admin).status,'valid');const anchor=checkpoint(admin);assert.equal(checkAuditIntegrity(admin).status,'valid');d.prepare('DELETE FROM audit_events WHERE sequence>=?').run(anchor.sequence);const result=checkAuditIntegrity(admin);assert.equal(result.status,'broken');assert.match(result.reason,/checkpoint/i)});
