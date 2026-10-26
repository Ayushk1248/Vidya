import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {anomalyOverview} from '@/lib/platform/anomalies.mjs'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {AnomalyCentre} from '@/components/anomaly-centre'
export const dynamic='force-dynamic'
export default async function Page(){const {user,actor}=await pageSession();if(!actor||['student','external_verifier'].includes(actor.role))redirect('/dashboard');return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="anomalies"><PageHeading eyebrow="EVIDENCE-LED INSTITUTION REVIEW" title="Anomaly Centre" description="Find unusual enrolment patterns, compare similar institutions, and record a considered review."/><SyntheticNote/><AnomalyCentre initial={anomalyOverview(actor,2026)} role={actor.role}/></WorkspaceShell>}
