
import {LocalizedLink,Label} from '@/components/language'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { signedInUser } from '@/lib/platform/web-session'
import { actorFor } from '@/lib/platform/repository.mjs'
import { portals, validPortal, portalPath } from '@/lib/platform/portals.mjs'
import { demoEnabled } from '@/lib/platform/demo.mjs'
import { workspaceHome } from '@/lib/platform/workspace-navigation'
import { RoleControls } from '@/components/role-controls'
import { SignOutButton } from '@/components/sign-out-button'
import { roles } from '@/lib/platform/access.mjs'
export const dynamic = 'force-dynamic'

export default async function Portal({ params,searchParams }: { params: Promise<{category:string}>;searchParams:Promise<{error?:string}> }) {
 const category=validPortal((await params).category);if(!category)notFound()
 const portal=portals[category],demo=demoEnabled((await headers()).get('host')||'')
 let user=null;try{user=await signedInUser()}catch{}
 const actor=user?actorFor(user.id):null
 if(actor&&portal.roles.includes(actor.role))redirect(portalPath(workspaceHome(actor.role),category))
 return <main className="portal"><header className="topbar"><LocalizedLink className="brand" href="/"><Label text={"◎ VIDYA"}/><span><Label text={portal.label.toUpperCase()}/><Label text={"PORTAL"}/></span></LocalizedLink><div className="actions"><LocalizedLink href="/#portals"><Label text={"All portals"}/></LocalizedLink>{user&&<SignOutButton/>}</div></header>
 <section className="demo-entry card"><div className="eyebrow"><Label text={portal.label.toUpperCase()}/></div><h1><Label text={portal.label}/><Label text={"workspace"}/></h1><p><Label text={portal.description}/></p>
 {user?<p className="feedback-info"><Label text={"Signed in as "}/><Label text={user.user_metadata?.display_name||user.email}/>. <Label text={actor?`Your assigned role is ${roles[actor.role as keyof typeof roles]}.`:'Your account is waiting for a role assignment.'}/></p>:<LocalizedLink className="button" href={'/login?portal='+encodeURIComponent(category)}><Label text={"Sign in with your account"}/></LocalizedLink>}
 {demo&&<>{(await searchParams).error==='demo_role_unavailable'&&<p role="alert" className="feedback-error"><Label text={"This demo role was revoked or its student identity is linked to another account. Choose another role. A project administrator must explicitly restore demo access before this role can be used again."}/></p>}<p className="small muted"><Label text={"Local demo: choose a role below. The other portal tabs keep their own roles."}/></p><RoleControls role={portal.roles[0]} demo entry category={category}/></>}
 {!demo&&user&&<LocalizedLink className="button secondary" href={actor?'/dashboard':'/onboarding'}><Label text={actor?'Open my assigned workspace':'Complete my role request'}/></LocalizedLink>}
 </section></main>
}
