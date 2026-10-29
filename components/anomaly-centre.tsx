"use client"
import {Label,LocalizedSelect,LocalizedButton,LocalizedLink,LocalizedAnchor} from '@/components/language'

import {SuggestedInput,SuggestedTextarea} from '@/components/data-suggestions'
import {RingGauge,Feedback,CountUp} from './presentation'
import Link from 'next/link'
import {useCallback,useEffect,useState} from 'react'
import {Activity,ArrowUpRight,CheckCircle2,RefreshCw,ShieldCheck,SlidersHorizontal} from 'lucide-react'
import type {Overview,Detail,AnomalyPolicy} from '@/lib/platform/anomalies.mjs'
const date=(value:string|null)=>value?new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'Not yet available'
export function AnomalyCentre({initial,role}:{initial:Overview;role:string}){
 const [data,setData]=useState(initial),[year,setYear]=useState(2026),[band,setBand]=useState('attention'),[status,setStatus]=useState('all'),[search,setSearch]=useState(''),[region,setRegion]=useState('all'),[selected,setSelected]=useState(''),[detail,setDetail]=useState<Detail|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[decision,setDecision]=useState('cleared'),[settings,setSettings]=useState(false)
 const admin=role==='aicte_admin',officer=admin||role==='regional_officer'
 const fetchJson=async(url:string,options?:RequestInit)=>{const response=await fetch(url,{cache:'no-store',...options});const body=await response.json();if(!response.ok)throw new Error(body.error||'Request failed.');return body}
 const refresh=useCallback(async()=>{try{const next:Overview=await fetchJson(`/api/platform/anomalies?year=${year}`);setData(next);if(selected){if(next.rows.some(r=>r.id===selected))setDetail(await fetchJson(`/api/platform/anomalies?id=${selected}`));else{setSelected('');setDetail(null)}}}catch(e){setMessage((e as Error).message)}},[year,selected])
 useEffect(()=>{queueMicrotask(()=>{void refresh()});const timer=setInterval(refresh,5000);return()=>clearInterval(timer)},[refresh])
 useEffect(()=>{if(detail?.snapshot.id)document.getElementById('anomaly-evidence')?.scrollIntoView({behavior:'smooth',block:'start'})},[detail?.snapshot.id])
 async function mutate(action:string,payload:Record<string,unknown>){setBusy(true);setMessage('');try{const result=await fetchJson('/api/platform/anomalies',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})});setMessage(action==='run'?(result.reused?'Current analysis is already available or queued.':'Analysis queued. Results will refresh automatically.'):action==='policy'?'Policy saved. Refresh analysis to apply it.':'Review saved with an audit event.');if(action==='review')setNote('');await refresh()}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 const [queuePage,setQueuePage]=useState(1);
 useEffect(()=>{queueMicrotask(()=>setQueuePage(1))},[search,band,status,region,year]);
 const rows=data.rows.filter(r=>(band==='attention'?(r.status==='open'&&['high','moderate'].includes(r.band)):(band==='all'||r.band===band))&&(status==='all'||r.status===status)&&(region==='all'||r.region===region)&&`${r.institution_name} ${r.institution_id} ${r.state}`.toLowerCase().includes(search.toLowerCase()))
 const visiblePage=Math.min(queuePage,Math.max(1,Math.ceil(rows.length/15)));
 const identity=detail?.identity_evidence;
 const running=['queued','running'].includes(data.job?.status||'');const current=detail?.snapshot
 return <>
