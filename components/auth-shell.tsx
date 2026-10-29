
import {LocalizedLink,Label} from '@/components/language'
import {LanguageToggle} from './language'
import { AuthAvailability } from '@/components/auth-availability'
import Link from 'next/link'
import { ShieldCheck, Building2, GraduationCap } from 'lucide-react'
export function AuthShell({children}:{children:React.ReactNode}) {
 return <div className="portal auth-shell">
<header className="topbar">
<LocalizedLink className="brand" href="/"><Label text={"◎ VIDYA"}/><span><Label text={"STUDENT DATA PLATFORM"}/></span>
</LocalizedLink>
<div className="actions">
<LanguageToggle/>
<LocalizedLink className="auth-home" href="/"><Label text={"← Back to home"}/></LocalizedLink>
</div>
</header>
<main className="auth-layout">
<aside className="auth-intro premium-auth-intro">
<div className="auth-mesh" aria-hidden="true"/>
<div className="auth-editorial">
<div className="auth-tag"><Label text={"TEAM BYTERS "}/><span>/</span><Label text={"SIH26263"}/></div>
<h2><Label text={"One student identity."}/><br/>
<em><Label text={"Verified with consent."}/></em>
</h2>
<p className="auth-hindi" lang="hi">एक पहचान। सुरक्षित भविष्य।</p>
<p className="auth-lead"><Label text={"A connected academic record, from institution submission to student-approved verification."}/></p>
<div className="auth-proof-grid">
<div>
<ShieldCheck size={19}/>
<strong>5,000</strong>
<span><Label text={"synthetic registry identities"}/></span>
</div>
<div>
<Building2 size={19}/>
<strong>14</strong>
<span><Label text={"configurable validation rules"}/></span>
</div>
<div className="auth-proof-wide">
<GraduationCap size={21}/>
<div>
<strong><Label text={"Every record has a journey."}/></strong>
<span><Label text={"Scoped access · Head review · Student consent"}/></span>
</div>
</div>
</div>
<div className="auth-prototype">
<i/><Label text={"SYNTHETIC PROTOTYPE · NO LIVE REGISTRY CONNECTION"}/></div>
</div>
</aside>
<section className="auth-panel" aria-label="Account access">
<AuthAvailability/>{children}</section>
</main>
<footer className="auth-footer">
<Label text={"VIDYA · APAAR-based student data management"}/>
<span>
<Label text={"Mock AICTE approvals · No live registry connection"}/>
</span>
</footer>
</div>
}
