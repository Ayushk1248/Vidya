import {sessionActor,apiError} from '@/lib/platform/session'
import {checkAuditIntegrity} from '@/lib/platform/audit-integrity.mjs'
import {limit} from '@/lib/platform/workflows.mjs'
export const runtime='nodejs'
export async function GET(){try{const actor=await sessionActor();limit(`audit-integrity:${actor.user_id}`,5);return Response.json(checkAuditIntegrity(actor),{headers:{'cache-control':'no-store'}})}catch(error){return apiError(error)}}
