"use client";
import {LocalizedButton,Label} from '@/components/language'

import {useState} from 'react';
export function ReportDownloads({year,type,institution}:{year:number;type:string;institution:string}){
 const [busy,setBusy]=useState(''),[error,setError]=useState('');
 async function download(format:string){setBusy(format);setError('');try{const query=new URLSearchParams({year:String(year),type,format});if(institution)query.set('institution',institution);const response=await fetch('/api/platform/report?'+query);if(!response.ok){const result=await response.json();throw new Error(result.error||'Export failed.')}const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download=`VIDYA-${type}-${year}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){setError(e instanceof Error?e.message:'Export failed.')}finally{setBusy('')}}
 return <div><div className="actions"><LocalizedButton className="button" disabled={!!busy} onClick={()=>download('xlsx')}><Label text={busy==='xlsx'?'Preparing Excel…':'Download Excel'}/></LocalizedButton><LocalizedButton className="button secondary" disabled={!!busy} onClick={()=>download('pdf')}><Label text={busy==='pdf'?'Preparing PDF…':'Download PDF'}/></LocalizedButton></div><p role="status" aria-live="polite"><Label text={error}/></p></div>
}
