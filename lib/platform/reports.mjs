import {db} from './db.mjs';
import {institutionScope,AccessError} from './access.mjs';
import {decrypt,maskApaar} from './crypto.mjs';
import {anomalyOverview} from './anomalies.mjs';
export const reportTypes={enrolment:'Enrolment register',intake:'Program intake and capacity',validation:'Validation findings',anomaly:'Anomaly review register'};
const fail=(message,status=400)=>{throw new AccessError(message,status)};
export function reportData(actor,options={}){
 const scope=institutionScope(actor),year=Number(options.year||2026),type=options.type||'intake';
 if(![2023,2024,2025,2026].includes(year))fail('Choose a seeded academic year.');
 if(!Object.hasOwn(reportTypes,type))fail('Choose an available report.');
 const institution=typeof options.institution==='string'?options.institution.trim():'';
 if(institution&&!db().prepare(`SELECT i.id FROM institutions i WHERE i.id=? AND ${scope.clause}`).get(institution,...scope.args))fail('Institution not found.',404);
 const where=scope.clause+(institution?' AND i.id=?':''),args=[...scope.args,...(institution?[institution]:[])];
 let columns=[],rows=[],notes=['Synthetic prototype data. No official AICTE or APAAR registry connection.'];
 if(type==='intake'){
 columns=['Institution ID','Institution','Program ID','Program','Approved','Approved intake','Within intake','Excess within intake','Supernumerary','Deadline'];
 rows=db().prepare(`SELECT i.id,i.name,p.id program_id,p.name program_name,a.approved,a.approved_intake,a.deadline,count(CASE WHEN e.scheme='WITHIN' THEN 1 END) within_count,count(CASE WHEN e.scheme<>'WITHIN' THEN 1 END) extra FROM institutions i JOIN programs p ON p.institution_id=i.id JOIN intake_approvals a ON a.program_id=p.id AND a.academic_year=? LEFT JOIN enrolments e ON e.program_id=p.id AND e.academic_year=a.academic_year WHERE ${where} GROUP BY p.id ORDER BY i.id,p.id`).all(year,...args).map(x=>[x.id,x.name,x.program_id,x.program_name,x.approved?'Yes':'No',x.approved?x.approved_intake:0,x.within_count,x.approved?Math.max(0,x.within_count-x.approved_intake):null,x.extra,x.deadline]);
 notes.push('Within-intake excess is calculated per approved program. Supernumerary seats are reported separately; consult validation findings for scheme-cap checks. Unapproved programs have no approved capacity.');
 }else if(type==='enrolment'){
 columns=['Institution ID','Institution','Record ID','Student ID','Student name','APAAR (masked)','Program','Year','Scheme','Status','Version'];
 rows=db().prepare(`SELECT i.id,i.name institution,e.id record_id,e.student_id,s.name,s.apaar,p.name program,e.academic_year,e.scheme,e.status,e.version FROM enrolments e JOIN institutions i ON i.id=e.institution_id JOIN effective_students s ON s.enrolment_id=e.id JOIN programs p ON p.id=e.program_id WHERE e.academic_year=? AND ${where} ORDER BY i.id,e.id LIMIT 20001`).all(year,...args).map(x=>[x.id,x.institution,x.record_id,x.student_id,x.name,maskApaar(x.apaar),x.program,x.academic_year,x.scheme,x.status,x.version]);
 notes.push('APAAR is masked. DOB and contact/passport fields are excluded. Historical seeded sign-off flags do not establish a live Head approval.');
 }else if(type==='validation'){
 columns=['Institution ID','Institution','Rule','Rule description','Severity','Source','Reference','Batch status','Flagged rows'];
 const groups=new Map(),rules=new Map(db().prepare('SELECT code,title,severity FROM validation_rules').all().map(r=>[r.code,r]));
 const add=(x,code,severity,source,reference,status,count=1)=>{const rule=rules.get(code);if(!rule)return;const key=JSON.stringify([x.institution_id,code,source,reference,severity||rule.severity]);const old=groups.get(key);if(old)old[8]+=count;else groups.set(key,[x.institution_id,x.institution_name,code,rule.title,severity||rule.severity,source,reference,status,count])};
 const scan=db().prepare(`SELECT f.institution_id,i.name institution_name,f.rule_code,f.id,e.id record_id FROM validation_findings f JOIN institutions i ON i.id=f.institution_id JOIN enrolments e ON e.id=f.enrolment_id WHERE f.resolved_at IS NULL AND e.academic_year=? AND ${where}`).all(year,...args);
 for(const x of scan)add(x,x.rule_code,null,'Unresolved record scan',x.record_id,'Unresolved');
 const uploaded=db().prepare(`SELECT b.institution_id,i.name institution_name,b.id,b.status,r.registry_json FROM upload_rows r JOIN upload_batches b ON b.id=r.batch_id JOIN institutions i ON i.id=b.institution_id WHERE b.academic_year=? AND ${where} AND r.registry_json IS NOT NULL`).iterate(year,...args);
 for(const x of uploaded){let result;try{result=JSON.parse(decrypt(x.registry_json))}catch{fail('An encrypted validation result could not be read.',409)}for(const issue of result.issues||[])add(x,issue.code,issue.severity,'Upload validation snapshot',x.id,x.status)}
 rows=[...groups.values()];notes.push('Flagged-row counts are not unique violation counts or excess-seat totals. Batch results are validation snapshots and may include earlier correction batches. Unresolved scans use current enrolment year. This report does not run validation; rule descriptions replace raw submitted values for privacy.');
 }else{
 const a=anomalyOverview(actor,year);columns=['Institution ID','Institution','Region','State','Risk score (0-100)','Band','Review status','Reason 1','Reason 2','Reason 3','Reviewed at'];
 rows=a.rows.filter(x=>!institution||x.institution_id===institution).map(x=>[x.institution_id,x.institution_name,x.region,x.state,x.score,x.band,x.status,...[0,1,2].map(n=>x.reasons[n]||''),x.reviewed_at||'']);
 notes.push(a.run?`Analysis completed ${a.run.completed_at}; model ${a.run.model_version}. Snapshot ${a.stale?'STALE - refresh before decisions':'current at export time'}.`:'No completed analysis for this year.');notes.push('Scores prompt human review and are not probabilities or findings of misconduct. Empty scores mean insufficient data.');
 }
 if(rows.length>20000)fail('This report exceeds 20,000 rows. Select one institution.');
 return {type,title:reportTypes[type],year,scope:institution||actor.institution_id||actor.region||'National',generated_at:new Date().toISOString(),columns,rows,notes};
}
