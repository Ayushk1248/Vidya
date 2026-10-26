import { mutation } from '@/lib/platform/web-session'
import { apiError,sessionActor } from '@/lib/platform/session'
import { requestConsent,decideConsent,consentResult,limit } from '@/lib/platform/workflows.mjs'
import { AccessError } from '@/lib/platform/access.mjs'
export const runtime='nodejs'
export async function POST(request:Request){try{const {actor,body}=await mutation(request);if(!actor)throw new AccessError();
 if(body.action==='request'){limit(`consent:${actor.user_id}`,5);return Response.json(requestConsent(actor,body))}
 if(body.action==='decide')return Response.json(decideConsent(actor,String(body.id),String(body.decision),body.fields))
 throw new AccessError('Unknown action.',400)
 }catch(e){return apiError(e)}}
export async function GET(request:Request){try{const actor=await sessionActor();limit(`result:${actor.user_id}`,30);return Response.json(consentResult(actor,new URL(request.url).searchParams.get('id')||''),{headers:{'Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