<section className="anomaly-intro card">
<div className="anomaly-intro-copy">
<div className="eyebrow">
<Activity size={15}/>
<Label text={"EARLY SIGNALS. HUMAN JUDGEMENT."}/>
</div>
<h2>
<Label text={"Review unusual enrolment patterns"}/>
</h2>
<p>
<Label text={"Select an institution below, inspect the evidence, then record a review. A higher score means an unusual pattern that needs context, not proof of misconduct."}/>
</p>
<div className="anomaly-run-info">
<Label text={"Last completed: "}/>
<Label text={date(data.run?.completed_at||null)}/>
<Label text={"IST"}/>{data.run&&<span>
<Label text={"Screening snapshot available"}/>
</span>}</div>
</div>
<div className="anomaly-controls">
<label>
<Label text={"Academic year"}/>
<LocalizedSelect value={year} onChange={e=>{setYear(Number(e.target.value));setSelected('');setDetail(null)}}>{[2026,2025,2024,2023].map(y=>
<option key={y} value={y}>
<Label text={y}/>
</option>)}</LocalizedSelect>
</label>{admin&&<LocalizedButton className="button" disabled={busy||running} onClick={()=>mutate('run',{year})}>
<RefreshCw size={16}/>
<Label text={running?'Analysis in progress':'Refresh analysis'}/>
</LocalizedButton>}{admin&&<LocalizedButton className="text-button" onClick={()=>setSettings(!settings)}>
<SlidersHorizontal size={16}/>
<Label text={"Review policy"}/>
</LocalizedButton>}</div>
</section>
 <Feedback message={message}/>{data.stale&&<div className="anomaly-notice"><Label text={"Records or model settings have changed since this snapshot. Scores remain visible for reference; review decisions are paused until an AICTE Admin refreshes analysis."}/></div>}{running&&<div className="synthetic-note">
<span className="live-dot"/><Label text={"Analysis "}/><Label text={data.job?.status}/><Label text={". You can continue using the platform while it runs."}/></div>}{data.job?.status==='failed'&&<div className="anomaly-notice" role="alert"><Label text={"Latest analysis failed: "}/><Label text={data.job.error}/> <Label text={data.run?'The last completed snapshot is shown below.':''}/></div>}
 <div className="metric-grid four">
<article>
<Activity size={20}/>
<span><Label text={"Institutions analysed"}/></span>
<strong>
<CountUp value={data.summary.total}/>
</strong>
<small><Label text={"Within your data scope"}/></small>
</article>
<article>
<ShieldCheck size={20}/>
<span><Label text={"High-priority signals"}/></span>
<strong>
<CountUp value={data.summary.high}/>
</strong>
<small><Label text={"Score "}/><Label text={data.run?.policy.high_threshold??data.policy.high_threshold}/><Label text={"or above"}/></small>
</article>
<article>
<RefreshCw size={20}/>
<span>
<Label text={"Awaiting review"}/>
</span>
<strong>
<Label text={data.summary.open}/>
</strong>
<small>
<Label text={"Open moderate / high signals"}/>
</small>
</article>
<article>
<CheckCircle2 size={20}/>
<span>
<Label text={"Reviewed"}/>
</span>
<strong>
<Label text={data.summary.cleared+data.summary.confirmed}/>
</strong>
<small>
<Label text={data.summary.cleared}/>
<Label text={"cleared / "}/>
<Label text={data.summary.confirmed}/>
<Label text={"confirmed"}/>
</small>
</article>
</div>
 <details className="workspace-disclosure">
<summary>
<Label text={"Explore priority groups and data coverage"}/>
</summary>
<section className="card anomaly-distribution">
<div>
<h2>
<Label text={"Risk distribution"}/>
</h2>
<p>
<Label text={data.summary.insufficient}/>
<Label text={"institutions have insufficient data. They are not treated as low risk."}/>
</p>
</div>
<div className="anomaly-band-chart">{['high','moderate','low','insufficient'].map(b=>{const count=data.rows.filter(r=>r.band===b).length;return <LocalizedButton key={b} className={`anomaly-band ${b}`} onClick={()=>setBand(b)} aria-label={`Filter ${b}: ${count} institutions`}>
<span>
<Label text={b==='insufficient'?'Insufficient data':b+' priority'}/>
</span>
<strong>
<Label text={count}/>
</strong>
<div className="risk-track">
<i style={{width:`${data.summary.total?count/data.summary.total*100:0}%`}}/>
</div>
</LocalizedButton>})}</div>
</section>
</details>
 {admin&&settings&&<section className="card upload-panel">
<h2>
<Label text={"Prototype review policy"}/>
</h2>
<p>
<Label text={"These are configurable screening heuristics, not official AICTE thresholds. Changes create a stale snapshot until the next analysis."}/>
</p>
<form className="anomaly-policy" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);const p=Object.fromEntries([...form.entries()].map(([k,v])=>[k,Number(v)])) as AnomalyPolicy;void mutate('policy',{policy:p})}}>{([{key:'min_peers',label:'Minimum peer institutions',min:8,max:50},{key:'min_enrolments',label:'Minimum enrolments to score',min:10,max:200},{key:'moderate_threshold',label:'Moderate-priority threshold',min:10,max:99},{key:'high_threshold',label:'High-priority threshold',min:11,max:100}] as const).map(f=>
<label key={f.key}>
<Label text={f.label}/>
<SuggestedInput name={f.key} type="number" min={f.min} max={f.max} defaultValue={data.policy[f.key]} required/>
</label>)}<LocalizedButton className="button secondary" disabled={busy}>
<Label text={"Save policy"}/>
</LocalizedButton>
</form>
</section>}
 <section className="card table-card">
