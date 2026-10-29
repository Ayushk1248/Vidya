'use client'

import Link from 'next/link'
import {createContext,useContext,useSyncExternalStore,useEffect,forwardRef,type ReactNode,type InputHTMLAttributes,type TextareaHTMLAttributes,type SelectHTMLAttributes,type ButtonHTMLAttributes,type AnchorHTMLAttributes,type ComponentPropsWithoutRef} from 'react'
import {translate} from '@/lib/translate'

const Language=createContext({lang:'en',setLang:(_value:string)=>{}})
let memoryLanguage='en'
function subscribe(listener:()=>void){window.addEventListener('storage',listener);window.addEventListener('vidya-language',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('vidya-language',listener)}}
function snapshot(){try{return localStorage.getItem('vidya-language')==='hi'?'hi':'en'}catch{return memoryLanguage}}
export function LanguageProvider({children}:{children:ReactNode}){
 const lang=useSyncExternalStore(subscribe,snapshot,()=>'en')
 const setLang=(value:string)=>{memoryLanguage=value;try{localStorage.setItem('vidya-language',value)}catch{}window.dispatchEvent(new Event('vidya-language'))}
 useEffect(()=>{document.documentElement.lang=lang},[lang])
 return <Language.Provider value={{lang,setLang}}>{children}</Language.Provider>
}
export function useLocale(){const {lang}=useContext(Language);return {lang,t:(text:string)=>translate(text,lang)}}
function localizedNode(value:ReactNode,lang:string):ReactNode{return typeof value==='string'?translate(value,lang):Array.isArray(value)?value.map(item=>localizedNode(item,lang)):value}
export function Label({text}:{text:ReactNode}){return <>{localizedNode(text,useContext(Language).lang)}</>}
export function Text({en,hi}:{en:string;hi:string}){return <>{useContext(Language).lang==='hi'?hi:en}</>}
export function LanguageToggle(){const {lang,setLang}=useContext(Language);return <button type="button" className="button secondary language-toggle" aria-label="Change language / भाषा बदलें" onClick={()=>setLang(lang==='en'?'hi':'en')}>{lang==='en'?'हिन्दी':'English'}</button>}

function useAttributes<T extends {'aria-label'?:string;title?:string;placeholder?:string}>(props:T){const {t}=useLocale();return {...props,'aria-label':props['aria-label']?t(props['aria-label']):props['aria-label'],title:props.title?t(props.title):props.title,...('placeholder' in props?{placeholder:props.placeholder?t(props.placeholder):props.placeholder}:{})}}
export const LocalizedInput=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(function LocalizedInput(props,ref){const attributes=useAttributes(props);return <input {...attributes} ref={ref}/>})
export const LocalizedTextarea=forwardRef<HTMLTextAreaElement,TextareaHTMLAttributes<HTMLTextAreaElement>>(function LocalizedTextarea(props,ref){const attributes=useAttributes(props);return <textarea {...attributes} ref={ref}/>})
export const LocalizedSelect=forwardRef<HTMLSelectElement,SelectHTMLAttributes<HTMLSelectElement>>(function LocalizedSelect(props,ref){const attributes=useAttributes(props);return <select {...attributes} ref={ref}/>})
export const LocalizedButton=forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement>>(function LocalizedButton(props,ref){const attributes=useAttributes(props),{lang}=useLocale();return <button {...attributes} ref={ref}>{localizedNode(props.children,lang)}</button>})
export const LocalizedAnchor=forwardRef<HTMLAnchorElement,AnchorHTMLAttributes<HTMLAnchorElement>>(function LocalizedAnchor(props,ref){const attributes=useAttributes(props),{lang}=useLocale();return <a {...attributes} ref={ref}>{localizedNode(props.children,lang)}</a>})
export const LocalizedLink=forwardRef<HTMLAnchorElement,ComponentPropsWithoutRef<typeof Link>>(function LocalizedLink(props,ref){const attributes=useAttributes(props),{lang}=useLocale();return <Link {...attributes} ref={ref}>{localizedNode(props.children,lang)}</Link>})
