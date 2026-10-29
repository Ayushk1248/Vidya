
import {LocalizedLink,Label} from '@/components/language'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {registrationData} from '@/lib/platform/workflows.mjs'
import {OnboardingForm} from '@/components/onboarding-form'
import {SignOutButton} from '@/components/sign-out-button'
export const dynamic='force-dynamic'
export default async function Onboarding(){const {user,actor}=await pageSession(true);if(actor)redirect('/dashboard')
 return <main className="portal"><header className="topbar"><LocalizedLink className="brand" href="/"><Label text={"◎ VIDYA"}/><span><Label text={"WORKSPACE REGISTRATION"}/></span></LocalizedLink><div className="actions"><span className="role-chip"><Label text={"Signed in"}/></span><SignOutButton/></div></header><div className="onboarding-page"><div className="eyebrow"><Label text={"WELCOME TO VIDYA"}/></div><h1><Label text={"Let’s set up your workspace."}/></h1><p className="muted"><Label text={"Signed in as "}/><Label text={user.email}/><Label text={". Choose the right access for your work."}/></p><OnboardingForm data={registrationData(user.id)}/></div></main>}
