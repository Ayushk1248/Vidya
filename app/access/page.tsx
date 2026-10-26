import {pageSession} from '@/lib/platform/web-session'
import {accessQueue} from '@/lib/platform/workflows.mjs'
import {redirect} from 'next/navigation'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {AccessManager} from '@/components/access-manager'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||!['aicte_admin','institution_head'].includes(actor.role))redirect('/dashboard');const data=accessQueue(actor)
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="access"><PageHeading eyebrow="IDENTITY & ACCESS" title="The right access. The right people." description="Review affiliations, activate workspaces, and manage account access."/><SyntheticNote/><div className="metric-grid"><article><span>Awaiting review</span><strong>{data.requests.filter(r=>r.status==='pending').length}</strong><small>Requests within your review scope</small></article><article><span>Active accounts</span><strong>{data.members.length}</strong><small>Approved role assignments</small></article><article><span>Completed reviews</span><strong>{data.requests.filter(r=>r.status!=='pending').length}</strong><small>Approval and rejection history</small></article></div><AccessManager data={data} currentUserId={user.id} reviewerRole={actor.role}/></WorkspaceShell>}
