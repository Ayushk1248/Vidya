import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'vidya-identity-evidence-'));process.env.PLATFORM_DB=join(folder,'test.sqlite');
const {db}=await import('../lib/platform/db.mjs');const {identityEvidence}=await import('../lib/platform/identity-evidence.mjs');const d=db();test.after(()=>{d.close();rmSync(folder,{recursive:true,force:true})});
for(const id of ['A','B']){d.prepare('INSERT INTO institutions VALUES(?,?,?,?,?,?,1)').run(id,'Synthetic Institute '+id,id==='A'?'North':'South','Demo','Demo','Private');d.prepare('INSERT INTO programs VALUES(?,?,?,?)').run(id+'P',id,'Engineering','UG')}
d.prepare("INSERT INTO scheme_caps VALUES('WITHIN',100,'Within')").run();
const one='990000001111',two='990000002222',other='999999999999';
for(const apaar of [one,two])d.prepare('INSERT INTO mock_registry VALUES(?,?,?,1)').run(apaar,'Synthetic Student','2004-01-01');
for(const [id,apaar]of [['S1',one],['S2',one],['S3',two],['S4',null],['S5','bad'],['S6',other],['S7','  ']])d.prepare('INSERT INTO students VALUES(?,?,?,?,?,?,?,?,?,?,1)').run(id,'Synthetic Student','2004-01-01',apaar,'encrypted','hash','encrypted',null,'IN','GENERAL');
for(const [id,sid,inst,year]of [['E1','S1','A',2026],['E2','S2','A',2026],['E3','S3','A',2026],['E4','S4','A',2026],['E5','S5','A',2026],['E6','S6','A',2026],['E7','S7','A',2026],['OTHER','S1','B',2026],['PAST','S3','B',2025]])d.prepare("INSERT INTO enrolments VALUES(?,?,?,?,?,'2026-08-01','2026-08-01','WITHIN','draft',1,0)").run(id,sid,inst,inst+'P',year);
const head={role:'institution_head',institution_id:'A'};
test('Identity evidence separates coverage/existence and duplicate enrolments by year without exposing identifiers',()=>{
 const x=identityEvidence(head,'A',2026);assert.equal(x.total,7);assert.equal(x.missing,2);assert.equal(x.bad_format,1);assert.equal(x.valid_format,4);assert.equal(x.registry_found,3);assert.equal(x.not_found,1);assert.equal(x.within_ids,1);assert.equal(x.within_records,2);assert.equal(x.cross_institution_records,2);assert.equal(x.total,x.missing+x.bad_format+x.valid_format);
 const output=JSON.stringify(x);for(const secret of [one,two,other,'S1','Synthetic Student','encrypted','Institute B'])assert.ok(!output.includes(secret));
 assert.equal(identityEvidence(head,'A',2025).total,0);assert.equal(identityEvidence({role:'regional_officer',region:'South'},'B',2026).cross_institution_records,1);
 assert.throws(()=>identityEvidence(head,'B',2026));assert.throws(()=>identityEvidence({role:'regional_officer',region:'South'},'A',2026));assert.throws(()=>identityEvidence({role:'student',student_id:'S1'},'A',2026));assert.throws(()=>identityEvidence({role:'external_verifier'},'A',2026));assert.throws(()=>identityEvidence(head,'A',NaN));
 // Effective overrides, including corrections after analysis, drive the explicitly live counters.
 d.prepare("INSERT INTO enrolment_values VALUES('E2','Synthetic Student','2004-01-01',?,'GENERAL','IN','encrypted','encrypted',NULL,1)").run(two);
 assert.equal(identityEvidence(head,'A',2026).within_ids,1);assert.equal(identityEvidence(head,'A',2026).cross_institution_records,1);
});
