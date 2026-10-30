import {NextRequest} from 'next/server'
import {sessionActor,apiError} from '@/lib/platform/session'
import {managedAccounts} from '@/lib/platform/account-roles.mjs'
export const runtime='nodejs'
export async function GET(request:NextRequest){
 try{return Response.json(managedAccounts(await sessionActor(),request.nextUrl.searchParams.get('q')),{headers:{'Cache-Control':'private, no-store'}})}catch(error){return apiError(error)}
}
