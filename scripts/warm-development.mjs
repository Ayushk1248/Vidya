const routes=['/','/login','/dashboard','/anomalies','/cases','/reports','/access','/uploads','/records','/certificates','/verification','/institutions','/notifications','/account','/security','/onboarding','/activity','/integrations','/admin'];
// Next dev compiles routes on demand. Prepare code serially, without a user
// session or role changes, so the first sidebar click need not compile it.
export async function warmDevelopmentRoutes(port,stopping){
 const origin=`http://127.0.0.1:${port}`;
 let ready=false;
 for(let attempt=0;attempt<60&&!stopping();attempt++){
  try{const response=await fetch(origin+'/login',{redirect:'manual',signal:AbortSignal.timeout(90000)});await response.arrayBuffer();ready=true;break}
  catch{await new Promise(resolve=>setTimeout(resolve,500))}
 }
 if(!ready||stopping())return;
 for(const route of routes){
  if(stopping())return;
  try{const response=await fetch(origin+route,{redirect:'manual',signal:AbortSignal.timeout(90000)});await response.arrayBuffer()}
  catch{console.warn(`Development preparation skipped ${route}; navigation will retry it.`)}
 }
 if(!stopping())console.log('Workspace page code prepared for local navigation.');
}
