import { migrateVerifiedOwner } from './owner-migration.mjs'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actorFor } from './repository.mjs'
import { syncProfile,limit } from './workflows.mjs'
import { AccessError } from './access.mjs'
export async function signedInUser() {
 const client=await createSupabaseServerClient()
 if(!client)throw new AccessError('Authentication is unavailable.',503)
 const {data:{user},error}=await client.auth.getUser()
 if(error||!user)throw new AccessError('Please sign in.',401)
 migrateVerifiedOwner(user)
 return user
}
export async function pageSession(allowUnassigned=false) {
 let user
 try {user=await signedInUser()} catch {redirect('/login')}
 syncProfile(user)
 const actor=actorFor(user.id)
 if(!actor&&!allowUnassigned)redirect('/onboarding')
 return {user,actor}
}
export async function mutation(request:Request) {
 const origin=request.headers.get('origin')
 if(!origin||origin!==new URL(request.url).origin)throw new AccessError('Request origin rejected.',403)
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AccessError('Send JSON.',415)
 const user=await signedInUser()
 limit(`mutate:${user.id}`,30)
 const raw=await request.text()
 if(raw.length>12000)throw new AccessError('Request is too large.',413)
 let body
 try {body=JSON.parse(raw)}catch{throw new AccessError('Invalid JSON.',400)}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new AccessError('Invalid request.',400)
 return {user,body,actor:actorFor(user.id)}
}
