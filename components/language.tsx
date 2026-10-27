'use client'
import {hindi} from '@/lib/i18n'
import {createContext,useContext,useSyncExternalStore,useEffect} from 'react'
const Language=createContext({lang:'en',setLang:(_value:string)=>{}})
function subscribe(listener:()=>void){window.addEventListener('storage',listener);window.addEventListener('vidya-language',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('vidya-language',listener)}}
function snapshot(){return localStorage.getItem('vidya-language')==='hi'?'hi':'en'}
export function LanguageProvider({children}:{children:React.ReactNode}){const lang=useSyncExternalStore(subscribe,snapshot,()=>'en');const setLang=(value:string)=>{localStorage.setItem('vidya-language',value);window.dispatchEvent(new Event('vidya-language'))};useEffect(()=>{document.documentElement.lang=lang},[lang]);return <Language.Provider value={{lang,setLang}}>{children}</Language.Provider>}

export function Text({en,hi}:{en:string;hi:string}){return <>{useContext(Language).lang==='hi'?hi:en}</>}
export function LanguageToggle(){const {lang,setLang}=useContext(Language);return <button type="button" className="button secondary language-toggle" aria-label="Change language / भाषा बदलें" onClick={()=>{const next=lang==='en'?'hi':'en';localStorage.setItem('vidya-language',next);setLang(next)}}>{lang==='en'?'हिन्दी':'English'}</button>}

export function Label({text}:{text:string}){return <Text en={text} hi={hindi[text]||text}/>}
