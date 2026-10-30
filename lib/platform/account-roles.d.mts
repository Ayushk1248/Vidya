import type {Actor} from './repository.mjs';
export type ManagedAccount={user_id:string;display_name:string;email:string;organisation:string;assignment:{role:string;institution_id:string|null;region:string|null;student_id:string|null}|null;expected_assignment:string|null};
export function assignmentScope(actor:{role:string;institution_id?:string|null;region?:string|null;student_id?:string|null}|null|undefined):string|null;
export function managedAccounts(actor:Actor,query:unknown):{accounts:ManagedAccount[]};
export function changeAccountRole(actor:Actor,input:Record<string,unknown>):{status:string;role:string};
