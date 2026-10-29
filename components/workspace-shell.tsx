
import {LocalizedLink} from '@/components/language'
import {rolePortal,portalPath,portals} from '@/lib/platform/portals.mjs'
import {RoleControls} from './role-controls'
import {LanguageToggle,Label} from './language'
import Link from 'next/link'
import {LayoutDashboard,FileText,Users,ShieldCheck,ArrowUpRight} from 'lucide-react'
import { SignOutButton } from './sign-out-button'
import type {Actor} from '@/lib/platform/repository.mjs'
import {roles} from '@/lib/platform/access.mjs'
import {workspaceNavigation} from '@/lib/platform/workspace-navigation'
export function WorkspaceShell({actor,name,active,children}:{actor:Actor;name:string;active:string;children:React.ReactNode}){
 const category=rolePortal(actor.role)
 const student=actor.role==='student',verifier=actor.role==='external_verifier',technical=actor.role==='system_admin'
 const icons={overview:LayoutDashboard,upload:FileText,anomaly:ShieldCheck,cases:Users,report:FileText,verification:ShieldCheck,certificate:ShieldCheck,admin:ShieldCheck}
 const links=workspaceNavigation(actor.role).map(link=>({...link,Icon:icons[link.icon]}))
 return <div className="portal"><header className="topbar"><LocalizedLink className="brand" href="/"><Label text={"◎ VIDYA"}/><span><Label text={"STUDENT DATA PLATFORM"}/></span></LocalizedLink><div className="actions"><div className="account-label"><strong><Label text={name}/></strong><span><Label text={roles[actor.role as keyof typeof roles]}/></span></div><LanguageToggle/><RoleControls role={actor.role} demo={actor.user_id.startsWith('demo-')} category={category||undefined}/><SignOutButton/></div></header>{actor.user_id.startsWith('demo-')&&<div className="demo-ribbon"><Label text={"LOCAL DEMO · Synthetic data · Roles are separate in each portal tab. Use the dropdown to switch within this portal."}/></div>}<div className="workspace workspace-v2"><aside className="sidebar"><div className="eyebrow"><Label text={category?portals[category].label.toUpperCase():'YOUR WORKSPACE'}/></div><nav aria-label="Workspace">{links.map(l=><LocalizedLink key={l.id} className={active===l.id?'nav-active':'nav-link'} href={portalPath(l.href,category)} aria-current={active===l.id?'page':undefined}><l.Icon size={18}/><Label text={l.label}/></LocalizedLink>)}</nav><div className="scope-box"><ShieldCheck size={19}/><strong><Label text={"Scoped access"}/></strong><span><Label text={actor.institution_id||actor.region|| (technical?'System operations only':student?'Your records only':verifier?'Student-approved fields':'National oversight')}/></span></div><LocalizedLink className="sidebar-home" href="/"><Label text={"About VIDYA "}/><ArrowUpRight size={14}/></LocalizedLink><div className="sidebar-foot"><Label text={"SIH26263"}/><br/><Label text={"Synthetic-data prototype"}/></div></aside><main className="content">{children}</main></div></div>
}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:React.ReactNode}){return <div className="section-heading"><div><div className="eyebrow"><Label text={eyebrow}/></div><h1><Label text={title}/></h1><p className="muted"><Label text={description}/></p></div>{children}</div>}
export function SyntheticNote(){return <div className="synthetic-note"><span className="live-dot"/><Label text={"SYNTHETIC DATA ONLY "}/><span><Label text={"Mock institutions and academic records. No live APAAR or AICTE connection."}/></span></div>}
