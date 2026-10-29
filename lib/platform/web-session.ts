import {requestOrigin} from '@/lib/platform/origin'
import {privilegedSession} from './mfa-session'
import {localDemoUser} from './demo-session'
import { migrateVerifiedOwner } from './owner-migration.mjs'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actorFor } from './repository.mjs'
import { syncProfile,limit } from './workflows.mjs'
import { AccessError } from './access.mjs'
import {headers} from 'next/headers'
import {validPortal,portalPath,rolePortal} from './portals.mjs'
export async function signedInUser() {
 const demo=await localDemoUser();if(demo)return demo
 const client=await createSupabaseServerClient()
 if(!client)throw new AccessError('Authentication is unavailable.',503)
 const {data:{user},error}=await client.auth.getUser()
 if(error||!user)throw new AccessError('Please sign in.',401)
 migrateVerifiedOwner(user)
 return user
}
export async function pageSession(allowUnassigned=false) {
 const category=validPortal((await headers()).get('x-vidya-portal'))
 let user
 try {user=await signedInUser()} catch {redirect('/login'+(category?'?portal='+category:''))}
 syncProfile(user)
 const actor=actorFor(user.id)
 if(!actor&&!allowUnassigned)redirect(portalPath('/onboarding',category))
 if(actor&&category&&rolePortal(actor.role)!==category)redirect('/portal/'+category)
 if(actor&&!await privilegedSession(actor))redirect(portalPath('/security',category))
 return {user,actor}
}
export async function mutation(request:Request) {
 const origin=request.headers.get('origin')
 if(!origin||origin!==requestOrigin(request))throw new AccessError('Request origin rejected.',403)
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AccessError('Send JSON.',415)
 const user=await signedInUser()
 limit(`mutate:${user.id}`,30)
 const raw=await request.text()
 if(raw.length>12000)throw new AccessError('Request is too large.',413)
 let body
 try {body=JSON.parse(raw)}catch{throw new AccessError('Invalid JSON.',400)}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new AccessError('Invalid request.',400)
 const actor=actorFor(user.id),category=validPortal((await headers()).get('x-vidya-portal'));if(actor&&category&&rolePortal(actor.role)!==category)throw new AccessError('Open the portal for your assigned role.',403);if(actor&&!await privilegedSession(actor))throw new AccessError('Verify your second factor at /security.',403)
 return {user,body,actor}
}
