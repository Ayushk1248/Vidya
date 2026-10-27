# Connect Google sign-in

The supplied Supabase URL and public publishable key are configured in ignored .env.local. Its public authentication settings returned HTTP 200: email enabled, Google disabled. Live Google login cannot complete until the Google OAuth provider and allowed return URLs are configured. The separate `work/Vidya-github` comparison checkout is unchanged.

1. Open https://supabase.com/dashboard and select the existing Vidya project. Use the same project as your collaborator. If it is not listed, the project owner can invite you or supply its public connection values.
2. Click **Connect** and copy the Project URL and Publishable key. Add them to the ignored `Vidya/.env.local`, preserving its existing entries:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   ```

   The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works. Never put a service-role/secret key in a `NEXT_PUBLIC_` setting.
3. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and configure the web OAuth client. Its client secret stays in Supabase, outside this app. Copy the Supabase OAuth callback displayed there into the Google Cloud client's **Authorized redirect URIs**. It normally looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
4. In Supabase **Authentication → URL Configuration**, allow the local app return URL:

   ```text
   http://127.0.0.1:3001/auth/callback
   ```

   If you also use `localhost`, add `http://localhost:3001/auth/callback` separately. Match the address used in the browser. Port 3003 is the comparison viewer, not the OAuth callback.
5. Restart the development server after changing public environment variables. Open http://127.0.0.1:3001/login. Google login opens in a separate tab so it can run outside the comparison iframe.
6. Complete Google login yourself. New users go to profile setup; returning users open their assigned workspace. Signing in does not grant an officer/admin role. Existing role approval and privileged-role MFA still apply.

## Local behavior verified

- The authorization route writes the PKCE verifier through the cookie-backed Supabase server client.
- The callback exchanges the one-use authorization code, verifies the user and writes the session before redirecting.
- Cancellation, missing/expired codes and unavailable configuration return controlled errors without exposing provider details.
- Unconfigured login/signup show a connection notice and disable account sign-in; the explicit local synthetic demo remains available when enabled.
- Tests mock Supabase boundary responses; they do not establish that a live provider/project has been configured.

References: [Supabase SSR setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google), [Redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).
