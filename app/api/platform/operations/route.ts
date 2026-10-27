import {mutation} from '@/lib/platform/web-session'
import {apiError} from '@/lib/platform/session'
import {AccessError} from '@/lib/platform/access.mjs'
import {createCase,updateCase,studentQuery,resolveQuery} from '@/lib/platform/cases.mjs'
import {markRead} from '@/lib/platform/notifications.mjs'
import {createClient,revokeClient,createWebhook} from '@/lib/platform/integrations.mjs'
import {checkpoint,saveWindow,adminAccess} from '@/lib/platform/admin.mjs'
import {createUpload} from '@/lib/platform/uploads.mjs'
import {db} from '@/lib/platform/db.mjs'
import {audit} from '@/lib/platform/workflows.mjs'
import {reportTypes} from '@/lib/platform/reports.mjs'
import {randomUUID} from 'node:crypto'
export async function POST(request:Request){try{const {actor,body}=await mutation(request);if(!actor)throw new AccessError();let result:unknown={};switch(body.action){
 case 'case_create':result=createCase(actor,body);break;
 case 'case_update':result=updateCase(actor,body);break;
 case 'student_query':result=studentQuery(actor,body.description);break;
 case 'query_resolve':resolveQuery(actor,body.id,body.response);break;
 case 'notification_read':markRead(actor,body.id);break;
 case 'client_create':result=createClient(actor,body.institution_id,body.name);break;
 case 'client_revoke':revokeClient(actor,body.id);break;
 case 'webhook_create':result=createWebhook(actor,body.institution_id,body.url);break;
 case 'checkpoint':checkpoint(actor);break;
 case 'program_window':saveWindow(actor,body);break;
 case 'template':{adminAccess(actor);if(actor.role!=='aicte_admin'||!['information','review','consent','reminder','otp'].includes(body.kind)||typeof body.title!=='string'||body.title.length>160||typeof body.template!=='string'||body.template.length>2000)throw new AccessError('Invalid notification template',400);db().prepare('INSERT INTO notification_templates VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET title=excluded.title,body=excluded.body').run(body.kind,body.title,body.template);audit(actor.user_id,'notification.template_updated',body.kind);break}
 case 'schedule_cancel':{db().prepare('UPDATE report_schedules SET active=0 WHERE id=? AND user_id=?').run(body.id,actor.user_id);audit(actor.user_id,'report.schedule_cancelled',String(body.id));break}
 case 'schedule':{if(!['aicte_admin','regional_officer','institution_head','institution_operator'].includes(actor.role)||!Object.hasOwn(reportTypes,body.type)||!Number.isInteger(Number(body.year))||Number(body.year)<2023||Number(body.year)>2030)throw new AccessError('Invalid report schedule',400);const id=randomUUID(),next=new Date();next.setUTCMonth(next.getUTCMonth()+1,1);next.setUTCHours(3,30,0,0);db().prepare('INSERT INTO report_schedules(id,user_id,report_type,academic_year,next_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,report_type,academic_year) DO UPDATE SET active=1,next_at=excluded.next_at').run(id,actor.user_id,body.type,Number(body.year),next.toISOString());audit(actor.user_id,'report.scheduled',id);break}
 case 'single_student':{const {action,year,reason,...row}=body;void action;const fields=Object.keys(row),cell=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';const csv=fields.map(cell).join(',')+'\n'+fields.map(k=>cell(row[k])).join(',');result={id:createUpload(actor,Buffer.from(csv),'single-student.csv',Number(year),true,String(reason||''))};break}
 default:throw new AccessError('Unknown action',400)
 }return Response.json(result,{headers:{'Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
