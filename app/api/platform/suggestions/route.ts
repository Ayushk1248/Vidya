import {headers} from 'next/headers'
import {sessionActor,apiError} from '@/lib/platform/session'
import {signedInUser} from '@/lib/platform/web-session'
import {actorFor} from '@/lib/platform/repository.mjs'
import {limit} from '@/lib/platform/workflows.mjs'
import {dataSuggestions} from '@/lib/platform/suggestions.mjs'
import {demoEnabled} from '@/lib/platform/demo.mjs'

export async function GET(request:Request){
 try{
  let actor=null,userId='';
  try{actor=await sessionActor();userId=actor.user_id}catch(error){const user=await signedInUser();if(actorFor(user.id))throw error;userId=user.id}
  limit('suggestions:'+userId,120);
  const q=new URL(request.url).searchParams;
  return Response.json(dataSuggestions(actor,{kind:q.get('kind')||'',q:q.get('q')||'',institution:q.get('institution')||'',student:q.get('student')||'',demo:demoEnabled((await headers()).get('host')||'')}),{headers:{'Cache-Control':'private, no-store'}})
 }catch(error){return apiError(error)}
}
