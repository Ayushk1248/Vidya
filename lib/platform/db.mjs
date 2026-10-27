import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {migrate} from './migrate.mjs';
let connection;
export function db() {
  if (!connection) {
    const filename = process.env.PLATFORM_DB || path.join(process.cwd(), 'data', 'platform.sqlite');
    mkdirSync(path.dirname(filename), { recursive: true });
    const opened = new DatabaseSync(filename);
    try {
      opened.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
      opened.exec(readFileSync(path.join(process.cwd(), 'db/schema.sql'), 'utf8'));
      migrate(opened);
      connection = opened;
    } catch (error) { opened.close(); throw error; }
  }
  return connection;
}
