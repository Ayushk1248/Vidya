import {sessionActor,apiError} from '@/lib/platform/session'
import {mutation} from '@/lib/platform/web-session'
import {AccessError} from '@/lib/platform/access.mjs'
import {limit} from '@/lib/platform/workflows.mjs'
import {anomalyOverview,anomalyDetail,requestAnalysis,reviewAnomaly,saveAnomalyPolicy} from '@/lib/platform/anomalies.mjs'
export const runtime='nodejs'
export async function GET(request:Request){try{const actor=await sessionActor();const query=new URL(request.url).searchParams;return Response.json(query.has('id')?anomalyDetail(actor,query.get('id')!):anomalyOverview(actor,Number(query.get('year')||2026)),{headers:{'cache-control':'no-store'}})}catch(e){return apiError(e)}}
export async function POST(request:Request){try{const {actor,body}=await mutation(request);if(!actor)throw new AccessError();if(body.action==='run'){limit(`anomaly-run:${actor.user_id}`,5);return Response.json(requestAnalysis(actor,Number(body.year||2026)),{status:202})}if(body.action==='review')return Response.json(reviewAnomaly(actor,body.id,body.status,body.note,body.revision));if(body.action==='policy')return Response.json(saveAnomalyPolicy(actor,body.policy));throw new AccessError('Unknown action.',400)}catch(e){return apiError(e)}}