<div className="table-title">
<div>
<h2>
<Label text={"Institution review queue"}/>
</h2>
<p>
<Label text={rows.length}/>
<Label text={"matching institutions"}/>
</p>
</div>
</div>
<div className="anomaly-filters">
<label>
<Label text={"Find an institution"}/>
<SuggestedInput kind="institution" placeholder="Name, ID or state" value={search} onChange={e=>setSearch(e.target.value)}/>
</label>
<label>
<Label text={"Priority"}/>
<LocalizedSelect value={band} onChange={e=>setBand(e.target.value)}>{[['attention','Needs review first'],['all','All priorities'],['high','High priority'],['moderate','Moderate priority'],['low','Low priority'],['insufficient','Insufficient data']].map(([v,label])=>
<option key={v} value={v}>
<Label text={label}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"Review status"}/>
<LocalizedSelect value={status} onChange={e=>setStatus(e.target.value)}>{['all','open','cleared','confirmed'].map(v=>
<option key={v} value={v}>
<Label text={v}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"Region"}/>
<LocalizedSelect value={region} onChange={e=>setRegion(e.target.value)}>
<option value="all">
<Label text={"All in scope"}/>
</option>{[...new Set(data.rows.map(r=>r.region))].sort().map(r=>
<option key={r} value={r}>
<Label text={r}/>
</option>)}</LocalizedSelect>
</label>
</div>
<div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Institution"}/>
</th>
<th>
<Label text={"Risk score"}/>
</th>
<th>
<Label text={"Leading signal"}/>
</th>
<th>
<Label text={"Review"}/>
</th>
<th/>
</tr>
</thead>
<tbody>{rows.slice((visiblePage-1)*15,visiblePage*15).map(row=>
<tr key={row.id} className={selected===row.id?'anomaly-selected':''}>
<td>
<strong>
<Label text={row.institution_name}/>
</strong>
<small>
<Label text={row.institution_id}/> / <Label text={row.state}/>
</small>
</td>
<td>
<RingGauge value={row.score} label="risk" tone={row.band}/>
<small><Label text={row.features.enrolments}/><Label text={"enrolments"}/></small>
</td>
<td>
<span className={`status-pill ${row.status==='cleared'?'approved':row.status==='confirmed'?'rejected':'pending'}`}>
<Label text={row.status}/>
</span>
</td>
<td>
<LocalizedButton className="text-button" onClick={()=>{setSelected(row.id);setDetail(null);setNote('');setMessage('')}}>
<Label text={"Inspect "}/>
<ArrowUpRight size={14}/>
</LocalizedButton>
</td>
</tr>)}</tbody>
</table>
</div>{!rows.length&&<div className="empty-inline">
<h3>
<Label text={data.run?'No institutions match these filters.':'Analysis will appear here.'}/>
</h3>
<p>
<Label text={data.run?'Change your search or filters to see other cases.':admin?'Refresh analysis to generate institution scores.':'An AICTE Admin can start analysis. The background worker also checks daily.'}/>
</p>
</div>}<div className="table-title">
<span>
<Label text={"Page "}/>
<Label text={visiblePage}/>
<Label text={"of "}/>
<Label text={Math.max(1,Math.ceil(rows.length/15))}/>
</span>
<div className="actions">
<LocalizedButton className="button secondary" disabled={visiblePage<=1} onClick={()=>setQueuePage(visiblePage-1)}>
<Label text={"Previous"}/>
</LocalizedButton>
<LocalizedButton className="button secondary" disabled={visiblePage*15>=rows.length} onClick={()=>setQueuePage(visiblePage+1)}>
<Label text={"Next"}/>
</LocalizedButton>
</div>
</div>
</section>
 {selected&&!current&&<div className="synthetic-note">
<Label text={"Loading institution evidence…"}/>
</div>}{current&&<section id="anomaly-evidence" className="card anomaly-evidence" aria-label="Institution evidence">
<div className="table-title">
<div>
<div className="eyebrow">
<Label text={"REVIEW EVIDENCE"}/>
</div>
<h2>
<Label text={current.institution_name}/>
</h2>
<p>
<Label text={current.institution_id}/> / <Label text={current.region}/>
<Label text={"/ academic year "}/>
<Label text={current.academic_year}/>
</p>
</div>
<RingGauge value={current.score} label={current.band} tone={current.band}/>
</div>
 {identity&&<section className="identity-evidence" aria-label="APAAR evidence breakdown">
<div className="table-title">
<div>
<h3>
<Label text={"Understand the APAAR signal"}/>
</h3>
<p>
<Label text={"Coverage and duplicate counts checked "}/>
<Label text={date(identity.checked_at)}/>
<Label text={"IST · "}/>
<Label text={identity.academic_year}/>
</p>
</div>
</div>
<div className="identity-evidence-grid">
<article>
<h4>
<Label text={"1. Coverage and registry"}/>
</h4>
<strong>
<Label text={identity.total?`${(identity.valid_format/identity.total*100).toFixed(1)}%`:'No records'}/>
</strong>
<p>
<Label text={identity.valid_format}/>
<Label text={"of "}/>
<Label text={identity.total}/>
<Label text={"records contain a 12-digit ID."}/>
</p>
<dl>
<div>
<dt>
<Label text={"Missing ID"}/>
</dt>
<dd>
<Label text={identity.missing}/>
</dd>
</div>
<div>
<dt>
<Label text={"Incorrect format"}/>
</dt>
<dd>
<Label text={identity.bad_format}/>
</dd>
</div>
<div>
<dt>
<Label text={"Valid format, not in registry"}/>
</dt>
<dd>
<Label text={identity.not_found}/>
</dd>
</div>
<div>
<dt>
<Label text={"Found in mock registry"}/>
</dt>
<dd>
<Label text={identity.registry_found}/>
</dd>
</div>
</dl>
<p className="small muted">
<Label text={"Format and existence do not confirm a person’s identity. Missing or incorrect details need correction."}/>
</p>
</article>
<article>
<h4>
<Label text={"2. Name / DOB disagreement"}/>
</h4>
<strong>
<Label text={Math.max(0,current.features.unresolved_identities-current.features.missing_registry)}/>
</strong>
<p>
<Label text={"Records with a registry entry that failed the saved name/DOB check."}/>
</p>
<p className="small muted">
<Label text={"From the score snapshot completed "}/>
<Label text={date(detail?.snapshot_completed_at||null)}/>
<Label text={"IST. This excludes missing, malformed and unregistered IDs."}/>
<Label text={data.stale?' The snapshot is stale: refresh analysis before interpreting this count.':''}/>
</p>
<p className="small muted">
<Label text={"Check spelling, initials and date corrections before drawing conclusions."}/>
</p>
</article>
<article>
<h4>
<Label text={"3. Repeated IDs"}/>
</h4>
<strong>
<Label text={identity.within_ids}/>
</strong>
<p>
<Label text={"IDs repeated within this institution, affecting "}/>
<Label text={identity.within_records}/>
<Label text={"enrolment records."}/>
</p>
<dl>
<div>
<dt>
<Label text={"Own records with an ID also used at another institution"}/>
</dt>
<dd>
<Label text={identity.cross_institution_records}/>
</dd>
</div>
</dl>
<p className="small muted">
<Label text={"Counts refer to enrolments in this academic year, not confirmed duplicate people or proven simultaneous attendance. Check transfers, surrendered seats and sync delays. Other institutions’ identities are withheld."}/>
</p>
</article>
</div>
<p className="small muted">
<Label text={"These counts overlap and must not be added together. Current record counts can differ from the saved score snapshot; this panel does not change the risk score."}/>
</p>
</section>}
 <aside className={`peer-evidence-notice ${current.band==='insufficient'?'insufficient':''}`} aria-label="Peer comparison limitations">
<strong>
<Label text={current.band==='insufficient'?'Insufficient evidence — no risk score':'Check the comparison before deciding'}/>
</strong>
<p>
<Label text={current.features.peer_count}/>
<Label text={"eligible peer institutions · prototype minimum "}/>
<Label text={data.run?.policy.min_peers??data.policy.min_peers}/>. <Label text={current.features.enrolments}/>
<Label text={"enrolments · minimum to score "}/>
<Label text={data.run?.policy.min_enrolments??data.policy.min_enrolments}/>.</p>
<p>
<Label text={current.features.peer_label}/>. <Label text={current.features.peer_label.toLowerCase().includes('national')?'A wider national fallback was used; local conditions may differ.':''}/> <Label text={current.features.capacity_band==='small'?'This is the small approved-capacity group: inspect actual counts alongside percentages.':''}/>
</p>
<p className="small muted">
<Label text={current.band==='insufficient'?'Missing evidence is not the same as low risk. Review counts qualitatively; a decision cannot be saved for this case.':'Meeting the prototype minimum does not establish that institutions are equivalent. Program mix, institution age and admission arrangements are not part of this peer model.'}/>
</p>
</aside>
 <div className="anomaly-evidence-columns">
<div>
<h3>
<Label text={"Top reasons to inspect"}/>
</h3>
<ol className="anomaly-reasons">{current.reasons.map((reason,i)=>
<li className="reason-chip" key={i}><Label text={reason}/></li>)}</ol>
<p className="small muted"><Label text={"Reasons compare observed values with peer medians. They are ranked using one-feature-at-a-time model checks and deviation, not proof of cause."}/></p>
<div className="peer-card">
<strong>
<Label text={current.features.peer_label}/>
</strong>
<p>
<Label text={current.features.peer_count}/>
<Label text={"other institutions / "}/>
<Label text={current.features.capacity_band}/>
<Label text={"approved-capacity group. The institution itself is excluded from peer medians."}/>
</p>
</div>{current.features.notes.map((n,i)=>
<p className="anomaly-notice" key={i}>
<Label text={n}/>
</p>)}<LocalizedLink className="text-button" href={`/records?institution=${current.institution_id}&year=${current.academic_year}`}>
<Label text={"Inspect scoped student records "}/>
<ArrowUpRight size={14}/>
</LocalizedLink>
</div>
<div>
<h3>
<Label text={"Institution versus peers"}/>
</h3>
<div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Indicator"}/>
</th>
<th>
<Label text={"Institution"}/>
</th>
<th>
<Label text={"Peer median"}/>
</th>
</tr>
</thead>
<tbody>{current.features.metrics.map(m=>
<tr key={m.key}>
<td>
<Label text={m.label}/>
</td>
<td>
<strong>
<Label text={m.display}/>
</strong>
</td>
<td>
<Label text={m.peer_display}/>
</td>
</tr>)}</tbody>
</table>
</div>
<details className="peer-mini-chart">
<summary><Label text={"Compare the indicator shapes"}/></summary>
<p><Label text={"Each indicator is scaled independently; exact signed values remain in the labels."}/></p>{current.features.metrics.map(m=>{const scale=Math.max(1,Math.abs(m.value??0),Math.abs(m.peer_median??0));return <div className="peer-mini-row" key={m.key}>
<strong><Label text={m.label}/></strong>
<div>
<span><Label text={"Institution · "}/><Label text={m.display}/></span>
<i style={{width:`${Math.abs(m.value??0)/scale*100}%`}}/>
</div>
<div className="peer-baseline">
<span><Label text={"Peer median · "}/><Label text={m.peer_display}/></span>
<i style={{width:`${Math.abs(m.peer_median??0)/scale*100}%`}}/>
</div>
</div>})}</details>
<p className="small muted"><Label text={"Total enrolments: "}/><Label text={current.features.enrolments}/><Label text={"; prior year: "}/><Label text={current.features.previous_enrolments}/><Label text={". Within-intake seats: "}/><Label text={current.features.within_intake}/> / <Label text={current.features.approved_intake}/><Label text={". Supernumerary seats are excluded from this ratio."}/></p>
<p className="small muted"><Label text={"Saved model input: "}/><Label text={current.features.unresolved_identities}/><Label text={"unsuccessful identity checks in total. Mobile supplied on "}/><Label text={current.features.mobile_present}/><Label text={"enrolment rows; "}/><Label text={current.features.shared_students}/><Label text={"of "}/><Label text={current.features.distinct_students}/><Label text={"distinct students share a supplied number. Contact values are never displayed."}/></p>
</div>
</div>
 <details className="review-context workspace-disclosure">
<summary>
<Label text={"Before deciding: check legitimate explanations"}/>
</summary>
<div className="disclosure-body">
<p>
<Label text={"A signal is a question to investigate. Check the context below before confirming a need for follow-up. These prompts draw on the supplied research note."}/>
</p>
<ul>
<li>
<strong>
<Label text={"Growth:"}/>
</strong>
<Label text={"Was intake increased, a new program introduced, or an earlier cohort uploaded late?"}/>
</li>
<li>
<strong>
<Label text={"Capacity:"}/>
</strong>
<Label text={"Are within-intake admissions and each supernumerary scheme counted separately for the correct program and year?"}/>
</li>
<li>
<strong>
<Label text={"Identity:"}/>
</strong>
<Label text={"Could spelling, initials, a transfer or registry-sync delay explain a mismatch? Missing APAAR is a prototype data-quality requirement, not a declaration of misconduct."}/>
</li>
<li>
<strong>
<Label text={"Edits:"}/>
</strong>
<Label text={"What changed, who approved it, and was it a documented correction?"}/>
</li>
<li>
<strong>
<Label text={"Shared contact:"}/>
</strong>
<Label text={"Could students share a parent, guardian, hostel or assisted-enrolment contact? Shared numbers alone do not establish wrongdoing."}/>
</li>
<li>
<strong>
<Label text={"Peers:"}/>
</strong>
<Label text={"Is the cohort small or specialised? Check peer count and missing evidence before relying on the score."}/>
</li>
</ul>
<p className="small muted">
<Label text={"Research-informed review prompts, not official AICTE rules. This interface update does not change model inputs, thresholds, validation policy or introduce the research note’s proposed escalation tiers."}/>
</p>
</div>
</details>
 {officer&&<form className="anomaly-review" onSubmit={e=>{e.preventDefault();void mutate('review',{id:current.id,status:decision,note,revision:current.revision})}}>
<div>
<h3>
<Label text={"Record your review"}/>
</h3>
<p>
<Label text={"“Confirmed” means the unusual pattern warrants follow-up. It does not declare fraud. Include the evidence checked and the next action."}/>
</p>
</div>
<label>
<Label text={"Decision"}/>
<LocalizedSelect value={decision} onChange={e=>setDecision(e.target.value)}>
<option value="cleared">
<Label text={"Cleared — explained by evidence"}/>
</option>
<option value="confirmed">
<Label text={"Confirmed — follow-up required"}/>
</option>
<option value="open">
<Label text={"Reopen for review"}/>
</option>
</LocalizedSelect>
</label>
<label>
<Label text={"Review note"}/>
<SuggestedTextarea value={note} onChange={e=>setNote(e.target.value)} minLength={10} maxLength={1500} required placeholder="Record the evidence checked, any legitimate explanation, and why follow-up is or is not needed."/>
</label>
<LocalizedButton className="button" disabled={busy||data.stale||current.band==='insufficient'}>
<Label text={"Save review decision"}/>
</LocalizedButton>
</form>}
 <details className="workspace-disclosure anomaly-history">
<summary>
<Label text={"Previous analysis and review decisions"}/>
</summary>
<div className="disclosure-body">{detail?.history.map((h,i)=>
<div className="timeline-item" key={i}>
<span/>
<div>
<strong>
<Label text={h.decision||'Analysis completed'}/>
</strong>
<p>
<Label text={h.note||(h.score===null?'Insufficient data for a risk score':`Score snapshot: ${h.score.toFixed(1)} / 100`)}/>
</p>
<small>
<Label text={date(h.created_at||h.completed_at)}/>
<Label text={"IST"}/>
</small>
</div>
</div>)}</div>
</details>
</section>}
 <p className="review-responsibility">
<ShieldCheck size={15}/><Label text={"Scores prioritise review. The final decision rests with AICTE officers."}/></p>
<details className="card anomaly-method">
<summary><Label text={"How the prototype score works"}/></summary>
<p><Label text={"Eight indicators are compared with peers by region, institution type and approved capacity (small: up to 300; medium: 301–1,000; large: over 1,000). Small groups fall back to national type-and-capacity, then type, then national peers. At least "}/><Label text={data.run?.policy.min_peers??data.policy.min_peers}/><Label text={"other eligible institutions are required."}/></p>
<p><Label text={"Isolation Forest uses 256 trees and a fixed random seed. Missing growth or intake ratios use the peer baseline for modelling and remain marked unavailable in evidence. Robust peer scaling limits extreme values. Raw anomaly scores map to 0–100 using clamp((raw − 0.35) / 0.40 × 100). This is a prototype triage scale, not a calibrated probability."}/></p>
<p><Label text={"Shared family contacts, new programs, corrected records and legitimate intake changes can explain signals. Check source records before deciding. A new analysis retains prior review history and opens fresh cases only when source data or policy changes."}/></p>
<LocalizedAnchor href="https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html" target="_blank" rel="noreferrer"><Label text={"Isolation Forest technical reference"}/></LocalizedAnchor>
</details>
 </>
}
