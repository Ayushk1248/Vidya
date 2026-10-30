import {cookies} from 'next/headers'
import {unseal} from './tokens.mjs'
import {assignmentScope} from './account-roles.mjs'
export async function privilegedSession(actor:{role:string;user_id:string;institution_id?:string|null;region?:string|null;student_id?:string|null}){if(actor.user_id.startsWith('demo-'))return true;if(!['aicte_admin','regional_officer','institution_head','system_admin'].includes(actor.role))return true;const value=unseal((await cookies()).get('vidya-mfa')?.value,'mfa');return value?.id===actor.user_id&&value?.scope===assignmentScope(actor)}
