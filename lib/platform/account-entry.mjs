import {portalPath,rolePortal} from './portals.mjs';
export function accountEntryDestination(actor,home,administrator=false){
 if(administrator)return actor?.role==='aicte_admin'?'/portal/aicte/access':'/administrator?error=administrator_required';
 if(!actor||!rolePortal(actor.role))return '/onboarding';
 return portalPath(home,rolePortal(actor.role));
}
