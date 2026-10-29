"use client"
import {Label,LocalizedLink,LocalizedButton,LocalizedSelect,LocalizedAnchor} from '@/components/language'

import {SuggestedInput,SuggestedTextarea} from '@/components/data-suggestions'
import {Skeleton,Feedback} from './presentation'
import Link from 'next/link'
import {useCallback,useEffect,useState,useRef} from 'react'
import {FileCheck2,Download,ShieldCheck,ExternalLink,X} from 'lucide-react'
import type {CertificateOverview,CertificateDetail} from '@/lib/platform/certificates.mjs'
import {portalApiPath,rolePortal} from '@/lib/platform/portals.mjs'
export function CertificateCentre({role}:{role:string}){
 const [data,setData]=useState<CertificateOverview|null>(null),[year,setYear]=useState(2026),[page,setPage]=useState(1),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(''),[detail,setDetail]=useState<CertificateDetail|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[reason,setReason]=useState('')
 const head=['institution_head','awarding_body'].includes(role),canRevoke=['institution_head','aicte_admin'].includes(role)
 async function json(url:string,options?:RequestInit){const r=await fetch(url,{cache:'no-store',...options});const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed.');return j}
 const previewDialog=useRef<HTMLDialogElement>(null),detailRequest=useRef(0)
 const [detailLoading,setDetailLoading]=useState(false),[detailError,setDetailError]=useState(''),[actionError,setActionError]=useState('')
 const refresh=useCallback(async()=>{try{setData(await json(`/api/platform/certificates?year=${year}&page=${page}&search=${encodeURIComponent(query)}`))}catch(e){setMessage((e as Error).message)}},[year,page,query])
 async function loadDetail(id:string){const request=++detailRequest.current;setDetailLoading(true);setDetailError('');try{const next=await json('/api/platform/certificates?id='+encodeURIComponent(id));if(request===detailRequest.current)setDetail(next)}catch(e){if(request===detailRequest.current){setDetail(null);setDetailError((e as Error).message)}}finally{if(request===detailRequest.current)setDetailLoading(false)}}
 function openCertificate(id:string){setActionError('');setSelected(id);setDetail(null);setReason('');previewDialog.current?.showModal();void loadDetail(id)}
 function closeCertificate(){detailRequest.current++;previewDialog.current?.close();setSelected('');setDetail(null);setDetailError('');setDetailLoading(false);setReason('')}
 useEffect(()=>{queueMicrotask(()=>{void refresh()})},[refresh])
 async function act(action:string,payload:Record<string,unknown>){setBusy(true);setMessage('');setActionError('');try{const j=await json('/api/platform/certificates',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})});if(j.id){openCertificate(j.id);setMessage(j.reused?'This approved version already has a certificate.':'Certificate issued and signed. Its PDF is ready.')}else{setReason('');setMessage('Certificate revoked. Its public check now shows Revoked.');if(selected)await loadDetail(selected)}await refresh()}catch(e){setMessage((e as Error).message);if(previewDialog.current?.open)setActionError((e as Error).message)}finally{setBusy(false)}}
 async function download(id:string){setBusy(true);setMessage('');setActionError('');try{const response=await fetch(`/api/platform/certificates?download=${id}`,{cache:'no-store'});if(!response.ok)throw new Error((await response.json()).error);const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`VIDYA-${id}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}catch(e){setMessage((e as Error).message);if(previewDialog.current?.open)setActionError((e as Error).message)}finally{setBusy(false)}}
 return <>
<section className="card certificate-intro">
<ShieldCheck size={30}/>
<div>
<h2>
<Label text={"One approved version. One verifiable certificate."}/>
</h2>
<p>
<Label text={"The Institution Head or awarding body issues certificates only after live sign-off. Select View to preview a certificate and access its actions. Each PDF contains the synthetic APAAR ID, Student ID and a QR check link. Public checks do not disclose student names, DOB or APAAR."}/>
</p>
<LocalizedLink className="text-button" href="/verify">
<Label text={"Open the public checker "}/>
<ExternalLink size={14}/>
</LocalizedLink>
</div>
</section>
<Feedback message={message}/>{!data&&!message&&<Skeleton label="Loading certificate records"/>}
 <section className="card table-card">
<div className="table-title">
<h2>
<Label text={"Academic records"}/>
</h2>
<LocalizedButton className="text-button" onClick={refresh}>
<Label text={"Refresh"}/>
</LocalizedButton>
</div>
<form className="anomaly-filters" onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search)}}>
<label>
<Label text={"Find a student"}/>
<SuggestedInput kind="student" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or Student ID"/>
</label>
<label>
<Label text={"Academic year"}/>
<LocalizedSelect value={year} onChange={e=>{setYear(Number(e.target.value));setPage(1)}}>{[2026,2025,2024,2023].map(y=>
<option key={y} value={y}>
<Label text={y}/>
</option>)}</LocalizedSelect>
</label>
<LocalizedButton className="button secondary">
<Label text={"Search"}/>
</LocalizedButton>
</form>
<div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Student"}/>
</th>
<th>
<Label text={"Program"}/>
</th>
<th>
<Label text={"Approved version"}/>
</th>
<th>
<Label text={"Certificate"}/>
</th>
</tr>
</thead>
<tbody>{data?.rows.map(row=>
<tr key={row.id}>
<td>
<strong>
<Label text={row.name}/>
</strong>
<small>
<Label text={row.student_id}/>
</small>
<small className="mono">
<Label text={row.apaar}/>
</small>
</td>
<td>
<Label text={row.program_name}/>
<small>
<Label text={row.institution_name}/>
</small>
</td>
<td>v<Label text={row.version}/>
<small>
<Label text={row.status.replaceAll('_',' ')}/>
</small>
</td>
<td>{row.certificate_id?<LocalizedButton className="text-button" onClick={()=>openCertificate(row.certificate_id!)}>
<FileCheck2 size={16}/>
<Label text={row.certificate_status}/>
<Label text={"· View"}/>
</LocalizedButton>:head&&row.eligible?<LocalizedButton className="button secondary" disabled={busy} onClick={()=>act('issue',{enrolment_id:row.id,version:row.version})}>
<Label text={"Issue certificate"}/>
</LocalizedButton>:<small>
<Label text={row.eligible?'Awaiting Head issuance':'Complete upload and Head sign-off first'}/>
</small>}</td>
</tr>)}</tbody>
</table>
</div>{data&&!data.rows.length&&<p className="table-foot">
<Label text={"No records match this search."}/>
</p>}<div className="table-title">
<span>
<Label text={"Page "}/>
<Label text={page}/> / <Label text={Math.max(1,Math.ceil((data?.total||0)/25))}/>
</span>
<div className="actions">
<LocalizedButton className="button secondary" disabled={page<=1} onClick={()=>setPage(page-1)}>
<Label text={"Previous"}/>
</LocalizedButton>
<LocalizedButton className="button secondary" disabled={page*25>=(data?.total||0)} onClick={()=>setPage(page+1)}>
<Label text={"Next"}/>
</LocalizedButton>
</div>
</div>
</section>
 <dialog ref={previewDialog} className="certificate-preview-dialog" aria-labelledby="certificate-preview-title" onCancel={event=>{event.preventDefault();closeCertificate()}} onClick={event=>{if(event.target===event.currentTarget&&!busy)closeCertificate()}}>
  <div className="certificate-preview-header">
<div>
<div className="eyebrow">
<Label text={"CERTIFICATE VIEWER"}/>
</div>
<h2 id="certificate-preview-title">
<Label text={detail?.student_name||'Certificate preview'}/>
</h2>{detail&&<p>
<Label text={detail.student_id}/>
<Label text={"· Approved version "}/>
<Label text={detail.version}/>
</p>}</div>
<LocalizedButton type="button" className="role-dialog-close" aria-label="Close certificate viewer" onClick={closeCertificate}>
<X size={21}/>
</LocalizedButton>
</div>
  {actionError&&<p role="alert" className="certificate-action-error"><Label text={actionError}/></p>}{detailLoading&&<Skeleton rows={6} label="Loading certificate details"/>}
  {detailError&&<div role="alert" className="certificate-loading">
<p>
<Label text={detailError}/>
</p>
<LocalizedButton className="button secondary" onClick={()=>void loadDetail(selected)}>
<Label text={"Try again"}/>
</LocalizedButton>
</div>}
  {detail&&!detailLoading&&<div className="certificate-preview-layout">
<aside className="certificate-preview-details">
<span className={`verification-badge ${detail.status.toLowerCase()}`}>
<Label text={detail.status}/>
</span>
<p>
<Label text={detail.message}/>
</p>
<dl className="detail-list">
<div>
<dt>
<Label text={"Reference"}/>
</dt>
<dd className="mono">
<Label text={detail.id}/>
</dd>
</div>
<div>
<dt>
<Label text={"APAAR"}/>
</dt>
<dd className="mono">
<Label text={detail.apaar}/>
</dd>
</div>
<div>
<dt>
<Label text={"Issued"}/>
</dt>
<dd>
<Label text={new Date(detail.issued_at).toLocaleString('en-IN')}/>
</dd>
</div>
</dl>
   <div className="certificate-preview-actions">
<LocalizedButton className="button" disabled={busy||detail.status!=='Valid'} onClick={()=>download(detail.id)}>
<Download size={16}/>
<Label text={"Download PDF"}/>
</LocalizedButton>{detail.status==='Valid'&&<LocalizedAnchor className="button secondary" href={portalApiPath('/api/platform/certificates?preview='+encodeURIComponent(detail.id),rolePortal(role))} target="_blank" rel="noreferrer">
<Label text={"Open PDF in new tab "}/>
<ExternalLink size={15}/>
</LocalizedAnchor>}<LocalizedAnchor className="button secondary" href={detail.verify_url} target="_blank" rel="noreferrer">
<Label text={"Verify QR & PDF integrity "}/>
<ExternalLink size={15}/>
</LocalizedAnchor>
</div>
   <p className="small muted">
<Label text={"The authorised PDF includes the full synthetic APAAR ID. Public checks keep student details private."}/>
</p>{/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(detail.verify_url)&&<p className="feedback-info">
<Label text={"This QR opens on this computer. Use the checker here to test PDF integrity."}/>
</p>}
   {detail.revocation_reason&&<p>
<strong>
<Label text={"Revocation reason:"}/>
</strong> <Label text={detail.revocation_reason}/>
</p>}{canRevoke&&detail.status!=='Revoked'&&<details className="certificate-revoke">
<summary>
<Label text={"Revoke this certificate"}/>
</summary>
<form onSubmit={e=>{e.preventDefault();void act('revoke',{id:detail.id,reason})}}>
<label>
<Label text={"Reason for revocation"}/>
<SuggestedTextarea value={reason} onChange={e=>setReason(e.target.value)} minLength={10} maxLength={500} required placeholder="Explain why this certificate should no longer be accepted."/>
</label>
<LocalizedButton className="button secondary" disabled={busy||reason.trim().length<10}>
<Label text={"Revoke certificate"}/>
</LocalizedButton>
<p className="small muted">
<Label text={"Revocation is permanent for this version. A replacement requires a correction and fresh Head sign-off."}/>
</p>
</form>
</details>}
  </aside>
<div className="certificate-pdf-pane">{detail.status==='Valid'?<iframe title={'Certificate PDF for '+detail.student_name} src={portalApiPath('/api/platform/certificates?preview='+encodeURIComponent(detail.id),rolePortal(role))+'#toolbar=1&view=FitH'}/>:<div className="certificate-loading">
<ShieldCheck size={32}/>
<h3>
<Label text={"PDF unavailable"}/>
</h3>
<p>
<Label text={"This certificate is "}/>
<Label text={detail.status.toLowerCase()}/>
<Label text={". Use the verification link to inspect its status."}/>
</p>
</div>}</div>
</div>}
 </dialog>
 <section className="card table-card">
<div className="table-title">
<h2>
<Label text={"Issued certificate history"}/>
</h2>
<span>
<Label text={"Latest 30 within your scope"}/>
</span>
</div>
<div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Student"}/>
</th>
<th>
<Label text={"Version"}/>
</th>
<th>
<Label text={"Status"}/>
</th>
<th>
<Label text={"Issued"}/>
</th>
<th/>
</tr>
</thead>
<tbody>{data?.history.map(c=>
<tr key={c.id}>
<td>
<Label text={c.name}/>
<small>
<Label text={c.student_id}/>
</small>
</td>
<td>
<Label text={c.version}/>
</td>
<td>
<Label text={c.status}/>
</td>
<td>
<Label text={new Date(c.created_at).toLocaleDateString('en-IN')}/>
</td>
<td>
<LocalizedButton className="text-button" onClick={()=>openCertificate(c.id)}>
<Label text={"Inspect"}/>
</LocalizedButton>
</td>
</tr>)}</tbody>
</table>
</div>{!data?.history.length&&<p className="table-foot">
<Label text={"No certificates have been issued in this scope and year."}/>
</p>}</section>
</>
}
