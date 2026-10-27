'use client'
import {Label} from '@/components/language'

import { useRef } from 'react'
import { LogOut } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const dialog = useRef<HTMLDialogElement>(null)

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
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-[#142b49] transition hover:bg-slate-50"
      >
        <LogOut className="size-4" />
        Sign Out
      </button>

      <dialog ref={dialog} className="account-confirmation" aria-labelledby="signout-title">
        <h3 id="signout-title">Sign Out?</h3>
        <p>You can sign back in to return to your VIDYA workspace.</p>
        <div className="confirmation-actions">
          <button type="button" className="confirmation-cancel" autoFocus onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="button" className="confirmation-primary" onClick={handleSignOut}><Label text="Sign Out"/></button>
        </div>
      </dialog>
    </>
  )
}
