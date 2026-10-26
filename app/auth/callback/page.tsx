'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleOAuthCallback } from '@/lib/auth/supabase-auth'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-0 items-center justify-center bg-white p-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 mx-auto" />
          <p className="text-sm text-slate-600">Signing you in...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

function AuthCallbackContent() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    processCallback()
  }, [])

  async function processCallback() {
    try {
      const result = await handleOAuthCallback()

      if (!result.success) {
        setError(result.error?.message || 'Authentication failed')
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(result.error?.message || 'Authentication failed')}`)
        }, 2000)
        return
      }

      if (result.redirectUrl === '/setup-profile') {
        // New user: go directly to profile setup; success animation plays after they submit
        router.replace('/setup-profile')
      } else {
        // Returning user: show success animation, then go to the final destination
        router.replace(`/login/success?next=${encodeURIComponent(result.redirectUrl)}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setTimeout(() => {
        router.push(`/login?error=${encodeURIComponent(message)}`)
      }, 2000)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex min-h-0 items-center justify-center bg-white p-4">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 mx-auto" />
            <p className="text-sm text-slate-600">Signing you in...</p>
          </>
        ) : error ? (
          <>
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-sm">
              <p className="font-medium">Authentication Error</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
            <p className="text-xs text-slate-500 mt-4">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="mb-4 text-lg text-teal-700">✓</div>
            <p className="text-sm text-slate-600">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  )
}