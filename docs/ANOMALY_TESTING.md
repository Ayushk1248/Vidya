# Anomaly Centre: testing and model notes

Run the entire platform from `C:\SIH26263` with `npm run dev`. The existing login is unchanged. The launcher runs the website, FastAPI validation/ML service, upload worker and anomaly worker. Leave this command running while testing.

## Demonstration

1. Sign in as AICTE Admin and open `/anomalies`. The worker queues initial analysis automatically. Use **Refresh analysis** after changing records or policy.
2. Select academic year 2026. Filter **high** priority and inspect INST001–INST004. The synthetic seed plants unusual growth, intake, edit and mobile-sharing patterns. The model must score them highly without consulting fixture labels or institution IDs.
3. Inspect the top three reasons, all five indicators and peer medians. Follow the scoped student-record link if needed.
4. As an AICTE Admin or Regional Officer with the matching region, enter a note and mark **Cleared**, **Confirmed** or **Reopen**. Confirmed means follow-up required, not a fraud finding.
5. An Institution Operator/Head can see only their institution's results and cannot make review decisions. Students/verifiers cannot open the centre or its API.
6. Change relevant enrolment data or an admin policy value. The prior snapshot is labelled stale and rejects new review decisions. Refresh analysis. Prior notes remain in history; the new case starts open. Refreshing unchanged input reuses its snapshot and retains decisions.
7. Select 2023 to examine absent prior-year baselines. Insufficient cohorts return no score, never a fabricated zero-risk claim.

## Evidence and privacy

- Growth: (current total enrolments − previous total) / previous total. A missing previous year remains unavailable.
- Intake ratio: within-intake enrolments / total approved intake. Supernumerary seats are excluded.
- Unsuccessful APAAR checks: missing, invalid, absent from mock registry, fuzzy-name mismatch or exact-DOB mismatch / enrolment rows. The V04 name threshold is reused.
- Post-sign-off edits: percentage of enrolment rows with at least one edit, not the sum of edit counts.
- Shared mobile: distinct students sharing a supplied mobile within the institution / all distinct enrolled students. Blank contacts are excluded. Node hashes decrypted contact values locally; Python receives hashes only. Neither hashes nor contact values enter anomaly responses.
- Peers exclude the subject and require >=8 eligible institutions. Group fallback and missing-data caveats are displayed. Only aggregate peer baselines are exposed.

## Model

Isolation Forest with 256 trees, random_state=26263, contamination=auto, n_jobs=1. Inputs use peer median/IQR scaling with explicit scale floors and clipping to [-8,8]. Unavailable indicators are imputed to the peer baseline for modelling. Score = clamp((negative score_samples − 0.35) / 0.40 × 100, 0, 100), rounded to one decimal. The transformation and 70/40 priority thresholds are prototype heuristics, not calibrated probabilities or official policy.

Reasons are ranked by how much the raw model score drops when replacing one feature with its peer baseline, then absolute robust deviation. This is a descriptive sensitivity check, not a causal explanation or SHAP attribution. Analyses persist model version, source fingerprint and policy; reviews use optimistic revision checks and the current input fingerprint. Model fitting happens outside DB transactions, with a consistency check before results are stored.

Technical reference: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html

## Verification commands

`npm test` — auth preservation, data scope, uploads, consent and anomaly lifecycle integration tests using isolated databases.

`npm run test:validation` — rule engine and anomaly model unit tests.

`npm run typecheck` and `npm run build` — application compilation.

The browser must use an authenticated role-approved account. Automated service/domain tests do not replace a manual Google sign-in check.

## Research follow-up

See ANOMALY_RESEARCH_BRIEF.md for a teammate task on peer validity, false positives, fair evaluation and legitimate explanations. Model policies should be revised against that evidence before any real-data deployment.


## APAAR evidence display

Inspect a case to see three separate evidence groups: current format/registry counts; saved name/DOB disagreements (unsuccessful snapshot checks minus snapshot rows without a registry match); and current repeated-ID counts. Current counters use effective corrected enrolment values and the selected academic year. Cross-institution counts disclose only how many own records have an ID present elsewhere. They do not establish overlapping attendance or duplicate people. Current counts can overlap and are not added to a risk score. The saved mismatch count has its exact run completion date; refresh analysis if the snapshot is stale.

The peer-context panel displays peer/enrolment minima, national fallback and small-capacity cautions. It does not change eligibility, thresholds, peer definitions, score mapping or review permissions. The research note supplies review prompts, not validated statutory requirements. Tests cover count partitions, year and scope restrictions, effective overrides, privacy and snapshot timestamp binding.
