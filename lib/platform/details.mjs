import {db} from './db.mjs';
import {encrypt,decrypt} from './crypto.mjs';
export const extraFields=['gender','year_of_study','admission_mode','social_category','nri_status','oci_status','fn_status','enrolment_status','status_date','apaar_pending_reason','apaar_pending_deadline','parent_name'];
export function detailsFor(id){const row=db().prepare('SELECT * FROM student_details WHERE enrolment_id=?').get(id);if(!row)return {};const {parent_name_cipher,...rest}=row;return {...rest,parent_name:parent_name_cipher?decrypt(parent_name_cipher):''}}
export function saveDetails(id,row){
 const values={gender:row.gender||'U',year_of_study:Number(row.year_of_study)||1,admission_mode:row.admission_mode||'Regular',social_category:row.social_category||'GEN',nri_status:row.nri_status||'N',oci_status:row.oci_status||(row.category==='OCI'?'Y':'N'),fn_status:row.fn_status||(row.category==='FN'?'Y':'N'),enrolment_status:row.enrolment_status||'Active',status_date:row.status_date||row.admission_date,apaar_pending_reason:row.apaar_pending_reason||'',apaar_pending_deadline:row.apaar_pending_deadline||'',parent_name_cipher:encrypt(row.parent_name||'')};
 const keys=Object.keys(values);db().prepare(`INSERT INTO student_details(enrolment_id,${keys.join(',')}) VALUES(?,${keys.map(()=>'?')}) ON CONFLICT(enrolment_id) DO UPDATE SET ${keys.map(k=>`${k}=excluded.${k}`)}`).run(id,...Object.values(values));
}
