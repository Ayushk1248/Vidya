"use client";
import {LocalizedButton,LocalizedSelect,LocalizedAnchor,LocalizedLink} from '@/components/language'

import {SuggestedInput} from '@/components/data-suggestions'
import {Label,useLocale} from '@/components/language'
import {useState} from 'react';
import {clientPortalPath} from '@/lib/platform/portals.mjs';
import Link from 'next/link';
import type {DashboardData} from '@/lib/platform/dashboard.mjs';
import {RingGauge} from './presentation'
import stateMap from '@/lib/platform/india-states.json'
import map from '@/lib/platform/india-map.json';
const locations:Record<string,[number,number]>={'Delhi':[77.2,28.6],'Punjab':[75.3,31.1],'Maharashtra':[75.7,19.7],'Gujarat':[71.2,22.6],'Tamil Nadu':[78.7,11.1],'Karnataka':[75.7,14.5],'West Bengal':[87.8,23.5],'Odisha':[84.4,20.5],'Madhya Pradesh':[78.5,23.9],'Assam':[92.7,26.2]};
const number=(v:number)=>v.toLocaleString('en-IN');
export function NationalExplorer({data,initial={}}:{data:DashboardData;initial?:{region?:string;state?:string;institution?:string;program?:string}}){
 const {t}=useLocale();
 const [region,setRegion]=useState(initial.region||''),[state,setState]=useState(initial.state||''),[institution,setInstitution]=useState(initial.institution||''),[program,setProgram]=useState(initial.program||'');
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1);
 function select(r='',s='',i='',p=''){setRegion(r);setState(s);setInstitution(i);setProgram(p);setPage(1);const q=new URLSearchParams({year:String(data.year)});Object.entries({region:r,state:s,institution:i,program:p}).forEach(([k,v])=>{if(v)q.set(k,v)});window.history.replaceState(null,'',clientPortalPath('/dashboard?'+q.toString()))}
 const regions=[...new Set(data.institutions.map(i=>i.region))].sort(),states=[...new Set(data.institutions.filter(i=>!region||i.region===region).map(i=>i.state))].sort();
 const eligible=data.institutions.filter(i=>(!region||i.region===region)&&(!state||i.state===state));
 const selected=eligible.filter(i=>!institution||i.id===institution),ids=new Set(selected.map(i=>i.id));
 const ps=data.programs.filter(p=>ids.has(p.institution_id)&&(!program||p.id===program));
 const sum=(key:'intake'|'enrolments'|'within_count'|'supernumerary')=>ps.reduce((n,p)=>n+p[key],0);
 const groups=institution?data.programs.filter(p=>p.institution_id===institution&&(!program||p.id===program)).map(p=>({id:p.id,name:p.name,ps:[p]})):state?selected.map(i=>({id:i.id,name:i.name,ps:ps.filter(p=>p.institution_id===i.id)})):region?states.map(s=>({id:s,name:s,ps:ps.filter(p=>data.institutions.some(i=>i.id===p.institution_id&&i.state===s))})):regions.map(r=>({id:r,name:r,ps:ps.filter(p=>data.institutions.some(i=>i.id===p.institution_id&&i.region===r))}));
 const stateTotals=Object.fromEntries(stateMap.states.map(s=>[s.name,data.programs.filter(p=>data.institutions.some(i=>i.id===p.institution_id&&i.state===s.name&&(!region||i.region===region))).reduce((n,p)=>n+p.enrolments,0)]));
 const maxState=Math.max(1,...Object.values(stateTotals));
 const max=Math.max(1,...groups.flatMap(g=>[g.ps.reduce((n,p)=>n+p.intake,0),g.ps.reduce((n,p)=>n+p.within_count,0)]));
 const tracker=data.tracker.filter(i=>ids.has(i.id)&&(!status||i.deadline_status===status||i.status===status)&&`${i.name} ${i.id}`.toLowerCase().includes(search.toLowerCase()));
 const pages=Math.max(1,Math.ceil(tracker.length/10)),current=Math.min(page,pages);
 const batches=data.uploads.filter(b=>ids.has(b.institution_id));
 return <section className="national-explorer" aria-label="Geographic enrolment explorer">
 <div className="card explorer-toolbar">
<div className="table-title">
<div>
<div className="eyebrow">
<Label text={"EXPLORE THE NETWORK"}/>
</div>
<h2>
<Label text="From national picture to program detail"/>
</h2>
</div>
<LocalizedButton className="button secondary" onClick={()=>select()}>
<Label text={"Reset view"}/>
</LocalizedButton>
</div>
 <nav className="explorer-crumbs" aria-label="Dashboard drill-down">
