import {demoEnabled} from './demo.mjs';
const privilegedRoles=new Set(['aicte_admin','regional_officer','institution_head','system_admin']);
export function requiresPrivilegedMfa(actor,host=''){
 return privilegedRoles.has(actor.role)&&!actor.user_id.startsWith('demo-')&&!demoEnabled(host);
}
