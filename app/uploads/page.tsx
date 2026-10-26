import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {UploadCentre} from '@/components/upload-centre'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||['student','external_verifier'].includes(actor.role))redirect('/dashboard');return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||'Account'} active="uploads"><PageHeading eyebrow="INSTITUTION DATA COLLECTION" title="Upload Centre" description="Upload synthetic records, resolve validation findings, and submit to your Institution Head."/><SyntheticNote/><UploadCentre role={actor.role}/></WorkspaceShell>}
