import { sessionActor,apiError } from '@/lib/platform/session'
import { overview } from '@/lib/platform/workflows.mjs'
export const runtime='nodejs'
export async function GET(request:Request){try{
 const actor=await sessionActor();const year=Number(new URL(request.url).searchParams.get('year')||2026);const data=overview(actor,year)
 const escape=(v:unknown)=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"'
 const rows=[['Institution ID','Institution','Region','State','Approved intake','Within intake','Supernumerary','Academic year'],...data.directory.map(i=>[i.id,i.name,i.region,i.state,i.intake,i.within_count,i.enrolments-i.within_count,year])]
 return new Response('\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="VIDYA-intake-${year}.csv"`,'Cache-Control':'no-store'}})
 }catch(e){return apiError(e)}}
