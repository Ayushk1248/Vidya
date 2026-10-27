import {workspaceHome} from '@/lib/platform/workspace-navigation'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {registrationData} from '@/lib/platform/workflows.mjs'
import {OnboardingForm} from '@/components/onboarding-form'
import {SignOutButton} from '@/components/sign-out-button'
export const dynamic='force-dynamic'
export default async function Onboarding(){const {user,actor}=await pageSession(true);if(actor)redirect(workspaceHome(actor.role))
 return <main className="portal"><header className="topbar"><Link className="brand" href="/">◎ VIDYA<span>WORKSPACE REGISTRATION</span></Link><div className="actions"><span className="role-chip">Signed in</span><SignOutButton/></div></header><div className="onboarding-page"><div className="eyebrow">WELCOME TO VIDYA</div><h1>Let’s set up your workspace.</h1><p className="muted">Signed in as {user.email}. Choose the right access for your work.</p><section className="card upload-panel"><p>For AICTE or system staff access, give your administrator this account ID. Staff roles cannot be requested through public registration.</p><code>{user.id}</code><p className="small muted">An existing approved role cannot be changed by choosing a different login portal.</p></section><OnboardingForm data={registrationData(user.id)}/><section className="card upload-panel"><h2>Account settings</h2><Link href="/account">View account or delete account →</Link></section></div></main>}
