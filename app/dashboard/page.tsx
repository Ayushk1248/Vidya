
import {Label,LocalizedLink,LocalizedSelect,LocalizedButton,LocalizedAnchor} from '@/components/language'
import {StageStepper,CountUp,Sparkline} from '@/components/presentation'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
import {rolePortal,portalPath} from '@/lib/platform/portals.mjs'
import {headers} from 'next/headers'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {overview,consentList,activities} from '@/lib/platform/workflows.mjs'
import {anomalyOverview} from '@/lib/platform/anomalies.mjs'
import {dashboardData} from '@/lib/platform/dashboard.mjs'
import {NationalExplorer} from '@/components/national-explorer'
import {enrolments} from '@/lib/platform/repository.mjs'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {ArrowUpRight,Building2,ShieldCheck,FileText,Users,ArrowRight} from 'lucide-react'
export const dynamic='force-dynamic'
export default async function Dashboard({searchParams}:{searchParams:Promise<{year?:string;institution?:string;region?:string;state?:string;program?:string}>}){
 const {user,actor}=await pageSession();if(!actor)redirect('/onboarding');const home=workspaceHome(actor.role),category=rolePortal(actor.role);if(home!=='/dashboard'||(await headers()).get('x-vidya-portal')!==category)redirect(portalPath(home,category));const query=await searchParams

 const name=user.user_metadata?.display_name||user.user_metadata?.username||user.email?.split('@')[0]||'Account'
 const y=Number(query.year),year=[2023,2024,2025,2026].includes(y)?y:2026
 if(['student','external_verifier'].includes(actor.role)){
 const student=actor.role==='student';const requests=consentList(actor);const record=student?enrolments(actor).rows[0]:null
 return <WorkspaceShell actor={actor} name={name} active="overview">
<PageHeading eyebrow={student?'STUDENT WORKSPACE':'VERIFIER WORKSPACE'} title={student?'My workspace':'Verification workspace'} description={student?'Your academic records, certificates and sharing permissions.':'Request academic details and follow the student’s decision.'}/>
<SyntheticNote/>
 <section className="next-task">
<div>
<span className="eyebrow">
<Label text={student?'YOUR NEXT STEP':'START HERE'}/>
</span>
<h2>
<Label text={student?(requests.some(r=>r.status==='pending')?'Review requests for your details':'Check your academic records'):'Create a verification request'}/>
</h2>
<p>
<Label text={student?(requests.some(r=>r.status==='pending')?'Someone has asked to view your information. You choose what to share.':'See the records linked to your Student ID. Your institution manages any corrections.'):'Explain your purpose and choose only the fields you need.'}/>
</p>
</div>
<LocalizedLink className="button" href={student?(requests.some(r=>r.status==='pending')?'/verification':'/records'):'/verification'}>
<Label text={student?(requests.some(r=>r.status==='pending')?'Review requests':'View my records'):'New request'}/> <ArrowRight size={16}/>
</LocalizedLink>
</section>
 <div className={student?"student-shortcuts":"student-shortcuts verifier-shortcuts"}>
<LocalizedLink href="/records" style={student?undefined:{display:'none'}}>
<FileText size={24}/>
<h2>
<Label text={"My academic records"}/>
</h2>
<p>
<Label text={"Check your program, institution and academic year."}/>
</p>
<span>
<Label text={"View records →"}/>
</span>
</LocalizedLink>{student&&<LocalizedLink href="/certificates">
<ShieldCheck size={24}/>
<h2>
<Label text={"My certificates"}/>
</h2>
<p>
<Label text={"Download a PDF when your institution has issued one."}/>
</p>
<span>
<Label text={"View certificates →"}/>
</span>
</LocalizedLink>}<LocalizedLink href="/verification">
<Users size={24}/>
<h2>
<Label text={student?'Sharing requests':'My requests'}/>
</h2>
<p>
<Label text={requests.filter(r=>r.status==='pending').length}/>
<Label text={"awaiting "}/>
<Label text={student?'your decision':'student approval'}/> · <Label text={requests.filter(r=>r.status==='approved').length}/>
<Label text={"active approvals"}/>
</p>
<span>
<Label text={student?'Manage sharing':'Track requests'}/> →</span>
</LocalizedLink>
</div>
 <div className="dashboard-columns">
<section className="card identity-card">
<div className="eyebrow">
<Label text={student?'YOUR LINKED PROFILE':'REQUEST SUMMARY'}/>
</div>
<h2>
<Label text={student?record?.name||'Your student record':'Recent verification requests'}/>
</h2>{record&&<dl className="detail-list">
<div>
<dt>
<Label text={"Student ID"}/>
</dt>
<dd>
<Label text={actor.student_id}/>
</dd>
</div>
<div>
<dt>
<Label text={"Institution"}/>
</dt>
<dd>
<Label text={record.institution_name}/>
</dd>
</div>
<div>
<dt>
<Label text={"Program"}/>
</dt>
<dd>
<Label text={record.program_name}/>
</dd>
</div>
</dl>}{student&&!record&&<p>
<Label text={"No records are available for this year. Check other years in My academic records."}/>
</p>}</section>
<section className="card">
<div className="table-title">
<h2>
<Label text={student?'Recent sharing requests':'Recent requests'}/>
</h2>
<LocalizedLink href="/verification">
<Label text={"View all →"}/>
</LocalizedLink>
</div>{requests.slice(0,3).map(r=>
<div className="request-preview" key={r.id}>
<span className={`status-pill ${r.status}`}>
<Label text={r.status==='pending'?'Awaiting decision':r.status}/>
</span>
<h3>
<Label text={r.purpose}/>
</h3>
<p>
<Label text={student?r.organisation||r.requester:`${r.requested_fields.length} fields requested`}/>
</p>
</div>)}{!requests.length&&<div className="empty-inline">
<h3>
<Label text={"No requests yet"}/>
</h3>
<p>
<Label text={student?'New requests will appear here. Your details are shared only with your approval.':'After you send a request, the student’s decision appears here.'}/>
</p>
</div>}</section>
</div>
</WorkspaceShell>
 }
 const explorer=dashboardData(actor,year);
 const selectedInstitution=explorer.institutions.find(i=>i.id===query.institution);
 const initial=selectedInstitution?{region:selectedInstitution.region,state:selectedInstitution.state,institution:selectedInstitution.id,program:explorer.programs.some(p=>p.id===query.program&&p.institution_id===selectedInstitution.id)?query.program:undefined}:{region:explorer.institutions.some(i=>i.region===query.region)?query.region:undefined,state:explorer.institutions.some(i=>i.state===query.state&&(!query.region||i.region===query.region))?query.state:undefined};
 const risk=anomalyOverview(actor,year);const data=overview(actor,year);const totalIntake=data.directory.reduce((sum,i)=>sum+i.intake,0);const totalPrograms=data.directory.reduce((sum,i)=>sum+i.programs,0)
 const coverage=data.summary.total?Math.round(data.summary.apaar_count/data.summary.total*1000)/10:0
 const regionMap=new Map<string,{count:number;enrolled:number;intake:number}>();data.directory.forEach(i=>{const current=regionMap.get(i.region)||{count:0,enrolled:0,intake:0};current.count++;current.enrolled+=i.enrolments;current.intake+=i.intake;regionMap.set(i.region,current)})
 const maxTrend=Math.max(...data.trend.map(t=>t.count),1);const recent=activities(actor).slice(0,4)
 return <WorkspaceShell actor={actor} name={name} active="overview">
<PageHeading eyebrow={`${actor.role==='aicte_admin'?'NATIONAL':actor.region?actor.region.toUpperCase()+' REGION':'INSTITUTION'} OVERVIEW · ${year}–${String(year+1).slice(-2)}`} title={actor.institution_id?'Institution overview':'Enrolment overview'} description="Monitor enrolment, inspect capacity, and keep access accountable.">
<form className="year-switch">
<label>
<Label text={"Academic year"}/>
<LocalizedSelect name="year" defaultValue={year}>{[2026,2025,2024,2023].map(y=>
<option key={y} value={y}>
<Label text={y}/>
</option>)}</LocalizedSelect>
</label>
<LocalizedButton className="button secondary">
<Label text={"Apply"}/>
</LocalizedButton>
</form>
</PageHeading>
<SyntheticNote/>
 {actor.institution_id&&<StageStepper/>}
 <div className="metric-grid four">
<article>
<Building2 size={20}/>
<span><Label text={"Institutions in scope"}/></span>
<strong>
<CountUp value={data.directory.length}/>
</strong>
<small><Label text={totalPrograms}/><Label text={"programs in the master"}/></small>
</article>
<article>
<Users size={20}/>
<span><Label text={"Student enrolments"}/></span>
<strong>
<CountUp value={data.summary.total}/>
</strong>
<Sparkline values={data.trend.map(t=>t.count)} label={data.trend.map(t=>`${t.year}: ${t.count} enrolments`).join(', ')}/>
<small><Label text={data.summary.supernumerary}/><Label text={"supernumerary enrolments"}/></small>
</article>
<article>
<ShieldCheck size={20}/>
<span>
<Label text={"APAAR format coverage"}/>
</span>
<strong>
<Label text={coverage}/>%</strong>
<small>
<Label text={"12-digit format present · not registry verified"}/>
</small>
</article>
<article>
<FileText size={20}/>
<span><Label text={"Programs over intake"}/></span>
<strong>
<CountUp value={data.capacity.length}/>
</strong>
<small><Label text={"Within-intake seats only · review indicators"}/></small>
</article>
</div>
 <section className="card upload-panel">
<div className="table-title">
<h2>
<Label text={"Mock registry verification"}/>
</h2>
<LocalizedLink href="/reports?type=apaar">
<Label text={"Identity report →"}/>
</LocalizedLink>
</div>
<div className="readiness-grid">
<div className="scope-box">
<strong>
<Label text={explorer.identity.total?Math.round(explorer.identity.verified/explorer.identity.total*1000)/10:0}/>%</strong>
<span>
<Label text={"Registry-confirmed in the synthetic registry"}/>
</span>
</div>
<div className="scope-box">
<strong>
<Label text={explorer.identity.pending}/>
</strong>
<span>
<Label text={"Pending or missing APAAR"}/>
</span>
</div>
<div className="scope-box">
<strong>
<Label text={explorer.identity.mismatch}/>
</strong>
<span>
<Label text={"Name / DOB mismatches"}/>
</span>
</div>
<div className="scope-box">
<strong>
<Label text={explorer.identity.not_found}/>
</strong>
<span>
<Label text={"Not found in mock registry"}/>
</span>
</div>
</div>
<p className="small muted">
<Label text={explorer.identity.checked_at?'Latest background check: '+new Date(explorer.identity.checked_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST':'Background identity checks are starting. Counts update as checks complete.'}/>
<Label text={"· No official registry connection."}/>
</p>
</section>
 <section className="next-task">
<div>
<span className="eyebrow">
<Label text={"WORKSPACE TASKS"}/>
</span>
<h2>
<Label text={actor.role==='institution_head'?'Review submissions for sign-off':actor.role==='institution_operator'?'Manage your student submissions':'Review institutions and submissions'}/>
</h2>
<p>
<Label text={actor.role==='institution_operator'?'Start an upload or fix errors in an existing batch.':'Open submitted records and review any issues that need attention.'}/>
</p>
</div>
<LocalizedLink className="button" href={['institution_operator','institution_head'].includes(actor.role)?'/uploads':'/anomalies'}>
<Label text={['institution_operator','institution_head'].includes(actor.role)?'Open submissions':'Open review queue'}/> <ArrowRight size={16}/>
</LocalizedLink>
</section>
 <details className="workspace-disclosure" open={!!(query.region||query.state||query.institution||query.program)}>
<summary>
<span>
<strong>
<Label text={"Explore enrolment by location"}/>
</strong>
<small>
<Label text={"India map · Region → State → Institution → Program · Submission deadlines"}/>
</small>
</span>
</summary>
<div className="disclosure-body">
<NationalExplorer key={year} data={explorer} initial={initial}/>
</div>
</details>
 <details className="workspace-disclosure">
<summary>
<span>
<strong>
<Label text={"Trends and capacity"}/>
</strong>
<small>
<Label text={"Enrolment across years and approved intake"}/>
</small>
</span>
</summary>
<div className="disclosure-body">
 <div className="dashboard-columns">
<section className="card chart-card">
<div className="table-title">
<div>
<h2>
<Label text={"Enrolment across academic years"}/>
</h2>
<p>
<Label text={"Actual seeded records within your scope"}/>
</p>
</div>
<span className="chart-legend">
<i/>
<Label text={"Enrolments"}/>
</span>
</div>
<div className="bar-chart" role="img" aria-label={data.trend.map(t=>`${t.year}: ${t.count} enrolments`).join(', ')}>{data.trend.map(t=>
<div className="chart-column" key={t.year}>
<strong>
<Label text={t.count.toLocaleString('en-IN')}/>
</strong>
<div className="bar-track">
<div className={t.year===year?'chart-bar current':'chart-bar'} style={{height:`${Math.max(2,t.count/maxTrend*100)}%`}}/>
</div>
<span>
<Label text={t.year}/>–<Label text={String(t.year+1).slice(-2)}/>
</span>
</div>)}</div>
</section>
<section className="card capacity-summary">
<div className="eyebrow">
<Label text={"CAPACITY SNAPSHOT"}/>
</div>
<h2>
<Label text={"Intake and enrolment"}/>
</h2>
<div className="capacity-number">
<Label text={data.summary.total.toLocaleString('en-IN')}/>
<span>
<Label text={"total enrolments"}/>
</span>
</div>
<div className="capacity-line">
<span>
<Label text={"Approved intake"}/>
</span>
<strong>
<Label text={totalIntake.toLocaleString('en-IN')}/>
</strong>
</div>
<div className="capacity-line">
<span>
<Label text={"Within-intake enrolments"}/>
</span>
<strong>
<Label text={(data.summary.total-data.summary.supernumerary).toLocaleString('en-IN')}/>
</strong>
</div>
<div className="capacity-line">
<span>
<Label text={"Supernumerary enrolments"}/>
</span>
<strong>
<Label text={data.summary.supernumerary}/>
</strong>
</div>
<p>
<Label text={"Supernumerary seats are counted separately. Institution totals can conceal individual programs exceeding intake."}/>
</p>
<LocalizedAnchor href={`/api/platform/report?year=${year}`} className="text-button">
<Label text={"Download intake report (CSV) "}/>
<ArrowUpRight size={15}/>
</LocalizedAnchor>
</section>
</div>
 </div>
</details>
<section className="card anomaly-dashboard">
<div className="table-title">
<div>
<h2>
<Label text={"Institution risk signals"}/>
</h2>
<p>
<Label text={risk.run?`${risk.summary.total} institutions analysed${risk.stale?" - refresh required":""}`:"Initial analysis is queued by the background worker."}/>
</p>
</div>
<LocalizedLink href="/anomalies">
<Label text={"Open Anomaly Centre"}/>
</LocalizedLink>
</div>
<div className="actions">
<div className="scope-box">
<strong>
<Label text={risk.summary.high}/>
</strong>
<span>
<Label text={"High-priority signals"}/>
</span>
</div>
<div className="scope-box">
<strong>
<Label text={risk.summary.open}/>
</strong>
<span>
<Label text={"Awaiting officer review"}/>
</span>
</div>
<div className="scope-box">
<strong>
<Label text={risk.summary.insufficient}/>
</strong>
<span>
<Label text={"Insufficient data"}/>
</span>
</div>
</div>
<p className="small muted">
<Label text={"Unusual patterns prompt human review; scores are not findings of misconduct."}/>
</p>
</section>
<div className="quick-links">
<LocalizedLink href={`/institutions?year=${year}`}>
<Building2 size={21}/>
<div>
<strong>
<Label text={"Explore institutions"}/>
</strong>
<span>
<Label text={"Region → State → Institution → Program"}/>
</span>
</div>
<ArrowUpRight size={18}/>
</LocalizedLink>
<LocalizedLink href={`/records?year=${year}`}>
<FileText size={21}/>
<div>
<strong>
<Label text={"Browse student records"}/>
</strong>
<span>
<Label text={"Masked identities and program details"}/>
</span>
</div>
<ArrowUpRight size={18}/>
</LocalizedLink>{['aicte_admin','institution_head'].includes(actor.role)&&<LocalizedLink href="/access">
<Users size={21}/>
<div>
<strong>
<Label text={"Review access requests"}/>
</strong>
<span>
<Label text={data.pending}/>
<Label text={"awaiting review"}/>
</span>
</div>
<ArrowUpRight size={18}/>
</LocalizedLink>}</div>
 <details className="workspace-disclosure">
<summary>
<span>
<strong>
<Label text={"Regional detail and recent activity"}/>
</strong>
<small>
<Label text={"Supporting totals and your workspace audit events"}/>
</small>
</span>
</summary>
<div className="disclosure-body">
<div className="dashboard-columns">
<section className="card table-card">
<div className="table-title">
<h2>
<Label text={actor.institution_id?'Programs needing attention':'Regional distribution'}/>
</h2>
<LocalizedLink href={`/institutions?year=${year}`}>
<Label text={"Explore →"}/>
</LocalizedLink>
</div>
<table>
<thead>
<tr>
<th>
<Label text={actor.institution_id?'Program':'Region'}/>
</th>
<th>
<Label text={actor.institution_id?'Within intake':'Institutions'}/>
</th>
<th>
<Label text={actor.institution_id?'Excess':'Enrolments'}/>
</th>
</tr>
</thead>
<tbody>{actor.institution_id?data.capacity.map(c=>
<tr key={c.id}>
<td>
<LocalizedLink href={`/records?institution=${c.institution_id}&year=${year}`}>
<Label text={c.name}/>
</LocalizedLink>
<small>
<Label text={c.id}/>
</small>
</td>
<td>
<Label text={c.enrolled}/> / <Label text={c.intake}/>
</td>
<td>
<span className="status-pill pending">+<Label text={c.enrolled-c.intake}/>
</span>
</td>
</tr>):[...regionMap].map(([region,values])=>
<tr key={region}>
<td>
<Label text={region}/>
</td>
<td>
<Label text={values.count}/>
</td>
<td>
<Label text={values.enrolled.toLocaleString('en-IN')}/>
</td>
</tr>)}</tbody>
</table>{actor.institution_id&&!data.capacity.length&&<p className="table-foot">
<Label text={"No approved programs exceed within-intake capacity in this year."}/>
</p>}</section>
<section className="card">
<div className="table-title">
<h2>
<Label text={"Workspace activity"}/>
</h2>
<LocalizedLink href="/activity">
<Label text={"View log →"}/>
</LocalizedLink>
</div>{recent.map(e=>
<div className="timeline-item" key={e.sequence}>
<span/>
<div>
<strong>
<Label text={e.action.replaceAll('.',' · ').replaceAll('_',' ')}/>
</strong>
<small>
<Label text={new Date(e.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}/>
</small>
</div>
</div>)}{!recent.length&&<div className="empty-inline">
<h3>
<Label text={"Your activity starts here."}/>
</h3>
<p>
<Label text={"Access reviews and verification decisions will appear as you work."}/>
</p>
</div>}<p className="small muted">
<Label text={"Historical seed flags are demonstration data; this log tracks actions performed in the prototype."}/>
</p>
</section>
</div>
 </div>
</details>
<details className="workspace-disclosure">
<summary>
<Label text={"About the prototype features"}/>
</summary>
<div className="milestone-banner">
<ShieldCheck size={22}/>
<div>
<strong>
<Label text={"Built to make every record accountable."}/>
</strong>
<p>
<Label text={"Role approvals, scoped records, and consent workflows are live. Bulk upload validation and Head sign-off are available in the Upload Centre. Peer-based anomaly scoring and officer reviews are live in the Anomaly Centre. Signed QR certificates and public integrity checks are available in Certificates."}/>
</p>
</div>
</div>
</details>
</WorkspaceShell>
}
