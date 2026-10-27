import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfiguration } from '@/lib/auth/config'

export function createSupabaseBrowserClient() {
  const { url, key: anonKey } = supabaseConfiguration()

  if (!url || !anonKey) {
    return null
  }

  return createBrowserClient(url, anonKey)
}

export const supabaseBrowser = createSupabaseBrowserClient()
