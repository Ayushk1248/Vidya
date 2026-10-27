'use client'

import { PasswordInput } from '@/components/password-input'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updatePassword, updateUserProfile, isNewUser, getLinkedIdentities } from '@/lib/auth/supabase-auth'

export default function SetupProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [linkedProviders, setLinkedProviders] = useState<string[]>([])


  async function checkAndSetup() {
    try {
      const { isNew, error: newUserError } = await isNewUser()

      if (newUserError) {
        setError('Unable to verify your account. Please try logging in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      if (!isNew) {
        // User already has a profile
        const { identities, error: identError } = await getLinkedIdentities()
        if (!identError && identities) {
          const providers = identities.map((id) => id.provider)
          setLinkedProviders(providers)
          setInfo(
            `Your account is already set up with: ${providers.join(', ')}. Your profile was automatically restored.`
          )
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      // Get current user info for display
      const { data, error: userError } = await getCurrentUser()
      if (userError || !data?.user) {
        setError('Session expired. Please log in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Get linked identities to show which providers are connected
      const { identities } = await getLinkedIdentities()
      if (identities) {
        const providers = identities.map((id) => id.provider)
        setLinkedProviders(providers)
        if (providers.length > 1) {
          setInfo(
            `Your account is linked with: ${providers.join(', ')}. You can use any of these to sign in.`
          )
        }
      }

      setLoading(false)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void checkAndSetup() })
  }, [])

  async function handleSetupProfile() {
    setError('')

    if (!username.trim()) {
      setError('Please enter a display name.')
      return
    }

    if (username.trim().length < 3) {
      setError('Display name must be at least 3 characters.')
      return
    }

    if (!password) {
      setError('Please create a password so you can also sign in with your email.')
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

    setSaving(true)

    try {
      // Update password first
      const { error: passwordError } = await updatePassword(password)
      if (passwordError) {
        throw passwordError
      }

      // Then update profile
      const { error: profileError } = await updateUserProfile({
        username: username.trim(),
        display_name: username.trim(),
      })

      if (profileError) {
        throw profileError
      }

      // Profile updated successfully — show the success animation, then go to dashboard
      router.push('/login/success')
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to save profile. Please try again.'
      setError(messageText)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-0 items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 mx-auto" />
          <p className="text-sm text-slate-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  if (info && !error) {
    return (
      <div className="flex min-h-0 items-center justify-center bg-white p-4">
        <div className="text-center">
          <div className="mb-4 text-lg text-teal-700">✓</div>
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 max-w-sm mb-4">
            {info}
          </div>
          <p className="text-xs text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 items-center justify-center overflow-hidden bg-white p-4">

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm ">
        <div className="mb-6 text-center">
          <span className="text-3xl font-bold text-teal-700" aria-hidden="true">◎</span>
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold text-[#142b49]">Complete your profile</h1>
        <p className="mb-7 text-center text-sm text-slate-600">Set your display name and email password for VIDYA</p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {linkedProviders.length > 0 && (
          <p role="status" className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-center text-xs text-teal-700">
            Connected with: {linkedProviders.join(', ')}
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Display name</label>
              <input aria-label="Display name" autoComplete="nickname"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Password</label>
              <PasswordInput aria-label="Password" autoComplete="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
              />
              <p className="mt-1 text-xs text-slate-500">You&apos;ll be able to sign in with email + password or Google</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Confirm password</label>
              <PasswordInput aria-label="Confirm password" autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#142b49] outline-none placeholder:text-slate-500 focus:border-teal-600"
                onKeyDown={(e) => e.key === 'Enter' && handleSetupProfile()}
              />
            </div>

            <button
              type="button"
              onClick={handleSetupProfile}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#142b49] py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue to workspace'}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">You can change these settings later</p>
      </div>
    </div>
  )
}
