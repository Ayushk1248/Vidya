import { spawnSync } from 'node:child_process';
import { db } from '../lib/platform/db.mjs';
import { encrypt, mobileHash } from '../lib/platform/crypto.mjs';
const d = db();
if (d.prepare('SELECT count(*) n FROM institutions').get().n) {
  console.log('Seed already exists. No records changed.'); process.exit(0);
}
const python = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python';
const generated = spawnSync(python,['scripts/generate-seed.py'],{encoding:'utf8',maxBuffer:20*1024*1024});
if (generated.status !== 0) throw new Error(generated.stderr || 'Faker seed failed');
const people = JSON.parse(generated.stdout);
const regions = [ ['North','Delhi','New Delhi'],['North','Punjab','Ludhiana'],['West','Maharashtra','Pune'],['West','Gujarat','Ahmedabad'],
 ['South','Tamil Nadu','Chennai'],['South','Karnataka','Bengaluru'],['East','West Bengal','Kolkata'],['East','Odisha','Bhubaneswar'],
 ['Central','Madhya Pradesh','Bhopal'],['North-East','Assam','Guwahati'] ];
const titles=['Computer Science & Engineering','Mechanical Engineering','Electronics & Communication'];
const rules=['Missing APAAR','Invalid APAAR format','APAAR not in mock registry','Name or DOB mismatch','Duplicate APAAR in file',
 'Duplicate APAAR in institution','Cross-institution duplicate','Approved intake exceeded','Supernumerary scheme cap exceeded',
 'Category inconsistency','Invalid date sequence','Program not approved','Late submission','Possible duplicate person'];
const insert=(table,cols)=>d.prepare(`INSERT INTO ${table}(${cols}) VALUES(${cols.split(',').map(()=>'?').join(',')})`);
d.exec('BEGIN IMMEDIATE');
try {
  const master=insert('institutions','id,name,region,state,district,institution_type');
  const program=insert('programs','id,institution_id,name,level');
  const approval=insert('intake_approvals','program_id,academic_year,approved_intake,approved,deadline');
  for(let i=0;i<100;i++) {
    const [region,state,city]=regions[i%regions.length]; const id=`INST${String(i+1).padStart(3,'0')}`;
    master.run(id,`Synthetic ${city} Institute ${String(i+1).padStart(3,'0')}`,region,state,city,i%3===0?'Government':'Private');
    for(let p=0;p<3;p++) {
      const pid=`${id}-P${p+1}`; program.run(pid,id,titles[p],'Undergraduate');
      for(let year=2023;year<=2026;year++) approval.run(pid,year,60,(i===5&&p===2&&year===2026)?0:1,`${year}-09-30`);
    }
  }
  const cap=insert('scheme_caps','scheme,cap_percent,description');
  cap.run('WITHIN',100,'Counts against approved intake'); cap.run('TFW',5,'Mock tuition fee waiver cap');
  cap.run('FN',15,'Mock foreign national cap'); cap.run('OCI',5,'Mock OCI cap');
  const reg=insert('mock_registry','apaar,name,dob');
  for(const s of people) reg.run(s.apaar,s.name,s.dob);
  // Four deliberately anomalous institutions; their current-year counts rise sharply.
  for(let i=0;i<200;i++) people[i].mobile='0000000001';
  people[200].apaar=null; people[201].apaar='BAD-APAAR'; people[202].apaar='989999999999';
  people[203].name='Synthetic Mismatched Person'; people[204].dob='2015-01-01';
  people[205].apaar=people[206].apaar; people[250].apaar=people[300].apaar;
  people[207].category='FN'; people[207].nationality='IN'; people[207].passport='';
  people[208].apaar=null; people[208].name=people[209].name; people[208].dob=people[209].dob;
  for(let i=0;i<200;i+=3) people[i].name=`Mismatch ${people[i].name}`;
  const student=insert('students','id,name,dob,apaar,mobile_cipher,mobile_hash,email_cipher,passport_cipher,nationality,category');
  for(const s of people) student.run(s.id,s.name,s.dob,s.apaar,encrypt(s.mobile),mobileHash(s.mobile),encrypt(s.email),s.passport?encrypt(s.passport):null,s.nationality,s.category);
  const enrol=insert('enrolments','id,student_id,institution_id,program_id,academic_year,admission_date,submitted_at,scheme,status,version,post_signoff_edits');
  let count=0;
  for(let year=2023;year<=2026;year++) {
    for(let index=0;index<people.length;index++) {
      let inst=Math.floor(index/50), p=index%3, scheme='WITHIN';
      if(year===2026 && index>=500 && index<1300) inst=Math.floor((index-500)/200);
      // Acceptance fixture: 62 within intake + 3 TFW, intake=60 in INST005-P1.
      if(year===2026 && ((index>=210&&index<=249)||(index>=1300&&index<=1324))) {
        inst=4;p=0;scheme=index>=1322?'TFW':'WITHIN';
      } else if(year===2026 && inst===4) p=1;
      if(year===2026 && index>=270&&index<280) {inst=5;p=0;scheme='TFW';}
      const iid=`INST${String(inst+1).padStart(3,'0')}`;
      const edited=year===2026&&inst<4&&index%2===0;
      enrol.run(`ENR${String(++count).padStart(6,'0')}`,people[index].id,iid,`${iid}-P${p+1}`,year,
        index===210?`${year+1}-08-01`:`${year}-08-01`, index===211?`${year}-10-15`:`${year}-09-01`,
        scheme,edited?'signed_off':'draft',edited?2:1,edited?1:0);
    }
  }
  const rule=insert('validation_rules','code,title,severity,configuration');
  rules.forEach((title,i)=>rule.run(`V${String(i+1).padStart(2,'0')}`,title,[3,10,13].includes(i)?'warning':[6,7,8].includes(i)?'critical':i===12?'info':'error',JSON.stringify(i===3||i===13?{name_threshold:85}:{})));
  const fixture=insert('seed_fixtures','code,description,references_json');
  const refs=[['STU00201'],['STU00202'],['STU00203'],['STU00204','STU00205'],['STU00206','STU00207'],['STU00206','STU00207'],
    ['STU00251','STU00301'],['INST005-P1'],['INST006-P1'],['STU00208'],['STU00211'],['INST006-P3'],['STU00212'],['STU00209','STU00210']];
  rules.forEach((title,i)=>fixture.run(`V${String(i+1).padStart(2,'0')}`,title,JSON.stringify(refs[i])));
  fixture.run('ANOMALY','Planted growth, ratio, mismatch, shared mobile, edit patterns',JSON.stringify(['INST001','INST002','INST003','INST004']));
  d.exec('COMMIT');
  console.log('Seeded 100 institutions, 300 programs, 1,200 yearly approvals, 5,000 synthetic students/registry IDs and 20,000 enrolments.');
  console.log('14 labelled rule fixtures and 4 anomaly fixtures are ready for later phases. No login accounts or roles were fabricated.');
} catch(e) { d.exec('ROLLBACK'); throw e; }
