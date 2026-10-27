import { sessionActor,apiError } from '@/lib/platform/session'
import { exportReport } from '@/lib/platform/reports.mjs'
export const runtime='nodejs'
export async function GET(request:Request){try{
 const actor=await sessionActor();const result=await exportReport(actor,Object.fromEntries(new URL(request.url).searchParams))
 return new Response(new Uint8Array(result.bytes),{headers:{'Content-Type':result.mime,'Content-Disposition':`attachment; filename="${result.filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Generated-At':new Date().toISOString()}})
 }catch(e){return apiError(e)}}
