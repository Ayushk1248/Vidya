
import {AccessWorkspace} from '@/components/access-workspace'
import {pageSession} from '@/lib/platform/web-session'
import {accessQueue} from '@/lib/platform/workflows.mjs'
import {redirect} from 'next/navigation'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {AccessManager} from '@/components/access-manager'
import {AccountRoleManager} from '@/components/account-role-manager'
import {institutions} from '@/lib/platform/repository.mjs'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||!['aicte_admin','institution_head'].includes(actor.role))redirect('/dashboard');const data=accessQueue(actor)
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="access"><PageHeading eyebrow="IDENTITY & ACCESS" title="The right access. The right people." description="Review affiliations, activate workspaces, and manage account access."/><SyntheticNote/><AccessWorkspace pending={data.requests.filter(r=>r.status==='pending').length} activeAccounts={data.members.length} completed={data.requests.filter(r=>r.status!=='pending').length}>{actor.role==='aicte_admin'&&<AccountRoleManager institutions={institutions(actor).map(i=>({id:i.id,name:i.name}))} regions={data.regions} currentUserId={user.id}/>}<AccessManager data={data} currentUserId={user.id} reviewerRole={actor.role}/></AccessWorkspace></WorkspaceShell>}
