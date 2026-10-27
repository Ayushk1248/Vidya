import https from 'node:https';
import {createHmac} from 'node:crypto';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import nodemailer from 'nodemailer';
import {db} from '../lib/platform/db.mjs';
import {decrypt} from '../lib/platform/crypto.mjs';
import {notify,queueDelivery} from '../lib/platform/notifications.mjs';
import {exportReport} from '../lib/platform/reports.mjs';
import {actorFor} from '../lib/platform/repository.mjs';
let stop=false,nextSchedule=0;process.on('SIGTERM',()=>stop=true);process.on('SIGINT',()=>stop=true);
const d=db();
const smtp=process.env.SMTP_HOST?nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',requireTLS:process.env.SMTP_SECURE!=='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined}):null;
function publicAddress(address){if(isIP(address)!==4)return false;const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a>=224||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19))}
async function deliver(job){const payload=JSON.parse(decrypt(job.payload_cipher));if(job.kind==='email'){
 if(!smtp)return false;
 if(typeof payload.to!=='string'||payload.to.endsWith('.invalid')){d.prepare("UPDATE delivery_jobs SET status='demo',error='Synthetic address: no external email sent' WHERE id=?").run(job.id);return true}
 await smtp.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:payload.to,subject:payload.subject,text:payload.text,attachments:payload.attachment?[{filename:payload.attachment.filename,content:Buffer.from(payload.attachment.base64,'base64'),contentType:payload.attachment.mime}]:[]});
 }else if(job.kind==='webhook'){
 const hook=d.prepare('SELECT * FROM webhooks WHERE id=? AND active=1').get(payload.webhook_id);if(!hook)throw new Error('Webhook disabled');const url=new URL(hook.url),allowed=(process.env.PLATFORM_WEBHOOK_HOSTS||'').split(',').map(s=>s.trim());if(url.protocol!=='https:'||!allowed.includes(url.hostname)||isIP(url.hostname))throw new Error('Webhook host is not authorized');
 const resolved=await lookup(url.hostname,{all:true});if(!resolved.length||resolved.some(r=>!publicAddress(r.address)))throw new Error('Webhook destination must resolve only to public IPv4 addresses');
 const body=JSON.stringify({id:job.id,...payload,created_at:job.created_at}),signature=createHmac('sha256',decrypt(hook.secret_cipher)).update(body).digest('hex');await new Promise((resolve,reject)=>{const req=https.request(url,{method:'POST',headers:{'content-type':'application/json','content-length':Buffer.byteLength(body),'x-vidya-signature':'sha256='+signature,'x-vidya-event-id':job.id},lookup:(_hostname,options,callback)=>options.all?callback(null,[{address:resolved[0].address,family:4}]):callback(null,resolved[0].address,4)},response=>{response.resume();if(response.statusCode>=200&&response.statusCode<300)resolve();else reject(new Error('Webhook delivery failed'))});req.setTimeout(10000,()=>req.destroy(new Error('Webhook delivery timed out')));req.on('error',reject);req.end(body)});
 }else throw new Error('Unknown delivery type');d.prepare("UPDATE delivery_jobs SET status='sent',error=NULL WHERE id=?").run(job.id);return true}
async function schedule(){
 const now=new Date().toISOString();for(const row of d.prepare('SELECT * FROM report_schedules WHERE active=1 AND next_at<=?').all(now)){
 const actor=actorFor(row.user_id);if(!actor){d.prepare('UPDATE report_schedules SET active=0 WHERE id=?').run(row.id);continue}
 try{const result=await exportReport(actor,{type:row.report_type,year:row.academic_year,format:'xlsx'});const account=d.prepare('SELECT email_cipher FROM account_profiles WHERE user_id=?').get(actor.user_id);if(account)queueDelivery('email',{to:decrypt(account.email_cipher),subject:'VIDYA monthly '+row.report_type+' report',text:'Attached is your scoped synthetic-data report.',attachment:{filename:result.filename,mime:result.mime,base64:result.bytes.toString('base64')}});const next=new Date();next.setUTCMonth(next.getUTCMonth()+1,1);next.setUTCHours(3,30,0,0);d.prepare('UPDATE report_schedules SET next_at=? WHERE id=?').run(next.toISOString(),row.id)}catch(e){console.error('Report schedule:',e.name)}}
 const today=new Date().toISOString().slice(0,10),last=d.prepare("SELECT last_run FROM platform_jobs WHERE name='pending_reminders'").get();if(!last||last.last_run.slice(0,10)!==today){for(const row of d.prepare("SELECT DISTINCT a.user_id,sd.apaar_pending_deadline FROM student_details sd JOIN enrolments e ON e.id=sd.enrolment_id JOIN effective_students s ON s.enrolment_id=e.id JOIN role_assignments a ON a.institution_id=e.institution_id AND a.role='institution_operator' WHERE (s.apaar IS NULL OR s.apaar='') AND sd.apaar_pending_deadline<>''").all())notify(row.user_id,'Pending APAAR reminder','An academic record still needs APAAR. Deadline: '+row.apaar_pending_deadline,'reminder');d.prepare("INSERT INTO platform_jobs VALUES('pending_reminders',?) ON CONFLICT(name) DO UPDATE SET last_run=excluded.last_run").run(now)}
}
while(!stop){try{if(Date.now()>=nextSchedule){await schedule();nextSchedule=Date.now()+60000}const jobs=d.prepare("SELECT * FROM delivery_jobs WHERE status='queued' AND next_at<=? ORDER BY created_at LIMIT 5").all(new Date().toISOString());for(const job of jobs)try{await deliver(job)}catch(e){const attempt=job.attempts+1;d.prepare('UPDATE delivery_jobs SET attempts=?,status=?,error=?,next_at=? WHERE id=?').run(attempt,attempt>=5?'failed':'queued',String(e.message).slice(0,200),new Date(Date.now()+Math.min(3600000,30000*2**attempt)).toISOString(),job.id)}}catch(e){console.error('Notification worker:',e.name)}await new Promise(r=>setTimeout(r,2500))}
