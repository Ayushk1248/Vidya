import {headers} from 'next/headers'
import {redirect} from 'next/navigation'
import {createSupabaseServerClient} from '@/lib/supabase/server'
import {actorFor} from '@/lib/platform/repository.mjs'
import {syncProfile} from '@/lib/platform/workflows.mjs'
import {migrateVerifiedOwner} from '@/lib/platform/owner-migration.mjs'
import {demoEnabled} from '@/lib/platform/demo.mjs'
import {Label,LocalizedLink,LocalizedButton,LocalizedInput,LanguageToggle} from '@/components/language'
export const dynamic='force-dynamic'
export default async function Administrator(){
 const client=await createSupabaseServerClient();const result=client?await client.auth.getUser():null;const user=result?.data.user;
 if(user){migrateVerifiedOwner(user);syncProfile(user);if(actorFor(user.id)?.role==='aicte_admin')redirect('/auth/workspace?administrator=1')}
 const demo=demoEnabled((await headers()).get('host')||'');
 return <main className="portal"><header className="topbar"><LocalizedLink className="brand" href="/">VIDYA</LocalizedLink><LanguageToggle/></header><section className="demo-entry card administrator-entry"><div className="eyebrow"><Label text="ADMINISTRATOR ACCESS"/></div><h1><Label text="Sign in as administrator"/></h1><p><Label text="Approve access requests and manage registered accounts by email using an approved AICTE Admin account."/></p>
  {user&&<p className="feedback-info"><Label text="Currently signed in as"/> {user.email}. <Label text="This account does not have administrator access. Sign in with a different approved administrator account to continue."/></p>}
  <LocalizedLink className="button" href="/administrator/sign-in"><Label text={user?'Use another administrator account':'Administrator sign-in'}/></LocalizedLink>
  <p className="small muted"><Label text="Choosing administrator sign-in does not change your current role or grant permissions. Administrator accounts must already be assigned by an authorised administrator."/></p>
  {demo&&<section className="scope-box"><h2><Label text="Local administrator demo"/></h2><p><Label text="For this local prototype, open the existing demonstration administrator in a separate tab. Your student portal stays open. This does not turn your Google account into an administrator."/></p><form action="/api/demo" method="post" target="_blank"><LocalizedInput type="hidden" name="role" value="aicte_admin"/><LocalizedInput type="hidden" name="category" value="aicte"/><LocalizedInput type="hidden" name="next" value="/access"/><LocalizedButton className="button secondary"><Label text="Open local administrator demo"/></LocalizedButton></form></section>}
  <LocalizedLink className="text-button" href="/"><Label text="Back to VIDYA"/></LocalizedLink>
 </section></main>
}
