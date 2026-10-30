import {randomUUID} from 'node:crypto';
import {db} from './db.mjs';
import {decrypt} from './crypto.mjs';
import {roles,AccessError} from './access.mjs';
import {actorFor} from './repository.mjs';
import {transaction,audit} from './workflows.mjs';
import {notify} from './notifications.mjs';

const fail=(message,status=400)=>{throw new AccessError(message,status)};
const text=(value,max=250)=>typeof value==='string'?value.trim().slice(0,max):'';
function administrator(actor){if(actor?.role!=='aicte_admin')fail('Only AICTE administrators can manage account roles.',403)}
export function assignmentScope(actor){return actor?JSON.stringify([actor.role,actor.institution_id||null,actor.region||null,actor.student_id||null]):null}
export function managedAccounts(actor,query){
 administrator(actor);
 const q=text(query,160).toLowerCase();if(q.length<2)return {accounts:[]};
 const accounts=[];
 for(const profile of db().prepare("SELECT user_id,display_name,email_cipher,organisation FROM account_profiles WHERE user_id NOT LIKE 'demo-%' ORDER BY display_name,user_id").iterate()){
  const email=decrypt(profile.email_cipher);
  if(!email.toLowerCase().includes(q)&&!profile.display_name.toLowerCase().includes(q))continue;
  const assigned=actorFor(profile.user_id),assignment=assigned?{role:assigned.role,institution_id:assigned.institution_id,region:assigned.region,student_id:assigned.student_id}:null;
  accounts.push({user_id:profile.user_id,display_name:profile.display_name,email,organisation:profile.organisation,assignment,expected_assignment:assignmentScope(assigned)});
  if(accounts.length===20)break;
 }
 return {accounts};
}
export function changeAccountRole(actor,input){
 administrator(actor);
 const userId=text(input.user_id,100),role=text(input.role,40),note=text(input.note,1000),designation=text(input.designation,100),organisation=text(input.organisation,160);
 if(userId===actor.user_id)fail('You cannot change your own role. Ask another administrator.',403);
 if(userId.startsWith('demo-'))fail('Shared demonstration roles are fixed. Choose a registered email account.');
 if(!Object.hasOwn(roles,role))fail('Choose a valid role.');
 if(note.length<10)fail('Explain the role change in at least 10 characters.');
 if(!['student','external_verifier'].includes(role)&&designation.length<3)fail('Enter the account holder’s designation.');
 if(role==='external_verifier'&&organisation.length<3)fail('Enter the verifier’s organisation.');
 const institution=['institution_operator','institution_head','awarding_body','student'].includes(role)?text(input.institution_id,40):null;
 const region=role==='regional_officer'?text(input.region,40):null,student=role==='student'?text(input.student_id,40):null;
 return transaction(()=>{
  const profile=db().prepare('SELECT user_id FROM account_profiles WHERE user_id=?').get(userId);
  if(!profile)fail('This account must sign in before an administrator can assign its role.',404);
  const before=actorFor(userId);
  if(!Object.hasOwn(input,'expected_assignment')||input.expected_assignment!==assignmentScope(before))fail('The account role changed since you opened it. Search again before saving.',409);
  if(institution&&!db().prepare('SELECT id FROM institutions WHERE id=?').get(institution))fail('Choose an institution from the master.');
  if(['institution_operator','institution_head','awarding_body','student'].includes(role)&&!institution)fail('Choose an institution from the master.');
  if(role==='regional_officer'&&(!region||!db().prepare('SELECT id FROM institutions WHERE region=?').get(region)))fail('Choose a valid region.');
  if(role==='student'){
   if(!db().prepare('SELECT id FROM enrolments WHERE student_id=? AND institution_id=?').get(student,institution))fail('Student ID is not enrolled at the selected institution.');
   if(db().prepare("SELECT user_id FROM role_assignments WHERE role='student' AND student_id=? AND user_id<>?").get(student,userId))fail('This student identity is already linked to another account.');
  }
  if(before?.role==='aicte_admin'&&role!=='aicte_admin'&&db().prepare("SELECT count(*) n FROM role_assignments WHERE role='aicte_admin'").get().n<=1)fail('The last AICTE administrator cannot be removed.',409);
  const after={role,institution_id:role==='student'?null:institution,region,student_id:student};
  if(assignmentScope(before)===assignmentScope(after))fail('Choose a different role or scope before saving.');
  const now=new Date().toISOString();
  // Old verifier grants and detached student links must not survive a change of identity.
  if(before?.role==='external_verifier')db().prepare("UPDATE consent_requests SET status='revoked',decided_at=? WHERE verifier_id=? AND status IN('pending','approved')").run(now,userId);
  if(before?.role==='student'&&(role!=='student'||before.student_id!==student))db().prepare("UPDATE consent_requests SET status='revoked',decided_at=? WHERE student_id=? AND status IN('pending','approved')").run(now,before.student_id);
  db().prepare(`INSERT INTO role_assignments(user_id,role,institution_id,region,student_id) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,institution_id=excluded.institution_id,region=excluded.region,student_id=excluded.student_id`).run(userId,role,after.institution_id,region,student);
  db().prepare('UPDATE account_profiles SET organisation=? WHERE user_id=?').run(organisation,userId);
  db().prepare("UPDATE access_requests SET status='rejected',reviewed_by=?,reviewed_at=?,review_note='Superseded by administrator role assignment' WHERE user_id=? AND status='pending'").run(actor.user_id,now,userId);
  db().prepare("INSERT INTO access_requests(id,user_id,role,institution_id,region,student_id,organisation,designation,reason,status,created_at,reviewed_by,reviewed_at,review_note) VALUES(?,?,?,?,?,?,?,?,?,'approved',?,?,?,?)").run(randomUUID(),userId,role,institution,region,student,organisation,designation,note,now,actor.user_id,now,note);
  audit(actor.user_id,'access.role_changed',userId,{before:before?{role:before.role,institution_id:before.institution_id,region:before.region,student_id:before.student_id}:null,after,note});
  notify(userId,'Workspace role updated','Your assigned role is now '+roles[role]+'. Reopen your workspace to use your new access. Administrator note: '+note,'access');
  return {status:'approved',role};
 });
}
