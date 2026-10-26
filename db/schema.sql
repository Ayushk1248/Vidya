PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_versions(version INTEGER PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS institutions(
 id TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, state TEXT NOT NULL,
 district TEXT NOT NULL, institution_type TEXT NOT NULL, synthetic INTEGER NOT NULL DEFAULT 1 CHECK(synthetic=1));
CREATE TABLE IF NOT EXISTS programs(
 id TEXT PRIMARY KEY, institution_id TEXT NOT NULL REFERENCES institutions(id), name TEXT NOT NULL, level TEXT NOT NULL,
 UNIQUE(id,institution_id));
CREATE TABLE IF NOT EXISTS intake_approvals(
 program_id TEXT NOT NULL REFERENCES programs(id), academic_year INTEGER NOT NULL,
 approved_intake INTEGER NOT NULL CHECK(approved_intake>=0), approved INTEGER NOT NULL DEFAULT 1 CHECK(approved IN(0,1)),
 deadline TEXT NOT NULL, PRIMARY KEY(program_id,academic_year));
CREATE TABLE IF NOT EXISTS scheme_caps(
 scheme TEXT PRIMARY KEY, cap_percent REAL NOT NULL CHECK(cap_percent>=0), description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mock_registry(
 apaar TEXT PRIMARY KEY CHECK(length(apaar)=12 AND apaar NOT GLOB '*[^0-9]*'), name TEXT NOT NULL, dob TEXT NOT NULL,
 synthetic INTEGER NOT NULL DEFAULT 1 CHECK(synthetic=1));
CREATE TABLE IF NOT EXISTS students(
 id TEXT PRIMARY KEY, name TEXT NOT NULL, dob TEXT NOT NULL, apaar TEXT,
 mobile_cipher TEXT NOT NULL, mobile_hash TEXT NOT NULL, email_cipher TEXT NOT NULL, passport_cipher TEXT,
 nationality TEXT NOT NULL, category TEXT NOT NULL, synthetic INTEGER NOT NULL DEFAULT 1 CHECK(synthetic=1));
CREATE TABLE IF NOT EXISTS enrolments(
 id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), institution_id TEXT NOT NULL REFERENCES institutions(id),
 program_id TEXT NOT NULL, academic_year INTEGER NOT NULL, admission_date TEXT NOT NULL, submitted_at TEXT NOT NULL,
 scheme TEXT NOT NULL REFERENCES scheme_caps(scheme), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','submitted','signed_off')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0), post_signoff_edits INTEGER NOT NULL DEFAULT 0,
 FOREIGN KEY(program_id,institution_id) REFERENCES programs(id,institution_id));
CREATE INDEX IF NOT EXISTS enrolments_scope ON enrolments(institution_id,academic_year,program_id);
CREATE INDEX IF NOT EXISTS enrolments_student ON enrolments(student_id);
CREATE INDEX IF NOT EXISTS students_apaar ON students(apaar);
CREATE TABLE IF NOT EXISTS role_assignments(
 user_id TEXT PRIMARY KEY,
 role TEXT NOT NULL CHECK(role IN('institution_operator','institution_head','regional_officer','aicte_admin','student','external_verifier')),
 institution_id TEXT REFERENCES institutions(id), region TEXT, student_id TEXT REFERENCES students(id),
 CHECK((role IN('institution_operator','institution_head') AND institution_id IS NOT NULL AND region IS NULL AND student_id IS NULL)
 OR (role='regional_officer' AND region IS NOT NULL AND institution_id IS NULL AND student_id IS NULL)
 OR (role='student' AND student_id IS NOT NULL AND institution_id IS NULL AND region IS NULL)
 OR (role IN('aicte_admin','external_verifier') AND institution_id IS NULL AND region IS NULL AND student_id IS NULL)));
CREATE TABLE IF NOT EXISTS validation_rules(
 code TEXT PRIMARY KEY, title TEXT NOT NULL, severity TEXT NOT NULL CHECK(severity IN('error','warning')),
 enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN(0,1)), configuration TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS upload_batches(
 id TEXT PRIMARY KEY, institution_id TEXT NOT NULL REFERENCES institutions(id), uploaded_by TEXT NOT NULL,
 academic_year INTEGER NOT NULL, filename TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 signed_by TEXT, signed_at TEXT, version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS upload_rows(
 batch_id TEXT NOT NULL REFERENCES upload_batches(id), row_number INTEGER NOT NULL, submitted_json TEXT NOT NULL,
 registry_json TEXT, status TEXT NOT NULL, PRIMARY KEY(batch_id,row_number));
CREATE TABLE IF NOT EXISTS validation_findings(
 id TEXT PRIMARY KEY, rule_code TEXT NOT NULL REFERENCES validation_rules(code), institution_id TEXT NOT NULL REFERENCES institutions(id),
 enrolment_id TEXT REFERENCES enrolments(id), batch_id TEXT REFERENCES upload_batches(id), row_number INTEGER,
 message TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}', resolved_at TEXT);
CREATE TABLE IF NOT EXISTS record_versions(
 enrolment_id TEXT NOT NULL REFERENCES enrolments(id), version INTEGER NOT NULL, snapshot_cipher TEXT NOT NULL,
 reason TEXT NOT NULL, actor_id TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(enrolment_id,version));
CREATE TABLE IF NOT EXISTS anomaly_reviews(
 id TEXT PRIMARY KEY, institution_id TEXT NOT NULL REFERENCES institutions(id), academic_year INTEGER NOT NULL,
 score REAL NOT NULL CHECK(score BETWEEN 0 AND 100), features TEXT NOT NULL, reasons TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','cleared','confirmed')), reviewed_by TEXT, reviewed_at TEXT, review_note TEXT);
CREATE TABLE IF NOT EXISTS consent_requests(
 id TEXT PRIMARY KEY, verifier_id TEXT NOT NULL, student_id TEXT NOT NULL REFERENCES students(id), purpose TEXT NOT NULL,
 requested_fields TEXT NOT NULL, approved_fields TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','revoked')),
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT NOT NULL, decided_at TEXT);
CREATE TABLE IF NOT EXISTS signed_records(
 id TEXT PRIMARY KEY, enrolment_id TEXT NOT NULL REFERENCES enrolments(id), version INTEGER NOT NULL,
 payload_cipher TEXT NOT NULL, payload_hash TEXT NOT NULL, signature TEXT NOT NULL, key_id TEXT NOT NULL,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT);
CREATE TABLE IF NOT EXISTS audit_events(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, action TEXT NOT NULL, entity_id TEXT NOT NULL,
 details TEXT NOT NULL, created_at TEXT NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seed_fixtures(code TEXT PRIMARY KEY, description TEXT NOT NULL, references_json TEXT NOT NULL);
INSERT OR IGNORE INTO schema_versions(version) VALUES(1);

CREATE TABLE IF NOT EXISTS account_profiles(user_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email_cipher TEXT NOT NULL, organisation TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS access_requests(
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL,
 institution_id TEXT REFERENCES institutions(id), region TEXT, student_id TEXT,
 organisation TEXT NOT NULL DEFAULT '', designation TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 created_at TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, review_note TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_access_request ON access_requests(user_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS request_limits(bucket TEXT PRIMARY KEY, started_at INTEGER NOT NULL, count INTEGER NOT NULL);
INSERT OR IGNORE INTO schema_versions(version) VALUES(2);

CREATE TABLE IF NOT EXISTS owner_migrations(old_user_id TEXT PRIMARY KEY, project_url TEXT NOT NULL, email_cipher TEXT NOT NULL, new_user_id TEXT, migrated_at TEXT);

CREATE TABLE IF NOT EXISTS upload_state(batch_id TEXT PRIMARY KEY REFERENCES upload_batches(id), payload_cipher TEXT, error TEXT, parent_id TEXT, reason TEXT NOT NULL DEFAULT '', otp_hash TEXT, otp_expires INTEGER, otp_actor TEXT, otp_attempts INTEGER NOT NULL DEFAULT 0, leased_at INTEGER, total INTEGER DEFAULT 0, errors INTEGER DEFAULT 0, warnings INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS enrolment_values(enrolment_id TEXT PRIMARY KEY REFERENCES enrolments(id), name TEXT NOT NULL,dob TEXT NOT NULL,apaar TEXT,category TEXT NOT NULL,nationality TEXT NOT NULL,mobile_cipher TEXT NOT NULL,email_cipher TEXT NOT NULL,passport_cipher TEXT,confirmed INTEGER NOT NULL DEFAULT 0);
CREATE VIEW IF NOT EXISTS effective_students AS SELECT e.id enrolment_id,COALESCE(v.name,s.name) name,COALESCE(v.dob,s.dob) dob,COALESCE(v.apaar,s.apaar) apaar,COALESCE(v.category,s.category) category,COALESCE(v.nationality,s.nationality) nationality,COALESCE(v.mobile_cipher,s.mobile_cipher) mobile_cipher,COALESCE(v.email_cipher,s.email_cipher) email_cipher,COALESCE(v.passport_cipher,s.passport_cipher) passport_cipher,COALESCE(v.confirmed,0) confirmed FROM enrolments e JOIN students s ON s.id=e.student_id LEFT JOIN enrolment_values v ON v.enrolment_id=e.id;
CREATE TABLE IF NOT EXISTS platform_jobs(name TEXT PRIMARY KEY,last_run TEXT NOT NULL);
UPDATE validation_rules SET severity='warning' WHERE code='V13' AND NOT EXISTS(SELECT 1 FROM schema_versions WHERE version=3);
INSERT OR IGNORE INTO schema_versions(version) VALUES(3);

CREATE TABLE IF NOT EXISTS anomaly_policy(id INTEGER PRIMARY KEY CHECK(id=1),configuration TEXT NOT NULL);
INSERT OR IGNORE INTO anomaly_policy VALUES(1,'{"min_peers":8,"min_enrolments":10,"high_threshold":70,"moderate_threshold":40}');
CREATE TABLE IF NOT EXISTS anomaly_runs(id TEXT PRIMARY KEY,academic_year INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN('queued','running','complete','failed')),requested_by TEXT NOT NULL,created_at TEXT NOT NULL,started_at TEXT,completed_at TEXT,input_hash TEXT,policy TEXT NOT NULL,model_version TEXT,error TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_anomaly_run ON anomaly_runs(academic_year) WHERE status IN('queued','running');
CREATE INDEX IF NOT EXISTS anomaly_runs_latest ON anomaly_runs(academic_year,completed_at);
CREATE TABLE IF NOT EXISTS anomaly_snapshot_meta(review_id TEXT PRIMARY KEY REFERENCES anomaly_reviews(id),run_id TEXT NOT NULL REFERENCES anomaly_runs(id),band TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS anomaly_snapshot_run ON anomaly_snapshot_meta(run_id);
CREATE TABLE IF NOT EXISTS anomaly_decisions(id TEXT PRIMARY KEY,review_id TEXT NOT NULL REFERENCES anomaly_reviews(id),actor_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('open','cleared','confirmed')),note TEXT NOT NULL,created_at TEXT NOT NULL);
INSERT OR IGNORE INTO schema_versions(version) VALUES(4);

CREATE TABLE IF NOT EXISTS certificate_keys(id TEXT PRIMARY KEY,public_key TEXT NOT NULL,private_key_cipher TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS certificate_artifacts(certificate_id TEXT PRIMARY KEY REFERENCES signed_records(id),pdf_cipher TEXT NOT NULL,pdf_sha256 TEXT NOT NULL,verify_url TEXT NOT NULL,issued_by TEXT NOT NULL,revoked_by TEXT,revocation_reason TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_certificate_per_record_version ON signed_records(enrolment_id,version);
INSERT OR IGNORE INTO schema_versions(version) VALUES(5);
