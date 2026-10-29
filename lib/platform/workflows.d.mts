import type {Actor} from './repository.mjs';
export type AccessRequest={id:string;user_id:string;role:string;institution_id:string|null;region:string|null;student_id:string|null;organisation:string;designation:string;reason:string;status:string;created_at:string;review_note:string|null;display_name?:string;email?:string;institution_name?:string;approval_issues?:string[]};
export type DirectoryRow={id:string;name:string;region:string;state:string;institution_type:string;programs:number;intake:number;enrolments:number;within_count:number;signed_count:number};
export type Overview={year:number;directory:DirectoryRow[];summary:{total:number;apaar_count:number;supernumerary:number;signed_count:number;edits:number};trend:{year:number;count:number}[];capacity:{id:string;name:string;institution_id:string;institution_name:string;intake:number;enrolled:number}[];pending:number};
export type Consent={id:string;purpose:string;requested_fields:string[];approved_fields:string[];status:string;created_at:string;expires_at:string;organisation:string;requester:string};
export function syncProfile(user:{id:string;email?:string;user_metadata?:Record<string,unknown>}):void;
export function registrationData(userId:string):{institutions:{id:string;name:string;state:string}[];regions:string[];requests:AccessRequest[]};
export function requestAccess(userId:string,input:Record<string,unknown>):{id:string};
export function accessQueue(actor:Actor):{requests:AccessRequest[];members:(Actor&{display_name:string;institution_name?:string})[];unassigned:{user_id:string;display_name:string}[];regions:string[]};
export function reviewAccess(actor:Actor,id:string,decision:string,note:string):{status:string};
export function revokeAccess(actor:Actor,id:string,note:string):{status:string};
export function overview(actor:Actor,year?:number):Overview;
export function activities(actor:Actor):{sequence:number;action:string;entity_id:string;created_at:string;details:string;actor_id:string}[];
export function limit(bucket:string,max?:number,windowMs?:number):void;
export function consentList(actor:Actor):Consent[];
export const consentFields:Record<string,string>;
export function requestConsent(actor:Actor,input:Record<string,unknown>):{id:string};
export function decideConsent(actor:Actor,id:string,decision:string,fields?:string[]):{status:string};
export function consentResult(actor:Actor,id:string):{fields:Record<string,string|number>;source:string;expires_at:string};

export function audit(actor:string,action:string,entity:string,details?:Record<string,unknown>):void;

export function transaction<T>(fn:()=>T):T;

export function assignStaffAccess(actor:Actor,input:Record<string,unknown>):{status:string};
