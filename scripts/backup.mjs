import {randomBytes,scryptSync,createCipheriv} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,unlinkSync,rmdirSync} from 'node:fs';
import path from 'node:path';
process.loadEnvFile('.env.local');
if(!process.env.BACKUP_PASSPHRASE||process.env.BACKUP_PASSPHRASE.length<16)throw new Error('Set a separate BACKUP_PASSPHRASE of at least 16 characters. Keep it outside the backup.');
const {db}=await import('../lib/platform/db.mjs');
const folder=path.resolve('data/backups');mkdirSync(folder,{recursive:true});const scratch=mkdtempSync(path.join(folder,'snapshot-')),snapshot=path.join(scratch,'platform.sqlite');
try{db().exec("VACUUM INTO '"+snapshot.replaceAll("'","''")+"'");const payload=Buffer.from(JSON.stringify({format:'vidya-backup/v1',created_at:new Date().toISOString(),database:readFileSync(snapshot).toString('base64'),environment:readFileSync('.env.local','utf8')}));const salt=randomBytes(16),iv=randomBytes(12),key=scryptSync(process.env.BACKUP_PASSPHRASE,salt,32),cipher=createCipheriv('aes-256-gcm',key,iv),bytes=Buffer.concat([cipher.update(payload),cipher.final()]);const output=path.join(folder,'VIDYA-'+new Date().toISOString().replace(/[:.]/g,'-')+'.enc');writeFileSync(output,JSON.stringify({format:'vidya-encrypted-backup/v1',kdf:'scrypt',salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:bytes.toString('base64')}));console.log('Encrypted consistent database + environment backup saved:',output)}finally{try{unlinkSync(snapshot);rmdirSync(scratch)}catch{}}
