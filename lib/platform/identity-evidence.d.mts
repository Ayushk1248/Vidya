import type {Actor} from './repository.mjs';
export type IdentityEvidence={total:number;missing:number;bad_format:number;valid_format:number;not_found:number;registry_found:number;within_ids:number;within_records:number;cross_institution_records:number;academic_year:number;checked_at:string};
export function identityEvidence(actor:Actor,institutionId:string,year:number):IdentityEvidence;
