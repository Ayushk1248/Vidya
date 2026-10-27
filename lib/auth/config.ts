// Direct env references are required for Next.js browser bundling.
export function supabaseConfiguration() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export function isSupabaseConfigured() {
  const { url, key } = supabaseConfiguration()
  return Boolean(url && key)
}

export function authErrorMessage(code: string) {
  const messages: Record<string, string> = {
    auth_not_configured: 'Account sign-in is not connected to this local copy yet.',
    google_not_enabled: 'Your project is connected. Enable the Google provider in Supabase to use Google sign-in.',
    google_unavailable: 'Google sign-in could not start. Check the project connection and Google provider settings, then try again.',
    google_cancelled: 'Google sign-in was cancelled or declined. You can try again.',
    missing_auth_code: 'This sign-in link is incomplete. Please start Google sign-in again.',
    auth_exchange_failed: 'This sign-in link expired or could not be verified. Please start Google sign-in again.',
  }
  return messages[code] || (code ? 'Sign-in could not be completed. Please try again.' : '')
}
