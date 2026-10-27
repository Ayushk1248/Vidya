import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {CertificateCentre} from '@/components/certificate-centre'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||actor.role==='external_verifier')redirect('/verification');return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="certificates"><PageHeading eyebrow="SIGNED ACADEMIC RECORDS" title={actor.role==='student'?'My certificates':'Certificate Centre'} description={actor.role==='student'?'Download certificates issued by your institution.':'Issue certificates for approved records, download PDFs and check validity.'}/><SyntheticNote/><CertificateCentre role={actor.role}/></WorkspaceShell>}
