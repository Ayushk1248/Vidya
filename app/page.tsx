
import {LocalizedLink,LocalizedAnchor} from '@/components/language'
import {LanguageToggle,Label} from '@/components/language'
import Link from 'next/link'
import {Building2,GraduationCap,Landmark,ShieldCheck,ArrowRight,CheckCircle2,FileText,LockKeyhole,ArrowUpRight} from 'lucide-react'
const portals=[{id:'students',label:'Students',icon:GraduationCap,text:'View academic records and control who can access your details.'},{id:'institutions',label:'Institutions',icon:Building2,text:'Explore approved programs, review records, and manage your team.'},{id:'aicte',label:'AICTE officers',icon:Landmark,text:'Monitor enrolment across your scope and review access requests.'},{id:'verifiers',label:'External verifiers',icon:ShieldCheck,text:'Request only the academic details a student agrees to share.'}]
export default function Home(){return <main className="portal home-v2">
<header className="topbar">
<LocalizedLink className="brand" href="/">
<Label text={"◎ VIDYA"}/>
<span>
<Label text={"STUDENT DATA PLATFORM"}/>
</span>
</LocalizedLink>
<nav className="home-nav">
<LanguageToggle/>
<LocalizedLink href="/demo">
<Label text={"Explore demo"}/>
</LocalizedLink>
<LocalizedAnchor href="#portals">
<Label text={"Who it’s for"}/>
</LocalizedAnchor>
<LocalizedAnchor href="#workflow">
<Label text={"How it works"}/>
</LocalizedAnchor>
<LocalizedLink className="button secondary" href="/signup"><Label text={"Create account"}/></LocalizedLink>
<LocalizedLink className="button" href="/dashboard">
<Label text={"Open workspace "}/>
<ArrowUpRight size={16}/>
</LocalizedLink>
</nav>
</header>
<section className="home-hero">
<div>
<div className="eyebrow">
<Label text={"SIH26263 · SMART INDIA HACKATHON PROTOTYPE"}/>
</div>
<h1>
<Label text={"Student records."}/>
<br/>
<em>
<Label text={"Verified with consent."}/>
</em>
</h1>
<p>
<Label text={"An APAAR-based workspace connecting institutions, students, and authorised verifiers through scoped access and student-controlled sharing."}/>
</p>
<div className="actions">
<LocalizedLink className="button" href="/dashboard">
<Label text={"Enter your workspace "}/>
<ArrowRight size={18}/>
</LocalizedLink>
<LocalizedAnchor className="text-button" href="#workflow">
<Label text={"Explore the platform ↓"}/>
</LocalizedAnchor>
</div>
<div className="hero-footnote">
<LockKeyhole size={14}/>
<Label text={"Synthetic records only · No official registry connection"}/>
</div>
</div>
<div className="hero-preview" aria-label="Illustrative platform preview">
<div className="preview-top">
<span className="live-dot"/>
<strong>
<Label text={"CONNECTED ACADEMIC RECORDS"}/>
</strong>
<span className="preview-label">
<Label text={"Prototype"}/>
</span>
</div>
<div className="preview-institution">
<div className="preview-icon">
<Building2 size={28}/>
</div>
<div>
<small>
<Label text={"INSTITUTION WORKSPACE"}/>
</small>
<h2>
<Label text={"Institution record overview"}/>
</h2>
</div>
</div>
<div className="preview-metrics">
<div>
<strong>100</strong>
<span>
<Label text={"Mock institutions"}/>
</span>
</div>
<div>
<strong>20,000</strong>
<span>
<Label text={"Seeded enrolments"}/>
</span>
</div>
</div>
<div className="preview-record">
<GraduationCap size={25}/>
<div>
<strong>
<Label text={"Academic identity"}/>
</strong>
<span>
<Label text={"APAAR · XXXX-XXXX-0001"}/>
</span>
</div>
<span className="source-badge">
<Label text={"Synthetic"}/>
</span>
</div>
<div className="preview-step">
<CheckCircle2 size={18}/>
<span>
<Label text={"Institution-scoped access"}/>
</span>
<span>01</span>
</div>
<div className="preview-step">
<CheckCircle2 size={18}/>
<span>
<Label text={"Student-controlled consent"}/>
</span>
<span>02</span>
</div>
<div className="preview-step">
<CheckCircle2 size={18}/>
<span>
<Label text={"Accountable access reviews"}/>
</span>
<span>03</span>
</div>
<div className="preview-bottom">
<ShieldCheck size={17}/>
<Label text={"Academic records shared with student approval."}/>
</div>
</div>
</section>
<section className="seed-strip">
<div>
<strong>100</strong>
<span>
<Label text={"synthetic institutions"}/>
</span>
</div>
<div>
<strong>300</strong>
<span>
<Label text={"programs in the master"}/>
</span>
</div>
<div>
<strong>5,000</strong>
<span>
<Label text={"mock academic identities"}/>
</span>
</div>
<div>
<strong>8</strong>
<span>
<Label text={"scoped platform roles"}/>
</span>
</div>
</section>
 <section className="home-section" id="portals">
<div className="eyebrow">
<Label text={"CHOOSE YOUR WORKSPACE"}/>
</div>
<h2>
<Label text="One account. Access matched to your responsibility."/>
</h2>
<p className="muted">
<Label text={"Open a portal in its own tab. Your sign-in is remembered; each portal shows its relevant roles."}/>
</p>
<div className="portal-card-grid">{portals.map(p=>
<LocalizedLink href={`/portal/${p.id}`} target="_blank" rel="noopener noreferrer" className="portal-card" key={p.id}>
<p.icon size={27}/>
<h3>
<Label text={p.label}/>
</h3>
<p>
<Label text={p.text}/>
</p>
<span>
<Label text={"Open portal "}/>
<ArrowRight size={16}/>
</span>
</LocalizedLink>)}</div>
</section>
 <section className="home-section workflow-section" id="workflow">
<div>
<div className="eyebrow">
<Label text={"ACCESS & CONSENT"}/>
</div>
<h2>
<Label text={"From sign-in to"}/>
<br/>
<Label text={"approved access."}/>
</h2>
<p className="muted">
<Label text={"Your role determines the records you can view. Students decide which details to share with external verifiers."}/>
</p>
<LocalizedLink href="/signup" className="button">
<Label text={"Create your account "}/>
<ArrowRight size={16}/>
</LocalizedLink>
</div>
<div className="home-steps">{[[LockKeyhole,'01','Create an account','Use Google or email, then request your role after signing in.'],[Building2,'02','Get your workspace approved','An authorised reviewer confirms your role and scope.'],[FileText,'03','Explore your academic records','See institution programs or your linked student profile.'],[ShieldCheck,'04','Share only with permission','Students approve selected fields for a limited time.']].map(([Icon,n,title,description])=>{const I=Icon as typeof ShieldCheck;return <div key={String(n)}>
<span><Label text={String(n)}/></span>
<I size={20}/>
<section>
<h3>
<Label text={String(title)}/>
</h3>
<p>
<Label text={String(description)}/>
</p>
</section>
</div>})}</div>
</section>
<footer className="home-footer">
<LocalizedLink className="brand" href="/">
<Label text={"◎ VIDYA"}/>
</LocalizedLink>
<p>
<Label text={"SIH26263 prototype · Built with synthetic data"}/>
<br/>
<Label text={"Not an official AICTE or Government of India service."}/>
</p>
<LocalizedLink href="/dashboard">
<Label text={"Access your workspace →"}/>
</LocalizedLink>
</footer>
</main>}