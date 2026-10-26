# Signed certificates and public checks

Start the full platform with `npm run dev` in `C:\SIH26263`. Open http://localhost:3001/certificates.

## Issue and download

1. An Institution Operator uploads synthetic rows, resolves validation errors and submits the batch.
2. The matching Institution Head completes sign-off in Upload Centre. Historical seeded `signed_off` flags alone are not eligible; a live approved record-version snapshot is required.
3. As that Institution Head, open Certificates, select the academic year and click **Issue certificate** for an eligible record. Issuance rechecks the approved snapshot and version before storing anything.
4. Open the issued item and download its PDF. The student linked to that record can download it from **My certificates**. Other institutions and External Verifiers cannot download it. Heads, operators, regional officers and AICTE Admin are limited by their established record scope.
5. The PDF contains the full synthetic APAAR ID and Student ID, institution/program/year, record version, Ed25519 record signature and QR link. Ordinary screens mask APAAR.

## Public verification

Visit `/verify` and enter a certificate reference, or open the QR link. No login is required. The checker exposes only the reference, institution, year/version, dates and integrity status — never student name, DOB, APAAR, email, mobile, passport or the signed payload.

- **Valid**: Ed25519 signature verifies and current data still matches the approved signed snapshot.
- **Tampered**: signed content/signature fails, the current approved record differs, or a selected PDF differs from the original bytes. A legitimate approved correction also makes the old certificate show Tampered with an explanatory changed-record message; issue a new certificate for the new version.
- **Revoked**: the Institution Head or AICTE Admin revoked it with a recorded reason. Revocation takes precedence over other statuses and cannot be undone. A replacement needs a freshly approved record version.

A QR alone checks the server record, not the surrounding paper/PDF. On the check page, choose the actual PDF to check the file. SHA-256 is calculated in the browser and only the digest is sent. The file contents stay local. This is an Ed25519-signed record plus an online PDF fingerprint check, not an Adobe/PAdES digital PDF signature or an official government credential.

## Demonstrate the acceptance cases

1. Issue after sign-off and check: Valid.
2. Complete a name correction with a new Head-approved version: the old QR shows Tampered (record changed). Issue the replacement version: Valid.
3. Alternatively edit text in a downloaded PDF while retaining its QR. Select that edited PDF on the public checker: Tampered. Merely opening its copied QR still checks only the original server record, as explained on-screen.
4. Revoke a valid certificate with a reason: the same QR shows Revoked. New downloads are blocked.
5. Sign in with another institution or an unrelated student: the private certificate APIs reject access.

Tests use a separate database and exercise all these cases, concurrent duplicate issuance, private-key persistence, protected fields, encryption at rest and verification rate limits. They never create fake approvals in the live database.

## Local QR URLs and keys

`PLATFORM_PUBLIC_ORIGIN` defaults to `http://localhost:3001`. That QR is for this computer. Before issuing shareable certificates on a deployed server, set it to the actual HTTPS origin and restart. Existing certificate URLs remain the URL they were issued with. Changing this value does not retroactively rewrite signed PDFs.

Ed25519 private keys, signed payloads and PDF bytes are stored encrypted under `PLATFORM_ENCRYPTION_KEY` in the local SQLite database. Back up the database and existing encryption key together. Losing either prevents verification/issuance recovery. There is no key-rotation interface in this prototype.

Public verification is globally limited to 180 requests/minute and 30/minute per certificate; issuance and authenticated downloads also have limits. Request bodies for PDF fingerprints are capped at 500 bytes. Public status responses are not cached.

## Checks

- `npm test`: full app regression suite, including `tests/certificates.test.mjs`.
- `npm run typecheck` and `npm run build`.
- PDF QA: render the isolated synthetic test PDF with Poppler, inspect layout, extract APAAR/Student ID, and decode the QR from the rendered page with jsQR.

The certificate font is bundled with its embedded licence in `assets/fonts`. Unsupported characters or overflowing fields cause a clear issuance error rather than silently losing text.
