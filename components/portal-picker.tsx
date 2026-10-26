'use client'
import {useEffect,useState} from 'react'
import {Building2,GraduationCap,Landmark,ShieldCheck} from 'lucide-react'
const portals=[{id:'student',label:'Student',icon:GraduationCap},{id:'institution_operator',label:'Institution',icon:Building2},{id:'regional_officer',label:'AICTE',icon:Landmark},{id:'external_verifier',label:'Verifier',icon:ShieldCheck}]
export function PortalPicker(){const [role,setRole]=useState('institution_operator')
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get('portal')||localStorage.getItem('vidya.requestedRole');if(value&&portals.some(p=>p.id===value)){setRole(value);localStorage.setItem('vidya.requestedRole',value)}},[])
 return <fieldset className="portal-picker"><legend>Choose your portal</legend><div>{portals.map(p=><button type="button" key={p.id} aria-pressed={role===p.id} onClick={()=>{setRole(p.id);localStorage.setItem('vidya.requestedRole',p.id)}}><p.icon size={20}/><span>{p.label}</span></button>)}</div><p>New here? Complete your role request after signing in. Existing accounts open their approved workspace.</p></fieldset>}
