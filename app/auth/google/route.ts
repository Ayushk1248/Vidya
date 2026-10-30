import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { startGoogleOAuth, oauthOrigin } from '@/lib/auth/oauth-flow.mjs'
import { supabaseConfiguration } from '@/lib/auth/config'

export async function GET(request: Request) {
  const administrator=new URL(request.url).searchParams.get('administrator')==='1'
  const origin = oauthOrigin(request)
  let destination: string
  try {
    const { url, key } = supabaseConfiguration()
    if (url && key) {
      const settings = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(8000),
      })
      if (!settings.ok) throw new Error('Provider settings unavailable')
      if (!(await settings.json()).external?.google) {
        const response = NextResponse.redirect(new URL((administrator?'/administrator/sign-in':'/login')+'?error=google_not_enabled', origin))
        response.headers.set('Cache-Control', 'private, no-store')
        return response
      }
    }
    destination = await startGoogleOAuth(await createSupabaseServerClient(), origin,administrator)
  } catch {
    destination = '/login?error=google_unavailable'
  }
  if(administrator&&destination.startsWith('/login?'))destination=destination.replace('/login?','/administrator/sign-in?')
  const response = NextResponse.redirect(new URL(destination, origin))
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
