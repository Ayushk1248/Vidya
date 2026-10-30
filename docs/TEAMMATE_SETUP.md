# Share VIDYA with a teammate

## Open the shared website

Use a hosted deployment URL if you want the same records, role approvals and database. `localhost:3001` always refers to the computer opening it. A clone shares Supabase sign-ins but uses its own local SQLite database and role assignments; approvals made on one machine do not appear on the other. No Supabase SQL paste is needed for the local application tables.

## Run a cloned copy

If you already have a checkout, first save or commit your own changes, then run `git fetch origin` and `git merge origin/master` on your working branch. Avoid resetting your checkout or force-pushing. The combined version preserves the portal tabs, scoped sessions, student consent, access decisions, dataset suggestions and Hindi interface alongside the workspace redesign, staff assignment and account deletion features.

Create `.env.local` in the repository root (these two values are public browser configuration):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://rafipzvzxmpjebmtsfeb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_IjN8PjiguJe91CU5wukqWQ_ZLpcmbHb
PLATFORM_PUBLIC_ORIGIN=http://localhost:3001
VIDYA_DEMO_MODE=0
```

Install dependencies and initialize local synthetic data:

```powershell
npm ci
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-validation.txt -r requirements-seed.txt
npm run init
npm run seed
npm run dev
```

Use http://localhost:3001 consistently. Create/sign in with a separate email, then register your intended role. An approved administrator in THIS local database must approve it. If the clone has no administrator yet, the repository owner must explicitly designate one trusted developer for that copy; public signup cannot create AICTE administrators. After that person signs in, the owner can run `npm run role -- <verified-Supabase-user-UUID> aicte_admin` once in that local copy. Subsequent requests and staff assignments use Access management in the website. The existing local synthetic demo is a separate optional developer setup, not a production permission mechanism.

For the optional local demonstration, set `VIDYA_DEMO_MODE=1` in `.env.local` and run `npm run demo:setup`, then open `/demo`. Each category has its own role session. This setup explicitly restores shared demo fixtures; do not use it to manage real account approvals. Environment files, encryption keys, uploaded files and the local SQLite database are excluded from Git, so pulling code does not copy another developer's records or account approvals.

## Administrator access and role changes

Open `/administrator` using **Sign in as administrator** on the home page, sign-in form or workspace account menu. Use an already approved AICTE Admin account with Google or email sign-in. Selecting this entry never promotes a student or grants a role. If another account is currently signed in, the administrator form can authenticate the approved administrator account; separate browser profiles keep real accounts independent.

In **Access management**, use **Manage roles by email** to search a registered account. The person must have signed in to this local copy at least once. Select **Change role**, choose a role and its institution/region/student scope, enter a reason and explicitly save. Only AICTE Admin can do this. Self changes, invalid student links, duplicate student ownership and stale edits are blocked. Changes are recorded in review history and the audit log; detached student or verifier sharing is revoked. In the localhost prototype with `VIDYA_DEMO_MODE=1`, authenticator verification is optional for signed-in accounts. Outside that development mode, privileged MFA verification remains bound to the assigned role and scope. Existing MFA enrollments remain intact.

The optional localhost-only administrator demo opens in a separate tab and goes directly to the request review page. It keeps the student portal's category session separate. Shared demo role assignments are fixed and excluded from email role editing. The demo does not promote the signed-in Google account. Production requires assigned accounts and MFA.

## Supabase dashboard setup (project owner, once)

Authentication → URL Configuration: Site URL `http://localhost:3001`. Add these development Redirect URLs once:

- `http://localhost:3001/**`
- `http://127.0.0.1:3001/**` (only if testing the numeric loopback address)

Everyone using the same localhost port can use these entries; no entry per teammate is necessary. Use exact deployment callback URLs for production. Keep the Google provider enabled with its client ID/secret configured in Supabase. Google Cloud's authorized redirect URI is `https://rafipzvzxmpjebmtsfeb.supabase.co/auth/v1/callback`; each teammate does not need a separate Google client.

Sources: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Do not share the secret/service-role key, Google client secret, encryption key, MFA secrets or your complete `.env.local`. Login needs only the public configuration above. Deletion requires a server-only `SUPABASE_SERVICE_ROLE_KEY` on the trusted server; it is not required for a teammate to sign in. SMTP/OTP sign-off needs its own server configuration.
