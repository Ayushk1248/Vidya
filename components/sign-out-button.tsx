'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const [isConfirming, setIsConfirming] = useState(false)

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      window.location.href = '/'
      return
    }

    await supabase.auth.signOut()
    window.location.href = '/login/success?mode=logout'
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-[#142b49] transition hover:bg-slate-50"
      >
        <LogOut className="size-4" />
        Sign Out
      </button>

      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#142b49]">Sign Out?</h3>
            <p className="mt-2 text-sm text-slate-600">
              You can sign back in to return to your VIDYA workspace.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsConfirming(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#142b49] transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-[#142b49] px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}