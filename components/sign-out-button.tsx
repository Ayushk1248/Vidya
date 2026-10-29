'use client'
import {LocalizedButton,Label} from '@/components/language'

import {useRef,useState} from 'react'
import {useRouter} from 'next/navigation'
import {LogOut} from 'lucide-react'
import {createSupabaseBrowserClient} from '@/lib/supabase/client'
export function SignOutButton(){
 const dialog=useRef<HTMLDialogElement>(null),router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function logout(){setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST'});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not log out.');await createSupabaseBrowserClient()?.auth.signOut({scope:'local'});router.replace(result.redirect);router.refresh()}catch(e){setError((e as Error).message);setBusy(false)}}
 return <div className="logout-control">
<LocalizedButton type="button" className="button secondary" onClick={()=>dialog.current?.showModal()} disabled={busy}>
<LogOut size={16}/>
<Label text={busy?'Logging out…':'Log out'}/>
</LocalizedButton>{error&&<span role="alert" className="feedback-error">
<Label text={error}/>
</span>}<dialog ref={dialog} className="account-confirmation" aria-labelledby="signout-title" onCancel={event=>{if(busy)event.preventDefault()}}><h3 id="signout-title"><Label text="Sign Out?"/></h3><p><Label text="You can sign back in to return to your VIDYA workspace."/></p><div className="confirmation-actions"><LocalizedButton type="button" className="confirmation-cancel" autoFocus disabled={busy} onClick={()=>dialog.current?.close()}><Label text={"Cancel"}/></LocalizedButton><LocalizedButton type="button" className="confirmation-primary" disabled={busy} onClick={()=>void logout()}><Label text={busy?'Logging out…':'Log out'}/></LocalizedButton></div></dialog></div>
}
