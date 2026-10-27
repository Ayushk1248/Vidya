import {db} from './db.mjs';
import {institutionScope,AccessError} from './access.mjs';
// No identities or contact fields are returned to the dashboard client.
export function dashboardData(actor,year=2026,now=new Date()) {
 if(![2023,2024,2025,2026].includes(year))throw new AccessError('Invalid academic year',400);
 const scope=institutionScope(actor), d=db();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const institutions=d.prepare(`SELECT i.id,i.name,i.region,i.state FROM institutions i WHERE ${scope.clause} ORDER BY i.name`).all(...scope.args).map(r=>({...r}));
 const programs=d.prepare(`SELECT p.id,p.name,p.institution_id,a.approved,a.approved_intake intake,a.deadline,
 count(e.id) enrolments,count(CASE WHEN e.scheme='WITHIN' THEN 1 END) within_count,
 count(CASE WHEN e.scheme<>'WITHIN' THEN 1 END) supernumerary,
 count(CASE WHEN e.status='signed_off' AND EXISTS(SELECT 1 FROM record_versions v WHERE v.enrolment_id=e.id AND v.version=e.version) THEN 1 END) approved_records
 FROM programs p JOIN institutions i ON i.id=p.institution_id JOIN intake_approvals a ON a.program_id=p.id AND a.academic_year=?
 LEFT JOIN enrolments e ON e.program_id=p.id AND e.academic_year=a.academic_year
 WHERE ${scope.clause} GROUP BY p.id ORDER BY p.name`).all(year,...scope.args).map(r=>({...r,intake:r.approved?r.intake:0}));
 const uploads=d.prepare(`SELECT b.institution_id,b.status,count(*) count,coalesce(sum(s.errors),0) errors,max(b.signed_at) signed_at
 FROM upload_batches b JOIN institutions i ON i.id=b.institution_id LEFT JOIN upload_state s ON s.batch_id=b.id
 WHERE b.academic_year=? AND ${scope.clause} GROUP BY b.institution_id,b.status`).all(year,...scope.args).map(r=>({...r}));
 const tracker=institutions.map(i=>{
 const ps=programs.filter(p=>p.institution_id===i.id),bs=uploads.filter(b=>b.institution_id===i.id);
 const total=ps.reduce((s,p)=>s+p.enrolments,0),approved_records=ps.reduce((s,p)=>s+p.approved_records,0);
 const deadlines=ps.filter(p=>p.approved).map(p=>p.deadline).sort(),deadline=deadlines[0]||null;
 const open=bs.filter(b=>b.status!=='signed_off'),signed=bs.filter(b=>b.status==='signed_off').reduce((s,b)=>s+b.count,0);
 const status=open.some(b=>b.status==='failed')?'Failed':open.some(b=>b.errors>0&&b.status==='draft')?'Needs correction':open.some(b=>['queued','processing'].includes(b.status))?'Processing':open.some(b=>b.status==='review')?'Awaiting Head':open.length?'Draft':signed?'Signed batches':'Not started';
 const complete=total>0&&approved_records===total&&!open.length;
 const remaining=deadline?Math.round((Date.parse(deadline+'T00:00:00+05:30')-Date.parse(today+'T00:00:00+05:30'))/86400000):null;
 return {...i,total,approved_records,deadline,deadline_end:deadlines.at(-1)||null,status,signed_batches:signed,open_batches:open.reduce((s,b)=>s+b.count,0),complete,days_remaining:remaining,deadline_status:!deadline?'No deadline':complete?'Records signed':remaining<0?'Overdue':remaining<=7?'Due soon':'On schedule'};
 });
 const identity=d.prepare(`SELECT count(*) total,coalesce(sum(COALESCE(c.status,CASE WHEN s.confirmed=1 THEN 'Verified' ELSE 'Unchecked' END)='Verified'),0) verified,coalesce(sum(c.status='Mismatch'),0) mismatch,coalesce(sum(c.status='Not found'),0) not_found,coalesce(sum(s.apaar IS NULL OR s.apaar=''),0) pending,max(c.checked_at) checked_at FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN institutions i ON i.id=e.institution_id LEFT JOIN apaar_checks c ON c.enrolment_id=e.id WHERE e.academic_year=? AND ${scope.clause}`).get(year,...scope.args);
 return {year,today,institutions,programs,uploads,tracker,identity:{...identity}};
}
