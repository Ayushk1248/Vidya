import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
let connection;
export function db() {
  if (!connection) {
    const filename = process.env.PLATFORM_DB || path.join(process.cwd(), 'data', 'platform.sqlite');
    mkdirSync(path.dirname(filename), { recursive: true });
    connection = new DatabaseSync(filename);
    connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    connection.exec(readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf8'));
  }
  return connection;
}
