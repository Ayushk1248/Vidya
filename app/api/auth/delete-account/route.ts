import {requestOrigin} from '@/lib/platform/origin'
import {removeDeletedAccountAccess} from '@/lib/platform/account-cleanup.mjs'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseConfiguration } from '@/lib/auth/config'

export async function POST(request:Request) {
  if(request.headers.get('origin')!==requestOrigin(request))return NextResponse.json({error:'Request origin rejected.'},{status:403})
  const cookieStore = await cookies()
  const { url: supabaseUrl, key: supabaseAnonKey } = supabaseConfiguration()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  if (!serviceRoleKey) {
    console.error('[delete-account] SUPABASE_SERVICE_ROLE_KEY is missing from environment')
    return NextResponse.json(
      { error: 'Account deletion is not available. Contact support.' },
      { status: 503 },
    )
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Might not be able to set cookies in some contexts
        }
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('[delete-account] Admin deleteUser error:', deleteError.message)
    return NextResponse.json(
      { error: 'Could not delete account. Please try again or contact support.' },
      { status: 500 },
    )
  }

  removeDeletedAccountAccess(userId)
  await supabase.auth.signOut({scope:'local'})
  cookieStore.delete('vidya-mfa')
  return NextResponse.json({ success: true })
}
