import {Label} from '@/components/language'
import {pageSession} from '@/lib/platform/web-session'
import {notifications} from '@/lib/platform/notifications.mjs'
import {WorkspaceShell,PageHeading} from '@/components/workspace-shell'
import {WorkflowAction} from '@/components/workflow-action'
export const dynamic='force-dynamic'
export default async function Notifications(){const {user,actor}=await pageSession(),rows=notifications(actor!);return <WorkspaceShell actor={actor!} name={user.user_metadata?.display_name||'Account'} active="notifications"><PageHeading eyebrow="YOUR INBOX" title="Every next step, in one place." description="Consent requests, institution queries, reminders and submission updates."/>{rows.length?rows.map(n=><section className="card upload-panel" key={n.id}><div className="table-title"><h2><Label text={n.title}/></h2><span className="status-pill"><Label text={n.read_at?'Read':'Unread'}/></span></div><p><Label text={n.body}/></p><small><Label text={new Date(n.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}/></small>{!n.read_at&&<WorkflowAction action="notification_read" button="Mark as read" extra={{id:n.id}}/>}</section>):<section className="card upload-panel"><h2><Label text="You’re all caught up."/></h2><p><Label text="Workflow notifications will appear here as you work."/></p></section>}</WorkspaceShell>}
