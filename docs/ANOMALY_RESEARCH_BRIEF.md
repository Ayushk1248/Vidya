# Teammate research task: fair, explainable institution screening

Research peer grouping, risk indicators and officer-review safeguards for an APAAR-based student data platform for AICTE-approved institutions. Use official AICTE/APAAR documents and credible anomaly-detection research. Use only synthetic examples, never student records or genuine APAAR IDs.

## Questions to answer

1. Which peer dimensions are defensible: institution type, program mix, region, approved capacity, age or funding model? How should small groups fall back without disclosing other institutions' records?
2. For enrolment growth, within-intake ratio, unsuccessful APAAR checks, post-sign-off edits and shared mobile numbers, list legitimate explanations and data-quality pitfalls. Consider new programs, family contacts, small institutions and partial submissions.
3. What review questions and documentary evidence would help officers clear or confirm a signal? Distinguish an unusual pattern from a proven rule violation or misconduct.
4. Recommend how to evaluate false positives, stability between runs, missing data, drift and fairness across peer groups. Explain why an unsupervised risk score is not a probability of fraud.
5. Identify actual AICTE/APAAR requirements versus optional product heuristics. Cite source title, URL, publication/version date and relevant section. State gaps or uncertainty.

## Return format

A two-page brief with: a recommendation table (indicator / peer baseline / legitimate explanation / officer question / source), proposed evaluation checks, and three prioritised improvements. Do not invent official thresholds.

## Current prototype assumptions to critique

- Isolation Forest, five institution-level features, deterministic seed and 256 trees.
- Within-intake enrolments divided by approved intake; supernumerary seats excluded.
- Peer ladder: region + type + capacity; national type + capacity; national type; national fallback. Capacity groups: <=300, 301–1,000, >1,000 seats.
- At least eight other eligible peers and ten enrolments; absent previous year means growth unavailable, not zero.
- Aggregate unsuccessful identity checks include missing/bad/not-found APAAR and name/DOB mismatches. Shared numbers count distinct students; blank contacts excluded.
- Peer-standardised features, fixed prototype 0–100 mapping, high priority >=70, moderate >=40. These are heuristics awaiting evaluation, not government requirements.
- Officers add notes and mark Cleared/Confirmed/Reopened; changed evidence requires a fresh snapshot. Historical decisions are retained.
