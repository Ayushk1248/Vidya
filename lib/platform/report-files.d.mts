import type {ReportData} from './reports.mjs';
export function reportXlsx(data:ReportData):Promise<Buffer>;
export function reportPdf(data:ReportData):Promise<Buffer>;
