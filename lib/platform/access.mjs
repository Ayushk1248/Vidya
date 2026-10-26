export const roles = {
  institution_operator: 'Institution Operator', institution_head: 'Institution Head',
  regional_officer: 'AICTE Regional Officer', aicte_admin: 'AICTE Admin',
  student: 'Student', external_verifier: 'External Verifier',
};
export class AccessError extends Error {
  constructor(message = 'Access denied', status = 403) { super(message); this.status = status; }
}
export function institutionScope(actor, alias = 'i') {
  if (!actor || !roles[actor.role]) throw new AccessError();
  if (actor.role === 'aicte_admin') return { clause: '1=1', args: [] };
  if (['institution_operator', 'institution_head'].includes(actor.role) && actor.institution_id)
    return { clause: `${alias}.id=?`, args: [actor.institution_id] };
  if (actor.role === 'regional_officer' && actor.region) return { clause: `${alias}.region=?`, args: [actor.region] };
  throw new AccessError();
}
export function enrolmentScope(actor) {
  if (actor?.role === 'student' && actor.student_id) return { clause: 'e.student_id=?', args: [actor.student_id] };
  return institutionScope(actor);
}
export function may(actor, action) {
  const permissions = {
    upload: ['institution_operator'], signoff: ['institution_head'],
    configure_rules: ['aicte_admin'], review_anomaly: ['regional_officer','aicte_admin'],
    request_consent: ['external_verifier'], decide_consent: ['student'],
  };
  return permissions[action]?.includes(actor?.role) || false;
}
