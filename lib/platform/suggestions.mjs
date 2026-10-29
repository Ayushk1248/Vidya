import {db} from './db.mjs';
import {institutionScope,enrolmentScope,AccessError} from './access.mjs';
import {decrypt} from './crypto.mjs';
import {detailsFor} from './details.mjs';

export function dataSuggestions(actor,{kind,q='',institution='',student='',demo=false}={}){
 q=String(q).trim().slice(0,100).toLowerCase();institution=String(institution).slice(0,40);
 const filter=rows=>rows.filter(r=>!q||(r.value+' '+r.label).toLowerCase().includes(q)).slice(0,12);
 if(kind==='apaar'&&actor?.role==='external_verifier')return {options:demo?[{value:'990000000001',label:'Mock APAAR for STU00001 · open the Student demo to approve'}]:[],hint:'Use a student-supplied APAAR ID. Sample IDs are available only in the local demo.'};
 if(!actor){
  if(kind==='institution')return {options:filter(db().prepare('SELECT id value,name label FROM institutions ORDER BY id').all())};
  if(kind==='student'&&demo&&institution)return {options:filter(db().prepare(`SELECT DISTINCT e.student_id value,e.student_id||' · '||i.name label,e.institution_id FROM enrolments e JOIN institutions i ON i.id=e.institution_id WHERE e.institution_id=? AND NOT EXISTS(SELECT 1 FROM role_assignments a WHERE a.student_id=e.student_id AND a.role='student') ORDER BY e.student_id LIMIT 200`).all(institution)),hint:'Unlinked synthetic IDs at this institution. Your reviewer must still confirm the correct identity.'};
  return {options:[],hint:'Choose an institution first. Student examples require the local synthetic demo.'};
 }
 if(actor.role==='system_admin'||actor.role==='external_verifier')return {options:[],hint:'Your role does not browse student or institution records.'};
 const scope=actor.role==='student'?{clause:'EXISTS(SELECT 1 FROM enrolments own WHERE own.institution_id=i.id AND own.student_id=?)',args:[actor.student_id]}:institutionScope(actor);
 const inst=kind==='institution'||kind==='region'||kind==='state';
 if(inst){const rows=db().prepare(`SELECT i.id value,i.id||' · '||i.name label,i.region,i.state FROM institutions i WHERE ${scope.clause} ORDER BY i.id`).all(...scope.args);return {options:filter(kind==='institution'?rows:[...new Set(rows.map(r=>r[kind]))].map(value=>({value,label:value})))};}
 const where=scope.clause+(institution?' AND i.id=?':''),args=[...scope.args,...(institution?[institution]:[])];
 if(kind==='program')return {options:filter(db().prepare(`SELECT p.id value,p.id||' · '||p.name label,p.institution_id FROM programs p JOIN institutions i ON i.id=p.institution_id WHERE ${where} ORDER BY p.id`).all(...args))};
 if(kind==='student'){
  const s=enrolmentScope(actor),extra=institution?' AND i.id=?':'';
  return {options:filter(db().prepare(`SELECT DISTINCT e.student_id value,e.student_id||' · '||s.name||' · '||i.id label,e.institution_id FROM enrolments e JOIN students s ON s.id=e.student_id JOIN institutions i ON i.id=e.institution_id WHERE ${s.clause}${extra} ORDER BY e.student_id`).all(...s.args,...(institution?[institution]:[])))};
 }
 if(['identity_name','identity_dob','identity_parent','apaar'].includes(kind)){
  if(!student)return {options:[],hint:'Choose a Student ID first, or load the matching student example.'};
  const s=enrolmentScope(actor);
  const row=db().prepare(`SELECT e.id,e.student_id,s.name,s.dob,s.apaar FROM enrolments e JOIN students s ON s.id=e.student_id JOIN institutions i ON i.id=e.institution_id WHERE ${s.clause} AND e.student_id=? ORDER BY e.academic_year DESC LIMIT 1`).get(...s.args,String(student).slice(0,40));
  if(!row)return {options:[],hint:'That Student ID is outside your scope or is not in the dataset.'};
  const value=kind==='identity_name'?row.name:kind==='identity_dob'?row.dob:kind==='identity_parent'?detailsFor(row.id).parent_name:row.apaar;
  return {options:value?[{value,label:value+' · '+row.student_id}]:[],hint:'Matches the selected student’s stored synthetic identity. Review before changing a row.'};
 }
 if(kind==='certificate'){
  const s=enrolmentScope(actor);
  return {options:filter(db().prepare(`SELECT c.id value,c.id||' · '||i.name label FROM certificates c JOIN enrolments e ON e.id=c.enrolment_id JOIN institutions i ON i.id=e.institution_id WHERE ${s.clause} ORDER BY c.issued_at DESC LIMIT 40`).all(...s.args)),hint:'These are issued certificate references in your scope. Use your own downloaded PDF for integrity checks.'};
 }
 if(kind==='upload_example'){
  if(!demo||actor.role!=='institution_operator')throw new AccessError('Matching upload examples are available only to an operator in the local synthetic demo.',403);
  const row=db().prepare(`SELECT e.*,s.name,s.dob,s.apaar,s.mobile_cipher,s.email_cipher,s.category,s.nationality FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN students original ON original.id=e.student_id JOIN institutions i ON i.id=e.institution_id JOIN mock_registry r ON r.apaar=s.apaar AND r.name=s.name AND r.dob=s.dob JOIN intake_approvals a ON a.program_id=e.program_id AND a.academic_year=e.academic_year AND a.approved=1 WHERE ${where} AND original.synthetic=1 AND e.status='draft' AND e.scheme='WITHIN' AND e.academic_year=2026 AND s.nationality='IN' AND s.category IN('DOMESTIC','GENERAL') ORDER BY e.student_id LIMIT 1`).get(...args);
  if(!row)return {options:[],hint:'No matching draft is available. Download the scoped CSV template instead.'};
  const extra=detailsFor(row.id);
  const data={...extra,student_id:row.student_id,apaar:row.apaar,name:row.name,dob:row.dob,program_id:row.program_id,admission_date:row.admission_date,year:String(row.academic_year),scheme:row.scheme,category:'GENERAL',nationality:row.nationality,mobile:decrypt(row.mobile_cipher),email:decrypt(row.email_cipher),passport:'',gender:extra.gender==='F'||extra.gender==='T'?extra.gender:'M',reason:'Updating an existing synthetic draft for a guided demonstration.'};
  delete data.enrolment_id;
  return {options:[{value:row.student_id,label:row.student_id+' · '+row.name+' · '+row.program_id,data}],hint:'Loads a matching existing draft. Review it before validating; nothing is submitted automatically.'};
 }
 return {options:[]};
}
