// Keep provider errors and authorization codes out of public redirects and logs.
const loginError = code => `/login?error=${code}`;

export function oauthOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  // Next dev can normalize request.url to localhost even when visited via 127.0.0.1.
  // Restore only loopback hosts; never trust an arbitrary forwarded host.
  if (['localhost', '127.0.0.1'].includes(url.hostname) && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) url.host = host;
  return url.origin;
}

export async function startGoogleOAuth(client, origin, administrator=false) {
  if (!client) return loginError('auth_not_configured');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback${administrator?'?administrator=1':''}`,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error || !data?.url) return loginError('google_unavailable');
  return data.url;
}

export async function finishGoogleOAuth(client, callbackUrl) {
  const url = new URL(callbackUrl);
  if (url.searchParams.has('error')) return loginError('google_cancelled');
  const code = url.searchParams.get('code');
  if (!code) return loginError('missing_auth_code');
  if (!client) return loginError('auth_not_configured');
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return loginError('auth_exchange_failed');
  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data?.user) return loginError('auth_exchange_failed');
  if (url.searchParams.get('administrator')==='1') return '/administrator';
  if (!data.user.user_metadata?.username) return '/setup-profile';
  return '/login/success?next=%2Fdashboard';
}
