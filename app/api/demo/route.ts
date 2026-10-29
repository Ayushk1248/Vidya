import {requestOrigin} from '@/lib/platform/origin'
import {cookies} from 'next/headers'
import {demoEnabled,demoActors,ensureDemoAccounts} from '@/lib/platform/demo.mjs'
import {seal,unseal} from '@/lib/platform/tokens.mjs'
import {audit} from '@/lib/platform/workflows.mjs'
import {actorFor} from '@/lib/platform/repository.mjs'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
import {rolePortal,validPortal,portalPath,demoCookie,portals} from '@/lib/platform/portals.mjs'
export async function POST(request:Request){
 const url=new URL(requestOrigin(request))
 if(!demoEnabled(url.host)||request.headers.get('origin')!==url.origin)return new Response('Local demo is unavailable',{status:403})
 const form=await request.formData(),role=String(form.get('role')||''),category=validPortal(form.get('category'))||rolePortal(role)
 const jar=await cookies()
 if(role==='logout'){if(category)jar.delete(demoCookie(category));else for(const key of Object.keys(portals))jar.delete(demoCookie(key));jar.delete('vidya-demo');jar.delete('vidya-portal');return Response.redirect(new URL('/demo',url),303)}
 const actor=demoActors().find(a=>a.role===role);if(!actor)return new Response('Choose a demo role',{status:400})
 if(!category||!portals[category].roles.includes(role))return new Response('Choose a role within this portal',{status:400})
 const ttl=7*24*3600;ensureDemoAccounts();if(!actorFor(actor.user_id))return Response.redirect(new URL('/portal/'+category+'?error=demo_role_unavailable',url),303)
 jar.set(demoCookie(category),seal({id:actor.user_id},'demo',ttl),{httpOnly:true,sameSite:'lax',path:'/',maxAge:ttl})
 const legacyToken=jar.get('vidya-demo')?.value,legacy=unseal(legacyToken,'demo'),oldRole=demoActors().find(a=>a.user_id===legacy?.id)?.role,oldCategory=oldRole?rolePortal(oldRole):null
 if(legacyToken&&oldCategory&&oldCategory!==category&&!jar.get(demoCookie(oldCategory)))jar.set(demoCookie(oldCategory),legacyToken,{httpOnly:true,sameSite:'lax',path:'/',maxAge:14400})
 jar.set('vidya-portal',category,{httpOnly:true,sameSite:'lax',path:'/',maxAge:ttl})
 jar.delete('vidya-demo')
 audit(actor.user_id,'demo.session_started',role)
 return Response.redirect(new URL(portalPath(workspaceHome(role),category),url),303)
}
