// Cache derived, non-personal values only while this connection AND other
// connections have made no writes. No TTL can hide a record or policy change.
export function databaseMemo(connection,derive,readRevision){
 const entries=new Map();
 const revision=readRevision||(()=>`${connection.prepare('PRAGMA data_version').get().data_version}:${connection.prepare('SELECT total_changes() n').get().n}`);
 return key=>{
  const before=revision(),entry=entries.get(key);
  if(entry?.revision===before)return entry.value;
  const value=derive(key);
  if(revision()===before)entries.set(key,{revision:before,value});
  return value;
 };
}
