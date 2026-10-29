
import {Label,LocalizedLink} from '@/components/language'
import Link from 'next/link'
import {Building2,Upload,ScanLine,ListChecks,Database,ChartNoAxesCombined,ShieldCheck} from 'lucide-react'
const stages=[
 {label:'Institution',detail:'Approved programs & intake',href:'/institutions',icon:Building2},
 {label:'Data upload',detail:'CSV, Excel or a single student',href:'/uploads',icon:Upload},
 {label:'APAAR checks',detail:'Identity & registry provenance',href:'/uploads',icon:ScanLine},
 {label:'Data verification',detail:'Findings, corrections & review',href:'/uploads',icon:ListChecks},
 {label:'Central repository',detail:'Signed-off, versioned records',href:'/records',icon:Database},
 {label:'Analytics',detail:'Peer-based anomaly review',href:'/anomalies',icon:ChartNoAxesCombined},
 {label:'Verification',detail:'Signed certificates & public checks',href:'/certificates',icon:ShieldCheck},
]
export function WorkflowJourney(){return <section className="card record-journey" aria-label="Academic record workflow"><div className="journey-heading"><div><div className="eyebrow"><Label text={"THE RECORD JOURNEY"}/></div><h2><Label text={"From institution data to verifiable records."}/></h2><p><Label text={"Jump into any stage. Your account’s permissions apply throughout."}/></p></div><span className="source-badge"><Label text={"7 connected stages"}/></span></div><nav className="journey-grid" aria-label="Record workflow stages">{stages.map((stage,index)=><LocalizedLink className="journey-step" href={stage.href} key={stage.label}><span><Label text={String(index+1).padStart(2,'0')}/> <stage.icon size={17}/></span><strong><Label text={stage.label}/></strong><small><Label text={stage.detail}/></small></LocalizedLink>)}</nav></section>}
