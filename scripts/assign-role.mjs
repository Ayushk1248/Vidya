import { db } from '../lib/platform/db.mjs';
import { roles } from '../lib/platform/access.mjs';
const [userId,role,scope] = process.argv.slice(2);
if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(userId||'') || !roles[role]) {
  console.error('Usage: npm run role -- <Supabase user UUID> <role> [institution ID | region | student ID]');
  console.error('Roles:',Object.keys(roles).join(', ')); process.exit(1);
}
const d=db(); let institution=null,region=null,student=null;
if (['institution_operator','institution_head'].includes(role)) institution=scope;
else if(role==='regional_officer') {
  region=scope;
  if(!d.prepare('SELECT id FROM institutions WHERE region=?').get(region||'')) throw new Error('Unknown region');
} else if(role==='student') student=scope;
else if(scope) throw new Error('This role does not accept a scope');
d.prepare(`INSERT INTO role_assignments(user_id,role,institution_id,region,student_id) VALUES(?,?,?,?,?)
 ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,institution_id=excluded.institution_id,region=excluded.region,student_id=excluded.student_id`).run(userId,role,institution,region,student);
console.log(`Assigned ${roles[role]} to ${userId}${scope?` (${scope})`:''}. Refresh the dashboard.`);
