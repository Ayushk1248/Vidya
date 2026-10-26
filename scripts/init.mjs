import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const file = '.env.local';
const current = existsSync(file) ? readFileSync(file,'utf8') : '';
if (!/^PLATFORM_ENCRYPTION_KEY=/m.test(current)) {
  appendFileSync(file, `\nPLATFORM_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`);
  console.log('Created local encryption key in ignored .env.local. Back up this file with your database.');
} else console.log('Existing encryption key retained.');

if (!/^VALIDATION_SERVICE_TOKEN=/m.test(current)) {
 appendFileSync(file, `\nVALIDATION_SERVICE_TOKEN=${randomBytes(32).toString('hex')}\n`);
 console.log('Created internal validation service token.');
}
