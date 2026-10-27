import type {Actor} from './repository.mjs';
export function notify(userId:string,title:string,body:string,kind?:string,email?:boolean):string;
export function notifyInstitution(id:string,title:string,body:string,kind?:string):void;
export function queueDelivery(kind:string,payload:Record<string,unknown>):string;
export function notifications(actor:Actor):{id:string;title:string;body:string;kind:string;created_at:string;read_at:string|null}[];
export function markRead(actor:Actor,id:unknown):void;
