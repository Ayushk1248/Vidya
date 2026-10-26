import { mutation } from '@/lib/platform/web-session'
import { apiError } from '@/lib/platform/session'
import { requestAccess,reviewAccess,revokeAccess,syncProfile } from '@/lib/platform/workflows.mjs'
import { AccessError } from '@/lib/platform/access.mjs'
export const runtime='nodejs'
export async function POST(request:Request) {
 try {const {user,body,actor}=await mutation(request)
 if(body.action==='request'){syncProfile(user);return Response.json(requestAccess(user.id,body))}
 if(!actor)throw new AccessError()
 if(body.action==='review')return Response.json(reviewAccess(actor,String(body.id),String(body.decision),String(body.note||'')))
 if(body.action==='revoke')return Response.json(revokeAccess(actor,String(body.user_id),String(body.note||'')))
 throw new AccessError('Unknown action.',400)
 }catch(e){return apiError(e)}
}
