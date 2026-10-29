'use client'
import {LocalizedButton,Label} from '@/components/language'

import {useState} from 'react'
import {parsePortalPath,portalApiPath} from '@/lib/platform/portals.mjs'
export function MatchingStudentExample(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 return <div className="matching-example"><LocalizedButton type="button" className="button secondary" disabled={busy} onClick={async event=>{
  const form=event.currentTarget.form;if(!form)return;setBusy(true);setMessage('');
  try{const category=parsePortalPath(window.location.pathname)?.category;const response=await fetch(portalApiPath('/api/platform/suggestions?kind=upload_example',category),{cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error);const record=result.options?.[0]?.data;if(!record){setMessage(result.hint||'Download a template to find a matching draft.');return}
   for(const [key,value] of Object.entries(record)){const field=form.elements.namedItem(key);if(!(field instanceof HTMLInputElement||field instanceof HTMLSelectElement)||['hidden','password','file','checkbox'].includes(field.type))continue;const prototype=field instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value')?.set?.call(field,String(value??''));field.dispatchEvent(new Event(field instanceof HTMLSelectElement?'change':'input',{bubbles:true}))}
   setMessage(result.hint+' Example: '+result.options[0].label);
  }catch(error){setMessage((error as Error).message)}finally{setBusy(false)}
 }}><Label text={busy?'Finding matching draft…':'✦ Load matching student example'}/></LocalizedButton><p className="small muted" role="status"><Label text={message||'Fill a consistent existing synthetic draft: Student ID, registry-matching name/DOB/APAAR, approved program and contact examples. Review before validating.'}/></p></div>
}
