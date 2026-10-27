import type {Actor} from './repository.mjs';
export function clients(actor:Actor):{id:string;institution_id:string;name:string;created_at:string;revoked_at:string|null;last_used:string|null}[];
export function createClient(actor:Actor,institutionId:unknown,name:unknown):{id:string;secret:string;api_key:string};
export function revokeClient(actor:Actor,id:unknown):void;
export function createWebhook(actor:Actor,institutionId:unknown,url:unknown):{id:string;secret:string};
export function accessToken(id:string,secret:string):{access_token:string;token_type:string;expires_in:number;scope:string};
export function integrationActor(request:Request):Actor & {institution_id:string};
