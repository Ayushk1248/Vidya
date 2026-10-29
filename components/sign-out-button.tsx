'use client'
import {LocalizedButton,Label} from '@/components/language'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {LogOut} from 'lucide-react'
import {createSupabaseBrowserClient} from '@/lib/supabase/client'
export function SignOutButton(){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function logout(){setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST'});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not log out.');await createSupabaseBrowserClient()?.auth.signOut({scope:'local'});router.replace(result.redirect);router.refresh()}catch(e){setError((e as Error).message);setBusy(false)}}
 return <div className="logout-control"><LocalizedButton type="button" className="button secondary" onClick={()=>void logout()} disabled={busy}><LogOut size={16}/><Label text={busy?'Logging out…':'Log out'}/></LocalizedButton>{error&&<span role="alert" className="feedback-error"><Label text={error}/></span>}</div>
}