import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
process.loadEnvFile('.env.local');
const serviceUrl=new URL(process.env.VALIDATION_SERVICE_URL||'http://127.0.0.1:8001');const servicePort=serviceUrl.port||'8001';
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const p of children){if(process.platform==='win32')spawn('taskkill',['/PID',String(p.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else p.kill('SIGTERM')}setTimeout(()=>process.exit(code),1000)}
function run(bin,args){const p=spawn(bin,args,{stdio:'inherit',windowsHide:true});children.push(p);p.on('error',e=>{console.error(e.message);stop(1)});p.on('exit',code=>{if(!stopping)stop(code||0)});return p}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
const python=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';if(!existsSync(python))throw new Error('Create .venv and install requirements-validation.txt first.');
run(python,['-m','uvicorn','services.validation.app:app','--host','127.0.0.1','--port',servicePort]);
let ready=false;for(let n=0;n<40;n++){try{const r=await fetch(serviceUrl.origin+'/health',{headers:{'x-service-token':process.env.VALIDATION_SERVICE_TOKEN},signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}if(!ready){console.error('Validation service could not start.');stop(1)}else{run(process.execPath,['scripts/upload-worker.mjs']);run(process.execPath,['scripts/anomaly-worker.mjs']);run(process.execPath,['scripts/notification-worker.mjs']);run(process.execPath,['scripts/identity-worker.mjs']);const args=process.argv.slice(2);run(process.execPath,['node_modules/next/dist/bin/next','dev',...args,...(args.some(a=>a==='--hostname'||a==='-H')?[]:['--hostname','127.0.0.1']),...(args.some(a=>a==='-p'||a==='--port')?[]:['--port','3001'])]);}
