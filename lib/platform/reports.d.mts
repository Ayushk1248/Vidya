import type {Actor} from './repository.mjs';
export const reportTypes:Record<string,string>;
export type Report={type:string;title:string;year:number;generated_at:string;columns:string[];rows:(string|number)[][];filter_summary:string};
export type ReportFilterOptions={institutions:{id:string;name:string;region:string;state:string;institution_type:string}[];programs:{id:string;name:string;institution_id:string;level:string}[];categories:string[]};
export function reportFilterOptions(actor:Actor):ReportFilterOptions;
export function reportData(actor:Actor,options?:Record<string,unknown>):Report;
export type ReportPreview=Report & {row_count:number};
export function reportPreview(actor:Actor,options?:Record<string,unknown>):ReportPreview;
export function exportReport(actor:Actor,options?:Record<string,unknown>):Promise<{bytes:Buffer;mime:string;filename:string}>;
