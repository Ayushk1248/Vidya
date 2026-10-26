import {scheduleAnalysis,processAnalysis} from '../lib/platform/anomalies.mjs';
let stop=false,nextSchedule=0;process.on('SIGTERM',()=>stop=true);process.on('SIGINT',()=>stop=true);
while(!stop){try{if(Date.now()>=nextSchedule){scheduleAnalysis();nextSchedule=Date.now()+86400000}if(await processAnalysis())continue}catch(e){console.error('Anomaly worker:',e.name);nextSchedule=Date.now()+300000}await new Promise(r=>setTimeout(r,2000))}
