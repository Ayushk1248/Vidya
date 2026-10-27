# Combined implementation

This implementation combines the collaborator commit `ee8970f` (Almost last change) with the local APAAR workflow implementation. The merge was resolved in an isolated checkout before publication.

- Retains the collaborator's enrolment and validation registers, detailed intake columns, native Excel workbooks, Unicode PDF exports, source notes, count-only identity evidence, anomaly review context, student record cards and consent groups.
- Adds college name/ID suggestions, scoped search, live report previews, CSV exports and the additional APAAR/category/compliance reports. Report preview and download filters agree. PDF limits remain stated alongside exports.
- Retains the requested focused role menus, direct role entry, demo role dropdown and contextual role information. These replace the earlier broad navigation groups.
- Uses the visible certificate viewer and inline PDF route instead of placing certificate details below a long table. Issuance, downloads, signature verification and authorized revocation remain scoped.
- Preserves Google/email login and the server-side PKCE callback, MFA for privileged accounts, integration credentials, scheduled notifications, cases, extended student fields and validation improvements.
- Keeps the collaborator's production launcher and adds the newer workers, configurable validation port and loopback development binding. The startup health wait allows a slower Python initialization.

Supabase/Google/SMTP secrets, `.env.local`, databases, node_modules, virtual environments and local comparison copies are excluded from Git. Each collaborator configures their own ignored environment file. Google OAuth secrets belong in the Supabase provider configuration.

## Verification

The combined code passed 57 Node tests and 18 Python tests. The production build and TypeScript checks also run before publication. Existing non-blocking lint warnings are recorded separately; merge-introduced lint errors are repaired.

The two report APIs use the same scoped search implementation. The original four register reports remain available alongside the newer report types. CSV and Excel retain all matching exported rows; PDF exports explicitly disclose their 1,000-row and cell-length limits.