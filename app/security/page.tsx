import {signedInUser} from '@/lib/platform/web-session'
import {actorFor} from '@/lib/platform/repository.mjs'
import {redirect} from 'next/navigation'
import {mfaState} from '@/lib/platform/mfa.mjs'
import {WorkspaceShell,PageHeading} from '@/components/workspace-shell'
import {SecurityCentre} from '@/components/security-centre'
export const dynamic='force-dynamic'
export default async function Security(){let user;try{user=await signedInUser()}catch{redirect('/login')}const actor=actorFor(user.id);if(!actor)redirect('/onboarding');return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||'Account'} active="security"><PageHeading eyebrow="ACCOUNT PROTECTION" title="A second layer for sensitive actions." description="Time-based authenticator codes, one-use recovery codes and short-lived privileged sessions."/><SecurityCentre enabled={!!mfaState(user.id).enabled} demo={user.id.startsWith('demo-')}/></WorkspaceShell>}
