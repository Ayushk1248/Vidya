import {db} from './db.mjs';
import {encrypt} from './crypto.mjs';
import {roles} from './access.mjs';
export function demoEnabled(host=''){return process.env.VIDYA_DEMO_MODE==='1'&&process.env.NODE_ENV!=='production'&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)}
export function demoActors(){return Object.entries(roles).map(([role,label])=>({role,label,user_id:'demo-'+role}))}
export function ensureDemoAccounts(){
 const d=db();if(!d.prepare("SELECT id FROM institutions WHERE id='INST001'").get())throw new Error('Run npm run seed before entering the demo.');
 for(const {role,label,user_id} of demoActors()){
  const institution=['institution_operator','institution_head','awarding_body'].includes(role)?'INST001':null;
  d.prepare('INSERT OR IGNORE INTO role_assignments VALUES(?,?,?,?,?)').run(user_id,role,institution,role==='regional_officer'?'North':null,role==='student'?'STU00001':null);
  d.prepare('INSERT OR IGNORE INTO account_profiles VALUES(?,?,?,?,?)').run(user_id,label,encrypt(role+'@example.invalid'),role==='external_verifier'?'Synthetic Employer':'',new Date().toISOString());
 }
}
export function demoUser(id){return {id,email:id+'@example.invalid',user_metadata:{username:id,display_name:demoActors().find(a=>a.user_id===id)?.label||'Demo account'}}}
