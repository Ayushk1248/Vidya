import {requestOrigin} from '@/lib/platform/origin'
import {cookies} from 'next/headers'
import {demoEnabled,demoActors,ensureDemoAccounts} from '@/lib/platform/demo.mjs'
import {seal} from '@/lib/platform/tokens.mjs'
import {audit} from '@/lib/platform/workflows.mjs'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
export async function POST(request:Request){
 const url=new URL(requestOrigin(request))
 if(!demoEnabled(url.host)||request.headers.get('origin')!==url.origin)return new Response('Local demo is unavailable',{status:403})
 const form=await request.formData(),role=String(form.get('role')||'')
 const jar=await cookies()
 if(role==='logout'){jar.delete('vidya-demo');return Response.redirect(new URL('/demo',url),303)}
 const actor=demoActors().find(a=>a.role===role);if(!actor)return new Response('Choose a demo role',{status:400})
 ensureDemoAccounts();jar.set('vidya-demo',seal({id:actor.user_id},'demo',14400),{httpOnly:true,sameSite:'strict',path:'/',maxAge:14400})
 audit(actor.user_id,'demo.session_started',role)
 return Response.redirect(new URL(workspaceHome(role),url),303)
}
