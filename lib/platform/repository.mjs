import { db } from './db.mjs';
import { institutionScope, enrolmentScope, AccessError } from './access.mjs';
import { maskApaar } from './crypto.mjs';
export function actorFor(userId) { return db().prepare('SELECT * FROM role_assignments WHERE user_id=?').get(userId); }
export function institutions(actor) {
  const s = institutionScope(actor);
  return db().prepare(`SELECT i.*, (SELECT count(*) FROM programs p WHERE p.institution_id=i.id) program_count
    FROM institutions i WHERE ${s.clause} ORDER BY i.id`).all(...s.args);
}
export function institution(actor, id) {
  const s = institutionScope(actor);
  const row = db().prepare(`SELECT i.* FROM institutions i WHERE ${s.clause} AND i.id=?`).get(...s.args, id);
  if (!row) throw new AccessError('Institution not found', 404);
  return row;
}
export function programs(actor, id, year = 2026) {
  institution(actor, id);
  return db().prepare(`SELECT p.*, a.approved_intake,a.approved,a.deadline,
    (SELECT count(*) FROM enrolments e WHERE e.program_id=p.id AND e.academic_year=a.academic_year AND e.scheme='WITHIN') within_count,
    (SELECT count(*) FROM enrolments e WHERE e.program_id=p.id AND e.academic_year=a.academic_year AND e.scheme<>'WITHIN') supernumerary_count
    FROM programs p JOIN intake_approvals a ON a.program_id=p.id WHERE p.institution_id=? AND a.academic_year=? ORDER BY p.id`).all(id,year);
}
export function enrolments(actor, options = {}) {
  const scope = enrolmentScope(actor);
  const parts = [scope.clause]; const args = [...scope.args];
  if (options.institutionId) { institution(actor, options.institutionId); parts.push('i.id=?'); args.push(options.institutionId); }
  if (options.programId) { parts.push('p.id=?'); args.push(options.programId); }
  if (options.id) { parts.push('e.id=?'); args.push(options.id); }
  const year = Number(options.year || 2026);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new AccessError('Invalid year', 400);
  parts.push('e.academic_year=?'); args.push(year);
  const page = Math.max(1, Math.floor(Number(options.page) || 1));
  const from = `FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id JOIN institutions i ON i.id=e.institution_id JOIN programs p ON p.id=e.program_id WHERE ${parts.join(' AND ')}`;
  const total = db().prepare(`SELECT count(*) total ${from}`).get(...args).total;
  const rows = db().prepare(`SELECT e.*,s.name,s.dob,s.apaar,s.category,s.nationality,s.confirmed,p.name program_name,i.name institution_name ${from} ORDER BY e.id LIMIT 50 OFFSET ?`).all(...args,(page-1)*50);
  return { total, page, pageSize: 50, rows: rows.map(({apaar,...row}) => ({...row,apaar:maskApaar(apaar), provenance:row.confirmed?'Registry-confirmed':'Institution-submitted'})) };
}
export function enrolment(actor, id, year=2026) {
  const result = enrolments(actor,{id,year}).rows[0];
  if (!result) throw new AccessError('Record not found',404);
  return result;
}
