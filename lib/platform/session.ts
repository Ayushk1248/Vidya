import {privilegedSession} from './mfa-session'
import {localDemoUser} from './demo-session'
import { migrateVerifiedOwner } from './owner-migration.mjs'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actorFor } from './repository.mjs'
import { AccessError } from './access.mjs'
import {headers} from 'next/headers'
import {validPortal,rolePortal} from './portals.mjs'
export async function sessionActor() {
  const demo=await localDemoUser();if(demo){const actor=actorFor(demo.id);if(actor)return actor}
  const client = await createSupabaseServerClient()
  if (!client) throw new AccessError('Authentication is not configured', 503)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new AccessError('Please sign in', 401)
  migrateVerifiedOwner(user)
  const actor = actorFor(user.id)
  if (!actor) throw new AccessError('Your account needs a role assignment', 403)
  const category=validPortal((await headers()).get('x-vidya-portal'))
  if(category&&rolePortal(actor.role)!==category)throw new AccessError('Open the portal for your assigned role.',403)
  if(!await privilegedSession(actor))throw new AccessError('Verify your second factor at /security.',403)
  return actor
}
export function apiError(error: unknown) {
  if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status })
  console.error('Platform request failed', error instanceof Error ? error.name : 'Unknown error')
  return Response.json({ error: 'Platform request failed' }, { status: 500 })
}
