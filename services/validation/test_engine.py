import unittest,copy,io
from services.validation.engine import validate
from services.validation.app import parse,FIELDS
from openpyxl import Workbook
def row(n=1,**kw):
    return dict(student_id=f'TEST{n}',apaar=f'990{n:09}',name=f'Synthetic Person {n}',dob='2004-01-01',program_id='P1',admission_date='2026-08-01',scheme='WITHIN',category='GENERAL',nationality='IN',**kw)
def context(rows):
    return dict(institution_id='A',year=2026,today='2026-09-01',registry=[dict(apaar=r['apaar'],name=r['name'],dob=r['dob']) for r in rows],rules=[dict(code=f'V{n:02}',enabled=1,severity='error',configuration={}) for n in range(1,15)],caps=[dict(scheme='WITHIN',cap_percent=100),dict(scheme='TFW',cap_percent=5)],approvals=[dict(program_id='P1',approved=1,approved_intake=600,deadline='2026-09-30')],existing=[])
class ValidationTests(unittest.TestCase):
 def test_clean_500(self):
    rows=[row(n) for n in range(500)];self.assertTrue(all(r['status']=='ok' for r in validate(rows,context(rows))))
 def test_intake_and_tfw_independent(self):
    rows=[row(n) for n in range(65)];c=context(rows);c['approvals'][0]['approved_intake']=60
    for r in rows[62:]:r['scheme']='TFW'
    result=validate(rows,c);self.assertTrue(all(any(i['code']=='V08' and i['details']['excess']==2 for i in r['issues']) for r in result[:62]));self.assertTrue(all(not r['issues'] for r in result[62:]))
 def test_all_rules_fire(self):
    rows=[row(n) for n in range(12)];c=context(rows);rows[0]['apaar']='';rows[1]['apaar']='BAD';rows[2]['apaar']='989999999999';rows[3]['name']='Completely unrelated';rows[4]['apaar']=rows[5]['apaar'];rows[6]['scheme']='TFW';rows[7]['category']='FN';rows[8]['dob']='2030-01-01';rows[9]['program_id']='NO';c['approvals'][0].update(approved_intake=1,deadline='2026-01-01');c['existing']=[dict(id='E1',institution_id='A',program_id='P1',scheme='WITHIN',apaar=rows[10]['apaar'],name=rows[0]['name'],dob=rows[0]['dob']),dict(id='E2',institution_id='B',program_id='P1',scheme='WITHIN',apaar=rows[11]['apaar'],name='Other',dob='2004-01-01')];codes={i['code'] for r in validate(rows,c) for i in r['issues']};self.assertTrue({f'V{n:02}' for n in range(1,15)}<=codes,codes)
 def test_excel_text_ids_and_formula_rejection(self):
    w=Workbook();s=w.active;s.append(FIELDS);r=row();s.append([r.get(k,'') for k in FIELDS]);b=io.BytesIO();w.save(b);self.assertEqual(parse(b.getvalue(),'test.xlsx')[0]['apaar'],r['apaar']);s['C2']='=1+2';b=io.BytesIO();w.save(b)
    with self.assertRaises(ValueError):parse(b.getvalue(),'test.xlsx')
 def test_missing_headers_rejected(self):
    with self.assertRaises(ValueError):parse(b'foo,bar\n1,2','test.csv')
if __name__=='__main__':unittest.main()
