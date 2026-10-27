import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';

// Load the actual server component; its client children are opaque at this boundary.
const require=createRequire(import.meta.url),mod={exports:{}};
const clientModules={
 './role-controls':{RoleControls:()=>null},
 './language':{LanguageToggle:()=>null,Label:()=>null},
 './sign-out-button':{SignOutButton:()=>null},
 './workspace-chrome':{WorkspaceChrome:()=>null},
};
const compiled=ts.transpileModule(readFileSync('components/workspace-shell.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','module','exports',compiled)(id=>clientModules[id]||require(id),mod,mod.exports);
const {WorkspaceShell}=mod.exports;

test('every role can cross the workspace client boundary with a native SQLite actor row',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const role of ['institution_operator','institution_head','regional_officer','aicte_admin','student','external_verifier','awarding_body','system_admin']){
   const actor=db.prepare("SELECT 'synthetic-account' user_id, ? role, 'INST001' institution_id, 'North' region, 'STU00001' student_id, 'server-only-value' private_metadata").get(role);
   assert.equal(Object.getPrototypeOf(actor),null,'reproduce the SQLite prototype that crashed React');
   const child='Existing page content',element=WorkspaceShell({actor,name:'Synthetic account',active:'security',children:child});
   assert.equal(Object.getPrototypeOf(element.props.actor),Object.prototype,role);
   assert.deepEqual(element.props.actor,{user_id:actor.user_id,role,institution_id:actor.institution_id,region:actor.region,student_id:actor.student_id});
   assert.equal(element.props.children,child);
   assert.equal(element.props.name,'Synthetic account');
   assert.equal(element.props.active,'security');
   assert.equal(Object.getPrototypeOf(actor),null,'the authorization record is not mutated');
   assert.equal(element.props.actor.private_metadata,undefined,'unneeded server fields stay off the client');
  }
  const actor=db.prepare("SELECT 'synthetic-student' user_id, 'student' role, NULL institution_id, NULL region, NULL student_id").get();
  assert.deepEqual(WorkspaceShell({actor,name:'Student',active:'verification',children:null}).props.actor,{...actor});
 }finally{db.close()}
});