<LocalizedButton onClick={()=>select()}>
<Label text={"Your scope"}/>
</LocalizedButton>{region&&<>
<span>/</span>
<LocalizedButton onClick={()=>select(region)}>
<Label text={region}/>
</LocalizedButton>
</>}{state&&<>
<span>/</span>
<LocalizedButton onClick={()=>select(region,state)}>
<Label text={state}/>
</LocalizedButton>
</>}{institution&&<>
<span>/</span>
<LocalizedButton onClick={()=>select(region,state,institution)}>
<Label text={institution}/>
</LocalizedButton>
</>}{program&&<>
<span>/</span>
<span>
<Label text={program}/>
</span>
</>}</nav>
 <div className="explorer-filters">
<label>
<Label text={"Region"}/>
<LocalizedSelect value={region} onChange={e=>select(e.target.value)}>
<option value="">
<Label text={"All in scope"}/>
</option>{regions.map(v=>
<option key={v} value={v}>
<Label text={v}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"State"}/>
<LocalizedSelect value={state} onChange={e=>{const i=data.institutions.find(i=>i.state===e.target.value);select(i?.region||region,e.target.value)}}>
<option value="">
<Label text={"All states"}/>
</option>{states.map(v=>
<option key={v} value={v}>
<Label text={v}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"Institution"}/>
<LocalizedSelect value={institution} onChange={e=>{const i=data.institutions.find(i=>i.id===e.target.value);select(i?.region||region,i?.state||state,e.target.value)}}>
<option value="">
<Label text={"All institutions"}/>
</option>{eligible.map(i=>
<option key={i.id} value={i.id}>
<Label text={i.name}/>
</option>)}</LocalizedSelect>
</label>
<label>
<Label text={"Program"}/>
<LocalizedSelect value={program} disabled={!institution} onChange={e=>select(region,state,institution,e.target.value)}>
<option value="">
<Label text={"All programs"}/>
</option>{data.programs.filter(p=>p.institution_id===institution).map(p=>
<option key={p.id} value={p.id}>
<Label text={p.name}/>
</option>)}</LocalizedSelect>
</label>
</div>
 <div className="explorer-totals" aria-live="polite">
<div>
<strong>
<Label text={number(selected.length)}/>
</strong>
<span>
<Label text={"institutions selected"}/>
</span>
</div>
<div>
<strong>
<Label text={number(sum('intake'))}/>
</strong>
<span>
<Label text={"approved intake"}/>
</span>
</div>
<div>
<strong>
<Label text={number(sum('within_count'))}/>
</strong>
<span>
<Label text={"within-intake enrolments"}/>
</span>
</div>
<div>
<strong>
<Label text={number(sum('supernumerary'))}/>
</strong>
<span>
<Label text={"supernumerary · separate"}/>
</span>
</div>
</div>
</div>
 <div className="dashboard-columns geographic-columns">
<section className="card">
<div className="table-title">
<div>
<h2>
<Label text={"India · enrolment footprint"}/>
</h2>
<p>
<Label text={"Select a state marker to explore its institutions."}/>
</p>
</div>
</div>
<svg viewBox="0 0 470 450" className="india-footprint" aria-label="Illustrative India map with selectable state enrolment markers">
<path d={map.path} className="india-country-outline"/>{stateMap.states.map(shape=>{const schools=data.institutions.filter(i=>i.state===shape.name&&(!region||i.region===region));const count=stateTotals[shape.name]||0;return <path key={shape.name} d={shape.path} className={`state-area ${state===shape.name?'selected':''} ${schools.length?'has-data':''}`} style={{fill:schools.length?`rgba(20,184,166,${.16+count/maxState*.7})`:undefined}} role={schools.length?'button':undefined} tabIndex={schools.length?0:undefined} aria-label={`${shape.name}: ${schools.length?number(count)+' seeded enrolments':'no seeded institutions in this scope'}`} onClick={()=>{if(schools.length)select(schools[0].region,shape.name)}} onKeyDown={e=>{if(schools.length&&(e.key==='Enter'||e.key===' ')){e.preventDefault();select(schools[0].region,shape.name)}}}>
<title>{t(`${shape.name}: ${schools.length?number(count)+' seeded enrolments':'no seeded institutions in this scope'}`)}</title>
</path>})}{Object.entries(locations).map(([s,[lon,lat]])=>{const schools=data.institutions.filter(i=>i.state===s&&(!region||i.region===region));if(!schools.length)return null;const count=data.programs.filter(p=>schools.some(i=>i.id===p.institution_id)).reduce((n,p)=>n+p.enrolments,0);return <g key={s} role="button" tabIndex={0} aria-label={`${s}: ${number(count)} enrolments. Select state.`} onClick={()=>select(schools[0].region,s)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(schools[0].region,s)}}} className={`map-marker ${state===s?'selected':''}`}>
<title>{t(`${s}: ${number(count)} enrolments`)}</title>
<circle cx={(lon-67)*14+20} cy={(37-lat)*14+15} r={7+Math.sqrt(count)/6}/>
<text x={(lon-67)*14+20} y={(37-lat)*14+39} textAnchor="middle">
<Label text={s}/>
</text>
</g>})}</svg>
<div className="choropleth-legend">
<span><Label text={"No seeded data"}/></span>
<i/>
<span><Label text={"Higher enrolment"}/></span>
</div>
<p className="small muted"><Label text={"State shading and marker area indicate enrolment volume in seeded states; unmarked areas have no seeded institutions in this scope. Approximate state locations."}/></p>
<p className="small muted">
<Label text={"Marker area indicates enrolment volume in seeded states; unmarked areas have no seeded institutions in this scope. Approximate state locations."}/>
</p>
<p className="small muted">
<LocalizedAnchor href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">
<Label text={"Natural Earth"}/>
</LocalizedAnchor>
<Label text={"illustrative outline · not an official boundary map."}/>
</p>
</section>
 <section className="card">
