'use client'
import {Label,LocalizedInput,LocalizedButton,LocalizedAnchor} from '@/components/language'


import { PortalPicker } from '@/components/portal-picker'
import { GoogleSignIn } from '@/components/google-sign-in'
import { PasswordInput } from '@/components/password-input'

import { authErrorMessage, isSupabaseConfigured } from '@/lib/auth/config'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmail } from '@/lib/auth/supabase-auth'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-0 items-center justify-center bg-white">
        <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<'email' | null>(null)
  const [error, setError] = useState(authErrorMessage(searchParams.get('error') || ''))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    function restorePage() {
      setLoading(null)
    }

    window.addEventListener('pageshow', restorePage)
    return () => window.removeEventListener('pageshow', restorePage)
  }, [])

  async function handleEmailLogin() {
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading('email')

    try {
      const { data, error } = await signInWithEmail(email.trim(), password)

      if (error) {
        throw error
      }

      if (data?.user) {
        router.push('/login/success?next=' + encodeURIComponent('/dashboard'))
      }
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(/invalid login credentials/i.test(messageText) ? 'Invalid email or password.' : messageText)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-0 items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ">
        <h1 className="mb-2 text-center text-2xl font-bold text-[#142b49]"><Label text={"Welcome back"}/></h1>
        <p className="mb-6 text-center text-sm text-slate-600"><Label text={"Sign in to your VIDYA workspace"}/></p>

        <PortalPicker />

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
            <Label text={error}/>
          </p>
        )}

        <div className="space-y-4">
          <GoogleSignIn disabled={loading !== null || !isSupabaseConfigured()} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-600"><Label text={"Or"}/></span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="auth-field"><span><Label text={"Email address"}/></span><LocalizedInput aria-label="Email address" autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            /></label>
            <label className="auth-field"><span><Label text={"Password"}/></span><PasswordInput aria-label="Password" autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            /></label>
            <LocalizedButton
              type="button"
              onClick={handleEmailLogin}
              disabled={loading !== null || !isSupabaseConfigured()}
              className="flex w-full items-center justify-center rounded-lg bg-[#142b49] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Label text={loading === 'email' ? 'Signing in...' : 'Sign In'}/>
            </LocalizedButton>
          </div>

          <div className="space-y-2 text-center text-sm">
            <LocalizedAnchor href="/forgot-password" className="block text-teal-700 hover:text-teal-700 transition"><Label text={"Forgot Password?"}/></LocalizedAnchor>
            <p className="text-slate-600"><Label text={"Don't have an account?"}/><Label text={' '}/>
              <LocalizedAnchor href="/signup" className="text-teal-700 hover:text-teal-700 transition"><Label text={"Sign Up"}/></LocalizedAnchor>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}