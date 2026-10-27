import type {Actor} from './repository.mjs';
export const reportTypes:Record<string,string>;
export type ReportData={type:string;title:string;year:number;scope:string;generated_at:string;columns:string[];rows:(string|number|null)[][];notes:string[]};
export function reportData(actor:Actor,options?:{type?:string;year?:number;institution?:string}):ReportData;
