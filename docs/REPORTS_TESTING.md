# Reports and exports

Visit `/reports` after signing in as an institution operator/head, regional officer, or AICTE Admin. Students/verifiers continue to use their dedicated records/consent pages.

Choose one of four reports and a seeded academic year. Optionally restrict it to an institution within your scope. Preview shows the first 20 rows; exports query the data again at download time.

- Enrolment: effective submitted values, masked APAAR, program, scheme, status and version. No DOB, mobile, email or passport.
- Intake: each program's approved intake, WITHIN count, positive excess, separately counted supernumerary enrolments, approval and deadline. The 60-seat fixture reports 62 WITHIN, 2 excess and 3 supernumerary.
- Validation: unresolved record-scan findings and encrypted upload-validation snapshots. Grouped flagged-row counts preserve batch references and status, including historical corrections. These are not unique violations or excess seats. Raw messages/details are excluded to prevent accidental identifier disclosure. This does not execute a new validation scan.
- Anomalies: latest completed analysis with score, peer risk band, decision and three reasons. Source timestamp/model and stale/insufficient/no-analysis notes are included.

Excel is a real `.xlsx` workbook with a Read me sheet, frozen column headers, filters, numeric values and text-only handling of formula-like input. Up to 20,000 rows; select one institution if that limit is exceeded. PDF repeats headers, numbers pages and includes up to 1,000 rows; long cell values are limited to 240 characters. Both limits are disclosed on the page and in the file. Exports are rate-limited to five per minute per user and recorded in the audit trail. The original CSV intake URL remains compatible.

Checks: `npm test`, `npm run test:validation`, `npm run build`. Focused report tests use isolated synthetic data, test RBAC and year filters, read generated Excel back, verify formula-like strings remain strings, and load multi-page PDFs. PDF layout has also been rendered for visual checking.
