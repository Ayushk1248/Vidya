import {NextResponse} from 'next/server'
import {createSupabaseServerClient} from '@/lib/supabase/server'
import {oauthOrigin} from '@/lib/auth/oauth-flow.mjs'
import {actorFor} from '@/lib/platform/repository.mjs'
import {migrateVerifiedOwner} from '@/lib/platform/owner-migration.mjs'
import {syncProfile} from '@/lib/platform/workflows.mjs'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
import {accountEntryDestination} from '@/lib/platform/account-entry.mjs'
import {portals,demoCookie} from '@/lib/platform/portals.mjs'
export const runtime='nodejs'
export async function GET(request:Request){
 const origin=oauthOrigin(request),administrator=new URL(request.url).searchParams.get('administrator')==='1'
 const login=administrator?'/administrator/sign-in':'/login'
 let user
 try{const client=await createSupabaseServerClient();if(client){const {data,error}=await client.auth.getUser();if(!error)user=data.user}}catch{}
 if(!user)return NextResponse.redirect(new URL(login+'?error=auth_exchange_failed',origin))
 migrateVerifiedOwner(user);syncProfile(user)
 const actor=actorFor(user.id),destination=accountEntryDestination(actor,actor?workspaceHome(actor.role):'/onboarding',administrator)
 const response=NextResponse.redirect(new URL(destination,origin))
 // Entering a verified real account explicitly ends old demonstration perspectives.
 // No role is inferred from a chosen portal, URL parameter or a demo cookie.
 for(const name of [...Object.keys(portals).map(category=>demoCookie(category)),'vidya-demo','vidya-portal'])response.cookies.set(name,'',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0})
 response.headers.set('Cache-Control','private, no-store')
 response.headers.set('Referrer-Policy','no-referrer')
 return response
}
