import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'vidya-dashboard-'));process.env.PLATFORM_DB=join(folder,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');
const {dashboardData}=await import('../lib/platform/dashboard.mjs');
const {enrolments}=await import('../lib/platform/repository.mjs');
const d=db();test.after(()=>{d.close();rmSync(folder,{recursive:true,force:true})});
const admin={role:'aicte_admin',user_id:'admin'},head={role:'institution_head',user_id:'head',institution_id:'A'};
for(const [id,region,state] of [['A','North','Punjab'],['B','South','Karnataka']]){
 d.prepare('INSERT INTO institutions VALUES(?,?,?,?,?,?,1)').run(id,'Synthetic '+id,region,state,'Test district','Private');
 for(const suffix of ['1','2']){d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+suffix,id,'Program '+suffix,'UG');for(const year of [2025,2026])d.prepare('INSERT INTO intake_approvals VALUES(?,?,60,1,?)').run(id+suffix,year,year+'-09-30')}
}
for(const scheme of ['WITHIN','TFW'])d.prepare('INSERT INTO scheme_caps VALUES(?,5,?)').run(scheme,scheme);
d.prepare("INSERT INTO students VALUES('S','Synthetic Student','2004-01-01','990000000001','encrypted','hash','encrypted',NULL,'IN','GENERAL',1)").run();
for(let i=0;i<65;i++)d.prepare("INSERT INTO enrolments VALUES(?,'S','A','A1',2026,'2026-08-01','2026-08-01',?,'signed_off',1,0)").run('E'+i,i<62?'WITHIN':'TFW');
d.prepare("INSERT INTO enrolments VALUES('B1','S','B','B1',2026,'2026-08-01','2026-08-01','WITHIN','draft',1,0)").run();
for(let i=0;i<105;i++)d.prepare("INSERT INTO upload_batches(id,institution_id,uploaded_by,academic_year,filename,status) VALUES(?,'A','op',2026,'synthetic.csv','review')").run('U'+i);
d.prepare("INSERT INTO upload_batches(id,institution_id,uploaded_by,academic_year,filename,status) VALUES('OLD','A','op',2025,'synthetic.csv','signed_off')").run();
const now=new Date('2026-09-29T19:00:00Z');
test('Year-scoped, uncapped submission totals; deadlines use India time and historical flags are not approval',()=>{
 const x=dashboardData(admin,2026,now);assert.equal(x.today,'2026-09-30');assert.equal(x.uploads.reduce((n,b)=>n+b.count,0),105);
 const a=x.tracker.find(i=>i.id==='A');assert.equal(a.status,'Awaiting Head');assert.equal(a.approved_records,0);assert.equal(a.days_remaining,0);assert.equal(a.deadline_status,'Due soon');assert.equal(a.complete,false);
 assert.equal(dashboardData(admin,2026,new Date('2026-09-30T18:30:00Z')).tracker[0].deadline_status,'Overdue');
 const old=dashboardData(admin,2025,now);assert.equal(old.uploads.reduce((n,b)=>n+b.count,0),1);assert.equal(old.tracker[0].status,'Signed batches');assert.equal(old.tracker[0].complete,false);
 const p=x.programs.find(p=>p.id==='A1');assert.equal(p.within_count,62);assert.equal(p.intake,60);assert.equal(p.supernumerary,3);assert.equal(p.within_count-p.intake,2);
});
test('Scope is enforced before aggregating; program register stays in scope',()=>{
 const x=dashboardData(head);assert.deepEqual(x.institutions.map(i=>i.id),['A']);assert.ok(x.programs.every(p=>p.institution_id==='A'));assert.ok(x.tracker.every(i=>i.id==='A'));
 assert.deepEqual(dashboardData({role:'regional_officer',region:'South'}).institutions.map(i=>i.id),['B']);
 assert.throws(()=>dashboardData({role:'student',student_id:'S'}));assert.throws(()=>dashboardData({role:'external_verifier'}));assert.throws(()=>dashboardData(admin,2027));
 assert.equal(enrolments(head,{programId:'B1',year:2026}).total,0);assert.equal(enrolments(head,{programId:'A1',year:2026}).total,65);assert.equal(enrolments(head,{programId:'A2',year:2026}).total,0);
});
test('Current approval versions, failed batches and unapproved capacity are represented accurately',()=>{
 d.prepare("INSERT INTO record_versions(enrolment_id,version,snapshot_cipher,reason,actor_id) VALUES('E0',1,'encrypted','Test approval','head')").run();
 assert.equal(dashboardData(head).tracker[0].approved_records,1);
 d.prepare("UPDATE enrolments SET version=2 WHERE id='E0'").run();assert.equal(dashboardData(head).tracker[0].approved_records,0);
 d.prepare("UPDATE upload_batches SET status='failed' WHERE id='U0'").run();assert.equal(dashboardData(head).tracker[0].status,'Failed');
 d.prepare("UPDATE intake_approvals SET approved=0 WHERE program_id='A2' AND academic_year=2026").run();assert.equal(dashboardData(head).programs.find(p=>p.id==='A2').intake,0);
});
