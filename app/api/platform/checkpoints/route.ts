import {sessionActor,apiError} from '@/lib/platform/session'
import {adminAccess} from '@/lib/platform/admin.mjs'
import {db} from '@/lib/platform/db.mjs'
export async function GET(){try{adminAccess(await sessionActor());return new Response(db().prepare('SELECT * FROM audit_checkpoints ORDER BY created_at').all().map((r:unknown)=>JSON.stringify(r)).join('\n'),{headers:{'Content-Type':'application/x-ndjson','Content-Disposition':'attachment; filename="VIDYA-audit-checkpoints.jsonl"','Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
