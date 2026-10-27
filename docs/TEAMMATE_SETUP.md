# Share VIDYA with a teammate

## Open the shared website

Use a hosted deployment URL if you want the same records, role approvals and database. `localhost:3001` always refers to the computer opening it. A clone shares Supabase sign-ins but uses its own local SQLite database and role assignments; approvals made on one machine do not appear on the other. No Supabase SQL paste is needed for the local application tables.

## Run a cloned copy

Create `.env.local` in the repository root (these two values are public browser configuration):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://rafipzvzxmpjebmtsfeb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_IjN8PjiguJe91CU5wukqWQ_ZLpcmbHb
PLATFORM_PUBLIC_ORIGIN=http://localhost:3001
VIDYA_DEMO_MODE=0
```

Install dependencies and initialize local synthetic data:

```powershell
npm install
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-validation.txt
npm run init
npm run seed
npm run dev
```

Use http://localhost:3001 consistently. Create/sign in with a separate email, then register your intended role. An approved administrator in THIS local database must approve it. If the clone has no administrator yet, the repository owner must explicitly designate one trusted developer for that copy; public signup cannot create AICTE administrators. After that person signs in, the owner can run `npm run role -- <verified-Supabase-user-UUID> aicte_admin` once in that local copy. Subsequent requests and staff assignments use Access management in the website. The existing local synthetic demo is a separate optional developer setup, not a production permission mechanism.

## Supabase dashboard setup (project owner, once)

Authentication → URL Configuration: Site URL `http://localhost:3001`. Add these development Redirect URLs once:

- `http://localhost:3001/**`
- `http://127.0.0.1:3001/**` (only if testing the numeric loopback address)

Everyone using the same localhost port can use these entries; no entry per teammate is necessary. Use exact deployment callback URLs for production. Keep the Google provider enabled with its client ID/secret configured in Supabase. Google Cloud's authorized redirect URI is `https://rafipzvzxmpjebmtsfeb.supabase.co/auth/v1/callback`; each teammate does not need a separate Google client.

Sources: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Do not share the secret/service-role key, Google client secret, encryption key, MFA secrets or your complete `.env.local`. Login needs only the public configuration above. Deletion requires a server-only `SUPABASE_SERVICE_ROLE_KEY` on the trusted server; it is not required for a teammate to sign in. SMTP/OTP sign-off needs its own server configuration.
