'use client'

import { useRef, useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

export function DeleteAccountButton() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Deletion failed')
      }

      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {setError(null);dialog.current?.showModal()}}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-700 transition hover:bg-red-500/20"
      >
        <Trash2 className="size-4" />
        Delete Account
      </button>

      <dialog ref={dialog} className="account-confirmation" aria-labelledby="delete-account-title" onCancel={event=>{if(isDeleting)event.preventDefault()}}>
        <AlertTriangle size={28} className="confirmation-warning" aria-hidden="true"/>
        <h3 id="delete-account-title">Delete Your Account?</h3>
        <p>This action is <strong>permanent and cannot be undone</strong>.</p>
        <p>Your sign-in account and local access will be removed. Institution-managed academic records and audit history are retained.</p>
        <p>If you sign up again later, you will need a new role approval.</p>
        {error&&<p className="confirmation-error" role="alert">{error}</p>}
        <div className="confirmation-actions">
          <button type="button" className="confirmation-cancel" autoFocus disabled={isDeleting} onClick={()=>{dialog.current?.close();setError(null)}}>Cancel</button>
          <button type="button" className="confirmation-danger" disabled={isDeleting} onClick={handleDelete}>{isDeleting?<><Loader2 size={16} className="animate-spin"/>Deleting…</>:<><Trash2 size={16}/>Yes, Delete My Account</>}</button>
        </div>
      </dialog>
    </>
  )
}
