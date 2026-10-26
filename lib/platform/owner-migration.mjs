import {db} from './db.mjs';
import {decrypt} from './crypto.mjs';
import {transaction,audit} from './workflows.mjs';
// Called only with a user returned by Supabase auth.getUser(), never browser input.
export function migrateVerifiedOwner(user) {
 if(!user.email_confirmed_at || !user.email)return false;
 return transaction(()=>{
  const request=db().prepare('SELECT * FROM owner_migrations WHERE project_url=? AND new_user_id IS NULL').get(process.env.NEXT_PUBLIC_SUPABASE_URL||'');
  if(!request || decrypt(request.email_cipher).trim().toLowerCase()!==user.email.trim().toLowerCase())return false;
  const old=db().prepare('SELECT role FROM role_assignments WHERE user_id=?').get(request.old_user_id);
  if(old?.role!=='aicte_admin')return false;
  const current=db().prepare('SELECT role FROM role_assignments WHERE user_id=?').get(user.id);
  if(current && current.role!=='aicte_admin')return false;
  db().prepare("INSERT OR IGNORE INTO role_assignments(user_id,role) VALUES(?,'aicte_admin')").run(user.id);
  if(user.id!==request.old_user_id)db().prepare('DELETE FROM role_assignments WHERE user_id=?').run(request.old_user_id);
  db().prepare('UPDATE owner_migrations SET new_user_id=?,migrated_at=? WHERE old_user_id=?').run(user.id,new Date().toISOString(),request.old_user_id);
  audit(user.id,'access.owner_migrated',user.id,{reason:'Same verified owner in the dedicated Supabase project'});
  return true;
 });
}
