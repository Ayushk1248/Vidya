import {randomBytes,createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {db} from './db.mjs';
import {encrypt,decrypt} from './crypto.mjs';
import {AccessError} from './access.mjs';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes){let bits=0,value=0,out='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out}
function decode(secret){let bits=0,value=0,out=[];for(const c of secret){const digit=alphabet.indexOf(c);if(digit<0)throw new Error('Invalid secret');value=(value<<5)|digit;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8}}return Buffer.from(out)}
export function totp(secret,counter=Math.floor(Date.now()/30000)){const message=Buffer.alloc(8);message.writeBigUInt64BE(BigInt(counter));const digest=createHmac('sha1',decode(secret)).update(message).digest(),offset=digest[19]&15;return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0')}
const hash=value=>createHash('sha256').update(value).digest('hex');
export function mfaState(userId){return db().prepare('SELECT enabled FROM mfa_secrets WHERE user_id=?').get(userId)||{enabled:0}}
export function beginMfa(userId){const existing=mfaState(userId);if(existing.enabled)throw new AccessError('MFA is already enabled. Use a recovery code if needed.',409);const secret=base32(randomBytes(20));db().prepare('INSERT INTO mfa_secrets(user_id,secret_cipher) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET secret_cipher=excluded.secret_cipher,last_counter=-1').run(userId,encrypt(secret));return {secret,uri:'otpauth://totp/VIDYA:'+encodeURIComponent(userId)+'?secret='+secret+'&issuer=VIDYA&algorithm=SHA1&digits=6&period=30'}}
export function confirmMfa(userId,code){const row=db().prepare('SELECT * FROM mfa_secrets WHERE user_id=?').get(userId);if(!row)throw new AccessError('Start authenticator setup first.',400);const counter=Math.floor(Date.now()/30000);let matched=null;if(/^\d{6}$/.test(String(code)))for(const value of [counter-1,counter,counter+1]){if(value<=row.last_counter)continue;const expected=Buffer.from(totp(decrypt(row.secret_cipher),value)),actual=Buffer.from(String(code));if(expected.length===actual.length&&timingSafeEqual(expected,actual))matched=value}
 if(matched===null&&row.enabled){const hashes=JSON.parse(row.recovery_hashes),index=hashes.indexOf(hash(String(code)));if(index>=0){hashes.splice(index,1);db().prepare('UPDATE mfa_secrets SET recovery_hashes=? WHERE user_id=?').run(JSON.stringify(hashes),userId);return {verified:true}}}
 if(matched===null)throw new AccessError('Invalid or already used authenticator code.',400);
 const recovery_codes=row.enabled?undefined:Array.from({length:8},()=>randomBytes(8).toString('hex'));
 db().prepare('UPDATE mfa_secrets SET enabled=1,last_counter=?,recovery_hashes=? WHERE user_id=?').run(matched,recovery_codes?JSON.stringify(recovery_codes.map(hash)):row.recovery_hashes,userId);return {verified:true,...(recovery_codes?{recovery_codes}:{})};
}
