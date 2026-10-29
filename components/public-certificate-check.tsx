"use client"
import {LocalizedLink,Label,LocalizedButton,LocalizedInput} from '@/components/language'

import {SuggestedInput} from '@/components/data-suggestions'
import {Skeleton} from './presentation'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {ShieldCheck,ShieldX,FileSearch} from 'lucide-react'
import type {Verification} from '@/lib/platform/certificates.mjs'
export function PublicCertificateCheck({id}:{id?:string}){
 const [entry,setEntry]=useState(id||''),[result,setResult]=useState<Verification|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[filename,setFilename]=useState('')
 async function check(fileHash?:string){if(!id)return;setBusy(true);setError('');try{const response=await fetch(fileHash?'/api/public/verify':`/api/public/verify?id=${encodeURIComponent(id)}`,fileHash?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,fileHash}),cache:'no-store'}:{cache:'no-store'});const j=await response.json();if(!response.ok)throw new Error(j.error||'Unable to check this certificate.');setResult(j)}catch(e){setError((e as Error).message);setResult(null)}finally{setBusy(false)}}
 useEffect(()=>{if(id)queueMicrotask(()=>{void check()})},[id])
 async function fileCheck(file?:File){if(!file)return;setError('');if(file.size>10000000||!file.name.toLowerCase().endsWith('.pdf')){setError('Select a PDF up to 10 MB.');return}setBusy(true);try{const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const hex=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');setFilename(file.name);await check(hex)}catch{setError('The browser could not calculate a file fingerprint. Use localhost or HTTPS.')}finally{setBusy(false)}}
 function open(e:React.FormEvent){e.preventDefault();let reference=entry.trim();try{if(reference.includes('://'))reference=new URL(reference).pathname.split('/').filter(Boolean).at(-1)||''}catch{setError('Enter a certificate reference or check link.');return}if(!/^[0-9a-f-]{36}$/i.test(reference)){setError('Enter the certificate reference printed on the PDF, not an APAAR ID.');return}window.location.assign('/verify/'+reference)}
 return <div className="portal public-verification">
<header className="topbar">
<LocalizedLink className="brand" href="/"><Label text={"◎ VIDYA"}/><span><Label text={"PUBLIC CERTIFICATE CHECK"}/></span>
</LocalizedLink>
<div className="actions">
<LocalizedLink className="button secondary" href="/login"><Label text={"Sign in"}/></LocalizedLink>
</div>
</header>
<main className="public-check-content">
<div className="eyebrow">
<Label text={"SIH26263 · SYNTHETIC-DATA PROTOTYPE"}/>
</div>
<h1>
<Label text={"Check a record. Trust the evidence."}/>
</h1>
<p className="muted">
<Label text={"Verify a certificate reference without signing in. Student details remain private."}/>
</p>
<form onSubmit={open} className="public-reference">
<label>
<Label text={"Certificate reference or QR link"}/>
<SuggestedInput kind="certificate" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Paste the reference printed on your certificate" required/>
</label>
<LocalizedButton className="button"><Label text={"Check reference"}/></LocalizedButton>
</form>{error&&<div className="anomaly-notice" role="alert"><Label text={error}/></div>}{busy&&<Skeleton rows={4} label="Checking certificate integrity"/>}{result&&<section className={`card public-result verification-${result.status.toLowerCase()}`}>
<div className={`public-result-heading ${result.status.toLowerCase()}`}>{result.status==='Valid'?<ShieldCheck size={38}/>:<ShieldX size={38}/>}<div>
<div className="eyebrow">
<Label text={"CURRENT CHECK RESULT"}/>
</div>
<h2>
<Label text={result.status}/>
</h2>
</div>
</div>
<p>
<Label text={result.message}/>
</p>
<dl className="detail-list">
<div>
<dt>
<Label text={"Reference"}/>
</dt>
<dd className="mono">
<Label text={result.id}/>
</dd>
</div>{result.institution&&<div>
<dt>
<Label text={"Institution"}/>
</dt>
<dd>
<Label text={result.institution}/>
</dd>
</div>}{result.academic_year&&<div>
<dt>
<Label text={"Academic year"}/>
</dt>
<dd>
<Label text={result.academic_year}/>
</dd>
</div>}<div>
<dt>
<Label text={"Record version"}/>
</dt>
<dd>
<Label text={result.version}/>
</dd>
</div>
<div>
<dt>
<Label text={"Issued"}/>
</dt>
<dd>
<Label text={new Date(result.issued_at).toLocaleDateString('en-IN')}/>
</dd>
</div>{result.revoked_at&&<div>
<dt>
<Label text={"Revoked"}/>
</dt>
<dd>
<Label text={new Date(result.revoked_at).toLocaleDateString('en-IN')}/>
</dd>
</div>}</dl>
<div className="verification-checks">
<span>
<Label text={"Ed25519 signature: "}/>
<strong>
<Label text={result.checks.signature_valid?'Verified':'Failed'}/>
</strong>
</span>
<span>
<Label text={"Current approved record: "}/>
<strong>
<Label text={result.checks.current_record_matches?'Matches':'Does not match'}/>
</strong>
</span>
<span>
<Label text={"Selected PDF: "}/>
<strong>
<Label text={result.checks.selected_pdf_matches===null?'Not checked':result.checks.selected_pdf_matches?'Matches original':'Does not match original'}/>
</strong>
</span>
</div>
<LocalizedButton className="text-button" disabled={busy} onClick={()=>{setFilename('');void check()}}>
<Label text={"Refresh record status"}/>
</LocalizedButton>
</section>}{id&&<section className="card public-file-check">
<FileSearch size={25}/>
<h2>
<Label text={"Check the actual PDF"}/>
</h2>
<p>
<Label text={"A copied QR does not prove that the surrounding document is unchanged. Select the PDF to compare its fingerprint with the original."}/>
</p>
<label>
<Label text={"Certificate PDF"}/>
<LocalizedInput type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e=>{void fileCheck(e.target.files?.[0]);e.target.value=''}}/>
</label>{filename&&<p className="small muted">
<Label text={"Selected: "}/>
<Label text={filename}/>
</p>}<p className="small muted">
<Label text={"The file stays in your browser. Only its SHA-256 fingerprint is sent; its contents are not uploaded."}/>
</p>
</section>}<p className="public-check-footer">
<Label text={"This checks a synthetic prototype credential, not a live APAAR record. Academic fields are shared separately through student-approved verification requests."}/>
</p>
</main>
</div>
}
