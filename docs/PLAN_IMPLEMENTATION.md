# SIH26263 implementation and demonstration

All implementation in this checkout is local. Do not push or publish it without an explicit user request followed by reconfirmation of the changes and destination branch.

## Start the demonstration

From the repository folder on Windows:

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-validation.txt -r requirements-seed.txt
npm run init
node --env-file=.env.local scripts/setup-demo.mjs
npm run dev
```

Open http://127.0.0.1:3001/demo. Eight role cards use signed, expiring, HTTP-only local demo sessions. Demo switching requires `VIDYA_DEMO_MODE=1`, a localhost host and a non-production process. Real Supabase accounts use the original authentication services; privileged accounts additionally require TOTP MFA. Do not expose the development server publicly.

The local review environment uses validation port 8101 because port 8001 was already occupied. Set `VALIDATION_SERVICE_URL` to choose a different port. The launcher starts Next.js, FastAPI and four background workers: uploads, anomaly scoring, notifications/report delivery and identity rechecks.

## Coverage against the detailed plan

| Module | Implementation |
| --- | --- |
| M1 master | Institution/program/year master, configurable scheme caps, admission start/end and upload deadline in administration. AICTE master data is synthetic. |
| M2 upload | CSV/XLSX templates with dropdowns, background parsing, row findings, single-student entry, fixes, operator submission, Head OTP sign-off, correction reason and encrypted versions. Extended gender, year of study, lateral admission, separate social/NRI/OCI/FN fields, lifecycle status/date and pending-APAAR fields. |
| M3 identity | Mock registry adapter, 12-digit format, fuzzy name/exact DOB check, provenance, pending exception with reason and a deadline within 90 days, background daily identity rechecks. |
| M4 rules | V01–V14, four severity levels, critical review cases, separate within-intake/scheme calculations, configurable matching threshold, admission windows, lifecycle-aware duplicate scanning. Identity format/existence and unapproved programs remain blocking. |
| M5 anomalies | Isolation Forest, state/type/capacity peers with explicit fallbacks, eight signals, three reasons, human clear/confirm workflow, stale snapshot protection. |
| M6 dashboards | Existing map, geographic drill-down, year filters, capacity, submission/deadline tracker and scoped risk data. Additional category/type/level filters are available in Reports. |
| M7 consent | Verified role access, purpose/field selection, student in-app notification, approve/reject/revoke, expiry and scoped result. Students can request record corrections. |
| M8 credentials | Scoped Head/awarding-body issuance, Ed25519 signatures, certificate PDF with APAAR/Student ID/QR, minimal public verification, actual PDF fingerprint check, revocation. |
| M9 reports | Intake, excess admissions, APAAR coverage/pending, categories/schemes, compliance and anomalies; scoped filters and CSV/XLSX/PDF export; cancellable monthly email schedules. |
| M10 governance | Eight roles, institution/region/student scope, field encryption and masking, real-account TOTP MFA/recovery codes, hash-chain checks, signed journal checkpoints, retention policy, notification templates, encrypted backup command. |
| M11 APIs | Institution-scoped API keys and OAuth2 client-credential bearer tokens, immediate revocation, upload/program/record/mock-registry endpoints, OpenAPI reference, signed/retried HTTPS webhooks with host allowlist and pinned public DNS resolution. |

Hindi/English switching covers shared navigation, demo introduction, common headings and primary controls. Technical diagnostics, field codes and some detailed explanatory copy remain English. The browser retains the language preference.

## Demonstration sequence

1. Operator: download a template and upload it. Inspect findings, fix errors and submit.
2. Head: review the batch and request a demonstration OTP. Sign off. The mock OTP is visible only in explicit local demo mode; real-account sign-off requires configured SMTP delivery.
3. AICTE: explore the map, review anomalies and queries, adjust policy/deadlines and download reports.
4. Verifier: request fields for synthetic APAAR `990000000001` and explain the purpose.
5. Student: approve a subset or reject. Return as verifier to see only the approved fields. Revoke and confirm access stops.
6. Head or awarding body: issue a certificate for a newly signed record. Open its public check; select the PDF to verify its fingerprint.
7. Technical administrator: inspect service readiness and delivery status. Student-record APIs remain inaccessible.

## External configuration and production boundaries

- Supabase URL/anon key are not present in this public clone. Configure the existing project locally for real account sign-in. Never commit `.env.local`.
- APAAR/AICTE/DigiLocker connections intentionally use mock data. Official access requires authorization; no live registry verification is claimed.
- SMTP credentials and a webhook hostname allowlist are required for outbound delivery. Without SMTP, messages remain queued. Synthetic `example.invalid` addresses are never sent real email. SMS delivery is not connected.
- This is a local SQLite prototype with database-backed workers. The plan's national-scale PostgreSQL/Redis architecture, managed deployment, monitoring and security review remain production work. No national-scale performance or legal-compliance certification is claimed.
- Store downloaded audit checkpoints independently and configure a separate `AUDIT_CHECKPOINT_KEY`. Local journals protect against database edits/removal, not a complete host compromise.
- Set a separate `BACKUP_PASSPHRASE` (16+ characters), then run `npm run backup`. The encrypted file includes a consistent SQLite snapshot and private environment, and is written under ignored `data/backups/`. Keep the passphrase separately. Verify restoration before relying on a backup operationally.
- W3C credential export and DigiLocker issuance are future integrations in the source plan.

## Validation

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:validation`. The additional plan-completion tests cover session tampering, TOTP vectors/replay/recovery, revoked integration credentials, report scope, officer cases, notifications, encrypted demographic data, legacy schema migration and removal of an audit suffix pinned by a separate checkpoint.

The local HTTP demonstration has exercised upload → validation → Head sign-off → signed certificate → public Valid check, eight role entry points and CSV/XLSX/PDF exports. Live external provider delivery is not testable without credentials.

### Recorded local verification

- 41 Node tests and 14 Python tests passed (55 total); affected dashboard/migration/security tests were also rechecked after final fixes.
- TypeScript and the production build passed. ESLint completed with zero errors; existing advisory warnings remain.
- HTTP acceptance checks passed for upload/sign-off/certificate validity, all role entry points, three export formats, consent field minimisation/revocation, scoped API-key/OAuth credentials and signed audit checkpoints.
- Hindi switching and the demo/report screens were inspected in the browser. The exported PDF was rendered and visually checked.
- Source remains uncommitted and unpushed for joint review.

### Reference merge update

The later CSV/live-preview feature merge and dashboard serialization fix are documented in [REFERENCE_MERGE.md](REFERENCE_MERGE.md). The latest regression run passed 64 tests.
