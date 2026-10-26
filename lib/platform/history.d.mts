import type {Actor} from './repository.mjs';
export type AuditOptions={q?:string;action?:string;actor?:string;from?:string;to?:string;page?:string};
export function auditHistory(actor:Actor,options?:AuditOptions):{rows:{sequence:number;actor_id:string;action:string;entity_id:string;created_at:string}[];total:number;page:number;pages:number;actions:string[];admin:boolean};
export function recordHistory(actor:Actor,id:string,options?:{from?:string;to?:string}):{record:{id:string;institution_id:string;student_id:string;academic_year:number;version:number;institution_name:string};versions:{version:number;reason:string;actor_id:string;created_at:string}[];from:number|null;to:number|null;comparison:{key:string;label:string;before:string;after:string;changed:boolean}[]};
