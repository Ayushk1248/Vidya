import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { finishGoogleOAuth, oauthOrigin } from '@/lib/auth/oauth-flow.mjs'

export async function GET(request: Request) {
  let destination: string
  try {
    destination = await finishGoogleOAuth(await createSupabaseServerClient(), request.url)
  } catch {
    destination = '/login?error=auth_exchange_failed'
  }
  if(new URL(request.url).searchParams.get('administrator')==='1'&&destination.startsWith('/login?'))destination=destination.replace('/login?','/administrator/sign-in?')
  const response = NextResponse.redirect(new URL(destination, oauthOrigin(request)))
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
