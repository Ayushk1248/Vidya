export type WorkspaceLink = {
  id: string
  href: string
  label: string
  icon: 'overview' | 'upload' | 'anomaly' | 'cases' | 'report' | 'verification' | 'certificate' | 'admin'
}

const upload: WorkspaceLink = { id: 'uploads', href: '/uploads', label: 'Upload Centre', icon: 'upload' }
const certificates: WorkspaceLink = { id: 'certificates', href: '/certificates', label: 'Certificates', icon: 'certificate' }
const oversight: WorkspaceLink[] = [
  { id: 'overview', href: '/dashboard', label: 'Map & Overview', icon: 'overview' },
  { id: 'anomalies', href: '/anomalies', label: 'Anomaly Centre', icon: 'anomaly' },
  { id: 'cases', href: '/cases', label: 'Cases & queries', icon: 'cases' },
  { id: 'reports', href: '/reports', label: 'Reports', icon: 'report' },
]

// The workspace menu follows the demonstration responsibilities, rather than
// exposing every section whose data happens to fall within a user's scope.
const navigation: Record<string, WorkspaceLink[]> = {
  institution_operator: [upload],
  institution_head: [{ ...upload, label: 'Batch Review' }, certificates,{id:'access',href:'/access',label:'Access management',icon:'admin'}],
  aicte_admin: [...oversight,{id:'access',href:'/access',label:'Access management',icon:'admin'}],
  regional_officer: oversight,
  external_verifier: [{ id: 'verification', href: '/verification', label: 'Verification requests', icon: 'verification' }],
  student: [
    { id: 'verification', href: '/verification', label: 'Consent centre', icon: 'verification' },
    { id: 'records', href: '/records', label: 'My records', icon: 'report' },
    { ...certificates, label: 'My certificates' },
  ],
  awarding_body: [certificates],
  system_admin: [{ id: 'admin', href: '/admin', label: 'System administration', icon: 'admin' }],
}

export function workspaceNavigation(role: string) {
  return navigation[role] || []
}

export function workspaceHome(role: string) {
  return workspaceNavigation(role)[0]?.href || '/onboarding'
}
