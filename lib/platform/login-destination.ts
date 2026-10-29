import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { actorFor } from './repository.mjs'
import { migrateVerifiedOwner } from './owner-migration.mjs'
import { validPortal, rolePortal, portalPath, portals } from './portals.mjs'
import { workspaceHome } from './workspace-navigation'

export async function signedInDestination(){
 const client=await createSupabaseServerClient();if(!client)return null
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return null
 migrateVerifiedOwner(user)
 const actor=actorFor(user.id),wanted=validPortal((await headers()).get('x-vidya-portal'))
 if(!actor)return '/onboarding'+(wanted?'?portal='+portals[wanted].roles[0]:'')
 if(wanted&&wanted!==rolePortal(actor.role))return '/portal/'+wanted
 return portalPath(workspaceHome(actor.role),rolePortal(actor.role))
}
