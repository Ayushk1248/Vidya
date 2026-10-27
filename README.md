# VIDYA Â· SIH26263

APAAR-based Student Data Management & Verification prototype. Built with synthetic student and institution data. Not an official AICTE / Government service.

## Test in the browser â€” no role commands

The local site runs at http://localhost:3001. The owner's account identified during setup is already an AICTE Admin. Sign in with that original account and open **Access management**.

For each additional email:

1. Choose Student, Institution, AICTE, or Verifier on the login page.
2. Sign in or create an account using the retained Google/email authentication.
3. Complete the role request, scope and reason. Choosing a portal does not grant privileges.
4. Sign in as the prototype admin and approve it under **Access management**, with a review note.
5. Return to the requesting account and refresh its status. Approved accounts go directly to their workspace on future logins.

Use separate browser profiles for simultaneous accounts, or sign out between accounts in one profile. Institution Heads can approve operators and student links only for their own institution. AICTE Admin can review all six role requests. Revocation and rejection are handled on the website. Self-approval and self-revocation are blocked.

### Suggested synthetic demo

| Account | Role | Scope |
| --- | --- | --- |
| Original account | AICTE Admin | Already activated |
| Another email | Institution Head | INST001 |
| Another email | Institution Operator | INST001 |
| Another email | Regional Officer | North |
| Another email | Student | INST001 / STU00001 |
| Another email | External Verifier | A fictional organisation |

Student STU00001 uses mock APAAR `990000000001`. After its account is approved, the verifier can request academic details using this ID. The student approves selected fields or rejects the request. The verifier sees only approved fields, until expiry (24 hours after request creation) or revocation. Reports and ordinary record lists mask APAAR. No contact columns are exposed through consent.

## What works now

- White/navy/teal landing page with audience portals, workflow explanation and synthetic dataset overview.
- Retained Google/email authentication, account recovery and logout with VIDYA styling, accessible labels and password visibility controls.
- Role registration, request tracking, scoped approvals/rejection, review history, active accounts and revocation.
- National, regional, institution, student and verifier overviews, populated from actual seeded or live workflow data.
- Four-year enrolment chart, capacity snapshot, format-only APAAR coverage, region totals and over-intake program indicators.
- Searchable institution directory with region/state filters and program/student drill-down.
- Masked, paginated student records and approved program/year master.
- Scoped CSV intake exports.
- Ed25519-signed academic records, QR certificates, authorised PDF downloads, public status/PDF integrity checks, and audited revocation.
- CSV/XLSX Upload Centre, background parsing, V01–V14 rules, field provenance and row corrections.
- Head sign-off with a demonstration OTP, correction reasons, preserved record versions and daily duplicate scans.
- Admin rule/cap settings and live submission counts on dashboards.
- Isolation Forest Anomaly Centre with peer baselines, scoped evidence, review notes, Cleared/Confirmed decisions, stale-snapshot protection and dashboard risk counts.
- Student consent request, field selection, approve/reject/revoke, expiry enforcement and verifier result access.
- Hash-linked activity events for access and consent actions. Full audit administration is still pending.

The dashboard's APAAR format metric does not imply registry confirmation. Capacity indicators are SQL comparisons, not the full V01â€“V14 engine or ML risk scores. Seeded signed-off/edit flags are historical synthetic fixtures, not live sign-off evidence.

## Still to build

Bulk Excel/CSV upload, background parsing, Python validation adapter and V01â€“V14 engine, fix-in-place and Head sign-off, immutable record versions, nightly duplicates, India map/submission tracker, Isolation Forest/Anomaly Centre, Ed25519/QR/public checks, certificates, PDF/XLSX reports, full audit hardening and MFA/OTP. English/Hindi toggle is also pending.

## Run or restart locally

The agent leaves the current development server running for testing. If the machine restarts:

```powershell
cd C:\SIH26263
npm run dev
```

No commands are needed for normal account registration or approval. The original CLI role-assignment script remains an optional local recovery utility, not the user flow. `scripts/activate-owner.mjs` is a one-time, explicitly authorised owner bootstrap; it never promotes the first arbitrary user.

## Validation

```powershell
npm test
npm run typecheck
npm run build
```

21 tests cover original auth service preservation, seeded counts, institution/region/student scope, encryption tamper detection, exact intake fixture, approval permissions, student linking, consent field filtering, rejection/revocation/expiry, rate limits, and hash-chain tampering. New workflow tests use an isolated temporary database, not the application's accounts or records.

## Stack and data

Next.js 16, React 19, TypeScript, Tailwind 4, original Supabase Auth, local SQLite via Node 24.9+. Python Faker (`en_IN`) creates the synthetic seed. FastAPI validation/ML is reserved for the next build phase.

- 100 institutions, 300 programs, 1,200 program/year approvals.
- 5,000 students and mock registry IDs; 20,000 annual enrolments across 2023â€“2026.
- V01â€“V14 labelled fixtures and four institutions with anomalous patterns for later rule/ML tests.
- Emails use `example.invalid`; synthetic contact values are non-operational. Mock IDs are never sent to an official registry.
- Scheme caps and region assignments are illustrative configuration, not authoritative AICTE policy.

Server-side roles come from the database, never user-editable metadata or portal selection. Contact and account-email columns use AES-256-GCM; shared-mobile matching uses keyed HMAC. APIs enforce role scope, approved consent fields and expiry. Mutation endpoints check origin and rate-limit by verified user; verification requests have an additional rate limit. Authentication remains direct to Supabase and uses its configured rate limits.

Keep `.env.local` and `data/platform.sqlite` private and back them up together. The local encryption key is necessary to decrypt contact data. Existing Supabase redirect settings must include the localhost origin/port used for Google and email links.

## Fresh installation

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-seed.txt
# Configure Supabase in .env.local using .env.example.
npm run init
npm run seed
npm run dev
```

Seed is transactional and does not replace an existing database. Schema versions 1â€“2 add tables without deleting existing records.

Upload workflow testing: see [UPLOAD_TESTING.md](UPLOAD_TESTING.md). The development command starts Next.js, FastAPI and the upload worker together. On a new machine, install `requirements-validation.txt` in the Python `.venv` and run `npm run init` once.

Anomaly Centre testing and model assumptions: [docs/ANOMALY_TESTING.md](docs/ANOMALY_TESTING.md). Teammate research brief: [docs/ANOMALY_RESEARCH_BRIEF.md](docs/ANOMALY_RESEARCH_BRIEF.md).

Certificate workflow and QR limitations: [docs/CERTIFICATES_TESTING.md](docs/CERTIFICATES_TESTING.md). Public checker: `/verify`; authenticated centre: `/certificates`.


Reports: `/reports` supports scoped Excel/PDF exports. See [report checks](docs/REPORTS_TESTING.md) and the [completed feature checklist and deployment requirements](docs/PROTOTYPE_STATUS.md). After `npm run build`, `npm start` launches Next, FastAPI and both background workers together.
