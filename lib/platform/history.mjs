import {db} from './db.mjs';
import {AccessError,enrolmentScope} from './access.mjs';
import {decrypt,maskApaar} from './crypto.mjs';
const fail=(message,status=400)=>{throw new AccessError(message,status)};
const text=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
const literal=value=>'%'+value.replace(/[\\%_]/g,c=>'\\'+c)+'%';
export function auditHistory(actor,options={}){
 if(!actor?.user_id)fail('Access denied',403);
 const admin=actor.role==='aicte_admin',parts=admin?['1=1']:['actor_id=?'],args=admin?[]:[actor.user_id];
 const q=text(options.q),action=text(options.action),actorId=admin?text(options.actor):'';
 if(q){parts.push("(action LIKE ? ESCAPE '\\' OR entity_id LIKE ? ESCAPE '\\' OR CAST(sequence AS TEXT)=?)");args.push(literal(q),literal(q),q.replace(/^#/,''))}
 if(action){parts.push('action=?');args.push(action)}
 if(actorId){parts.push('actor_id=?');args.push(actorId)}
 for(const [key,operator] of [['from','>='],['to','<']]){
 const value=text(options[key],10);if(!value)continue;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail('Choose a valid date.');
 const time=new Date(value+'T00:00:00+05:30');if(key==='to')time.setTime(time.getTime()+86400000);
 parts.push(`created_at ${operator} ?`);args.push(time.toISOString());
 }
 if(options.from&&options.to&&options.from>options.to)fail('Start date must be before end date.');
 const where=parts.join(' AND '),total=db().prepare(`SELECT count(*) n FROM audit_events WHERE ${where}`).get(...args).n;
 const pages=Math.max(1,Math.ceil(total/25)),page=Math.min(pages,Math.max(1,Math.floor(Number(options.page)||1)));
 const rows=db().prepare(`SELECT sequence,actor_id,action,entity_id,created_at FROM audit_events WHERE ${where} ORDER BY sequence DESC LIMIT 25 OFFSET ?`).all(...args,(page-1)*25).map(row=>({...row}));
 const actions=db().prepare(`SELECT DISTINCT action FROM audit_events WHERE ${admin?'1=1':'actor_id=?'} ORDER BY action`).all(...(admin?[]:[actor.user_id])).map(r=>r.action);
 return {rows,total,page,pages,actions,admin};
}
const fields={student_id:'Student ID',name:'Student name',dob:'Date of birth',apaar:'APAAR (masked)',program_id:'Program ID',admission_date:'Admission date',scheme:'Admission scheme',category:'Category',nationality:'Nationality'};
export function recordHistory(actor,id,options={}){
 if(typeof id!=='string'||id.length>120)fail('Record not found.',404);
 const scope=enrolmentScope(actor);
 const record=db().prepare(`SELECT e.id,e.institution_id,e.student_id,e.academic_year,e.version,i.name institution_name FROM enrolments e JOIN institutions i ON i.id=e.institution_id WHERE e.id=? AND ${scope.clause}`).get(id,...scope.args);
 if(!record)fail('Record not found.',404);
 const versions=db().prepare('SELECT version,reason,actor_id,created_at,snapshot_cipher FROM record_versions WHERE enrolment_id=? ORDER BY version DESC').all(id);
 const select=(input,fallback)=>{if(input===undefined||input==='')return fallback;const n=Number(input);if(!Number.isSafeInteger(n)||!versions.some(v=>v.version===n))fail('Choose an available record version.');return n};
 const to=select(options.to,versions[0]?.version),from=select(options.from,versions[1]?.version??to);
 if(from!==undefined&&to!==undefined&&from>to)fail('Earlier snapshot must not follow the later snapshot.');
 const snapshots=new Map();for(const n of new Set([from,to].filter(n=>n!==undefined))){try{const data=JSON.parse(decrypt(versions.find(v=>v.version===n).snapshot_cipher));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();snapshots.set(n,data)}catch{fail('A stored version could not be read. Contact an administrator.',409)}}
 const before=snapshots.get(from)||{},after=snapshots.get(to)||{};
 const value=(data,key)=>data[key]===undefined||data[key]===null?'Not captured':key==='apaar'?maskApaar(String(data[key])):String(data[key]);
 const comparison=versions.length?Object.entries(fields).map(([key,label])=>({key,label,before:value(before,key),after:value(after,key),changed:(before[key]??null)!==(after[key]??null)})):[];
 return {record:{...record},versions:versions.map(({snapshot_cipher,...row})=>({...row})),from:from??null,to:to??null,comparison};
}
