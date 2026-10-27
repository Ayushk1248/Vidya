# Reference feature merge

The supplied APAAR-Setu HTML was reviewed as reference code. VIDYA's existing layout, branding, database, access controls, validation, consent, anomaly engine and certificate implementation are retained.

## Added features

- Reports now have a database-backed live preview, refresh timestamp, manual refresh and pausable 20-second polling. Polling pauses when the tab is hidden. Existing CSV/XLSX/PDF links continue to export the latest database state within the signed-in account's scope.
- Upload validation now supports search by name, Student ID, program and masked APAAR, with combined row-status, rule and severity filters.
- Filtered validation CSV downloads include all matching rows across pages, validation findings and masked identifiers. Exports exclude mobile numbers, email, passport and parent names, are audited, and protect spreadsheet cells from formula execution.
- Batch summary counters and a linked seven-stage record journey are additive components styled to match the original interface.
- CSV/XLSX import understands `apaar_id`, `student_name`, `date_of_birth`, `program_code`, `seat_type` and `passport_no` aliases. `Within Intake`, `Supernumerary-TFW` and `Indian` values are normalized. Quoted commas and line breaks use the existing real CSV parser.

Reference files must include `student_id` and valid program codes from the institution master. The reference's sample template omits Student ID, so add it or use VIDYA's downloadable template. Imports do not invent academic identities or insert unknown APAAR IDs into the registry. An academic_year column must match the selected upload year.

## Already present and reused

Role access, bulk and single-student intake, V01–V14 checks, fuzzy matching, pending APAAR, independent scheme caps, Head sign-off, version history, officer cases, actual Isolation Forest scoring, consent, Ed25519 certificates, QR/PDF integrity checks, audit checkpoints, report types and language switching already exist. These workflows were not duplicated.

The reference's browser-only role selector, arithmetic risk-score simulator, automatic registry insertion and visual “passed” test labels do not replace real authentication, model execution, identity checks or test evidence.

## Dashboard error correction

The SQLite aggregate row used for registry summary has a null prototype. It is now copied into a plain object before being passed to the interactive dashboard. A regression test recursively checks all dashboard props for AICTE Admin, Regional Officer and Institution Head.

Local source remains uncommitted and unpushed. Any future push requires an explicit request and reconfirmation.

## Verification

46 Node tests and 18 Python tests passed (64 total). TypeScript, production build and lint completed; lint retains advisory warnings but no errors. Live HTTP checks verified all three repaired dashboards, scoped previews, filtered masked CSV downloads and reference-header parsing. AICTE Admin and Regional Officer views were inspected in the browser.
