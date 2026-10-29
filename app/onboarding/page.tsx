
import {LocalizedLink,Label} from '@/components/language'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {registrationData} from '@/lib/platform/workflows.mjs'
import {OnboardingForm} from '@/components/onboarding-form'
import {SignOutButton} from '@/components/sign-out-button'
export const dynamic='force-dynamic'
export default async function Onboarding(){const {user,actor}=await pageSession(true);if(actor)redirect(workspaceHome(actor.role))
 return <main className="portal">
<header className="topbar">
<LocalizedLink className="brand" href="/">
<Label text={"◎ VIDYA"}/>
<span>
<Label text={"WORKSPACE REGISTRATION"}/>
</span>
</LocalizedLink>
<div className="actions">
<span className="role-chip">
<Label text={"Signed in"}/>
</span>
<SignOutButton/>
</div>
</header>
<div className="onboarding-page">
<div className="eyebrow"><Label text={"WELCOME TO VIDYA"}/></div>
<h1><Label text={"Let’s set up your workspace."}/></h1>
<p className="muted"><Label text={"Signed in as "}/><Label text={user.email}/><Label text={". Choose the right access for your work."}/></p>
<section className="card upload-panel">
<p><Label text={"For AICTE or system staff access, give your administrator this account ID. Staff roles cannot be requested through public registration."}/></p>
<code>{user.id}</code>
<p className="small muted"><Label text={"An existing approved role cannot be changed by choosing a different login portal."}/></p>
</section>
<OnboardingForm data={registrationData(user.id)}/>
<section className="card upload-panel">
<h2><Label text={"Account settings"}/></h2>
<LocalizedLink href="/account"><Label text={"View account or delete account →"}/></LocalizedLink>
</section>
</div>
</main>}
