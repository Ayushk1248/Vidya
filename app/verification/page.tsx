import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {consentList} from '@/lib/platform/workflows.mjs'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {ConsentWorkspace} from '@/components/consent-workspace'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||!['student','external_verifier'].includes(actor.role))redirect('/dashboard');const student=actor.role==='student'
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="verification"><PageHeading eyebrow={student?'PRIVACY & PERMISSION':'CONSENT-BASED VERIFICATION'} title={student?'Sharing requests':'Verification requests'} description={student?'Review who is asking, why they need access, and which fields they want.':'Request academic information with the student’s explicit approval.'}/><SyntheticNote/><ConsentWorkspace key={actor.user_id} student={student} requests={consentList(actor)}/></WorkspaceShell>}
