'use client'
import {Label,LocalizedButton} from '@/components/language'

import {useEffect,useState} from 'react'
import {Building2,GraduationCap,Landmark,ShieldCheck} from 'lucide-react'
import {roles} from '@/lib/platform/access.mjs'
import {portals,validPortal,rolePortal,type PortalCategory} from '@/lib/platform/portals.mjs'
export function PortalPicker(){
 const [role,setRole]=useState('institution_operator'),[category,setCategory]=useState<PortalCategory|null>(null)
 useEffect(()=>{queueMicrotask(()=>{const requested=new URLSearchParams(window.location.search).get('portal')||'',group=validPortal(requested)||rolePortal(requested);const saved=localStorage.getItem('vidya.requestedRole');const next=group?(portals[group].roles.includes(requested)?requested:portals[group].roles.includes(saved||'')?saved!:portals[group].roles[0]):saved||'institution_operator';setCategory(group);setRole(next);localStorage.setItem('vidya.requestedRole',next)})},[])
 const visible=category?portals[category].roles:['student','institution_operator','institution_head','regional_officer','aicte_admin','external_verifier']
 return <fieldset className="portal-picker"><legend><Label text={category?'Choose your role · '+portals[category].label:'Choose your role'}/></legend><div>{visible.map(id=>{const Icon=id==='student'?GraduationCap:id==='external_verifier'?ShieldCheck:['aicte_admin','regional_officer','system_admin'].includes(id)?Landmark:Building2;return <LocalizedButton type="button" key={id} aria-pressed={role===id} onClick={()=>{setRole(id);localStorage.setItem('vidya.requestedRole',id)}}><Icon size={20}/><span><Label text={roles[id as keyof typeof roles]}/></span></LocalizedButton>})}</div><p><Label text={"Sign in once. Existing accounts open their approved workspace; new roles require approval."}/></p></fieldset>
}