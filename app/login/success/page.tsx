'use client'
import {Label,LocalizedAnchor} from '@/components/language'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
export default function LoginSuccessPage() {
  return <Suspense fallback={null}><LoginSuccessContent /></Suspense>
}
function LoginSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSigningOut = searchParams.get('mode') === 'logout'
  const requestedPath = searchParams.get('next')
  const nextPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\') ? requestedPath : (isSigningOut ? '/login?logged_out=1' : '/dashboard')
  useEffect(() => {
    const timer = setTimeout(() => router.replace(nextPath), 2400)
    return () => clearTimeout(timer)
  }, [nextPath, router])
  return <div className="auth-status" role="status"><div className="auth-check">✓</div><h1><Label text={isSigningOut ? 'You’re signed out' : 'Welcome to VIDYA'}/></h1><p><Label text={isSigningOut ? 'Your workspace session has ended.' : 'Opening your assigned workspace…'}/></p><LocalizedAnchor className="button" href={nextPath}><Label text={isSigningOut ? 'Return to sign in' : 'Continue to workspace'}/></LocalizedAnchor></div>
}
