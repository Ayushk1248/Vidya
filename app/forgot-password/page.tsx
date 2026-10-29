'use client'
import {Label,LocalizedInput,LocalizedButton} from '@/components/language'


import { PasswordInput } from '@/components/password-input'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeRecoverySessionFromUrl, sendPasswordResetEmail, updatePassword } from '@/lib/auth/supabase-auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [canSetPassword, setCanSetPassword] = useState(false)

  useEffect(() => {
    const initializeRecovery = async () => {
      const query = new URLSearchParams(window.location.search)
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const isRecoveryLink = query.has('code') || (query.get('type') === 'recovery' && query.has('token_hash')) || (fragment.get('type') === 'recovery' && fragment.has('access_token'))
      if (!isRecoveryLink) return
      const { error } = await completeRecoverySessionFromUrl()
      if (error) {
        setError('This reset link is invalid or has expired.')
        return
      }

      setCanSetPassword(true)
    }

    initializeRecovery()
  }, [])

  async function handleSendResetEmail() {
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const { error } = await sendPasswordResetEmail(email)

      if (error) {
        throw error
      }

      setSubmitted(true)
      setSuccess('If an account exists for that email, a password reset email has been sent.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword() {
    setError('')
    setSuccess('')

    if (!password) {
      setError('Please enter a new password.')
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

    setLoading(true)

    try {
      const { error } = await updatePassword(password)

      if (error) {
        throw error
      }

      setSuccess('Password updated successfully. Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-0 items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ">
        <h1 className="mb-2 text-center text-2xl font-bold text-[#142b49]">
          <Label text={canSetPassword ? 'Set New Password' : 'Reset Password'}/>
        </h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          <Label text={canSetPassword ? 'Choose a new password for your account.' : 'Enter your email to receive a reset link.'}/>
        </p>

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

        {!canSetPassword ? (
          <div className="space-y-3">
            <label className="auth-field"><span><Label text={"Email address"}/></span><LocalizedInput aria-label="Email address" autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              onKeyDown={(e) => e.key === 'Enter' && handleSendResetEmail()}
            /></label>
            <LocalizedButton
              type="button"
              onClick={handleSendResetEmail}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-[#142b49] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Label text={loading ? 'Sending...' : submitted ? 'Resend Email' : 'Send Reset Email'}/>
            </LocalizedButton>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="auth-field"><span><Label text={"Password"}/></span><PasswordInput aria-label="Password" autoComplete="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
            /></label>
            <label className="auth-field"><span><Label text={"Confirm password"}/></span><PasswordInput aria-label="Confirm password" autoComplete="new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
            /></label>
            <LocalizedButton
              type="button"
              onClick={handleUpdatePassword}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-[#142b49] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Label text={loading ? 'Updating...' : 'Update Password'}/>
            </LocalizedButton>
          </div>
        )}

        <div className="mt-5 text-center">
          <LocalizedButton
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm text-teal-700 hover:text-teal-700 transition"
          ><Label text={"Back to Sign In"}/></LocalizedButton>
        </div>
      </div>
    </div>
  )
}