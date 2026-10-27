"use client"
import {useEffect,useSyncExternalStore,useRef} from 'react'
import {usePathname} from 'next/navigation'
import {MotionConfig,motion,useReducedMotion,animate} from 'framer-motion'
import {Check,ShieldCheck,Info} from 'lucide-react'
export function PresentationProvider({children}:{children:React.ReactNode}){
 const pathname=usePathname()
 useEffect(()=>{
  document.documentElement.dataset.theme='light'
  document.documentElement.style.colorScheme='light'
  // Clear the retired preference so existing browsers return to the white theme.
  try{localStorage.removeItem('vidya-theme');localStorage.removeItem('vidya.requestedRole')}catch{}
 },[])
 return <MotionConfig reducedMotion="user"><motion.div key={pathname} initial={{opacity:.7}} animate={{opacity:1}} transition={{duration:.18}}>{children}</motion.div></MotionConfig>
}
export function CountUp({value}:{value:number}){const ref=useRef<HTMLSpanElement>(null),reduce=useReducedMotion();useEffect(()=>{if(reduce||!ref.current)return;const node=ref.current;const control=animate(0,value,{duration:.65,onUpdate:n=>{node.textContent=Math.round(n).toLocaleString('en-IN')}});return()=>control.stop()},[value,reduce]);return <span><span className="sr-only">{value.toLocaleString('en-IN')}</span><span ref={ref} aria-hidden="true">{value.toLocaleString('en-IN')}</span></span>}
export function Skeleton({rows=3,label='Loading records'}:{rows?:number;label?:string}){return <div className="skeleton-panel" role="status" aria-label={label}><span className="sr-only">{label}</span>{Array.from({length:rows},(_,i)=><div key={i} className="skeleton-line" style={{width:`${100-i%3*18}%`}}/>)}</div>}
export function Feedback({message,tone='info'}:{message:string;tone?:'info'|'error'|'success'}){if(!message)return null;return <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className={`action-feedback ${tone}`} role={tone==='error'?'alert':'status'}><Info size={17}/><span>{message}</span></motion.div>}
const stages=['Institution','Upload','APAAR validation','Data verification','Central repository','Analytics','Authorised verification']
export function StageStepper({status}:{status?:string}){const current=status?({queued:1,processing:2,draft:3,review:3,signed_off:4,failed:1} as Record<string,number>)[status]:undefined;return <section className="stage-panel" aria-label="Student record workflow"><div className="stage-heading"><span className="eyebrow">THE RECORD JOURNEY</span><span>{status?'Current batch: '+status.replaceAll('_',' '):'From institution to consent-based verification'}</span></div><ol className="stage-stepper">{stages.map((label,i)=><li key={label} className={current===undefined?'':i<current?'complete':i===current?'current':''} aria-current={i===current?'step':undefined}><span className="stage-node">{current!==undefined&&i<current?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><span>{label}</span></li>)}</ol></section>}
export function RingGauge({value,label,tone='teal'}:{value:number|null;label:string;tone?:string}){const n=value===null?0:Math.max(0,Math.min(100,value));return <div className={`ring-gauge ${tone}`} role="img" aria-label={value===null?label+': unavailable':`${label}: ${value.toFixed(1)} out of 100`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="42"/><motion.circle className="ring-value" cx="50" cy="50" r="42" pathLength="100" strokeDasharray={`${n} 100`} initial={{strokeDashoffset:30}} animate={{strokeDashoffset:0}}/></svg><strong>{value===null?'—':Math.round(value)}<small>{value===null?'no score':label}</small></strong></div>}
export function Provenance({value}:{value:string}){return <span className={`provenance-badge ${value==='Registry-confirmed'?'confirmed':'submitted'}`}><ShieldCheck size={12}/>{value}</span>}

export function PresentationDialog({label,title,children}:{label:string;title:string;children:React.ReactNode}){const dialog=useRef<HTMLDialogElement>(null);return <><button type="button" className="text-button" onClick={()=>dialog.current?.showModal()}>{label}</button><dialog className="presentation-dialog" ref={dialog} aria-label={title} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}><header><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={()=>dialog.current?.close()}>×</button></header>{children}</dialog></>}

export function Sparkline({values,label}:{values:number[];label:string}){const max=Math.max(1,...values),min=Math.min(0,...values),span=max-min||1;const points=values.map((v,i)=>`${4+i*112/Math.max(1,values.length-1)},${35-(v-min)/span*30}`).join(' ');return <svg className="kpi-sparkline" viewBox="0 0 120 40" role="img" aria-label={label}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}

function clockSubscribe(fn:()=>void){const timer=setInterval(fn,1000);return()=>clearInterval(timer)}
export function ExpiryCountdown({expires}:{expires:string}){const now=useSyncExternalStore(clockSubscribe,()=>Math.floor(Date.now()/1000),()=>0),remaining=Math.max(0,Math.floor((Date.parse(expires)-now*1000)/1000));if(!now)return <span className="expiry-countdown">Time-limited access</span>;if(!Number.isFinite(remaining))return <span className="expiry-countdown">Check expiry details</span>;return <span className={`expiry-countdown ${remaining===0?'expired':''}`} title={`Expires ${expires}`}>{remaining===0?'Expired — refresh status':`${String(Math.floor(remaining/3600)).padStart(2,'0')}:${String(Math.floor(remaining%3600/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')} remaining`}</span>}
