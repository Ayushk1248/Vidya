import {readCheckpoints,validCheckpoint} from './checkpoint-journal.mjs';
import {createHash} from 'node:crypto';
import {db} from './db.mjs';
import {AccessError} from './access.mjs';
export function checkAuditIntegrity(actor) {
 if(actor?.role!=='aicte_admin')throw new AccessError('Only AICTE Admin can check the platform-wide audit chain.');
 // A single SELECT gives a consistent snapshot, including events beyond the activity page limit.
 const rows=db().prepare('SELECT * FROM audit_events ORDER BY sequence').all();
 const checked_at=new Date().toISOString();
 let previous='0'.repeat(64),checked=0;
 for(const row of rows){
  const expected=createHash('sha256').update(JSON.stringify([row.actor_id,row.action,row.entity_id,row.details,row.created_at,row.previous_hash])).digest('hex');
  const reason=row.previous_hash!==previous?'Previous-event link does not match.':row.event_hash!==expected?'Event content does not match its stored hash.':null;
  if(reason)return {status:'broken',checked_at,total:rows.length,checked,first_broken_sequence:row.sequence,reason};
  previous=row.event_hash;checked++;
 }
 let anchors;try{anchors=readCheckpoints()}catch{return {status:'broken',checked_at,total:rows.length,checked,first_broken_sequence:null,reason:'Checkpoint journal is unreadable.'}}
 for(const anchor of anchors){if(!validCheckpoint(anchor)||!rows.some(r=>r.sequence===anchor.sequence&&r.event_hash===anchor.event_hash))return {status:'broken',checked_at,total:rows.length,checked,first_broken_sequence:anchor.sequence,reason:'Independent checkpoint does not match the stored audit chain.'}}
 return {status:rows.length?'valid':'empty',checked_at,total:rows.length,checked,first_broken_sequence:null,reason:null};
}
