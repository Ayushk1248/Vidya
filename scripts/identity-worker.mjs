import {recheckIdentities} from '../lib/platform/identity-checks.mjs';
let stop=false;process.on('SIGTERM',()=>stop=true);process.on('SIGINT',()=>stop=true);
while(!stop){try{if(await recheckIdentities()){await new Promise(r=>setTimeout(r,500));continue}}catch(e){console.error('Identity worker:',e.name)}await new Promise(r=>setTimeout(r,60000))}
