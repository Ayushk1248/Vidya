'use client'
import {createContext,useContext,useState,type Dispatch,type SetStateAction,type ReactNode} from 'react'
import {Label,LocalizedButton} from './language'

const AccessView=createContext<{tab:string;setTab:Dispatch<SetStateAction<string>>}|null>(null)
export function useAccessView(){const value=useContext(AccessView);if(!value)throw new Error('Access lists must be inside AccessWorkspace');return value}

export function AccessWorkspace({pending,activeAccounts,completed,children}:{pending:number;activeAccounts:number;completed:number;children:ReactNode}){
 const [tab,setTab]=useState('pending')
 function open(view:string){setTab(view);requestAnimationFrame(()=>{const list=document.getElementById('access-list');if(!list)return;list.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});list.focus({preventScroll:true})})}
 const cards=[{id:'pending',label:'Awaiting review',count:pending,description:'Requests within your review scope'},{id:'members',label:'Active accounts',count:activeAccounts,description:'Approved role assignments'},{id:'history',label:'Completed reviews',count:completed,description:'Approval and rejection history'}]
 return <AccessView.Provider value={{tab,setTab}}><div className="metric-grid">{cards.map(card=><article className="access-metric-card" key={card.id}><span><Label text={card.label}/></span><strong>{card.count}</strong><small><Label text={card.description}/></small><LocalizedButton type="button" className="access-metric-trigger" aria-label={card.label} aria-controls="access-list" aria-pressed={tab===card.id} onClick={()=>open(card.id)}><span className="sr-only"><Label text={card.label}/></span></LocalizedButton></article>)}</div>{children}</AccessView.Provider>
}
