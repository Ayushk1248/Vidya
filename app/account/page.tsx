import Link from 'next/link'
import {redirect} from 'next/navigation'
import {signedInUser} from '@/lib/platform/web-session'
import {actorFor} from '@/lib/platform/repository.mjs'
import {roles} from '@/lib/platform/access.mjs'
import {WorkspaceShell,PageHeading} from '@/components/workspace-shell'
import {DeleteAccountButton} from '@/components/delete-account-button'
import {SignOutButton} from '@/components/sign-out-button'
export const dynamic='force-dynamic'
export default async function Account(){
 let user;try{user=await signedInUser()}catch{redirect('/login')}
 const actor=actorFor(user.id),name=user.user_metadata?.display_name||user.user_metadata?.username||'Account'
 const content=<><PageHeading eyebrow="YOUR ACCOUNT" title="Account settings" description="Your approved role belongs to this account. Signing out or choosing another page does not change it."/><section className="card upload-panel"><dl className="detail-list"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Account ID</dt><dd className="mono">{user.id}</dd></div><div><dt>Assigned role</dt><dd>{actor?roles[actor.role as keyof typeof roles]:'Not assigned — complete registration or await approval'}</dd></div><div><dt>Scope</dt><dd>{actor?.institution_id||actor?.region||actor?.student_id||(actor?'Role-specific access':'Not yet approved')}</dd></div></dl><p>To change an approved role, contact your administrator. Existing accounts are not automatically reset by this registration update.</p>{!actor&&<Link className="button" href="/onboarding">Continue registration</Link>}</section><section className="card upload-panel" id="delete-account"><h2>Delete account</h2><p>Deleting your sign-in account is permanent. Institution-managed academic records and audit history are retained. No account is deleted unless you confirm below.</p>{user.id.startsWith('demo-')?<p>Shared demonstration accounts cannot be deleted here.</p>:<><DeleteAccountButton/>{!process.env.SUPABASE_SERVICE_ROLE_KEY&&<p className="feedback-info">Account deletion needs the server administrator to configure the Supabase server-only deletion key.</p>}</>}</section></>
 if(actor)return <WorkspaceShell actor={actor} name={name} active="account">{content}</WorkspaceShell>
 return <main className="portal"><header className="topbar"><Link className="brand" href="/">VIDYA</Link><SignOutButton/></header><div className="onboarding-page">{content}</div></main>
}
