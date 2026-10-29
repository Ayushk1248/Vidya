'use client'
import {LocalizedButton,Label} from '@/components/language'


import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false)
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
      <LocalizedButton
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
      >
        <Trash2 className="size-4" /><Label text={"Delete Account"}/></LocalizedButton>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-slate-900/95 p-6 shadow-2xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="size-6 text-red-400" />
            </div>

            <h3 className="text-xl font-semibold text-white"><Label text={"Delete Your Account?"}/></h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400"><Label text={"This action is "}/><strong className="text-white"><Label text={"permanent and cannot be undone"}/></strong><Label text={". All of your data will be immediately deleted."}/></p>
            <p className="mt-3 text-sm text-slate-400"><Label text={"If you sign up again later, you will start with a completely fresh account."}/></p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <Label text={error}/>
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <LocalizedButton
                onClick={() => {
                  setIsOpen(false)
                  setError(null)
                }}
                disabled={isDeleting}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              ><Label text={"Cancel"}/></LocalizedButton>
              <LocalizedButton
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /><Label text={"Deleting…"}/></>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /><Label text={"Yes, Delete My Account"}/></>
                )}
              </LocalizedButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}