
import {LocalizedAnchor,Label} from '@/components/language'
import {pageSession} from '@/lib/platform/web-session'
import {overview} from '@/lib/platform/workflows.mjs'
import {redirect} from 'next/navigation'
import {WorkspaceShell,PageHeading,SyntheticNote} from '@/components/workspace-shell'
import {InstitutionDirectory} from '@/components/institution-directory'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams:Promise<{year?:string}>}){const {actor,user}=await pageSession();if(!actor||['student','external_verifier'].includes(actor.role))redirect('/dashboard');const y=Number((await searchParams).year);const year=[2023,2024,2025,2026].includes(y)?y:2026;const data=overview(actor,year)
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="institutions"><PageHeading eyebrow="INSTITUTION & PROGRAM MASTER" title={actor.institution_id?'Your institution at a glance':'Explore your institution network'} description="Filter by region and state, then open an institution’s program approvals and records."><LocalizedAnchor className="button secondary" href={`/api/platform/report?year=${year}`}><Label text={"Export CSV"}/></LocalizedAnchor></PageHeading><SyntheticNote/><InstitutionDirectory rows={data.directory} year={year}/></WorkspaceShell>}
