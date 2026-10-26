import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'node:crypto';
function key() {
  const value = process.env.PLATFORM_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('PLATFORM_ENCRYPTION_KEY must contain 64 hex characters');
  return Buffer.from(value, 'hex');
}
export function encrypt(value) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), nonce);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return ['v1', nonce.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join(':');
}
export function decrypt(value) {
  const [version, nonce, tag, ciphertext] = value.split(':');
  if (version !== 'v1') throw new Error('Unsupported ciphertext');
  const cipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(nonce, 'base64'));
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([cipher.update(Buffer.from(ciphertext, 'base64')), cipher.final()]).toString('utf8');
}
export const mobileHash = (value) => createHmac('sha256', key()).update(`mobile:${value}`).digest('hex');
export const maskApaar = (value) => value ? `XXXX-XXXX-${String(value).slice(-4).padStart(4, 'X')}` : 'Missing';
export const maskPassport = (value) => value ? `XXXXX${String(value).slice(-2)}` : '—';
