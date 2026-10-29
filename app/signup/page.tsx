'use client'
import {LocalizedInput,LocalizedButton,LocalizedAnchor} from '@/components/language'

import {Label} from '@/components/language'

import { PortalPicker } from '@/components/portal-picker'
import { GoogleSignIn } from '@/components/google-sign-in'
import { PasswordInput } from '@/components/password-input'

import { isSupabaseConfigured } from '@/lib/auth/config'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail } from '@/lib/auth/supabase-auth'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'email' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    function restorePage() {
      setLoading(null)
    }

    window.addEventListener('pageshow', restorePage)
    return () => window.removeEventListener('pageshow', restorePage)
  }, [])

  async function handleEmailSignup() {
    setError('')
    setSuccess('')

    if (!username.trim()) {
      setError('Please enter a display name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }

    if (!password) {
      setError('Please enter a password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading('email')

    try {
      const { data, error } = await signUpWithEmail(email.trim(), password, username.trim())

      if (error) {
        throw error
      }

      if (data?.user) {
        setSuccess('Account created! Check your email to verify your address, then you can log in.')
        setUsername('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(messageText)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-0 items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ">
        <h1 className="mb-2 text-center text-2xl font-bold text-[#142b49]"><Label text="Create your account"/></h1>
        <p className="mb-6 text-center text-sm text-slate-600"><Label text={"Create your VIDYA account. An administrator will assign your role and data access."}/></p>

        <PortalPicker />

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
            <Label text={error}/>
          </p>
        )}

        {success && (
          <p role="status" className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-center text-sm text-teal-800">
            <Label text={success}/>
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
            <label className="auth-field"><span><Label text={"Display name"}/></span><LocalizedInput aria-label="Display name" autoComplete="nickname"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display name"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
            /></label>
            <label className="auth-field"><span><Label text={"Email address"}/></span><LocalizedInput aria-label="Email address" autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
            /></label>
            <label className="auth-field"><span><Label text={"Password"}/></span><PasswordInput aria-label="Password" autoComplete="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
            /></label>
            <label className="auth-field"><span><Label text={"Confirm password"}/></span><PasswordInput aria-label="Confirm password" autoComplete="new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSignup()}
            /></label>
            <LocalizedButton
              type="button"
              onClick={handleEmailSignup}
              disabled={loading !== null || !isSupabaseConfigured()}
              className="flex w-full items-center justify-center rounded-lg bg-[#142b49] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Label text={loading === 'email' ? 'Creating account...' : 'Sign Up'}/>
            </LocalizedButton>
          </div>

          <p className="text-center text-sm text-slate-600"><Label text={"Already have an account?"}/><Label text={' '}/>
            <LocalizedAnchor href="/login" className="text-teal-700 hover:text-teal-700 transition"><Label text={"Sign In"}/></LocalizedAnchor>
          </p>
        </div>
      </div>
    </div>
  )
}
