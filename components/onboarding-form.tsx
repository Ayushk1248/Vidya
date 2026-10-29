'use client'
import {Label,LocalizedButton,LocalizedAnchor,LocalizedSelect,LocalizedInput} from '@/components/language'

import {useEffect,useState} from 'react'
import {SuggestedInput,SuggestedTextarea} from './data-suggestions'
import {useRouter} from 'next/navigation'
import {CheckCircle2,Clock3,ArrowRight,ShieldCheck} from 'lucide-react'
import {roles,registrationRoles} from '@/lib/platform/access.mjs'
import type {registrationData} from '@/lib/platform/workflows.mjs'
type Data=ReturnType<typeof registrationData>
export function OnboardingForm({data}:{data:Data}){
 const router=useRouter();const [role,setRole]=useState('institution_operator'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[institutionId,setInstitutionId]=useState(''),[studentId,setStudentId]=useState('')
 useEffect(()=>{queueMicrotask(()=>{const saved=localStorage.getItem('vidya.requestedRole');if(saved&&registrationRoles.includes(saved))setRole(saved)})},[])
 const pending=data.requests.find(r=>r.status==='pending');const last=data.requests[0]
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');const input=Object.fromEntries(new FormData(event.currentTarget))
 try{const res=await fetch('/api/platform/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,role,action:'request'})});const result=await res.json();if(!res.ok)throw new Error(result.error);router.refresh()}catch(e){setError(e instanceof Error?e.message:'Request failed.')}finally{setBusy(false)}}
 if(pending)return <div className="onboarding-grid">
<section className="card request-status">
<div className="status-icon">
<Clock3 size={28}/>
</div>
<span className="status-pill pending">
<Label text={"Awaiting review"}/>
</span>
<h2>
<Label text={"Your request is with the reviewer."}/>
</h2>
<p>
<Label text={"You requested "}/>
<strong>
<Label text={roles[pending.role as keyof typeof roles]}/>
</strong>
<Label text={pending.institution_id?` at ${data.institutions.find(i=>i.id===pending.institution_id)?.name}`:''}/>
<Label text={". Your access will become available after approval."}/>
</p>
<dl className="detail-list">
<div>
<dt>
<Label text={"Request reference"}/>
</dt>
<dd>
<Label text={pending.id.slice(0,8).toUpperCase()}/>
</dd>
</div>
<div>
<dt>
<Label text={"Submitted"}/>
</dt>
<dd>
<Label text={new Date(pending.created_at).toLocaleDateString('en-IN')}/>
</dd>
</div>
<div>
<dt>
<Label text={"Status"}/>
</dt>
<dd>
<Label text={"Pending approval"}/>
</dd>
</div>
</dl>
<LocalizedButton className="button" onClick={()=>router.refresh()}>
<Label text={"Check approval status "}/>
<ArrowRight size={16}/>
</LocalizedButton>
<p className="small muted">
<Label text={"To review this request, open the "}/>
<LocalizedAnchor href="/portal/aicte/access" target="_blank" rel="noopener noreferrer">
<Label text={"AICTE Admin Access management page"}/>
</LocalizedAnchor>
<Label text={"and select AICTE Admin in that portal. Real accounts need an approved administrator role; use a separate browser profile for a different account."}/>
</p>
</section>
<OnboardingSteps current={2}/>
</div>
 return <div className="onboarding-grid">
<section className="card">
<h2>
<Label text={"Complete your workspace request"}/>
</h2>
<p className="muted">
<Label text={"Select the role and scope you need. Your reviewer will confirm your affiliation. Choosing a role here does not grant access. AICTE and system staff roles are assigned only by an administrator."}/>
</p>{last&&<div className="feedback-info">
<Label text={"Previous request: "}/>
<Label text={last.status}/>. <Label text={last.review_note||'Your access is no longer active; submit a new request.'}/>
</div>}<form onSubmit={submit} className="platform-form">
<label>
<Label text={"Requested role"}/>
<LocalizedSelect name="role" value={role} onChange={e=>setRole(e.target.value)}>{registrationRoles.map(id=>
<option value={id} key={id}>
<Label text={roles[id as keyof typeof roles]}/>
</option>)}</LocalizedSelect>
</label>
 {['institution_operator','institution_head','student','awarding_body'].includes(role)&&<label>
<Label text={"Institution"}/>
<LocalizedSelect name="institution_id" required value={institutionId} onChange={e=>{setInstitutionId(e.target.value);setStudentId('')}}>
<option value="" disabled>
<Label text={"Select your institution"}/>
</option>{data.institutions.map(i=>
<option key={i.id} value={i.id}>
<Label text={i.id}/> · <Label text={i.name}/>
</option>)}</LocalizedSelect>
</label>}
 {role==='regional_officer'&&<label>
<Label text={"Assigned region"}/>
<LocalizedSelect name="region" required defaultValue="">
<option value="" disabled>
<Label text={"Select region"}/>
</option>{data.regions.map(x=>
<option key={x} value={x}>
<Label text={x}/>
</option>)}</LocalizedSelect>
</label>}
 {role==='student'?<>
<label>
<Label text={"Student ID"}/>
<SuggestedInput aria-label="Student ID" name="student_id" value={studentId} onChange={e=>setStudentId(e.target.value)} institution={institutionId} onRecommendation={option=>{setStudentId(option.value);if(option.institution_id)setInstitutionId(option.institution_id)}} placeholder="Choose a matching, unlinked Student ID" pattern="STU[0-9]{5}" required maxLength={8}/>
</label>
<div className="feedback-info">
<Label text={"Choose your institution, then open Student ID suggestions to see matching, unlinked synthetic identities. The existing STU00001 demo identity may already be linked; suggestions avoid that conflict. Your reviewer must still confirm your affiliation."}/>
</div>
</>:role==='external_verifier'?<label>
<Label text={"Organisation"}/>
<SuggestedInput name="organisation" placeholder="Example Verification Services" required minLength={3} maxLength={160}/>
</label>:<label>
<Label text={"Designation"}/>
<SuggestedInput name="designation" placeholder={role==='institution_head'?'Principal / Director':'Your position or designation'} required minLength={3} maxLength={100}/>
</label>}
 <label>
<Label text={"Why do you need access?"}/>
<SuggestedTextarea name="reason" placeholder="Describe your responsibility and the records you need to work with." required minLength={10} maxLength={1000} rows={3}/>
</label>
 <label className="checkbox-label">
<LocalizedInput type="checkbox" required/>
<Label text={"I understand that this request is subject to approval and scope checks."}/>
</label>
 {error&&<p className="feedback-error" role="alert">
<Label text={error}/>
</p>}<LocalizedButton className="button" disabled={busy}>
<Label text={busy?'Submitting…':'Submit access request'}/> <ArrowRight size={16}/>
</LocalizedButton>
</form>
</section>
<OnboardingSteps current={1}/>
</div>
}
function OnboardingSteps({current}:{current:number}){return <aside className="onboarding-help">
<div className="eyebrow">
<Label text={"GET STARTED IN THREE STEPS"}/>
</div>{[['Account verified','Your Google or email sign-in is complete.'],['Request your workspace','Choose your role, institution, or region.'],['Review & activation','An authorised reviewer confirms your access.']].map(([title,body],index)=>
<div className="step" key={title}>
<span className={index<current?'complete':''}>{index<current?<CheckCircle2 size={18}/>:index+1}</span>
<div>
<strong>
<Label text={title}/>
</strong>
<p>
<Label text={body}/>
</p>
</div>
</div>)}<div className="card">
<ShieldCheck className="accent" size={23}/>
<h2>
<Label text={"Your role defines your view"}/>
</h2>
<p>
<Label text={"Institutions see their own records. Students see their linked profile. External verifiers see only fields approved by a student."}/>
</p>
</div>
</aside>}