<div className="table-title">
<div>
<h2>
<Label text="Intake versus enrolment"/>
</h2>
<p>
<Label text={institution?'Programs':state?'Institutions':region?'States':'Regions'}/> · <Label text={data.year}/>–<Label text={String(data.year+1).slice(-2)}/>
</p>
</div>
</div>
<div className="capacity-legend">
<span>
<i className="intake-key"/>
<Label text={"Approved intake"}/>
</span>
<span>
<i/>
<Label text={"Within-intake enrolments"}/>
</span>
</div>
<div className="comparison-bars">{groups.map(g=>{const intake=g.ps.reduce((n,p)=>n+p.intake,0),within=g.ps.reduce((n,p)=>n+p.within_count,0),supernum=g.ps.reduce((n,p)=>n+p.supernumerary,0);return <div className="comparison-row" key={g.id}>
<LocalizedButton onClick={()=>{if(institution)select(region,state,institution,g.id);else if(state)select(region,state,g.id);else if(region)select(region,g.id);else select(g.id)}}>
<Label text={g.name}/> <span>→</span>
</LocalizedButton>
<div className="comparison-track" aria-label={`Approved intake ${intake}`}>
<i className="intake-bar" style={{width:`${intake/max*100}%`}}/>
<span>
<Label text={number(intake)}/>
</span>
</div>
<div className="comparison-track" aria-label={`Within-intake ${within}`}>
<i style={{width:`${within/max*100}%`}}/>
<span>
<Label text={number(within)}/>
</span>
</div>
<small>
<Label text={supernum}/>
<Label text={"supernumerary, checked separately by scheme"}/>
<Label text={within>intake?` · ${within-intake} above approved intake`:''}/>
<Label text={g.ps.some(p=>!p.approved)?' · Includes an unapproved program':''}/>
</small>
</div>})}{!groups.length&&<p>
<Label text={"No programs match this selection."}/>
</p>}</div>{institution&&<LocalizedLink className="button secondary" href={`/records?year=${data.year}&institution=${institution}${program?'&program='+encodeURIComponent(program):''}`}>
<Label text={"Open "}/>
<Label text={program?'program':'institution'}/>
<Label text={"records →"}/>
</LocalizedLink>}</section>
</div>
 <section className="card table-card">
