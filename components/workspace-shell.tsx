import {RoleControls} from './role-controls'
import {LanguageToggle,Label} from './language'
import { SignOutButton } from './sign-out-button'
import type {Actor} from '@/lib/platform/repository.mjs'
import {WorkspaceChrome} from './workspace-chrome'
export function WorkspaceShell({actor,name,active,children}:{actor:Actor;name:string;active:string;children:React.ReactNode}){
 // SQLite rows have a null prototype, which React cannot send to a Client Component.
 // Project only the role/scope fields required by the presentation layer.
 const viewActor:Actor={user_id:actor.user_id,role:actor.role,institution_id:actor.institution_id,region:actor.region,student_id:actor.student_id}
 return <WorkspaceChrome actor={viewActor} name={name} active={active} controls={<><LanguageToggle/><RoleControls role={actor.role} demo={actor.user_id.startsWith('demo-')}/>{!actor.user_id.startsWith('demo-')&&<SignOutButton/>}</>}>{children}</WorkspaceChrome>
}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:React.ReactNode}){return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1><Label text={title}/></h1><p className="muted"><Label text={description}/></p></div>{children}</div>}
export function SyntheticNote(){return <div className="synthetic-note"><span className="live-dot"/>SYNTHETIC DATA ONLY <span>Mock institutions and academic records. No live APAAR or AICTE connection.</span></div>}
