'use client'
import {LocalizedInput,Label,LocalizedSelect,LocalizedButton} from '@/components/language'


import { useId, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { roles } from '@/lib/platform/access.mjs'
import {portals,rolePortal,validPortal} from '@/lib/platform/portals.mjs'

const information: Record<string, { scope: string; tasks: string[] }> = {
  institution_operator: { scope: 'Your institution’s submissions', tasks: ['Download a CSV or Excel template.', 'Upload the student batch and fix validation findings.', 'Submit the corrected batch to the Institution Head.'] },
  institution_head: { scope: 'Your institution’s batch approvals and certificates', tasks: ['Inspect the submitted batch and validation findings.', 'Request the demonstration OTP and confirm sign-off.', 'Issue certificates after sign-off; check QR links and PDF integrity.'] },
  regional_officer: { scope: 'Institutions within your assigned region', tasks: ['Explore the regional map and enrolment overview.', 'Review anomalies and resolve cases.', 'Export reports within your regional scope.'] },
  aicte_admin: { scope: 'National oversight', tasks: ['Explore the national map and enrolment overview.', 'Review anomalies and resolve cases.', 'Filter and export national reports.'] },
  external_verifier: { scope: 'Only the fields approved by the student', tasks: ['Request STU00001’s details using mock APAAR 990000000001.', 'Explain the purpose and select the required fields.', 'After student approval, inspect only the permitted fields before consent expires.'] },
  student: { scope: 'Your linked identity: STU00001 in the local demo', tasks: ['Review who requested your details and their purpose.', 'Choose which requested fields to share, then approve or reject.', 'Revoke an active approval whenever needed.'] },
  awarding_body: { scope: 'Certificates for your assigned institution', tasks: ['Find a record with completed Head sign-off.', 'Issue and download its signed certificate.', 'Check its QR destination and test PDF integrity with the public checker.'] },
  system_admin: { scope: 'System operations', tasks: ['Inspect service readiness and background delivery.', 'Review audit checkpoints.', 'Manage retention and backup readiness.'] },
}

export function RoleControls({ role, demo, entry = false, category }: { role: string; demo: boolean; entry?: boolean; category?: string }) {
  const group=validPortal(category)||rolePortal(role)
  const allowed=group?portals[group].roles:Object.keys(roles)
  const [selected, setSelected] = useState(role)
  const [switching, setSwitching] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  const label = roles[selected as keyof typeof roles] || 'Workspace role'
  const details = information[selected]

  return <div className="role-controls">
    {demo && <form action="/api/demo" method="post" onSubmit={() => setSwitching(true)} className="role-switch-form">
      {group&&<LocalizedInput type="hidden" name="category" value={group}/>}<label htmlFor={id} className={entry ? 'role-select-label' : 'sr-only'}><Label text={entry ? 'Choose a role' : 'Switch demo role'}/></label>
      <LocalizedSelect id={id} name="role" value={selected} onChange={event => {
        setSelected(event.target.value)
        if (!entry) event.currentTarget.form?.requestSubmit()
      }} aria-label={entry ? 'Choose a demo role' : 'Switch demo role'}>
        {Object.entries(roles).filter(([value])=>allowed.includes(value)).map(([value, name]) => <option key={value} value={value}><Label text={name}/></option>)}
      </LocalizedSelect>
      {entry && <LocalizedButton type="submit" className="button" disabled={switching}><Label text={switching ? 'Opening…' : 'Enter workspace →'}/></LocalizedButton>}
      {!entry && <noscript><LocalizedButton type="submit" className="button secondary"><Label text={"Switch role"}/></LocalizedButton></noscript>}
    </form>}
    <LocalizedButton type="button" className="role-info-button" aria-label={`About the ${label} role`} title="Role information" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><Info size={21} aria-hidden="true"/></LocalizedButton>
    <dialog ref={dialog} className="role-info-dialog" aria-labelledby={`${id}-title`} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="role-info-heading"><div><span className="eyebrow"><Label text={"ROLE INFORMATION"}/></span><h2 id={`${id}-title`}><Label text={label}/></h2></div><LocalizedButton type="button" className="role-dialog-close" aria-label="Close role information" onClick={() => dialog.current?.close()}><X size={20}/></LocalizedButton></div>
      {details && <><p className="role-info-scope"><Label text={details.scope}/></p><ol>{details.tasks.map(task => <li key={task}><Label text={task}/></li>)}</ol></>}
      {demo && <p className="role-info-note"><Label text={"Local demonstration with synthetic data. Switching perspectives opens that role’s focused workspace."}/></p>}
      <LocalizedButton type="button" className="button secondary" onClick={() => dialog.current?.close()}><Label text={"Got it"}/></LocalizedButton>
    </dialog>
  </div>
}
