import { AuthShell } from '@/components/auth-shell'
import {redirect} from 'next/navigation'
import {signedInDestination} from '@/lib/platform/login-destination'
export default async function Layout({children}:{children:React.ReactNode}) { const destination=await signedInDestination();if(destination)redirect(destination);return <AuthShell>{children}</AuthShell> }
