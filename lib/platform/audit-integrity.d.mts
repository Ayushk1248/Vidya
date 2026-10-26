import type {Actor} from './repository.mjs';
export type IntegrityResult={status:'valid'|'broken'|'empty';checked_at:string;total:number;checked:number;first_broken_sequence:number|null;reason:string|null};
export function checkAuditIntegrity(actor:Actor):IntegrityResult;
