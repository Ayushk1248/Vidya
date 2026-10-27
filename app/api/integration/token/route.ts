import {accessToken} from '@/lib/platform/integrations.mjs'
import {apiError} from '@/lib/platform/session'
import {AccessError} from '@/lib/platform/access.mjs'
export async function POST(request:Request){try{const f=await request.formData();if(f.get('grant_type')!=='client_credentials')throw new AccessError('Use grant_type=client_credentials',400);let id=String(f.get('client_id')||''),secret=String(f.get('client_secret')||'');const basic=request.headers.get('authorization');if(basic?.startsWith('Basic ')){const value=Buffer.from(basic.slice(6),'base64').toString();const i=value.indexOf(':');id=value.slice(0,i);secret=value.slice(i+1)}return Response.json(accessToken(id,secret),{headers:{'Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
