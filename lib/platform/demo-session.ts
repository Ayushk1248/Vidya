import {cookies,headers} from 'next/headers'
import {demoEnabled,demoActors,demoUser} from './demo.mjs'
import {unseal} from './tokens.mjs'
export async function localDemoUser(){
 const h=await headers();if(!demoEnabled(h.get('host')||''))return null
 const data=unseal((await cookies()).get('vidya-demo')?.value,'demo')
 return data&&demoActors().some(a=>a.user_id===data.id)?demoUser(data.id):null
}
