// Explicit prototype owner authorised in the build conversation; no first-user auto-admin behavior.
import {db} from '../lib/platform/db.mjs';
import {transaction,audit} from '../lib/platform/workflows.mjs';
const id='a8742a96-a00b-443a-b353-5376dbfe99bc';
transaction(()=>{const current=db().prepare('SELECT role FROM role_assignments WHERE user_id=?').get(id);
 if(current?.role==='aicte_admin'){console.log('Owner already active.');return;}
 db().prepare(`INSERT INTO role_assignments(user_id,role,institution_id,region,student_id) VALUES(?,'aicte_admin',NULL,NULL,NULL)
 ON CONFLICT(user_id) DO UPDATE SET role='aicte_admin',institution_id=NULL,region=NULL,student_id=NULL`).run(id);
 audit(id,'access.owner_activated',id,{reason:'Explicitly authorised local prototype owner'});
 console.log('Designated prototype owner activated. All further role reviews are available in the website.');});
