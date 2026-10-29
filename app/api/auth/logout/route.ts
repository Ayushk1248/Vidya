import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requestOrigin } from '@/lib/platform/origin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { portals, demoCookie } from '@/lib/platform/portals.mjs'

export async function POST(request:Request) {
 if(request.headers.get('origin')!==requestOrigin(request))return NextResponse.json({error:'Request origin rejected.'},{status:403})
 const client=await createSupabaseServerClient()
 if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)return NextResponse.json({error:'Could not end the account session. Please try again.'},{status:503})}
 const jar=await cookies()
 for(const category of Object.keys(portals))jar.delete(demoCookie(category))
 for(const name of ['vidya-demo','vidya-portal','vidya-mfa'])jar.delete(name)
 return NextResponse.json({redirect:'/login?logged_out=1'},{headers:{'Cache-Control':'no-store'}})
}
