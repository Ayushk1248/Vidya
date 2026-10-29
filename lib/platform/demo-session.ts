import {cookies,headers} from 'next/headers'
import {demoEnabled,demoActors,demoUser} from './demo.mjs'
import {unseal} from './tokens.mjs'
import {validPortal,demoCookie,demoIdentity} from './portals.mjs'
export async function localDemoUser(){
 const h=await headers();if(!demoEnabled(h.get('host')||''))return null
 const jar=await cookies(),category=validPortal(h.get('x-vidya-portal'))||validPortal(jar.get('vidya-portal')?.value)
 if(category){const data=unseal(jar.get(demoCookie(category))?.value,'demo');const id=demoIdentity(category,data);return id?demoUser(id):null}
 const data=unseal(jar.get('vidya-demo')?.value,'demo')
 return data&&demoActors().some(a=>a.user_id===data.id)?demoUser(data.id):null
}
