'use client'
import {LocalizedInput,LocalizedButton,Label,LocalizedTextarea,useLocale} from '@/components/language'


import {useEffect,useId,useRef,useState,type InputHTMLAttributes,type TextareaHTMLAttributes} from 'react'
import {fieldKinds,fieldExamples,fieldLabels,textExamples} from '@/lib/platform/field-examples'
import type {DataOption} from '@/lib/platform/suggestions.mjs'
import {parsePortalPath,portalApiPath} from '@/lib/platform/portals.mjs'

type Extra={field?:string;kind?:string;examples?:string[];options?:DataOption[];institution?:string;onRecommendation?:(option:DataOption)=>void}
export function SuggestedInput({field,kind,examples,options,institution,onRecommendation,...props}:InputHTMLAttributes<HTMLInputElement>&Extra){
 const {t}=useLocale();
 const key=field||props.name||'',source=kind??fieldKinds[key];
 const [value,setValue]=useState(String(props.defaultValue??'')),[open,setOpen]=useState(false),[choices,setChoices]=useState<DataOption[]>([]),[hint,setHint]=useState(''),[loading,setLoading]=useState(false),[all,setAll]=useState(false);
 const input=useRef<HTMLInputElement>(null),id=useId();const current=props.value===undefined?value:String(props.value);
 const numeric=props.type==='number'&&(props.value!==undefined||props.defaultValue!==undefined)?[String(props.value??props.defaultValue)]:undefined;
 const staticValues=examples||fieldExamples[key]||numeric;
 useEffect(()=>{
  if(!open||options||staticValues||!source)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   setLoading(true);setHint('');
   const form=input.current?.form,related=institution??String((form?.elements.namedItem('institution_id') as HTMLInputElement|null)?.value||'');
   const student=String((form?.elements.namedItem('student_id') as HTMLInputElement|null)?.value||'');
   const query=new URLSearchParams({kind:source,q:all?'':current,institution:related,student});
   const category=parsePortalPath(window.location.pathname)?.category;
   fetch(portalApiPath('/api/platform/suggestions?'+query,category),{cache:'no-store',signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Suggestions are unavailable.');setChoices(data.options);setHint(data.hint||'Choose a value from the records available to your role.')}).catch(e=>{if(!controller.signal.aborted){setChoices([]);setHint(e.message)}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  },200);
  return()=>{clearTimeout(timer);controller.abort()}
 },[open,source,current,institution,all,options,staticValues]);
 const available=options||(staticValues||[]).map(value=>({value:['reason','apaar_pending_reason'].includes(key)?t(value):value,label:value}));
 const rows=options||staticValues?available.filter(o=>all||!current||(o.value+' '+o.label).toLowerCase().includes(current.toLowerCase())):choices;
 function choose(option:DataOption){
  const node=input.current;if(!node)return;
  // Dispatch the same input event as typing, so parent-controlled fields stay in sync.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set?.call(node,option.value);
  node.dispatchEvent(new Event('input',{bubbles:true}));setValue(option.value);onRecommendation?.(option);node.focus();setOpen(false);
 }
 const label=props['aria-label']||fieldLabels[key]||props.placeholder||key.replaceAll('_',' ')||'this field';
 const {defaultValue:ignored,...attributes}=props;void ignored;
 return <span className="suggested-field"><LocalizedInput {...attributes} ref={input} aria-label={label} value={current} onChange={event=>{setValue(event.target.value);setAll(false);props.onChange?.(event)}} aria-describedby={[props['aria-describedby'],open?id:undefined].filter(Boolean).join(' ')||undefined}/>
  <LocalizedButton type="button" className="suggestion-toggle" aria-expanded={open} aria-controls={id} aria-label={'Suggestions for '+label} onClick={e=>{e.preventDefault();setAll(true);setOpen(!open)}}><Label text={"✦ Suggestions"}/></LocalizedButton>
  {open&&<span id={id} className="suggestion-panel"><span className="suggestion-caption"><Label text={"Dataset choices / example values · review before submitting"}/></span>{loading?<span role="status"><Label text={"Finding matching records…"}/></span>:<span className="suggestion-options">{rows.slice(0,8).map(o=><LocalizedButton type="button" key={o.value} onClick={e=>{e.preventDefault();choose(o)}} title={o.label}><Label text={o.label}/></LocalizedButton>)}</span>}
   <span className="suggestion-hint"><Label text={hint||(!rows.length?(key==='name'||key==='dob'||key==='passport'||key==='parent_name'?'Use “Load matching student example” to keep identity fields consistent.':'Enter a value appropriate to this record. Select fields already list their valid choices.'):'Examples fill this field only. Nothing is submitted automatically.')}/></span>
   {rows.length===0&&source&&current&&!all&&<LocalizedButton type="button" className="text-button" onClick={e=>{e.preventDefault();setAll(true)}}><Label text={"Show available choices"}/></LocalizedButton>}
  </span>}
 </span>
}

export function SuggestedTextarea({field,examples,...props}:TextareaHTMLAttributes<HTMLTextAreaElement>&{field?:string;examples?:string[]}){
 const {t}=useLocale();
 const [value,setValue]=useState(String(props.defaultValue??'')),[open,setOpen]=useState(false);const input=useRef<HTMLTextAreaElement>(null),id=useId();
 const choices=(examples||textExamples[field||props.name||'note']||textExamples.note).map(t);
 const {defaultValue:ignored,...attributes}=props;void ignored;
 return <span className="suggested-field"><LocalizedTextarea {...attributes} ref={input} aria-label={props['aria-label']||fieldLabels[field||props.name||'']||undefined} value={props.value===undefined?value:props.value} onChange={e=>{setValue(e.target.value);props.onChange?.(e)}}/>
  <LocalizedButton type="button" className="suggestion-toggle" aria-controls={id} aria-expanded={open} onClick={e=>{e.preventDefault();setOpen(!open)}}><Label text={"✦ Example wording"}/></LocalizedButton>
  {open&&<span id={id} className="suggestion-panel"><span className="suggestion-caption"><Label text={"Example draft · edit to match your reason and evidence"}/></span>{choices.map(example=><LocalizedButton type="button" key={example} className="suggestion-example" onClick={e=>{e.preventDefault();const node=input.current;if(!node)return;Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set?.call(node,example);node.dispatchEvent(new Event('input',{bubbles:true}));setValue(example);node.focus();setOpen(false)}}><Label text={example}/></LocalizedButton>)}</span>}
 </span>
}
