import {sessionActor,apiError} from '@/lib/platform/session'
import {reportPreview} from '@/lib/platform/reports.mjs'
import {limit} from '@/lib/platform/workflows.mjs'
export const runtime='nodejs'
export async function GET(request:Request){try{const actor=await sessionActor();limit('report-preview:'+actor.user_id,60);return Response.json(reportPreview(actor,Object.fromEntries(new URL(request.url).searchParams)),{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}catch(e){return apiError(e)}}