<div className="table-title">
<div>
<div className="eyebrow">
<Label text={"SUBMISSION & DEADLINE TRACKER"}/>
</div>
<h2>
<Label text="What needs attention next?"/>
</h2>
<p>
<Label text={"Institution-level tracker for the selected geography · "}/>
<Label text={data.year}/>
<Label text={"· as of "}/>
<Label text={data.today}/>
<Label text={"IST"}/>
</p>
</div>
<LocalizedLink href="/uploads">
<Label text={"Upload Centre →"}/>
</LocalizedLink>
</div>
<div className="submission-health">
<RingGauge value={selected.length?data.tracker.filter(i=>ids.has(i.id)&&i.complete).length/selected.length*100:null} label="signed"/>
<div>
<strong><Label text={"Institution submission coverage"}/></strong>
<p><Label text={data.tracker.filter(i=>ids.has(i.id)&&i.complete).length}/><Label text={"of "}/><Label text={selected.length}/><Label text={"selected institutions have all current records signed and no open batches."}/></p>
</div>
</div>
<div className="tracker-summary">{['Overdue','Due soon','Records signed'].map(s=>
<div key={s}>
<strong>
<Label text={data.tracker.filter(i=>ids.has(i.id)&&i.deadline_status===s).length}/>
</strong>
<span>
<Label text={s}/>
</span>
</div>)}<div>
<strong>
<Label text={batches.filter(b=>b.status==='review').reduce((n,b)=>n+b.count,0)}/>
</strong>
<span>
<Label text={"batches awaiting Head"}/>
</span>
</div>
</div>
 <p className="tracker-note">
<Label text={"Signed batches do not mean the entire institution has finished. Coverage counts current record versions with a stored approval snapshot; historical seed flags are excluded. Deadlines use the earliest approved program date. Program selection above does not narrow this institution-level tracker."}/>
</p>
<div className="directory-tools">
<SuggestedInput kind="institution" aria-label="Search submission tracker" placeholder="Search institution name or ID" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
<LocalizedSelect aria-label="Filter submission status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>
<option value="">
<Label text={"All submission statuses"}/>
</option>{['Overdue','Due soon','On schedule','Records signed','Not started','Draft','Needs correction','Processing','Awaiting Head','Signed batches','Failed','No deadline'].map(s=>
<option key={s} value={s}>
<Label text={s}/>
</option>)}</LocalizedSelect>
</div>
 <div className="table-scroll">
<table>
<thead>
<tr>
<th>
<Label text={"Institution"}/>
</th>
<th>
<Label text={"Submission"}/>
</th>
<th>
<Label text={"Approved records"}/>
</th>
<th>
<Label text={"Deadline"}/>
</th>
<th>
<Label text={"Attention"}/>
</th>
</tr>
</thead>
<tbody>{tracker.slice((current-1)*10,current*10).map(i=>
<tr key={i.id}>
<td>
<LocalizedButton className="tracker-institution" onClick={()=>select(i.region,i.state,i.id)}>
<Label text={i.name}/>
</LocalizedButton>
<small>
<Label text={i.id}/> · <Label text={i.state}/>
</small>
</td>
<td>
<Label text={i.status}/>
<small>
<Label text={i.signed_batches}/>
<Label text={"signed / "}/>
<Label text={i.open_batches}/>
<Label text={"open batches"}/>
</small>
</td>
<td>
<Label text={i.approved_records}/> / <Label text={i.total}/>
<small>
<Label text={i.total?Math.round(i.approved_records/i.total*100):0}/>
<Label text={"% current versions approved"}/>
</small>
</td>
<td>
<Label text={i.deadline||'Not configured'}/>{i.deadline_end!==i.deadline&&<small>
<Label text={"Program dates through "}/>
<Label text={i.deadline_end}/>
</small>}</td>
<td>
<span className={`status-pill ${i.deadline_status==='Overdue'?'rejected':i.complete?'approved':'pending'}`}>
<Label text={i.deadline_status}/>
</span>{!i.complete&&i.days_remaining!==null&&<small>
<Label text={i.days_remaining<0?`${-i.days_remaining} days past deadline`:i.days_remaining===0?'Due today':`${i.days_remaining} days remaining`}/>
</small>}</td>
</tr>)}</tbody>
</table>{!tracker.length&&<p className="table-foot">
<Label text={"No institutions match these filters."}/>
</p>}</div>
<div className="table-title">
<span>
<Label text={tracker.length}/>
<Label text={"institutions · Page "}/>
<Label text={current}/>
<Label text={"of "}/>
<Label text={pages}/>
</span>
<div className="actions">
<LocalizedButton className="button secondary" disabled={current<=1} onClick={()=>setPage(current-1)}>
<Label text={"Previous"}/>
</LocalizedButton>
<LocalizedButton className="button secondary" disabled={current>=pages} onClick={()=>setPage(current+1)}>
<Label text={"Next"}/>
</LocalizedButton>
</div>
</div>
</section>
 </section>
}
