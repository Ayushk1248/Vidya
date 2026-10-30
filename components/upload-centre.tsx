"use client"
import {LocalizedAnchor,LocalizedInput,LocalizedButton,LocalizedSelect} from '@/components/language'

import {SuggestedInput} from '@/components/data-suggestions'
import {clientPortalPath} from '@/lib/platform/portals.mjs'

import {StageStepper,RingGauge,Skeleton,Feedback,Provenance,PresentationDialog} from './presentation'
import {Label} from '@/components/language'
import {StudentForm} from './student-form'
import {useEffect,useState,useCallback} from 'react'
type Finding={code:string;severity:string;message:string;justification?:string|null}
type Row={row_number:number;student_id:string;apaar:string;name:string;dob:string;program_id:string;admission_date:string;scheme:string;category:string;nationality:string;passport:string;result:{status:string;issues:Finding[];provenance:Record<string,string>}}
type Batch={id:string;filename:string;status:string;version:number;total:number;errors:number;warnings:number;error?:string;reason?:string;institution_name?:string;parent_id?:string}
type Detail={batch:Batch;rows:Row[];total:number;page:number;summary:{total:number;ok:number;error:number;warning:number;critical:number}}
type Rule={code:string;title:string;severity:string;enabled:number;configuration:string}
const batchStatus:Record<string,string>={queued:'Waiting for validation',processing:'Validation in progress',draft:'Draft - review and correct',review:'Awaiting Head sign-off',signed_off:'Head sign-off complete',failed:'Processing failed'}
const rowStatus:Record<string,string>={ok:'Checks passed',error:'Correction required',warning:'Review findings',pending:'Not checked yet'}
export function UploadCentre({role}:{role:string}){
 const [list,setList]=useState<Batch[]>([]),[selected,setSelected]=useState(''),[detail,setDetail]=useState<Detail|null>(null),[page,setPage]=useState(1),[filter,setFilter]=useState('all'),[severity,setSeverity]=useState('all'),[rule,setRule]=useState('all'),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[edit,setEdit]=useState<Row|null>(null),[code,setCode]=useState(''),[demo,setDemo]=useState(''),[reason,setReason]=useState(''),[rules,setRules]=useState<Rule[]>([]),[caps,setCaps]=useState<{scheme:string;cap_percent:number}[]>([]),[duplicates,setDuplicates]=useState<{enrolment_id:string;message:string}[]>([])
 const operator=role==='institution_operator',head=role==='institution_head',admin=role==='aicte_admin'
 async function get(url:string){const r=await fetch(url,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error);return j}
 const refresh=useCallback(async()=>{try{const data=await get('/api/platform/uploads');setList(data.batches);setDuplicates(data.duplicates);if(selected)setDetail(await get(`/api/platform/uploads?id=${selected}&page=${page}&filter=${filter}&severity=${severity}&rule=${rule}&q=${encodeURIComponent(query)}`))}catch(e){setMessage((e as Error).message)}},[selected,page,filter,severity,rule,query])
 useEffect(()=>{queueMicrotask(()=>{const batch=new URLSearchParams(window.location.search).get('batch');if(batch)setSelected(batch)})},[])
 useEffect(()=>{if(selected)window.history.replaceState(null,'',clientPortalPath('/uploads?batch='+encodeURIComponent(selected)))},[selected])
 useEffect(()=>{void refresh();const timer=setInterval(refresh,3000);return()=>clearInterval(timer)},[refresh])
 async function action(action:string,extra:Record<string,unknown>={}){setBusy(true);setMessage('');try{const r=await fetch('/api/platform/uploads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,id:selected,...extra})});const j=await r.json();if(!r.ok)throw new Error(j.error);if(j.id){setSelected(j.id);setPage(1)}if(j.code)setDemo(j.code);setMessage(j.message||'Saved successfully.');await refresh();return true}catch(e){setMessage((e as Error).message);return false}finally{setBusy(false)}}
 async function upload(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);data.set('synthetic','true');setBusy(true);setMessage('');try{const r=await fetch('/api/platform/uploads',{method:'POST',body:data});const j=await r.json();if(!r.ok)throw new Error(j.error);setSelected(j.id);setPage(1);setMessage('File queued. Validation results will appear automatically.');await refresh()}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 const exportParams=new URLSearchParams({id:selected,download:'csv',filter,severity,rule,q:query});
 return <>
<StageStepper status={detail?.batch.id===selected?detail.batch.status:undefined}/>{operator&&<StudentForm/>}<Feedback message={message}/>{operator&&<section className="card upload-panel">
<h2>
<Label text="Add a student batch"/>
</h2>
<p>
<Label text={"CSV or Excel · up to 10,000 rows / 8 MB. Templates contain up to 10 existing synthetic draft records for your institution; these update matching records. Reference column names such as apaar_id, student_name and program_code are supported. Always include student_id and use your institution’s approved program codes."}/>
</p>
<div className="actions">
<LocalizedAnchor className="button secondary" href="/api/platform/uploads?template=csv">
<Label text={"Download CSV template"}/>
</LocalizedAnchor>
<LocalizedAnchor className="button secondary" href="/api/platform/uploads?template=xlsx">
<Label text={"Download Excel template"}/>
</LocalizedAnchor>
</div>
<form onSubmit={upload} className="upload-form">
<label>
<Label text={"Academic year"}/>
<SuggestedInput type="number" name="year" defaultValue="2026" min="2023" max="2030" required/>
</label>
<label>
<Label text={"Student file"}/>
<LocalizedInput name="file" type="file" accept=".csv,.xlsx" required/>
</label>
<label>
<Label text={"Correction reason (if updating signed records)"}/>
<SuggestedInput name="reason" maxLength={500} placeholder="Explain the change in at least 10 characters"/>
</label>
<label className="checkbox-label">
<LocalizedInput type="checkbox" required/>
<Label text={"This file contains synthetic demonstration data only."}/>
</label>
<LocalizedButton className="button" disabled={busy}>
<Label text="Upload and validate"/>
</LocalizedButton>
</form>
</section>}
 <div className="upload-layout">
<section className="card upload-panel">
<h2>
<Label text="Submission tracker"/>
</h2>{!list.length&&<p>
<Label text={"No uploads yet. Your institution operator can upload the template to begin."}/>
</p>}{list.map(b=>
<LocalizedButton key={b.id} className={`batch-choice ${selected===b.id?'selected':''}`} onClick={()=>{setSelected(b.id);setPage(1);setEdit(null);setDemo('');setCode('')}}>
<strong>
<Label text={b.filename}/>
</strong>
<small>
<Label text={b.institution_name}/>
</small>
<span className={`status-pill ${b.status==='signed_off'?'approved':'pending'}`}>
<Label text={batchStatus[b.status]||b.status.replaceAll('_',' ')}/>
</span>
<small>
<Label text={b.total||0}/>
<Label text={"rows · "}/>
<Label text={b.errors||0}/>
<Label text={"errors · "}/>
<Label text={b.warnings||0}/>
<Label text={"warnings · v"}/>
<Label text={b.version}/>
</small>
</LocalizedButton>)}</section>
<section className="card upload-panel">{!detail?<div className="empty-inline">
<h2>
<Label text="Every row has a clear next step."/>
</h2>
<p>
<Label text="Select a batch to inspect validation results and approval status."/>
</p>
</div>:<>
<div className="table-title">
<div>
<h2>
<Label text={detail.batch.filename}/>
</h2>
<p>
<Label text={batchStatus[detail.batch.status]||detail.batch.status.replaceAll('_',' ')}/>
<Label text={"· version "}/>
<Label text={detail.batch.version}/>
</p>
</div>
<div className="actions">
<span className="status-pill"><Label text={detail.batch.total}/><Label text={"records"}/></span>{detail.batch.errors>0&&<LocalizedAnchor href="#validation-results" className="button secondary"><Label text={"Fix errors ↓"}/></LocalizedAnchor>}</div>
</div>{detail.batch.reason&&<p>
<strong><Label text={"Correction reason:"}/></strong> <Label text={detail.batch.reason}/></p>}{detail.batch.error&&<p role="alert"><Label text={detail.batch.error}/></p>}{['queued','processing'].includes(detail.batch.status)&&<p className="synthetic-note"><Label text={"Processing in the background… This page refreshes automatically."}/></p>}<div className="actions">{operator&&detail.batch.status==='draft'&&<LocalizedButton className={`button ${detail.batch.errors===0?'submission-ready':''}`} disabled={busy||detail.batch.errors>0} onClick={()=>action('submit')}><Label text={"Submit to Institution Head"}/></LocalizedButton>}{operator&&detail.batch.status==='failed'&&<LocalizedButton className="button" disabled={busy} onClick={()=>action('retry')}><Label text={"Retry processing"}/></LocalizedButton>}{head&&detail.batch.status==='review'&&<LocalizedButton className="button" disabled={busy} onClick={()=>action('otp')}><Label text={"Request sign-off code"}/></LocalizedButton>}</div>{head&&demo&&detail.batch.status==='review'&&<div className="upload-panel">
<p><Label text={"Mock OTP: "}/><strong className="mono"><Label text={demo}/></strong><Label text={"· valid for five minutes. No SMS is sent."}/></p>
<label><Label text={"Enter demonstration OTP"}/><LocalizedInput className="otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={6}/>
</label>
<LocalizedButton className="button" disabled={busy} onClick={()=>action('signoff',{code})}>
<Label text={"Confirm Head sign-off"}/>
</LocalizedButton>
</div>}{operator&&detail.batch.status==='signed_off'&&<div className="upload-panel">
<p>
<Label text={"This signed batch is preserved. Create a correction to change its records."}/>
</p>
<label>
<Label text={"Reason for correction"}/>
<SuggestedInput field="reason" value={reason} onChange={e=>setReason(e.target.value)} minLength={10} maxLength={500}/>
</label>
<LocalizedButton className="button secondary" disabled={busy||reason.trim().length<10} onClick={()=>action('revise',{reason})}>
<Label text={"Create correction version"}/>
</LocalizedButton>
</div>}
 <section className="validation-theatre" aria-label="Validation status">
<div>
<div className="eyebrow"><Label text={"VALIDATION ENGINE"}/></div>
<h3><Label text={['queued','processing'].includes(detail.batch.status)?'Your batch is being checked':'The batch results are ready for review'}/></h3>
<p><Label text={['queued','processing'].includes(detail.batch.status)?'Server-side parsing and validation are in progress. Results refresh automatically; results appear when the checks finish.':'Review the actual row findings below before submitting for Head approval.'}/></p>
<div className="validation-rule-strip" aria-label="Validation rule identifiers">{Array.from({length:14},(_,i)=>
<span key={i}>V<Label text={String(i+1).padStart(2,'0')}/></span>)}</div>{['queued','processing'].includes(detail.batch.status)&&<Skeleton rows={2} label="Waiting for server validation results"/>}</div>
<RingGauge value={detail.summary.total?detail.summary.ok/detail.summary.total*100:null} label="rows ready"/>
</section>
<div className="review-overview" aria-label="Batch validation summary">
<div>
<strong>
<Label text={detail.summary.total}/>
</strong>
<span>
<Label text={"Total rows"}/>
</span>
</div>
<div>
<strong>
<Label text={detail.summary.ok}/>
</strong>
<span>
<Label text={"Ready"}/>
</span>
</div>
<div>
<strong>
<Label text={detail.summary.error}/>
</strong>
<span>
<Label text={"Needs correction"}/>
</span>
</div>
<div>
<strong>
<Label text={detail.summary.critical}/>
</strong>
<span>
<Label text={"Critical review"}/>
</span>
</div>
</div>
<div id="validation-results" className="review-toolbar">
<form onSubmit={e=>{e.preventDefault();setQuery(search.trim());setPage(1)}} className="review-search">
<label>
<Label text={"Search validation results"}/>
<SuggestedInput kind="student" value={search} onChange={e=>setSearch(e.target.value)} maxLength={120} placeholder="Student name, Student ID, program or masked APAAR"/>
</label>
<LocalizedButton className="button secondary">
<Label text={"Search"}/>
</LocalizedButton>
</form>
<label>
<Label text={"Severity"}/>
<LocalizedSelect value={severity} onChange={e=>{setSeverity(e.target.value);setPage(1)}}>{['all','error','critical','warning','info'].map(v=>
<option key={v} value={v}>
<Label text={v}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"Validation rule"}/>
<LocalizedSelect value={rule} onChange={e=>{setRule(e.target.value);setPage(1)}}>
<option value="all">
<Label text={"All rules"}/>
</option>{Array.from({length:14},(_,i)=>'V'+String(i+1).padStart(2,'0')).map(v=>
<option key={v} value={v}>
<Label text={v}/>
</option>)}<option value="SYS">
<Label text={"Required fields"}/>
</option>
</LocalizedSelect>
</label>
<LocalizedAnchor className="button secondary" href={'/api/platform/uploads?'+exportParams}>
<Label text={"Download filtered CSV"}/>
</LocalizedAnchor>
</div>
<p className="review-export-note">
<Label text={"Exports include all matching rows across every page, with masked APAAR IDs and validation findings. Contact and passport data are excluded."}/>
</p>
<div className="table-title">
<label>
<Label text={"Row status"}/>
<LocalizedSelect value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}>{['all','ok','error','warning'].map(s=>
<option key={s} value={s}>
<Label text={s}/>
</option>)}</LocalizedSelect>
</label>
<span>
<Label text={detail.total}/>
<Label text={"matching rows"}/>
</span>
</div>
<div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Row / student"}/>
</th>
<th>
<Label text={"APAAR / provenance"}/>
</th>
<th>
<Label text={"Findings"}/>
</th>
<th>
<Label text={"Action"}/>
</th>
</tr>
</thead>
<tbody>{detail.rows.map(r=>
<tr key={r.row_number}>
<td>
<strong>
<Label text={r.row_number}/>. <Label text={r.name}/>
</strong>
<small>
<Label text={r.student_id}/> · <Label text={r.program_id}/>
</small>
<small>
<Label text={r.dob}/> · <Label text={r.scheme}/>
</small>
</td>
<td>
<span className="mono"><Label text={r.apaar}/></span>{Object.entries(r.result?.provenance||{}).map(([k,v])=>
<small key={k} className="field-provenance">
<span><Label text={k}/></span>
<Provenance value={v}/>
</small>)}</td>
<td>
<span className={`status-pill ${r.result?.status==='error'?'rejected':r.result?.status==='ok'?'approved':'pending'}`}>
<Label text={rowStatus[r.result?.status||'pending']||r.result?.status}/>
</span>{r.result?.issues.map((i,n)=>
<div key={n}>
<small>
<strong className="rule-code"><Label text={i.code}/></strong> · <Label text={i.severity}/> · <Label text={i.message}/></small>{i.justification&&<small>
<strong><Label text={"Justification:"}/></strong> <Label text={i.justification}/></small>}{operator&&detail.batch.status==='draft'&&i.severity!=='error'&&<PresentationDialog label="Justify finding" title="Explain this validation finding">
<form onSubmit={e=>{e.preventDefault();void action('justify',{row:r.row_number,rule:i.code,reason:new FormData(e.currentTarget).get('reason'),version:detail.batch.version})}}>
<SuggestedInput name="reason" aria-label="Justification" minLength={10} maxLength={1000} placeholder="Explain the finding" required/>
<LocalizedButton className="text-button">
<Label text={"Save justification"}/>
</LocalizedButton>
</form>
</PresentationDialog>}</div>)}</td>
<td>{operator&&detail.batch.status==='draft'&&<LocalizedButton className="text-button" onClick={()=>setEdit(r)}><Label text={"Fix row"}/></LocalizedButton>}</td>
</tr>)}</tbody>
</table>
</div>
<div className="table-title">
<LocalizedButton className="button secondary" disabled={page<=1} onClick={()=>setPage(page-1)}>
<Label text={"Previous"}/>
</LocalizedButton>
<span>
<Label text={"Page "}/>
<Label text={page}/> / <Label text={Math.max(1,Math.ceil(detail.total/50))}/>
</span>
<LocalizedButton className="button secondary" disabled={page*50>=detail.total} onClick={()=>setPage(page+1)}>
<Label text={"Next"}/>
</LocalizedButton>
</div>
</>}</section>
</div>
 {edit&&detail&&<div className="edit-overlay">
<section className="card upload-panel" role="dialog" aria-modal="true" aria-label="Correct student row">
<h2>
<Label text={"Correct row "}/>
<Label text={edit.row_number}/>
</h2>
<p>
<Label text={"Student ID: "}/>
<Label text={edit.student_id}/>
<Label text={". Blank replacement APAAR/passport preserves the current value. Saving revalidates the entire batch."}/>
</p>
<form onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);const patch:Record<string,string>={};data.forEach((v,k)=>{if((k==='apaar'||k==='passport')&&!String(v).trim())return;patch[k]=String(v)});if(await action('edit',{row:edit.row_number,version:detail.batch.version,patch}))setEdit(null)}}>
<div className="edit-grid">{['student_id','name','dob','program_id','admission_date','scheme','category','nationality','apaar','passport','gender','year_of_study','admission_mode','social_category','nri_status','oci_status','fn_status','enrolment_status','status_date','apaar_pending_reason','apaar_pending_deadline','parent_name'].map(k=>
<label key={k}>
<Label text={k.replaceAll('_',' ')}/>
<SuggestedInput name={k} defaultValue={['apaar','passport'].includes(k)?'':String(edit[k as keyof Row]||'')} maxLength={250}/>
</label>)}</div>
<div className="actions">
<LocalizedButton className="button" disabled={busy}>
<Label text="Save and revalidate"/>
</LocalizedButton>
<LocalizedButton type="button" className="button secondary" onClick={()=>setEdit(null)}>
<Label text={"Cancel"}/>
</LocalizedButton>
</div>
<Feedback message={message}/>
</form>
</section>
</div>}
 <section className="card upload-panel">
<h2>
<Label text="Cross-institution checks"/>
</h2>
<p>
<Label text={"Daily duplicate scan. Only records within your data scope are displayed; other institutions’ student details are withheld."}/>
</p>{admin&&<LocalizedButton className="button secondary" disabled={busy} onClick={()=>action('scan')}>
<Label text={"Run duplicate check now"}/>
</LocalizedButton>}{duplicates.slice(0,10).map((d,i)=>
<p key={i}>
<strong>
<Label text={d.enrolment_id}/>
</strong> · <Label text={d.message}/>
</p>)}{!duplicates.length&&<p>
<Label text={"No open cross-institution duplicate findings."}/>
</p>}</section>
 {admin&&<section className="card upload-panel">
<h2>
<Label text="Validation policy"/>
</h2>
<LocalizedButton className="button secondary" onClick={async()=>{try{const j=await get('/api/platform/uploads?rules=1');setRules(j.rules);setCaps(j.caps)}catch(e){setMessage((e as Error).message)}}}>
<Label text={"Load rule settings"}/>
</LocalizedButton>
<p>
<Label text={"Identity format, registry existence and program approval remain mandatory. Late submissions default to warnings. Changes are checked again before Head sign-off."}/>
</p>{rules.map(r=>
<form className="rule-row" key={r.code} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void action('rule',{code:r.code,severity:f.get('severity'),enabled:f.get('enabled')==='on',threshold:Number(f.get('threshold'))})}}>
<strong>
<Label text={r.code}/> · <Label text={r.title}/>
</strong>
<label>
<LocalizedInput type="checkbox" name="enabled" defaultChecked={!!r.enabled}/>
<Label text={"Enabled"}/>
</label>
<LocalizedSelect name="severity" defaultValue={r.severity}>
<option value={"error"}>
<Label text={"error"}/>
</option>
<option value={"warning"}>
<Label text={"warning"}/>
</option>
<option value={"critical"}>
<Label text={"critical"}/>
</option>
<option value={"info"}>
<Label text={"info"}/>
</option>
</LocalizedSelect>
<label>
<Label text={"Match threshold"}/>
<SuggestedInput type="number" name="threshold" min="50" max="100" defaultValue={JSON.parse(r.configuration).threshold||85}/>
</label>
<LocalizedButton className="button secondary" disabled={busy}>
<Label text="Save"/>
</LocalizedButton>
</form>)}{caps.filter(c=>c.scheme!=='WITHIN').map(c=>
<form className="rule-row" key={c.scheme} onSubmit={e=>{e.preventDefault();void action('rule',{scheme:c.scheme,percent:new FormData(e.currentTarget).get('percent')})}}>
<strong>
<Label text={c.scheme}/>
<Label text={"cap (% of approved intake)"}/>
</strong>
<SuggestedInput name="percent" type="number" min="0" max="100" step="0.1" defaultValue={c.cap_percent}/>
<LocalizedButton className="button secondary" disabled={busy}>
<Label text={"Save cap"}/>
</LocalizedButton>
</form>)}</section>}
 </>
}
