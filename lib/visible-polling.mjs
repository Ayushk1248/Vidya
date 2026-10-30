// One request at a time; hidden tabs do no polling. Returning to a tab refreshes
// it immediately, and the next interval starts only after that request finishes.
export function visiblePolling(refresh,interval,{document:doc=globalThis.document,window:win=globalThis.window,setTimeout:schedule=globalThis.setTimeout,clearTimeout:cancel=globalThis.clearTimeout}={}){
 let stopped=false,timer,controller;
 const clear=()=>{if(timer!==undefined)cancel(timer);timer=undefined};
 const run=async()=>{
  clear();if(stopped||doc.visibilityState!=='visible'||controller)return;
  const current=new AbortController();controller=current;
  try{await refresh(current.signal)}catch(error){if(!current.signal.aborted)console.error('Background refresh failed',error)}
  finally{if(controller===current)controller=undefined;if(!stopped&&doc.visibilityState==='visible')timer=schedule(run,current.signal.aborted?0:interval())}
 };
 const visibility=()=>{clear();if(doc.visibilityState==='visible')void run();else controller?.abort()};
 doc.addEventListener('visibilitychange',visibility);win.addEventListener('focus',run);void run();
 return()=>{stopped=true;clear();controller?.abort();doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('focus',run)};
}
