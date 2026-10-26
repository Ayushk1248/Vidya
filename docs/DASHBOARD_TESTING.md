# National dashboard and submission tracker

Run the existing `npm run dev` launcher and visit http://localhost:3001/dashboard. No new service or Supabase migration is needed.

1. Sign in as an AICTE Admin. Select an academic year, then a region, a map state marker, an institution, and a program. The comparison bars and selection totals update together. Breadcrumbs go back one level; Reset view clears geography. Reload preserves the selected drill-down in the URL.
2. Click Open program records. Only that program's records appear, with year/program preserved through pagination. Program names in the approval table also filter records.
3. Compare 2025 and 2026 submission trackers. Each counts all batches for that year (no latest-100 limit), with queued/processing, errors, review, failed and signed batches reflected in status.
4. Search/filter the tracker and paginate. Dates use Asia/Kolkata; the deadline day itself is not overdue. Earliest approved program deadline drives attention; differing end dates are displayed. There is no automatic institution-wide submission declaration: coverage reports current signed record versions with approval snapshots, excluding seeded historical flags. Zero-enrolment institutions are not called complete.
5. Sign in as a Regional Officer: only their region is returned. Institution accounts receive only their institution. Student/verifier dashboards remain unchanged. Manipulating URL filters cannot expand server scope.
6. INST005-P1 has 62 within-intake versus 60 approved seats and 3 TFW separately; selecting this program must show 2 excess within-intake, not 5.

Map: bundled Natural Earth public-domain 1:110m illustrative country outline, with approximate markers for the ten seeded states. It is not an official boundary map. No runtime map service, API key or external data transmission is required. Other states have no synthetic fixtures; absence of a marker is not a national enrolment statistic.

Verification: `npm test`, `npm run typecheck`, `npm run build`. Dashboard tests use isolated temporary databases, including 105 current-year batches, prior-year isolation, India midnight boundary, current-version approval, unapproved capacity, program filtering and access scope.
