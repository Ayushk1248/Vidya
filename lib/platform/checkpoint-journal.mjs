import {readFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHmac,timingSafeEqual} from 'node:crypto';
export function journalPath(){return (process.env.PLATFORM_DB||path.join(process.cwd(),'data','platform.sqlite'))+'.checkpoints.jsonl'}
export function checkpointSignature(row){const key=process.env.AUDIT_CHECKPOINT_KEY||process.env.PLATFORM_ENCRYPTION_KEY;if(!key)throw new Error('Checkpoint signing key unavailable');return createHmac('sha256',key).update(JSON.stringify([row.sequence,row.event_hash,row.created_at])).digest('hex')}
export function appendCheckpoint(row){const filename=journalPath();mkdirSync(path.dirname(filename),{recursive:true});appendFileSync(filename,JSON.stringify(row)+'\n')}
export function readCheckpoints(){const filename=journalPath();if(!existsSync(filename))return [];return readFileSync(filename,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line))}
export function validCheckpoint(row){try{const actual=Buffer.from(row.signature),expected=Buffer.from(checkpointSignature(row));return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
