
import {Label,LocalizedLink} from '@/components/language'
import Link from 'next/link'
import { headers } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/auth/config'
import { demoEnabled } from '@/lib/platform/demo.mjs'

export async function AuthAvailability() {
  if (isSupabaseConfigured()) return null
  const demo = demoEnabled((await headers()).get('host') || '')
  return <aside role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <strong><Label text={"Account sign-in needs a project connection"}/></strong>
    <p className="mt-1"><Label text={"Google and email sign-in will be available after this local copy is connected to your Supabase project."}/></p>
    {demo && <p className="mt-3"><LocalizedLink href="/demo" className="font-semibold underline"><Label text={"Explore the local demo →"}/></LocalizedLink><span className="mt-1 block text-xs"><Label text={"Synthetic data only. Demo access does not create a Google account or session."}/></span></p>}
  </aside>
}
