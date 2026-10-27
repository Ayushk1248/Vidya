import {db} from './db.mjs';
import {actorFor} from './repository.mjs';
import {transaction,audit} from './workflows.mjs';
// Run only after Supabase confirms deletion of the authenticated user's account.
export function removeDeletedAccountAccess(userId){
 return transaction(()=>{
  const actor=actorFor(userId),now=new Date().toISOString();
  db().prepare("UPDATE consent_requests SET status='revoked',decided_at=? WHERE status IN ('pending','approved') AND (verifier_id=? OR student_id=?)").run(now,userId,actor?.student_id||'');
  db().prepare('DELETE FROM role_assignments WHERE user_id=?').run(userId);
  db().prepare('DELETE FROM mfa_secrets WHERE user_id=?').run(userId);
  db().prepare('DELETE FROM access_requests WHERE user_id=?').run(userId);
  db().prepare('DELETE FROM account_profiles WHERE user_id=?').run(userId);
  audit(userId,'account.deleted',userId,{academic_records_retained:true});
 });
}
