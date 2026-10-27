import {readFileSync} from 'node:fs';
export function migrate(d) {
  const schema=readFileSync('db/schema.sql','utf8');
  // Retain every row and column while extending old CHECK constraints.
  for(const table of ['validation_rules','role_assignments']) {
    const old=d.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table)?.sql||'';
    const marker=table==='validation_rules'?"'critical'":"'awarding_body'";
    if(old.includes(marker))continue;
    const definition=schema.match(new RegExp('CREATE TABLE IF NOT EXISTS '+table+'\\([\\s\\S]*?;'))?.[0];
    if(!definition)throw new Error('Missing migration definition');
    d.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE');
    try {d.exec(definition.replace('IF NOT EXISTS '+table,'IF NOT EXISTS '+table+'_next'));
      d.exec(`INSERT INTO ${table}_next SELECT * FROM ${table}; DROP TABLE ${table}; ALTER TABLE ${table}_next RENAME TO ${table}; COMMIT;`);
    }catch(e){d.exec('ROLLBACK');throw e}finally{d.exec('PRAGMA foreign_keys=ON')}
  }
  if(!d.prepare('SELECT 1 FROM schema_versions WHERE version=6').get()) {
    d.exec("BEGIN IMMEDIATE; UPDATE validation_rules SET severity='warning' WHERE code IN('V04','V11','V14'); UPDATE validation_rules SET severity='critical' WHERE code IN('V07','V08','V09'); UPDATE validation_rules SET severity='info' WHERE code='V13'; INSERT INTO schema_versions(version) VALUES(6); COMMIT;");
  }
}
