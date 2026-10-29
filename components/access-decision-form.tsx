'use client'
import {Label,LocalizedButton} from '@/components/language'

import {SuggestedTextarea} from '@/components/data-suggestions'

import {useId} from 'react'
import type {AccessRequest} from '@/lib/platform/workflows.mjs'

export function AccessDecisionForm({active,member,currentUserId,note,setNote,busy,error,send}:{
 active:AccessRequest|null;member:string|null;currentUserId:string;note:string;
 setNote:(value:string)=>void;busy:boolean;error:string;
 send:(body:Record<string,unknown>)=>Promise<void>;
}){
 const helpId=useId(),ownRequest=active?.user_id===currentUserId;
 const issues=active?.approval_issues||[];
 return <form className="platform-form" onSubmit={event=>{
  event.preventDefault();
  const decision=(event.nativeEvent as SubmitEvent).submitter?.getAttribute('value');
  if(ownRequest)return;
  if(member)void send({action:'revoke',user_id:member,note:note.trim()});
  else if(decision==='approved'||decision==='rejected')void send({action:'review',id:active?.id,decision,note:note.trim()});
 }}>
  {ownRequest&&<p className="feedback-error" role="alert"><Label text={"Another authorised reviewer must review your request. You cannot approve or reject your own access."}/></p>}
  {!!issues.length&&<div className="feedback-error" role="status"><strong><Label text={"Approval needs a correction"}/></strong><ul>{issues.map(issue=><li key={issue}><Label text={issue}/></li>)}</ul><p><Label text={"You can reject this request with an explanation so the applicant can submit the correct details."}/></p></div>}
  <label><Label text={member?'Reason for revocation (required)':'Review note (required)'}/>
   <SuggestedTextarea aria-label={member?'Reason for revocation (required)':'Review note (required)'} autoFocus value={note} onChange={event=>setNote(event.target.value)} rows={3}
    placeholder={member?'Explain why this account’s access is being revoked.':'Explain why you are approving or rejecting this request.'}
    required minLength={5} maxLength={1000} aria-describedby={helpId}/>
  </label>
  <p id={helpId} className="small muted"><Label text={"Enter at least 5 characters. This reason is saved in the audit history. "}/><Label text={note.trim().length}/><Label text={"/1000 characters."}/></p>
  {error&&<p role="alert" className="feedback-error"><Label text={error}/></p>}
  <div className="actions">{member?
   <LocalizedButton type="submit" className="button" disabled={busy}><Label text={busy?'Revoking…':'Confirm revocation'}/></LocalizedButton>:
   <><LocalizedButton type="submit" name="decision" value="rejected" className="button secondary" disabled={busy||ownRequest}><Label text={busy?'Saving…':'Reject'}/></LocalizedButton>
   <LocalizedButton type="submit" name="decision" value="approved" className="button" disabled={busy||ownRequest||!!issues.length}><Label text={busy?'Saving…':'Approve access'}/></LocalizedButton></>}
  </div>
 </form>
}
