import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfiguration } from '@/lib/auth/config'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  const { url, key: anonKey } = supabaseConfiguration()

  if (!url || !anonKey) {
    return null
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server components may not be able to set cookies in some contexts.
        }
      },
    },
  })
}
