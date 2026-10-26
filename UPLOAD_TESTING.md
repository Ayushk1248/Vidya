# Upload and Head sign-off

Start all components with one command from `C:\SIH26263`: `npm run dev`.
Open http://localhost:3001/uploads. Authentication and existing role approval are unchanged.

1. Use an Institution Operator account assigned to an institution (e.g. INST007).
2. Download its CSV or Excel template. Only synthetic records are permitted. Templates update existing draft records and can have planted errors to correct.
3. Upload, watch the background status, filter errors, and use **Fix row**. Identity fields show their source individually. V13 defaults to a warning because the seeded September deadline has passed.
4. Submit when errors are zero. Sign in with a different Institution Head account scoped to the same institution, open the batch, request the mock OTP and confirm sign-off.
5. As Operator, create a correction with a reason. The original signed batch remains viewable; revalidation and fresh Head approval are required.
6. AICTE Admin can configure rule severity, matching threshold and scheme caps, or run duplicate scanning from Upload Centre. V01/V02/V03/V12 remain mandatory. The worker scans duplicates at startup if due, then daily while running.

Tests: `npm test`, `npm run test:validation`, `npm run typecheck`, `npm run build`.
The 500-row acceptance test uses an isolated institution with 600 seats; the normal seed intentionally retains its 60-seat program caps.
The Python service binds only to localhost and requires an internal token. File contents and sensitive columns are encrypted at rest. Nothing connects to a real APAAR registry.

Remaining separate phases: ML anomaly detection/review, signed QR certificates/public verification, PDF/Excel reports, and full acceptance coverage for those phases.
