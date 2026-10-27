import Link from 'next/link'
import { headers } from 'next/headers'
import { demoEnabled } from '@/lib/platform/demo.mjs'
import { LanguageToggle } from '@/components/language'
import { RoleControls } from '@/components/role-controls'
export const dynamic = 'force-dynamic'
export default async function Demo() {
  const enabled = demoEnabled((await headers()).get('host') || '')
  return <main className="portal"><header className="topbar"><Link className="brand" href="/">◎ VIDYA<span>STUDENT DATA PLATFORM</span></Link><LanguageToggle/></header>
    <section className="demo-entry card"><div className="eyebrow">LOCAL DEMONSTRATION</div><h1>Choose your workspace.</h1><p>Select a role to begin. Use the circled information button to see what that role can do.</p>
      {enabled ? <RoleControls role="institution_operator" demo entry/> : <p>Local role switching is unavailable.</p>}
      <p className="small muted">Synthetic data only · No official registry access</p>
    </section>
  </main>
}