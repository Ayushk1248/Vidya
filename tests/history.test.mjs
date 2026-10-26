import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'vidya-history-'));process.env.PLATFORM_DB=join(folder,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs'),{encrypt}=await import('../lib/platform/crypto.mjs'),{auditHistory,recordHistory}=await import('../lib/platform/history.mjs');const d=db();test.after(()=>{d.close();rmSync(folder,{recursive:true,force:true})});
const admin={user_id:'admin',role:'aicte_admin'},head={user_id:'head',role:'institution_head',institution_id:'A'};
for(const id of ['A','B']){d.prepare('INSERT INTO institutions VALUES(?,?,?,?,?,?,1)').run(id,'Synthetic '+id,id==='A'?'North':'South','Test State','Test District','Private');d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+'P',id,'Synthetic Program','UG')}
d.prepare("INSERT INTO scheme_caps VALUES('WITHIN',100,'Within')").run();d.prepare("INSERT INTO students VALUES('S','Synthetic Student','2004-01-01','990000001234','cipher','hash','cipher',NULL,'IN','GENERAL',1)").run();
for(const [id,inst] of [['E','A'],['OTHER','B'],['SEED','A']])d.prepare("INSERT INTO enrolments VALUES(?,'S',?,?,2026,'2026-08-01','2026-08-01','WITHIN','signed_off',2,1)").run(id,inst,inst+'P');
const first={name:'Synthetic First',apaar:'990000001234',student_id:'S',program_id:'AP',mobile:'private-mobile',email:'private-email',passport:'private-passport'};
for(const [v,snapshot]of [[1,first],[2,{...first,name:'Synthetic Updated',apaar:'991111111234'}]])d.prepare('INSERT INTO record_versions(enrolment_id,version,snapshot_cipher,reason,actor_id) VALUES(?,?,?,?,?)').run('E',v,encrypt(JSON.stringify(snapshot)),'Synthetic correction '+v,'head');
for(let n=1;n<=105;n++)d.prepare('INSERT INTO audit_events(actor_id,action,entity_id,details,created_at,previous_hash,event_hash) VALUES(?,?,?,?,?,?,?)').run(n===1?'other':'head',n===2?'upload.test':'access.test',n===3?'literal%_ref':'ref'+n,'{}',n===4?'2026-10-26T18:29:59.999Z':'2026-10-26T18:30:00.000Z','hash','hash');
test('Audit history paginates all events, literal search, account scope, exact action and IST inclusive dates',()=>{
 let x=auditHistory(admin);assert.equal(x.total,105);assert.equal(x.rows.length,25);assert.equal(x.pages,5);assert.equal(auditHistory(admin,{page:'99'}).page,5);
 assert.equal(auditHistory(admin,{q:'literal%_'}).total,1);assert.equal(auditHistory(admin,{q:"' OR 1=1 --"}).total,0);assert.equal(auditHistory(admin,{q:'#105'}).rows[0].sequence,105);
 assert.equal(auditHistory(admin,{action:'upload.test'}).total,1);assert.equal(auditHistory(admin,{actor:'other'}).total,1);
 assert.equal(auditHistory(head,{actor:'other'}).total,104);assert.ok(auditHistory(head).rows.every(r=>r.actor_id==='head'));
 assert.equal(auditHistory(admin,{from:'2026-10-27',to:'2026-10-27'}).total,104);assert.equal(auditHistory(admin,{from:'2026-10-26',to:'2026-10-26'}).total,1);
 assert.throws(()=>auditHistory(admin,{from:'2026-02-30'}));assert.throws(()=>auditHistory(admin,{from:'2026-10-27',to:'2026-10-26'}));
});
test('Version comparison masks identifiers, detects hidden APAAR changes and enforces record scope',()=>{
 const x=recordHistory(head,'E');assert.equal(x.from,1);assert.equal(x.to,2);assert.equal(x.comparison.filter(f=>f.changed).length,2);
 const apaar=x.comparison.find(f=>f.key==='apaar');assert.equal(apaar.before,apaar.after);assert.equal(apaar.changed,true);assert.match(apaar.before,/XXXX/);
 const exposed=JSON.stringify(x);for(const secret of ['private-mobile','private-email','private-passport','990000001234','991111111234','snapshot_cipher'])assert.ok(!exposed.includes(secret));
 assert.throws(()=>recordHistory(head,'OTHER'));assert.throws(()=>recordHistory({role:'regional_officer',region:'South'},'E'));assert.throws(()=>recordHistory({role:'student',student_id:'OTHER'},'E'));assert.throws(()=>recordHistory({role:'external_verifier'},'E'));
 assert.equal(recordHistory({role:'student',student_id:'S'},'E').record.student_id,'S');assert.equal(recordHistory(head,'SEED').versions.length,0);
 assert.throws(()=>recordHistory(head,'E',{from:'99'}));assert.throws(()=>recordHistory(head,'E',{from:'2',to:'1'}));assert.equal(recordHistory(head,'E',{from:'1',to:'1'}).comparison.some(f=>f.changed),false);
});
