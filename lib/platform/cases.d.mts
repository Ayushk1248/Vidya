import type {Actor} from './repository.mjs';
export type Case={id:string;institution_name:string;institution_id:string;rule_code:string;summary:string;status:string;response:string|null;review_note:string|null};
export type Query={id:string;student_id:string;description:string;status:string;response:string|null};
export function caseList(actor:Actor):{cases:Case[];queries:Query[]};
export function createCase(actor:Actor,input:Record<string,unknown>):{id:string};
export function updateCase(actor:Actor,input:Record<string,unknown>):{status:string};
export function studentQuery(actor:Actor,description:unknown):{id:string};
export function resolveQuery(actor:Actor,id:unknown,response:unknown):void;
