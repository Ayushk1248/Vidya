# SIH26263 prototype completion and deployment

The planned functional prototype modules are implemented:

- Institution/program/year approvals and separate supernumerary caps.
- Six scoped roles with reviewed access requests and retained Google/email authentication.
- Background CSV/Excel uploads, row corrections, mock APAAR adapter, configurable V01-V14 rules, Head demonstration OTP sign-off, reasoned revisions and version comparisons.
- National/regional/institution dashboards, illustrative India map, drill-down, capacity and deadline/submission tracker.
- Isolation Forest risk scoring, peer comparison, plain-English reasons and officer review.
- Student-controlled selected-field consent, rejection/revocation and expiry.
- Ed25519 record signing, private certificate PDFs, QR links and public Valid/Tampered/Revoked checks.
- Hash-chained audit, integrity check, searchable/filterable paginated history.
- Scoped enrolment/intake/validation/anomaly Excel and PDF reports.

## Remaining release work (not additional prototype features)

1. Choose a public host/domain. The server must support persistent Node + Python processes and persistent SQLite disk. Keep validation on localhost. Serverless-only hosting is not sufficient for this architecture.
2. Install dependencies (`npm ci`; Python requirements-seed.txt and requirements-validation.txt in `.venv`). Preserve the database and PLATFORM_ENCRYPTION_KEY together; also preserve `.env.local` or equivalent server environment settings. Do not reset/seed over an existing database.
3. Run `npm run build`, then `npm start`. The production launcher starts Next, validation and both workers together on port 3001 by default. Configure a process manager to restart it after a machine reboot. The workers need to remain running for scheduled scans.
4. Put an HTTPS reverse proxy in front of port 3001. Configure PLATFORM_PUBLIC_ORIGIN to that public origin, Supabase allowed redirect URLs/Site URL, and the deployed OAuth configuration. Supabase handles authentication throttling; review its production Auth rate limits in the project dashboard.
5. Issue new certificates using the public origin. Previously issued localhost QR links remain stored with their original URL; phones cannot resolve a PC's localhost. Revoke/replace old certificates through a newly approved record version if needed.
6. Run a final real-browser demonstration using the six approved test accounts, including phone QR access. Automated tests use isolated synthetic fixtures and do not establish that external OAuth/SMTP/hosting is configured correctly.

## Deliberate limits

Only synthetic data and a mock registry are supported. Map boundaries are illustrative. Mock OTP is for a prototype. Excel/PDF export limits are documented in REPORTS_TESTING.md. The audit chain detects stored edits/interior deletions, but an independent checkpoint is needed to prove suffix deletion or complete chain rewriting did not happen. Hindi translation and real AICTE/APAAR integration were optional/future scope and are not implemented. No public hosting has been configured or charged for in this task.

A finite feature checklist can be complete; a production system will still need maintenance, accessibility/security review, backups and policy updates. This document does not claim production certification or a real government integration.
