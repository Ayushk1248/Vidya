import {processNext,scanDuplicates} from '../lib/platform/uploads.mjs';
import {db} from '../lib/platform/db.mjs';
let stop=false;process.on('SIGTERM',()=>stop=true);process.on('SIGINT',()=>stop=true);
while(!stop){try{const last=db().prepare("SELECT last_run FROM platform_jobs WHERE name='duplicate_scan'").get();if(!last||Date.now()-Date.parse(last.last_run)>86400000)scanDuplicates();if(await processNext())continue;}catch(e){console.error('Upload worker:',e.name)}await new Promise(r=>setTimeout(r,1500));}
