import {notify} from './notifications.mjs';
import { randomUUID, createHash } from 'node:crypto';
import { db } from './db.mjs';
import { encrypt, decrypt, maskApaar } from './crypto.mjs';
import { roles, registrationRoles, administratorAssignedRoles, AccessError, institutionScope } from './access.mjs';
import { actorFor } from './repository.mjs';
const fail=(message,status=400)=>{throw new AccessError(message,status)};
const text=(value,max=250)=>typeof value==='string'?value.trim().slice(0,max):'';
export function transaction(fn) {
 const d=db();d.exec('BEGIN IMMEDIATE');try{const result=fn();d.exec('COMMIT');return result}catch(e){d.exec('ROLLBACK');throw e}
}
export function audit(actor,action,entity,details={}) {
 const previous=db().prepare('SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get()?.event_hash || '0'.repeat(64);
 const timestamp=new Date().toISOString();const payload=JSON.stringify(details);
 const hash=createHash('sha256').update(JSON.stringify([actor,action,entity,payload,timestamp,previous])).digest('hex');
 db().prepare('INSERT INTO audit_events(actor_id,action,entity_id,details,created_at,previous_hash,event_hash) VALUES(?,?,?,?,?,?,?)').run(actor,action,entity,payload,timestamp,previous,hash);
}
export function limit(bucket,max=20,windowMs=60000) {
 transaction(()=>{const now=Date.now();const row=db().prepare('SELECT * FROM request_limits WHERE bucket=?').get(bucket);
 if(row&&now-row.started_at<windowMs){if(row.count>=max)fail('Too many requests. Please try again in a minute.',429);db().prepare('UPDATE request_limits SET count=count+1 WHERE bucket=?').run(bucket)}
 else db().prepare('INSERT INTO request_limits VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET started_at=excluded.started_at,count=1').run(bucket,now);
 });
}
export function syncProfile(user) {
 const name=text(user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'VIDYA user',100);
 const previous=db().prepare('SELECT display_name,email_cipher FROM account_profiles WHERE user_id=?').get(user.id);
 if(previous&&previous.display_name===name&&decrypt(previous.email_cipher)===(user.email||''))return;
 db().prepare(`INSERT INTO account_profiles(user_id,display_name,email_cipher,updated_at) VALUES(?,?,?,?)
 ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,email_cipher=excluded.email_cipher,updated_at=excluded.updated_at`).run(user.id,name,encrypt(user.email||''),new Date().toISOString());
}
export function registrationData(userId) {
 return {institutions:db().prepare('SELECT id,name,state FROM institutions ORDER BY name').all().map(row=>({...row})),
 regions:db().prepare('SELECT DISTINCT region FROM institutions ORDER BY region').all().map(x=>x.region),
 requests:db().prepare('SELECT * FROM access_requests WHERE user_id=? ORDER BY created_at DESC').all(userId).map(row=>({...row}))};
}
export function requestAccess(userId,input) {
 if(actorFor(userId))fail('Your account already has an approved role. Contact your administrator to change it.',409);
 if(!roles[input.role])fail('Choose a valid role.');
 if(!registrationRoles.includes(input.role))fail('AICTE and system staff roles can only be assigned by an AICTE administrator.',403);
 const role=input.role;let institution=null,region=null,student=null;
 const reason=text(input.reason,1000);const organisation=text(input.organisation,160);const designation=text(input.designation,100);
 if(reason.length<10)fail('Describe your access request in at least 10 characters.');
 if(['institution_operator','institution_head','student','awarding_body'].includes(role)){
  institution=text(input.institution_id,30);
  if(!db().prepare('SELECT id FROM institutions WHERE id=?').get(institution))fail('Choose an institution from the master.');
 }
 if(role==='student'){student=text(input.student_id,30);if(!/^STU\d{5}$/.test(student))fail('Enter your synthetic Student ID, such as STU00001.');}
 if(role==='regional_officer'){region=text(input.region,40);if(!db().prepare('SELECT id FROM institutions WHERE region=?').get(region))fail('Choose a valid region.');}
 if(role==='external_verifier'&&organisation.length<3)fail('Enter your organisation name.');
 if(['institution_operator','institution_head','regional_officer','aicte_admin','awarding_body','system_admin'].includes(role)&&designation.length<3)fail('Enter your designation.');
 return transaction(()=>{
  if(db().prepare("SELECT id FROM access_requests WHERE user_id=? AND status='pending'").get(userId))fail('Your request is already awaiting review.',409);
  const id=randomUUID();db().prepare(`INSERT INTO access_requests(id,user_id,role,institution_id,region,student_id,organisation,designation,reason,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(id,userId,role,institution,region,student,organisation,designation,reason,new Date().toISOString());
  audit(userId,'access.requested',id,{role,institution,region});return{id};
 });
}
function reviewScope(actor) {
 if(actor.role==='aicte_admin')return {clause:'1=1',args:[]};
 if(actor.role==='institution_head')return {clause:"r.institution_id=? AND r.role IN ('institution_operator','student')",args:[actor.institution_id]};
 fail('Only AICTE administrators and Institution Heads can manage access.',403);
}
export function accessQueue(actor) {
 const s=reviewScope(actor);
 const requests=db().prepare(`SELECT r.*,p.display_name,p.email_cipher,i.name institution_name FROM access_requests r
 JOIN account_profiles p ON p.user_id=r.user_id LEFT JOIN institutions i ON i.id=r.institution_id
 WHERE ${s.clause} ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200`).all(...s.args);
 const members=actor.role==='aicte_admin'?db().prepare(`SELECT a.*,coalesce(p.display_name,'Prototype administrator') display_name,i.name institution_name FROM role_assignments a LEFT JOIN account_profiles p ON p.user_id=a.user_id LEFT JOIN institutions i ON i.id=a.institution_id`).all():db().prepare(`SELECT a.*,coalesce(p.display_name,'Assigned user') display_name,i.name institution_name FROM role_assignments a LEFT JOIN account_profiles p ON p.user_id=a.user_id LEFT JOIN institutions i ON i.id=a.institution_id WHERE a.institution_id=? OR (a.role='student' AND EXISTS(SELECT 1 FROM enrolments e WHERE e.student_id=a.student_id AND e.institution_id=?))`).all(actor.institution_id,actor.institution_id);
 return {requests:requests.map(({email_cipher,...rest})=>({...rest,email:decrypt(email_cipher),approval_issues:approvalIssues(rest)})),members:members.map(row=>({...row})),
 unassigned:actor.role==='aicte_admin'?db().prepare("SELECT p.user_id,p.display_name FROM account_profiles p WHERE NOT EXISTS(SELECT 1 FROM role_assignments a WHERE a.user_id=p.user_id) ORDER BY p.display_name").all().map(row=>({...row})):[],
 regions:actor.role==='aicte_admin'?db().prepare('SELECT DISTINCT region FROM institutions ORDER BY region').all().map(row=>row.region):[]};
}
export function assignStaffAccess(actor,input) {
 if(actor.role!=='aicte_admin')fail('Only AICTE administrators can assign staff roles.',403);
 const userId=text(input.user_id,100),role=text(input.role,40),note=text(input.note,1000),designation=text(input.designation,100);
 if(userId===actor.user_id)fail('You cannot assign your own role.',403);
 if(!administratorAssignedRoles.includes(role))fail('Choose an administrator-assigned staff role.');
 if(note.length<10||designation.length<3)fail('Add a designation and an approval reason of at least 10 characters.');
 const region=role==='regional_officer'?text(input.region,40):null;
 if(role==='regional_officer'&&!db().prepare('SELECT id FROM institutions WHERE region=?').get(region))fail('Choose a valid region.');
 return transaction(()=>{
  if(!db().prepare('SELECT user_id FROM account_profiles WHERE user_id=?').get(userId))fail('The account must sign in and register first.',404);
  if(actorFor(userId))fail('This account already has an approved role.',409);
  const now=new Date().toISOString(),id=randomUUID();
  db().prepare("UPDATE access_requests SET status='rejected',reviewed_by=?,reviewed_at=?,review_note='Superseded by administrator staff assignment' WHERE user_id=? AND status='pending'").run(actor.user_id,now,userId);
  db().prepare('INSERT INTO role_assignments(user_id,role,region) VALUES(?,?,?)').run(userId,role,region);
  db().prepare("INSERT INTO access_requests(id,user_id,role,region,designation,reason,status,created_at,reviewed_by,reviewed_at,review_note) VALUES(?,?,?,?,?,?,'approved',?,?,?,?)").run(id,userId,role,region,designation,note,now,actor.user_id,now,note);
  audit(actor.user_id,'access.staff_assigned',userId,{role,region,note});
  return {status:'approved'};
 });
}
function approvalIssues(request) {
 const issues=[];
 if(actorFor(request.user_id))issues.push('This user already has access.');
 if(request.role==='student'){
  if(!db().prepare('SELECT id FROM enrolments WHERE student_id=? AND institution_id=?').get(request.student_id,request.institution_id))issues.push('Student ID is not enrolled at the requested institution. Reject the request and ask for a correction.');
  if(db().prepare("SELECT user_id FROM role_assignments WHERE role='student' AND student_id=?").get(request.student_id))issues.push('This student identity is already linked to another account.');
 }
 return issues;
}
export function reviewAccess(actor,id,decision,note) {
 if(!['approved','rejected'].includes(decision))fail('Choose approve or reject.');
 note=text(note,1000);if(note.length<5)fail('Add a review note (at least 5 characters).');
 const s=reviewScope(actor);
 return transaction(()=>{
 const request=db().prepare(`SELECT r.* FROM access_requests r WHERE r.id=? AND ${s.clause}`).get(id,...s.args);
 if(!request)fail('Request not found.',404);
 if(request.user_id===actor.user_id)fail('You cannot approve or reject your own request.',403);
 if(request.status!=='pending')fail('This request has already been reviewed.',409);
 if(decision==='approved'){
  const issues=approvalIssues(request);if(issues.length)fail(issues[0],actorFor(request.user_id)?409:400);
  db().prepare('INSERT INTO role_assignments(user_id,role,institution_id,region,student_id) VALUES(?,?,?,?,?)').run(request.user_id,request.role,['institution_operator','institution_head','awarding_body'].includes(request.role)?request.institution_id:null,request.region,request.student_id);
  db().prepare('UPDATE account_profiles SET organisation=? WHERE user_id=?').run(request.organisation,request.user_id);
 }
 db().prepare('UPDATE access_requests SET status=?,reviewed_by=?,reviewed_at=?,review_note=? WHERE id=?').run(decision,actor.user_id,new Date().toISOString(),note,id);
 audit(actor.user_id,`access.${decision}`,id,{role:request.role,institution:request.institution_id,note});return{status:decision};
 });
}
export function revokeAccess(actor,userId,note) {
 const s=reviewScope(actor);void s;note=text(note,1000);
 if(note.length<5)fail('Give a reason for revoking access.');
 if(userId===actor.user_id)fail('You cannot revoke your own account.',403);
 return transaction(()=>{const target=actorFor(userId);if(!target)fail('User not found.',404);
 if(actor.role==='institution_head'&&!(target.role==='institution_operator'&&target.institution_id===actor.institution_id))fail('You may revoke only operators at your institution.',403);
 db().prepare('DELETE FROM role_assignments WHERE user_id=?').run(userId);audit(actor.user_id,'access.revoked',userId,{role:target.role,note});return{status:'revoked'};});
}
export function overview(actor,year=2026) {
 if(![2023,2024,2025,2026].includes(year))fail('Choose a seeded academic year.');
 const s=institutionScope(actor);
 const directory=db().prepare(`SELECT i.*,
 (SELECT count(*) FROM programs p WHERE p.institution_id=i.id) programs,
 (SELECT coalesce(sum(a.approved_intake),0) FROM intake_approvals a JOIN programs p ON p.id=a.program_id WHERE p.institution_id=i.id AND a.academic_year=? AND a.approved=1) intake,
 (SELECT count(*) FROM enrolments e WHERE e.institution_id=i.id AND e.academic_year=?) enrolments,
 (SELECT count(*) FROM enrolments e WHERE e.institution_id=i.id AND e.academic_year=? AND e.scheme='WITHIN') within_count,
 (SELECT count(*) FROM enrolments e WHERE e.institution_id=i.id AND e.academic_year=? AND e.status='signed_off') signed_count
 FROM institutions i WHERE ${s.clause} ORDER BY i.id`).all(year,year,year,year,...s.args);
 const summary=db().prepare(`SELECT count(*) total,
 coalesce(sum(CASE WHEN s.apaar IS NOT NULL AND length(s.apaar)=12 AND s.apaar NOT GLOB '*[^0-9]*' THEN 1 ELSE 0 END),0) apaar_count,
 coalesce(sum(CASE WHEN e.scheme<>'WITHIN' THEN 1 ELSE 0 END),0) supernumerary,
 coalesce(sum(CASE WHEN e.status='signed_off' THEN 1 ELSE 0 END),0) signed_count,
 coalesce(sum(e.post_signoff_edits),0) edits
 FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN institutions i ON i.id=e.institution_id WHERE e.academic_year=? AND ${s.clause}`).get(year,...s.args);
 const trend=db().prepare(`SELECT e.academic_year year,count(*) count FROM enrolments e JOIN institutions i ON i.id=e.institution_id WHERE ${s.clause} GROUP BY e.academic_year ORDER BY e.academic_year`).all(...s.args);
 const capacity=db().prepare(`SELECT p.id,p.name,i.id institution_id,i.name institution_name,a.approved_intake intake,
 count(CASE WHEN e.scheme='WITHIN' THEN 1 END) enrolled
 FROM programs p JOIN institutions i ON i.id=p.institution_id JOIN intake_approvals a ON a.program_id=p.id AND a.academic_year=?
 LEFT JOIN enrolments e ON e.program_id=p.id AND e.academic_year=a.academic_year WHERE ${s.clause} AND a.approved=1
 GROUP BY p.id HAVING enrolled>intake ORDER BY enrolled-intake DESC`).all(year,...s.args);
 const pending=actor.role==='aicte_admin'?db().prepare("SELECT count(*) n FROM access_requests WHERE status='pending'").get().n:actor.role==='institution_head'?db().prepare("SELECT count(*) n FROM access_requests WHERE status='pending' AND institution_id=? AND role IN ('student','institution_operator')").get(actor.institution_id).n:0;
 return {year,directory:directory.map(row=>({...row})),summary,trend,capacity,pending};
}
export function activities(actor) {
 if(actor.role==='aicte_admin')return db().prepare('SELECT * FROM audit_events ORDER BY sequence DESC LIMIT 100').all();
 return db().prepare('SELECT * FROM audit_events WHERE actor_id=? ORDER BY sequence DESC LIMIT 100').all(actor.user_id);
}
export const consentFields={name:'Student name',dob:'Date of birth',student_id:'Student ID',apaar:'Masked APAAR',institution:'Institution',program:'Program',academic_year:'Academic year'};
export function consentList(actor) {
 if(!['student','external_verifier'].includes(actor.role))fail('This workspace is for students and verifiers.',403);
 const isStudent=actor.role==='student';
 return db().prepare(`SELECT c.id,c.purpose,c.requested_fields,c.approved_fields,c.status,c.created_at,c.expires_at,c.decided_at,
 coalesce(p.organisation,'') organisation,coalesce(p.display_name,'Verifier') requester
 FROM consent_requests c LEFT JOIN account_profiles p ON p.user_id=c.verifier_id WHERE ${isStudent?'c.student_id':'c.verifier_id'}=? ORDER BY c.created_at DESC`).all(isStudent?actor.student_id:actor.user_id).map(row=>({...row,status:row.expires_at<new Date().toISOString()&&['pending','approved'].includes(row.status)?'expired':row.status,requested_fields:JSON.parse(row.requested_fields),approved_fields:JSON.parse(row.approved_fields||'[]')}));
}
export function requestConsent(actor,input) {
 if(actor.role!=='external_verifier')fail('Only approved verifiers can request records.',403);
 const apaar=text(input.apaar,20),purpose=text(input.purpose,1000);
 if(!/^\d{12}$/.test(apaar))fail('Enter a 12-digit mock APAAR ID.');
 if(purpose.length<10)fail('Describe the purpose in at least 10 characters.');
 if(!Array.isArray(input.fields)||!input.fields.length||input.fields.some(f=>!Object.hasOwn(consentFields,f)))fail('Select supported fields.');
 const fields=[...new Set(input.fields)];
 return transaction(()=>{
 const matches=db().prepare("SELECT DISTINCT e.student_id id FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN role_assignments a ON a.student_id=e.student_id AND a.role='student' WHERE s.apaar=? AND e.academic_year=(SELECT MAX(x.academic_year) FROM enrolments x WHERE x.student_id=e.student_id)").all(apaar);
 if(matches.length!==1)fail('Unable to deliver the request. Ask the student to confirm their ID and activate their VIDYA account.');
 const id=randomUUID();const now=new Date();const expires=new Date(now.getTime()+24*3600*1000).toISOString();
 db().prepare('INSERT INTO consent_requests(id,verifier_id,student_id,purpose,requested_fields,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').run(id,actor.user_id,matches[0].id,purpose,JSON.stringify(fields),now.toISOString(),expires);
 for(const account of db().prepare("SELECT user_id FROM role_assignments WHERE role='student' AND student_id=?").all(matches[0].id))notify(account.user_id,'Academic verification requested',purpose+' · Visit Consent centre to choose fields and approve or reject.','consent');
 audit(actor.user_id,'consent.requested',id,{fields});return{id};
 });
}
export function decideConsent(actor,id,decision,fields=[]) {
 if(actor.role!=='student')fail('Only the linked student can decide.',403);
 if(!['approved','rejected','revoked'].includes(decision))fail('Invalid decision.');
 return transaction(()=>{const row=db().prepare('SELECT * FROM consent_requests WHERE id=? AND student_id=?').get(id,actor.student_id);
 if(!row)fail('Request not found.',404);
 if(row.expires_at<=new Date().toISOString())fail('This request has expired.',409);
 if((decision==='revoked'&&row.status!=='approved')||(decision!=='revoked'&&row.status!=='pending'))fail('This request is no longer awaiting that decision.',409);
 const requested=JSON.parse(row.requested_fields);
 if(decision==='approved'&&(!Array.isArray(fields)||fields.length===0||fields.some(f=>!requested.includes(f))))fail('Choose at least one of the requested fields.');
 db().prepare('UPDATE consent_requests SET status=?,approved_fields=?,decided_at=? WHERE id=?').run(decision,JSON.stringify(decision==='approved'?[...new Set(fields)]:[]),new Date().toISOString(),id);
 notify(row.verifier_id,'Student consent '+decision,'Your academic verification request was '+decision+'.','consent');
 audit(actor.user_id,`consent.${decision}`,id,{fields:decision==='approved'?fields:[]});return{status:decision};});
}
export function consentResult(actor,id) {
 if(actor.role!=='external_verifier')fail('Only the requesting verifier can view the result.',403);
 const row=db().prepare('SELECT * FROM consent_requests WHERE id=? AND verifier_id=?').get(id,actor.user_id);
 if(!row)fail('Request not found.',404);
 if(row.status!=='approved'||row.expires_at<=new Date().toISOString())fail('An active student approval is required.',403);
 const data=db().prepare(`SELECT s.name,s.dob,e.student_id,s.apaar,i.name institution,p.name program,e.academic_year FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN institutions i ON i.id=e.institution_id JOIN programs p ON p.id=e.program_id WHERE e.student_id=? ORDER BY e.academic_year DESC,e.id DESC LIMIT 1`).get(row.student_id);
 if(!data)fail('Record unavailable.',404);data.apaar=maskApaar(data.apaar);
 const fields=JSON.parse(row.approved_fields);const result=Object.fromEntries(fields.map(k=>[k,data[k]]));
 transaction(()=>audit(actor.user_id,'consent.result_viewed',id,{fields}));
 return{fields:result,source:'Institution-submitted - synthetic record',expires_at:row.expires_at};
}
