import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {UploadCentre} from '@/components/upload-centre'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||['student','external_verifier'].includes(actor.role))redirect('/dashboard');const head=actor.role==='institution_head';return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||'Account'} active="uploads"><PageHeading eyebrow={head?'INSTITUTION HEAD · BATCH APPROVAL':'OPERATOR · DATA SUBMISSION'} title={head?'Batch Review':'Upload Centre'} description={head?'Inspect submitted batches and validation findings, then sign off with the demonstration OTP.':'Download a template, upload your batch, fix rows, and submit to your Institution Head.'}/><SyntheticNote/><UploadCentre role={actor.role}/></WorkspaceShell>}
