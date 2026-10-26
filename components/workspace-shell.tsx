import Link from 'next/link'
import {LayoutDashboard,Building2,FileText,Users,ShieldCheck,History,ArrowUpRight} from 'lucide-react'
import { SignOutButton } from './sign-out-button'
import type {Actor} from '@/lib/platform/repository.mjs'
import {roles} from '@/lib/platform/access.mjs'
export function WorkspaceShell({actor,name,active,children}:{actor:Actor;name:string;active:string;children:React.ReactNode}){
 const student=actor.role==='student',verifier=actor.role==='external_verifier'
 const links=[{id:'overview',href:'/dashboard',label:'Overview',icon:LayoutDashboard},
 ...(!student&&!verifier?[{id:'institutions',href:'/institutions',label:actor.institution_id?'My institution':'Institutions',icon:Building2}]:[]),
 ...(!student&&!verifier?[{id:'uploads',href:'/uploads',label:'Upload Centre',icon:FileText}]:[]),
 ...(!student&&!verifier?[{id:'anomalies',href:'/anomalies',label:'Anomaly Centre',icon:ShieldCheck}]:[]),
 ...(!verifier?[{id:'records',href:'/records',label:student?'My academic records':'Student records',icon:FileText}]:[]),
 ...(!verifier?[{id:'certificates',href:'/certificates',label:student?'My certificates':'Certificates',icon:ShieldCheck}]:[]),
 ...(['aicte_admin','institution_head'].includes(actor.role)?[{id:'access',href:'/access',label:'Access management',icon:Users}]:[]),
 ...(student||verifier?[{id:'verification',href:'/verification',label:student?'Consent centre':'Verification requests',icon:ShieldCheck}]:[]),
 {id:'activity',href:'/activity',label:'Activity log',icon:History}]
 return <div className="portal"><header className="topbar"><Link className="brand" href="/">◎ VIDYA<span>STUDENT DATA PLATFORM</span></Link><div className="actions"><div className="account-label"><strong>{name}</strong><span>{roles[actor.role as keyof typeof roles]}</span></div><SignOutButton/></div></header><div className="workspace workspace-v2"><aside className="sidebar"><div className="eyebrow">YOUR WORKSPACE</div><nav aria-label="Workspace">{links.map(l=><Link key={l.id} className={active===l.id?'nav-active':'nav-link'} href={l.href} aria-current={active===l.id?'page':undefined}><l.icon size={18}/>{l.label}</Link>)}</nav><div className="scope-box"><ShieldCheck size={19}/><strong>Scoped access</strong><span>{actor.institution_id||actor.region|| (student?'Your records only':verifier?'Student-approved fields':'National oversight')}</span></div><Link className="sidebar-home" href="/">About VIDYA <ArrowUpRight size={14}/></Link><div className="sidebar-foot">SIH26263<br/>Synthetic-data prototype</div></aside><main className="content">{children}</main></div></div>
}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:React.ReactNode}){return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="muted">{description}</p></div>{children}</div>}
export function SyntheticNote(){return <div className="synthetic-note"><span className="live-dot"/>SYNTHETIC DATA ONLY <span>Mock institutions and academic records. No live APAAR or AICTE connection.</span></div>}
