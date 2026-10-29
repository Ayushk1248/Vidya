import type {Actor} from './repository.mjs';
export type DataOption={value:string;label:string;institution_id?:string;data?:Record<string,string|number>};
export function dataSuggestions(actor:Actor|null,options:{kind:string;q?:string;institution?:string;student?:string;demo?:boolean}):{options:DataOption[];hint?:string};
