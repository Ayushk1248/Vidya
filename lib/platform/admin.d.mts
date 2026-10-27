import type {Actor} from './repository.mjs';
export type Checkpoint={id:string;sequence:number;event_hash:string;signature:string;created_at:string};
export function adminAccess(actor:Actor):void;
export function systemState(actor:Actor):{schema:number;delivery:{kind:string;status:string;count:number}[];jobs:{name:string;last_run:string}[];retention:{years:number;description:string};checkpoints:Checkpoint[];auth:boolean;smtp:boolean;checkpoint_key:boolean;demo:boolean};
export function checkpoint(actor:Actor):Checkpoint;
export function saveWindow(actor:Actor,input:Record<string,unknown>):void;
