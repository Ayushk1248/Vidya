"use client"
import {useId,useRef,useSyncExternalStore} from 'react'
import {ArrowUpRight,BookOpen,Check,X} from 'lucide-react'
import {Label,LocalizedButton,LocalizedLink,useLocale} from './language'
import {roles} from '@/lib/platform/access.mjs'
import {portalPath,rolePortal} from '@/lib/platform/portals.mjs'
import {checkedGuideSteps,guideStorageKey,roleGuide} from '@/lib/platform/role-guides'
const memory=new Map<string,string>()
function subscribe(update:()=>void){window.addEventListener('vidya-guide-progress',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('vidya-guide-progress',update);window.removeEventListener('storage',update)}}
function read(key:string){try{return localStorage.getItem(key)||memory.get(key)||null}catch{return memory.get(key)||null}}
function write(key:string,steps:string[]){const value=JSON.stringify(steps);memory.set(key,value);try{localStorage.setItem(key,value)}catch{}window.dispatchEvent(new Event('vidya-guide-progress'))}
export function RoleWalkthrough({userId,role,active}:{userId:string;role:string;active:string}){
 const guide=roleGuide(role),key=guideStorageKey(userId,role),dialog=useRef<HTMLDialogElement>(null),titleId=useId(),{t}=useLocale()
 const raw=useSyncExternalStore(subscribe,()=>read(key),()=>null),checked=checkedGuideSteps(raw,guide?.steps||[])
 if(!guide)return null
 const next=guide.steps.find(step=>!checked.includes(step.id)),href=(path:string)=>portalPath(path,rolePortal(role))
 return <><aside className="role-guide-entry" aria-label={t('Your workspace guide')}><BookOpen size={19} aria-hidden="true"/><div><strong><Label text="Start here"/></strong><p><Label text={guide.summary}/></p></div><LocalizedButton type="button" className="button secondary" onClick={()=>dialog.current?.showModal()}><Label text="Open your guide"/><ArrowUpRight size={14} aria-hidden="true"/></LocalizedButton></aside>
 <dialog ref={dialog} className="role-walkthrough-dialog" aria-labelledby={titleId}><header><div><span className="eyebrow"><Label text="YOUR WORKSPACE GUIDE"/></span><h2 id={titleId}><Label text={roles[role as keyof typeof roles]}/></h2></div><LocalizedButton type="button" className="icon-button" aria-label="Close workspace guide" onClick={()=>dialog.current?.close()}><X size={20}/></LocalizedButton></header><p className="guide-summary"><Label text={guide.summary}/></p>
 {active==='security'&&<p className="feedback-info"><Label text="Review the security options shown on this page. Continue to your workspace when verification is not required."/></p>}
 <div className="guide-progress"><progress max={guide.steps.length} value={checked.length} aria-label={t('Personal checklist progress')}/><span><Label text={`${checked.length} of ${guide.steps.length} steps checked`}/></span></div><p className="guide-checklist-note"><Label text="Tick steps you have tried. These are personal reminders, not live approval or record statuses."/></p>
 <ol className="role-guide-steps">{guide.steps.map((step,index)=>{const done=checked.includes(step.id);return <li key={step.id} className={done?'guide-step-done':''}><span className="role-guide-number" aria-hidden="true">{done?<Check size={16}/>:index+1}</span><div><h3><Label text={step.title}/></h3><p><Label text={step.description}/></p><LocalizedLink href={href(step.href)} onClick={()=>dialog.current?.close()}><Label text={step.action}/><ArrowUpRight size={13} aria-hidden="true"/></LocalizedLink><label className="role-guide-check"><input type="checkbox" checked={done} aria-label={`${t('Mark step as tried')}: ${t(step.title)}`} onChange={event=>write(key,event.target.checked?[...checked,step.id]:checked.filter(id=>id!==step.id))}/><Label text="I have tried this step"/></label></div></li>})}</ol>
 <footer><LocalizedButton type="button" className="text-button" disabled={!checked.length} onClick={()=>write(key,[])}><Label text="Reset checklist"/></LocalizedButton>{next?<LocalizedLink className="button" href={href(next.href)} onClick={()=>dialog.current?.close()}><Label text="Next step"/>: <Label text={next.title}/></LocalizedLink>:<LocalizedButton type="button" className="button" onClick={()=>dialog.current?.close()}><Label text="Back to workspace"/></LocalizedButton>}</footer><p className="guide-checklist-note"><Label text="Your checklist is saved in this browser for this account and role. Guide links do not change permissions or perform actions."/></p></dialog></>
}
