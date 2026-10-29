import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTranslator} from '../lib/translation-engine.mjs';
const dictionary=JSON.parse(readFileSync(new URL('../lib/ui-hindi.json',import.meta.url),'utf8'));
const translate=createTranslator(dictionary);

test('Hindi covers primary workflows and accessibility labels',()=>{
 for(const phrase of ['Student records.','Open workspace','Approve access','Reject','Revoke access','Review note (required)','Mock APAAR ID','Verification purpose','Choose your role','✦ Suggestions','Download PDF','Email address','Password','Delete Account'])assert.match(translate(phrase,'hi'),/[\u0900-\u097f]/,phrase);
 assert.ok(Object.keys(dictionary).length>1000);
});
test('English, record IDs and user-entered values remain unchanged',()=>{
 for(const value of ['STU00001','INST001-P1','990000000001','Chandrashekhar Gokhale','example@example.invalid','https://example.invalid/record','My own purpose: verify this record']){
  assert.equal(translate(value,'hi'),value);assert.equal(translate(value,'en'),value);
 }
 for(const phrase of Object.keys(dictionary))assert.equal(translate(phrase,'en'),phrase);
});
test('Hindi template substitution preserves counts, roles and machine identifiers',()=>{
 assert.equal(translate('Pending (3)','hi'),'लंबित (3)');
 assert.equal(translate('About the AICTE Admin role','hi'),'AICTE प्रशासक भूमिका के बारे में');
 assert.equal(translate('Suggestions for Student ID','hi'),'छात्र आईडी के सुझाव');
 const text=translate('Year-on-year enrolment growth is +20.0%, above the peer median of +5.0%.','hi');
 assert.match(text,/वर्ष दर वर्ष/);assert.match(text,/\+20\.0%/);assert.match(text,/\+5\.0%/);
 assert.equal(translate('  Log out  ','hi'),'  लॉग आउट  ');
});
test('every translated template retains its original substitution slots',()=>{
 const slots=text=>[...new Set([...text.matchAll(/\{\{(\d+)\}\}/g)].map(m=>m[1]))].sort();
 for(const [source,target]of Object.entries(dictionary)){assert.deepEqual(slots(target),slots(source),source);assert.ok(target.trim(),source)}
});
test('localized controls retain canonical option values and form names',()=>{
 const source=readFileSync(new URL('../components/student-form.tsx',import.meta.url),'utf8');
 assert.match(source,/name=\{key\}/);assert.match(source,/value=\{o\}/);
 const consent=readFileSync(new URL('../components/consent-workspace.tsx',import.meta.url),'utf8');
 assert.match(consent,/name="apaar"/);assert.match(consent,/name="fields" value=\{key\}/);
});
