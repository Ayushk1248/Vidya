import {db} from './db.mjs';
import {institutionScope,AccessError} from './access.mjs';
import {dashboardData} from './dashboard.mjs';
import {anomalyOverview} from './anomalies.mjs';
import {audit} from './workflows.mjs';
import {csvDocument} from './csv.mjs';
import {reportData as registerData} from './legacy-reports.mjs';
import {reportPdf,reportXlsx} from './report-files.mjs';
export const reportTypes={intake:'Intake & enrolment',apaar:'APAAR coverage',category:'Category & scheme usage',pending:'Pending APAAR records',excess:'Excess admissions',compliance:'Submission compliance',anomalies:'Anomaly review',enrolment:'Enrolment register',validation:'Validation findings',anomaly:'Anomaly review register',capacity:'Program capacity & deadlines'};
const filterText=value=>String(value??'').trim().slice(0,120);
const contains=value=>'%'+value.replace(/[!%_]/g,'!$&')+'%';
function addFilter(parts,args,key,column,value){
 value=filterText(value);if(!value)return;
 if(key==='institution'||key==='program'){
  const table=key==='institution'?'institutions':'programs';
  if(db().prepare(`SELECT 1 FROM ${table} WHERE id=? COLLATE NOCASE`).get(value)){parts.push(column+'=? COLLATE NOCASE');args.push(value)}
  else {const alias=key==='institution'?'i':'p',terms=[];for(const word of value.split(/\s+/).slice(0,12)){terms.push(`(${column} LIKE ? ESCAPE '!' COLLATE NOCASE OR ${alias}.name LIKE ? ESCAPE '!' COLLATE NOCASE)`);args.push(contains(word),contains(word))}let clause=terms.join(' AND ');if(key==='institution'){clause="("+clause+") OR i.state LIKE ? ESCAPE '!' COLLATE NOCASE";args.push(contains(value))}parts.push('('+clause+')')}
 }else {parts.push(column+'=? COLLATE NOCASE');args.push(value)}
}
export function reportFilterOptions(actor){
 const scope=institutionScope(actor),d=db();
 const institutions=d.prepare(`SELECT i.id,i.name,i.region,i.state,i.institution_type FROM institutions i WHERE ${scope.clause} ORDER BY i.name`).all(...scope.args).map(r=>({...r}));
 const programs=d.prepare(`SELECT p.id,p.name,p.institution_id,p.level FROM programs p JOIN institutions i ON i.id=p.institution_id WHERE ${scope.clause} ORDER BY p.name,p.id`).all(...scope.args).map(r=>({...r}));
 const categories=d.prepare(`SELECT DISTINCT s.category FROM enrolments e JOIN institutions i ON i.id=e.institution_id JOIN effective_students s ON s.enrolment_id=e.id WHERE ${scope.clause} AND s.category IS NOT NULL ORDER BY s.category`).all(...scope.args).map(r=>r.category);
 return {institutions,programs,categories};
}
export function reportData(actor,options={}){
 options=Object.fromEntries(Object.entries(options).map(([key,value])=>[key,filterText(value)]));
 const year=Number(options.year||2026),type=options.type||'intake';if(!Object.hasOwn(reportTypes,type)||!Number.isInteger(year)||year<2023||year>2030)throw new AccessError('Invalid report or year',400);
 const scope=institutionScope(actor),parts=[scope.clause,'e.academic_year=?'],args=[...scope.args,year];
 if(options.institution){const known=db().prepare('SELECT id FROM institutions WHERE id=? COLLATE NOCASE').get(options.institution);if(known&&!db().prepare(`SELECT i.id FROM institutions i WHERE i.id=? AND ${scope.clause}`).get(known.id,...scope.args))throw new AccessError('Institution not found.',404)}
 for(const [key,column] of Object.entries({region:'i.region',state:'i.state',institution:'i.id',program:'p.id',level:'p.level',institution_type:'i.institution_type',category:'s.category'}))addFilter(parts,args,key,column,options[key]);
 const where=parts.join(' AND '),from=`FROM enrolments e JOIN institutions i ON i.id=e.institution_id JOIN programs p ON p.id=e.program_id JOIN effective_students s ON s.enrolment_id=e.id LEFT JOIN student_details sd ON sd.enrolment_id=e.id LEFT JOIN apaar_checks ac ON ac.enrolment_id=e.id LEFT JOIN intake_approvals a ON a.program_id=e.program_id AND a.academic_year=e.academic_year WHERE ${where}`;
 const matched=db().prepare(`SELECT DISTINCT i.id,i.name ${from}`).all(...args);const ids=new Set(matched.map(r=>r.id));
 let columns,rows,notes=['Synthetic prototype data. No official AICTE or APAAR registry connection.'];
 if(type==='intake'||type==='excess'){columns=['Institution ID','Institution','Program ID','Program','Approved','Approved intake','Within intake','Excess within intake','Supernumerary','Deadline'];rows=db().prepare(`SELECT i.id,i.name,p.id program_id,p.name program,a.approved,a.deadline,CASE WHEN a.approved=1 THEN a.approved_intake ELSE 0 END intake,sum(e.scheme='WITHIN') within_count,sum(e.scheme<>'WITHIN') super ${from} GROUP BY i.id,p.id ORDER BY i.name,p.name`).all(...args).map(r=>[r.id,r.name,r.program_id,r.program,r.approved?'Yes':'No',r.intake,r.within_count,r.approved?Math.max(0,r.within_count-r.intake):null,r.super,r.deadline]);notes.push('Program-level WITHIN excess is separate from supernumerary counts. Unapproved programs have no approved capacity.')}
 if(type==='excess')rows=rows.filter(r=>r[7]>0);
 if(type==='pending'){columns=['Institution','Student ID','APAAR status','Reason','Deadline'];rows=db().prepare(`SELECT i.name,e.student_id,sd.apaar_pending_reason reason,sd.apaar_pending_deadline deadline ${from} AND (s.apaar IS NULL OR s.apaar='') ORDER BY i.name,e.student_id`).all(...args).map(r=>[r.name,r.student_id,'Pending / missing',r.reason||'Not recorded',r.deadline||'Not recorded'])}
 if(type==='apaar'){columns=['Institution','Records','Registry confirmed','Pending / missing','Not confirmed'];rows=db().prepare(`SELECT i.name,count(*) total,sum(COALESCE(ac.status,CASE WHEN s.confirmed=1 THEN 'Verified' ELSE 'Unchecked' END)='Verified') verified,sum(s.apaar IS NULL OR s.apaar='') pending ${from} GROUP BY i.id ORDER BY i.name`).all(...args).map(r=>[r.name,r.total,r.verified,r.pending,r.total-r.verified])}
 if(type==='category'){columns=['Institution','Scheme','Social category','Nationality category','Records'];rows=db().prepare(`SELECT i.name,e.scheme,coalesce(sd.social_category,'GEN') social,s.category,count(*) total ${from} GROUP BY i.id,e.scheme,social,s.category ORDER BY i.name`).all(...args).map(r=>[r.name,r.scheme,r.social,r.category,r.total])}
 if(type==='compliance'){columns=['Institution','Workflow','Deadline','Deadline status','Approved records','Total records'];rows=dashboardData(actor,year).tracker.filter(r=>ids.has(r.id)).map(r=>[r.name,r.status,r.deadline||'Not set',r.deadline_status,r.approved_records,r.total])}
 if(type==='anomalies'){columns=['Institution','Risk score','Band','Review status','Reasons'];rows=anomalyOverview(actor,year).rows.filter(r=>ids.has(r.institution_id)).map(r=>[r.institution_name,r.score??'Insufficient',r.band,r.status,r.reasons.join('; ')])}
 if(['enrolment','validation','anomaly','capacity'].includes(type)){
  const selected=options.institution&&db().prepare(`SELECT i.id FROM institutions i WHERE i.id=? COLLATE NOCASE AND ${scope.clause}`).get(options.institution,...scope.args);
  const register=registerData(actor,{year,type:type==='capacity'?'intake':type,institution:selected?.id});
  columns=register.columns;rows=register.rows.filter(row=>!Object.entries(options).some(([key,value])=>value&&['institution','region','state','institution_type','program','level','category'].includes(key))||ids.has(row[0]));notes=register.notes;
 }
 const college=options.institution?(matched.length===1?matched[0].name:options.institution):'All colleges in your scope';
 return {type,title:reportTypes[type],year,generated_at:new Date().toISOString(),columns,rows,filter_summary:college,scope:college,notes};
}
export function reportPreview(actor,options={}){const data=reportData(actor,options);return {...data,row_count:data.rows.length,rows:data.rows.slice(0,100)}}
export async function exportReport(actor,options={}){const data=reportData(actor,options),format=options.format||'csv';let bytes,mime;
 if(format==='csv'){bytes=csvDocument(data.columns,data.rows);mime='text/csv; charset=utf-8'}
 else if(format==='xlsx'){bytes=await reportXlsx(data);mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
 else if(format==='pdf'){bytes=await reportPdf(data);mime='application/pdf'}
 else throw new AccessError('Choose CSV, XLSX or PDF',400);
 audit(actor.user_id,'report.exported',data.type,{year:data.year,format,rows:data.rows.length,institution:filterText(options.institution)});const college=filterText(options.institution).replace(/[^a-z0-9]+/gi,'-').slice(0,50);return {bytes,mime,filename:`VIDYA-${data.type}-${data.year}${college?'-'+college:''}.${format}`};
}
