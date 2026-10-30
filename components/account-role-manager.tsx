'use client'
import {useState,useRef} from 'react'
import {useRouter} from 'next/navigation'
import {Label,LocalizedInput,LocalizedButton,LocalizedSelect} from './language'
import {SuggestedInput,SuggestedTextarea} from './data-suggestions'
import {roles} from '@/lib/platform/access.mjs'
import {portalApiPath} from '@/lib/platform/portals.mjs'
import type {ManagedAccount} from '@/lib/platform/account-roles.mjs'

export function AccountRoleManager({institutions,regions,currentUserId}:{institutions:{id:string;name:string}[];regions:string[];currentUserId:string}){
 const router=useRouter(),request=useRef(0)
 const [query,setQuery]=useState(''),[accounts,setAccounts]=useState<ManagedAccount[]>([]),[selected,setSelected]=useState<ManagedAccount|null>(null),[searched,setSearched]=useState(false)
 const [role,setRole]=useState('student'),[institution,setInstitution]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('')
 async function search(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const sequence=++request.current;setBusy(true);setError('');setSelected(null);setSuccess('');try{const r=await fetch(portalApiPath('/api/platform/accounts?q='+encodeURIComponent(query.trim()),'aicte'),{cache:'no-store'}),j=await r.json();if(!r.ok)throw new Error(j.error);if(sequence===request.current){setAccounts(j.accounts);setSearched(true)}}catch(e){if(sequence===request.current)setError((e as Error).message)}finally{if(sequence===request.current)setBusy(false)}}
 function choose(account:ManagedAccount){setSelected(account);setRole(account.assignment?.role||'student');setInstitution(account.assignment?.institution_id||'');setError('');setSuccess('')}
 async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!selected)return;setBusy(true);setError('');setSuccess('');try{const fields=Object.fromEntries(new FormData(event.currentTarget));const r=await fetch(portalApiPath('/api/platform/access','aicte'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,role,institution_id:institution,action:'change_role',user_id:selected.user_id,expected_assignment:selected.expected_assignment})}),j=await r.json();if(!r.ok)throw new Error(j.error);setSuccess('Role saved. The account will use its new permissions when the workspace is reopened.');setSelected(null);setAccounts([]);setSearched(false);router.refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="card upload-panel account-role-manager" id="account-roles">
  <div className="table-title"><h2><Label text="Manage roles by email"/></h2><span className="status-pill"><Label text="Administrator only"/></span></div>
  <p className="muted"><Label text="Find a registered email, select the account, then assign its role and scope. The account must have signed in to this project first."/></p>
  <form className="actions" onSubmit={search}><label className="account-search"><Label text="Email or account name"/><LocalizedInput value={query} onChange={e=>setQuery(e.target.value)} minLength={2} maxLength={160} required placeholder="Search a registered email" autoComplete="off"/></label><LocalizedButton className="button secondary" disabled={busy}><Label text={busy?'Searching…':'Find account'}/></LocalizedButton></form>
  {success&&<p className="feedback-info" role="status"><Label text={success}/></p>}
  {searched&&accounts.length===0&&<p role="status"><Label text="No registered account found. Ask the person to sign in once, then search again."/></p>}
  {accounts.length>0&&<div className="table-scroll"><table><thead><tr><th><Label text="Account"/></th><th><Label text="Current role"/></th><th><Label text="Action"/></th></tr></thead><tbody>{accounts.map(account=><tr key={account.user_id}><td><strong>{account.display_name}</strong><small>{account.email}</small></td><td><Label text={account.assignment?roles[account.assignment.role as keyof typeof roles]:'Not assigned'}/></td><td>{account.user_id===currentUserId?<Label text="Your account — another administrator must change it"/>:<LocalizedButton type="button" className="text-button" onClick={()=>choose(account)} disabled={busy}><Label text="Change role"/></LocalizedButton>}</td></tr>)}</tbody></table></div>}
  {selected&&<form key={selected.user_id} onSubmit={save} className="platform-form role-assignment-form"><h3><Label text="Change role for"/> {selected.email}</h3><p className="small muted"><Label text="This replaces the current assignment. Previous student or verifier sharing permissions are revoked when their identity changes. Verification requirements follow the project’s security settings."/></p>
   <label><Label text="New role"/><LocalizedSelect value={role} onChange={e=>{setRole(e.target.value);setInstitution('')}}>{Object.entries(roles).map(([id,label])=><option value={id} key={id}><Label text={label}/></option>)}</LocalizedSelect></label>
   {['institution_operator','institution_head','awarding_body','student'].includes(role)&&<label><Label text="Institution"/><LocalizedSelect name="institution_id" value={institution} onChange={e=>setInstitution(e.target.value)} required><option value=""><Label text="Select an institution"/></option>{institutions.map(i=><option value={i.id} key={i.id}>{i.id} · {i.name}</option>)}</LocalizedSelect></label>}
   {role==='regional_officer'&&<label><Label text="Region"/><LocalizedSelect name="region" required defaultValue={selected.assignment?.region||''}><option value=""><Label text="Select a region"/></option>{regions.map(region=><option value={region} key={region}>{region}</option>)}</LocalizedSelect></label>}
   {role==='student'&&<label><Label text="Student ID"/><SuggestedInput name="student_id" kind="student" institution={institution} defaultValue={selected.assignment?.student_id||''} required maxLength={40} placeholder="Choose the student enrolled at this institution"/></label>}
   {role==='external_verifier'&&<label><Label text="Organisation"/><SuggestedInput name="organisation" defaultValue={selected.organisation} required minLength={3} maxLength={160}/></label>}
   {!['student','external_verifier'].includes(role)&&<label><Label text="Designation"/><SuggestedInput name="designation" required minLength={3} maxLength={100}/></label>}
   <label><Label text="Reason for role change"/><SuggestedTextarea name="note" aria-label="Reason for role change" required minLength={10} maxLength={1000} rows={3}/></label>
   <label className="check"><LocalizedInput type="checkbox" required/><Label text="I checked this email account, role and scope before changing access."/></label>
   <div className="actions"><LocalizedButton type="submit" className="button" disabled={busy}><Label text={busy?'Saving…':'Save role change'}/></LocalizedButton><LocalizedButton type="button" className="button secondary" disabled={busy} onClick={()=>setSelected(null)}><Label text="Cancel"/></LocalizedButton></div>
  </form>}
  {error&&<p className="feedback-error" role="alert"><Label text={error}/></p>}
 </section>
}
