import type {Actor} from './repository.mjs';
export type DashboardInstitution={id:string;name:string;region:string;state:string};
export type DashboardProgram={id:string;name:string;institution_id:string;approved:number;intake:number;deadline:string;enrolments:number;within_count:number;supernumerary:number;approved_records:number};
export type Tracker=DashboardInstitution & {total:number;approved_records:number;deadline:string|null;deadline_end:string|null;status:string;signed_batches:number;open_batches:number;complete:boolean;days_remaining:number|null;deadline_status:string};
export type DashboardData={year:number;today:string;institutions:DashboardInstitution[];programs:DashboardProgram[];uploads:{institution_id:string;status:string;count:number;errors:number;signed_at:string|null}[];tracker:Tracker[]};
export function dashboardData(actor:Actor,year?:number,now?:Date):DashboardData;
