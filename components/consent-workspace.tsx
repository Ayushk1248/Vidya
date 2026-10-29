'use client'
import {Label,LocalizedButton,LocalizedInput} from '@/components/language'

import {SuggestedInput,SuggestedTextarea} from '@/components/data-suggestions'
import {useState,useCallback,useEffect,useRef} from 'react'
import {Feedback,ExpiryCountdown,Provenance} from './presentation'
import type {Consent} from '@/lib/platform/workflows.mjs'
const labels:Record<string,string>={name:'Student name',dob:'Date of birth',student_id:'Student ID',apaar:'Masked APAAR',institution:'Institution',program:'Program',academic_year:'Academic year'}
export function ConsentWorkspace({student,requests:initialRequests}:{student:boolean;requests:Consent[]}){
 const [requests,setRequests]=useState(initialRequests)
 const [tab,setTab]=useState('pending');const visible=student?requests.filter(r=>tab==='pending'?r.status==='pending':tab==='approved'?r.status==='approved':!['pending','approved'].includes(r.status)):requests;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[result,setResult]=useState<{id:string;fields:Record<string,string|number>;source:string;expires_at:string}|null>(null)
 const pending=useRef<AbortController|null>(null)
 const refreshRequests=useCallback(async()=>{if(pending.current)return;const controller=new AbortController();pending.current=controller;try{const response=await fetch('/api/platform/consents',{cache:'no-store',signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not refresh requests.');setRequests(data.requests);setError('')}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{if(pending.current===controller)pending.current=null}},[])
 useEffect(()=>{queueMicrotask(()=>{void refreshRequests()});const update=()=>{if(document.visibilityState==='visible')void refreshRequests()};const timer=setInterval(update,5000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);pending.current?.abort();pending.current=null}},[refreshRequests])
 async function action(body:Record<string,unknown>){setBusy(true);setError('');setSuccess('');try{const res=await fetch('/api/platform/consents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error);setSuccess(body.action==='request'?'Request delivered. Open the Student portal to approve it.':body.decision==='approved'?'Selected fields approved. The verifier can now view them.':body.decision==='revoked'?'Approval revoked. The verifier no longer has access.':'Request declined.');await refreshRequests();if(student&&body.action==='decide')setTab(body.decision==='approved'?'approved':'history');return true}catch(e){setError(e instanceof Error?e.message:'Request failed.');return false}finally{setBusy(false)}}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const data=new FormData(form);if(await action({action:'request',apaar:data.get('apaar'),purpose:data.get('purpose'),fields:data.getAll('fields')}))form.reset()}
 async function view(id:string){setBusy(true);setError('');setResult(null);try{const res=await fetch(`/api/platform/consents?id=${id}`,{cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.error);setResult({id,...data})}catch(e){setError(e instanceof Error?e.message:'Unable to view result.')}finally{setBusy(false)}}
 return <>
<div className="consent-toolbar">
<p>
<Label text={student?'You decide which requested fields to share. You can revoke an active approval.':'Approvals last until the request expires, at most 24 hours after creation.'}/>
</p>
<LocalizedButton className="button secondary" onClick={()=>{setResult(null);void refreshRequests()}}>
<Label text={"Refresh status"}/>
</LocalizedButton>
</div>{error&&<p className="feedback-error" role="alert">
<Label text={error}/>
</p>}{success&&<p className="feedback-info" role="status">
<Label text={success}/>
</p>}
 {student&&<nav className="task-tabs" aria-label="Sharing request groups">{[['pending','Needs your decision'],['approved','Shared now'],['history','Past requests']].map(([id,label])=>
<LocalizedButton type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>
<Label text={label}/>
<span>
<Label text={requests.filter(r=>id==='history'?!['pending','approved'].includes(r.status):r.status===id).length}/>
</span>
</LocalizedButton>)}</nav>}
 <div className={student?'student-consent-layout':'verification-grid'}>{!student&&<section className="card">
<div className="eyebrow">
<Label text={"NEW REQUEST"}/>
</div>
<h2>
<Label text={"Ask for academic details"}/>
</h2>
<form className="platform-form" onSubmit={submit}>
<label>
<Label text={"Mock APAAR ID"}/>
<SuggestedInput name="apaar" required pattern="[0-9]{12}" minLength={12} maxLength={12} inputMode="numeric" placeholder="12-digit mock ID"/>
</label>
<p className="small muted">
<Label text={"Demo: 990000000001 belongs to STU00001. A separate approved student account must be linked before a request can be delivered."}/>
</p>
<label>
<Label text={"Verification purpose"}/>
<SuggestedTextarea name="purpose" minLength={10} maxLength={1000} required rows={3} placeholder="For example, verify academic details for an internship application."/>
</label>
<fieldset className="field-options">
<legend>
<Label text={"Request only what you need"}/>
</legend>{Object.entries(labels).map(([key,label])=>
<label key={key}>
<LocalizedInput type="checkbox" name="fields" value={key}/>
<Label text={label}/>
</label>)}</fieldset>
<LocalizedButton className="button" disabled={busy}>
<Label text={busy?'Sending…':'Send consent request'}/>
</LocalizedButton>
</form>
<details className="consent-illustration">
<summary><Label text={"Preview the student’s side"}/></summary>
<div className="phone-demo">
<div className="phone-notch" aria-hidden="true"/>
<span className="eyebrow"><Label text={"ILLUSTRATIVE PREVIEW ONLY"}/></span>
<h3><Label text={"Someone requested your records."}/></h3>
<p><Label text={"The student sees your purpose and the requested fields, then chooses what to share."}/></p>
<div className="phone-preview-fields">
<span><Label text={"Student name"}/></span>
<span><Label text={"Institution"}/></span>
<span><Label text={"Program"}/></span>
</div>
<div className="phone-demo-decisions" aria-label="Illustrative controls; sign in as the student to decide">
<span><Label text={"Decline"}/></span>
<span><Label text={"Approve selected"}/></span>
</div>
<small><Label text={"Actual decisions are made in the student’s account."}/></small>
</div>
</details>
</section>}
 <section className={student?'student-phone':'consent-history'}>{student&&<div className="phone-status">
<span><Label text={"PRIVATE STUDENT WORKSPACE"}/></span>
<span><Label text={"CONSENT"}/></span>
</div>}<div className="table-title">
<h2><Label text={student?(tab==='pending'?'Requests to review':tab==='approved'?'Who currently has access':'Previous decisions'):'Request history'}/></h2>
<span className="muted small"><Label text={visible.length}/><Label text={"requests"}/></span>
</div>{visible.map(request=>
<ConsentCard key={request.id+request.status} request={request} student={student} busy={busy} decide={(decision,fields)=>action({action:'decide',id:request.id,decision,fields})} view={()=>view(request.id)}/>)}{!visible.length&&<div className="card empty-inline">
<h3>
<Label text={student?(tab==='pending'?'No requests need your attention':tab==='approved'?'No active sharing permissions':'No past requests'):'Your first request starts here.'}/>
</h3>
<p>
<Label text={student?(tab==='pending'?'New requests appear here with the organisation, purpose and requested fields.':tab==='approved'?'Approved requests appear here until they expire or you revoke access.':'Rejected, revoked and expired requests appear here.'): 'Send a purpose-specific request to an activated synthetic student account. Its status will appear in this list.'}/>
</p>
</div>}</section>
</div>
 {result&&<div className="modal-backdrop">
<section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="result-title">
<div className="table-title">
<h2 id="result-title">
<Label text={"Student-approved details"}/>
</h2>
<LocalizedButton className="text-button" onClick={()=>setResult(null)}>
<Label text={"Close ✕"}/>
</LocalizedButton>
</div>
<div className="modal-body">
<span className="status-pill approved">
<Label text={"Approved fields only"}/>
</span>
<dl className="detail-list">{Object.entries(result.fields).map(([key,value])=>
<div key={key}>
<dt><Label text={labels[key]||key}/></dt>
<dd className="approved-field">
<span><Label text={value}/></span>
<Provenance value="Institution-submitted"/>
</dd>
</div>)}</dl>
<ExpiryCountdown expires={result.expires_at}/>
<p className="small muted"><Label text={result.source}/><br/><Label text={"Access expires "}/><Label text={new Date(result.expires_at).toLocaleString('en-IN')}/>.</p>
<p className="feedback-info"><Label text={"This shows institution-submitted details, not a signed certificate or registry verification."}/></p>
</div>
</section>
</div>}</>
}
function ConsentCard({request,student,busy,decide,view}:{request:Consent;student:boolean;busy:boolean;decide:(decision:string,fields:string[])=>Promise<boolean>;view:()=>void}){
 const [fields,setFields]=useState(request.requested_fields)
 return <article className="card consent-card">
<div className="consent-card-heading">
<span className={`status-pill ${request.status}`}>
<Label text={request.status}/>
</span>
<span className="muted small">#<Label text={request.id.slice(0,8)}/>
</span>
</div>
<h3><Label text={request.purpose}/></h3>{student&&<p><Label text={"Requested by "}/><strong><Label text={request.organisation||request.requester}/></strong>
</p>}<div className="consent-expiry">
<ExpiryCountdown expires={request.expires_at}/>
<span><Label text={"Expires "}/><Label text={new Date(request.expires_at).toLocaleString('en-IN')}/></span>
</div>
 {student&&request.status==='pending'?<fieldset className="field-options">
<legend>
<Label text={"Choose what to share — uncheck any field you want to keep private"}/>
</legend>{request.requested_fields.map(key=>
<label key={key}>
<LocalizedInput type="checkbox" checked={fields.includes(key)} onChange={e=>setFields(e.target.checked?[...fields,key]:fields.filter(f=>f!==key))}/>
<Label text={labels[key]}/>
</label>)}</fieldset>:<div className="field-chips">{(request.status==='approved'?request.approved_fields:request.requested_fields).map(key=>
<span key={key}>
<Label text={labels[key]}/>
</span>)}</div>}
 <div className="actions">{student&&request.status==='pending'&&<>
<LocalizedButton className="button secondary" disabled={busy} onClick={()=>decide('rejected',[])}>
<Label text={"Decline request"}/>
</LocalizedButton>
<LocalizedButton className="button" disabled={busy||!fields.length} onClick={()=>decide('approved',fields)}>
<Label text={"Approve selected fields"}/>
</LocalizedButton>
</>}{student&&request.status==='approved'&&<LocalizedButton className="button secondary" disabled={busy} onClick={()=>decide('revoked',[])}>
<Label text={"Revoke approval"}/>
</LocalizedButton>}{!student&&request.status==='approved'&&<LocalizedButton className="button" disabled={busy} onClick={view}>
<Label text={"View approved details →"}/>
</LocalizedButton>}</div>
</article>
}
