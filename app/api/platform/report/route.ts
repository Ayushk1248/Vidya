import { sessionActor,apiError } from '@/lib/platform/session'
import {reportData} from '@/lib/platform/reports.mjs'
import {reportPdf,reportXlsx} from '@/lib/platform/report-files.mjs'
import {AccessError} from '@/lib/platform/access.mjs'
import {limit,audit,transaction} from '@/lib/platform/workflows.mjs'
import { overview } from '@/lib/platform/workflows.mjs'
export const runtime='nodejs'
export async function GET(request:Request){try{
 const actor=await sessionActor();const params=new URL(request.url).searchParams;const year=Number(params.get('year')||2026);
 if(params.has('format')){const format=params.get('format');if(!['xlsx','pdf'].includes(format||''))throw new AccessError('Choose Excel or PDF.',400);limit(`report:${actor.user_id}`,5);const report=reportData(actor,{year,type:params.get('type')||'intake',institution:params.get('institution')||undefined});const bytes=format==='xlsx'?await reportXlsx(report):await reportPdf(report);transaction(()=>audit(actor.user_id,'report.exported',report.type,{year,format,scope:report.scope,total_rows:report.rows.length,pdf_rows:format==='pdf'?Math.min(1000,report.rows.length):undefined}));return new Response(new Uint8Array(bytes),{headers:{'Content-Type':format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf','Content-Disposition':`attachment; filename="VIDYA-${report.type}-${year}.${format}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
 const data=overview(actor,year)
 const escape=(v:unknown)=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"'
 const rows=[['Institution ID','Institution','Region','State','Approved intake','Within intake','Supernumerary','Academic year'],...data.directory.map(i=>[i.id,i.name,i.region,i.state,i.intake,i.within_count,i.enrolments-i.within_count,year])]
 return new Response('\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="VIDYA-intake-${year}.csv"`,'Cache-Control':'no-store'}})
 }catch(e){return apiError(e)}}
