import {cookies,headers} from 'next/headers'
import {unseal} from './tokens.mjs'
import {assignmentScope} from './account-roles.mjs'
import {requiresPrivilegedMfa} from './mfa-policy.mjs'
export async function privilegedSession(actor:{role:string;user_id:string;institution_id?:string|null;region?:string|null;student_id?:string|null}){if(!requiresPrivilegedMfa(actor,(await headers()).get('host')||''))return true;const value=unseal((await cookies()).get('vidya-mfa')?.value,'mfa');return value?.id===actor.user_id&&value?.scope===assignmentScope(actor)}
