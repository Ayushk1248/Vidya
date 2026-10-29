# VIDYA presentation redesign

Presentation-only changes: white surfaces with navy/teal accents, local Geist font, responsive workspace chrome, page search, role-aware guide, workflow stages, truthful counters, state map shading, risk rings, consent layout, certificate viewer/checker states, audit chain summary and reduced-motion support. Authentication, API contracts, business logic and database schemas were preserved.

## Dependencies

- geist: 1.8.2
- framer-motion: 14.7.1

## Changed files

- `package.json`
- `package-lock.json`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/premium.css`
- `components/presentation.tsx`
- `components/workspace-chrome.tsx`
- `components/workspace-shell.tsx`
- `components/auth-shell.tsx`
- `components/upload-centre.tsx`
- `components/national-explorer.tsx`
- `components/anomaly-centre.tsx`
- `components/consent-workspace.tsx`
- `components/certificate-centre.tsx`
- `components/public-certificate-check.tsx`
- `components/audit-integrity.tsx`
- `lib/platform/india-states.json`

## Deliberate adaptations

- Existing Google/email login retained; no new login OTP contract.
- Validation uses real batch snapshots, not simulated live per-rule progress.
- No full APAAR reveal or fabricated registry provenance. Consent fields remain institution-submitted where the API provides no registry provenance.
- Certificate status remains authoritative; no fake Valid/Tampered demo switch. Printable PDF/signature content is unchanged.
- Audit visualization uses actual checked-event counts; hashes unavailable from the endpoint are not invented.
- Map geometry is illustrative Natural Earth public-domain data, not an official boundary reference.

## Validation

Build passed after each implementation pass. Interactive synthetic preview checked sidebar collapse, page-search keyboard shortcut, guide keyboard activation, map drill-down, a 390px consent viewport (no horizontal overflow). Login checked in the running site. Temporary preview removed after verification.

Existing regression suite: 56/57 passed. Default run requires SMTP for upload sign-off; a test-only mock-OTP rerun instead failed the upload test assertion at tests/uploads.test.mjs:18 (expected bad-batch errors, received zero). No backend or test files were changed to suppress this failure.

## Follow-up: workspace crash and white theme

The workspace shell now projects native SQLite role rows to a plain object before the client boundary. A regression test covers all eight roles, null scopes, preserved authorization values and exclusion of unneeded server fields. The dark preference and toggle were removed; existing stored dark preferences are cleared. Sidebar, page and login presentation use the white theme. Focused boundary, access, dashboard and OAuth checks: 22 passed. An isolated Next.js reproduction with a native SQLite actor renders the security component without the serialization error.
