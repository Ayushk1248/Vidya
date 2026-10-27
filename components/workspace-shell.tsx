import {RoleControls} from './role-controls'
import {LanguageToggle,Label} from './language'
import Link from 'next/link'
import {LayoutDashboard,FileText,Users,ShieldCheck,ArrowUpRight} from 'lucide-react'
import { SignOutButton } from './sign-out-button'
import type {Actor} from '@/lib/platform/repository.mjs'
import {roles} from '@/lib/platform/access.mjs'
import {workspaceNavigation} from '@/lib/platform/workspace-navigation'
export function WorkspaceShell({actor,name,active,children}:{actor:Actor;name:string;active:string;children:React.ReactNode}){
 const student=actor.role==='student',verifier=actor.role==='external_verifier',technical=actor.role==='system_admin'
 const icons={overview:LayoutDashboard,upload:FileText,anomaly:ShieldCheck,cases:Users,report:FileText,verification:ShieldCheck,certificate:ShieldCheck,admin:ShieldCheck}
 const links=workspaceNavigation(actor.role).map(link=>({...link,Icon:icons[link.icon]}))
 return <div className="portal"><header className="topbar"><Link className="brand" href="/">◎ VIDYA<span>STUDENT DATA PLATFORM</span></Link><div className="actions"><div className="account-label"><strong>{name}</strong><span>{roles[actor.role as keyof typeof roles]}</span></div><LanguageToggle/><RoleControls role={actor.role} demo={actor.user_id.startsWith('demo-')}/>{!actor.user_id.startsWith('demo-')&&<SignOutButton/>}</div></header>{actor.user_id.startsWith('demo-')&&<div className="demo-ribbon">LOCAL DEMO · Synthetic data · Use the role dropdown above to switch perspectives.</div>}<div className="workspace workspace-v2"><aside className="sidebar"><div className="eyebrow">YOUR WORKSPACE</div><nav aria-label="Workspace">{links.map(l=><Link key={l.id} className={active===l.id?'nav-active':'nav-link'} href={l.href} aria-current={active===l.id?'page':undefined}><l.Icon size={18}/><Label text={l.label}/></Link>)}</nav><div className="scope-box"><ShieldCheck size={19}/><strong>Scoped access</strong><span>{actor.institution_id||actor.region|| (technical?'System operations only':student?'Your records only':verifier?'Student-approved fields':'National oversight')}</span></div><Link className="sidebar-home" href="/">About VIDYA <ArrowUpRight size={14}/></Link><div className="sidebar-foot">SIH26263<br/>Synthetic-data prototype</div></aside><main className="content">{children}</main></div></div>
}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:React.ReactNode}){return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1><Label text={title}/></h1><p className="muted"><Label text={description}/></p></div>{children}</div>}
export function SyntheticNote(){return <div className="synthetic-note"><span className="live-dot"/>SYNTHETIC DATA ONLY <span>Mock institutions and academic records. No live APAAR or AICTE connection.</span></div>}
