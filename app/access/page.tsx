
import {Label} from '@/components/language'
import {pageSession} from '@/lib/platform/web-session'
import {accessQueue} from '@/lib/platform/workflows.mjs'
import {redirect} from 'next/navigation'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {AccessManager} from '@/components/access-manager'
import {AccountRoleManager} from '@/components/account-role-manager'
import {institutions} from '@/lib/platform/repository.mjs'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||!['aicte_admin','institution_head'].includes(actor.role))redirect('/dashboard');const data=accessQueue(actor)
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="access"><PageHeading eyebrow="IDENTITY & ACCESS" title="The right access. The right people." description="Review affiliations, activate workspaces, and manage account access."/><SyntheticNote/><div className="metric-grid"><article><span><Label text={"Awaiting review"}/></span><strong><Label text={data.requests.filter(r=>r.status==='pending').length}/></strong><small><Label text={"Requests within your review scope"}/></small></article><article><span><Label text={"Active accounts"}/></span><strong><Label text={data.members.length}/></strong><small><Label text={"Approved role assignments"}/></small></article><article><span><Label text={"Completed reviews"}/></span><strong><Label text={data.requests.filter(r=>r.status!=='pending').length}/></strong><small><Label text={"Approval and rejection history"}/></small></article></div>{actor.role==='aicte_admin'&&<AccountRoleManager institutions={institutions(actor).map(i=>({id:i.id,name:i.name}))} regions={data.regions} currentUserId={user.id}/>}<AccessManager data={data} currentUserId={user.id} reviewerRole={actor.role}/></WorkspaceShell>}
