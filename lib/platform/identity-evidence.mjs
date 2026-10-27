import {db} from './db.mjs';
import {institution} from './repository.mjs';
import {AccessError} from './access.mjs';
// Count-only evidence: never return APAARs, names, contacts, or other institutions' identities.
export function identityEvidence(actor,institutionId,year){
 institution(actor,institutionId);
 if(!Number.isInteger(year)||year<2023||year>2030)throw new AccessError('Invalid academic year.',400);
 const valid="length(s.apaar)=12 AND s.apaar NOT GLOB '*[^0-9]*'";
 const counts=db().prepare(`SELECT count(*) total,
 coalesce(sum(CASE WHEN trim(coalesce(s.apaar,''))='' THEN 1 ELSE 0 END),0) missing,
 coalesce(sum(CASE WHEN trim(coalesce(s.apaar,''))<>'' AND NOT (${valid}) THEN 1 ELSE 0 END),0) bad_format,
 coalesce(sum(CASE WHEN ${valid} THEN 1 ELSE 0 END),0) valid_format,
 coalesce(sum(CASE WHEN ${valid} AND r.apaar IS NULL THEN 1 ELSE 0 END),0) not_found,
 coalesce(sum(CASE WHEN r.apaar IS NOT NULL THEN 1 ELSE 0 END),0) registry_found
 FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id LEFT JOIN mock_registry r ON r.apaar=s.apaar
 WHERE e.institution_id=? AND e.academic_year=?`).get(institutionId,year);
 const duplicates=db().prepare(`WITH population AS MATERIALIZED (
 SELECT e.institution_id,s.apaar FROM enrolments e JOIN effective_students s ON s.enrolment_id=e.id
 WHERE e.academic_year=? AND ${valid}),
 local_ids AS (SELECT apaar,count(*) n FROM population WHERE institution_id=? GROUP BY apaar),
 shared AS (SELECT apaar FROM population GROUP BY apaar HAVING count(DISTINCT institution_id)>1)
 SELECT coalesce(sum(CASE WHEN n>1 THEN 1 ELSE 0 END),0) within_ids,
 coalesce(sum(CASE WHEN n>1 THEN n ELSE 0 END),0) within_records,
 coalesce(sum(CASE WHEN apaar IN(SELECT apaar FROM shared) THEN n ELSE 0 END),0) cross_institution_records FROM local_ids`).get(year,institutionId);
 return {...counts,...duplicates,academic_year:year,checked_at:new Date().toISOString()};
}
