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
 def test_reference_aliases_keep_quoted_names_and_normalize_seat_and_country(self):
    header='student_id,apaar_id,student_name,date_of_birth,gender,program_code,academic_year,admission_date,seat_type,social_category,nri_status,oci_status,fn_status,nationality,passport_no'
    data=header+'\nTEST1,990000000001,"Synthetic, Student",2004-01-01,F,P1,2026-27,2026-08-01,Supernumerary-TFW,EWS,N,N,N,Indian,\n'
    r=parse(data.encode('utf-8'),'reference.csv',2026)[0]
    self.assertEqual(r['name'],'Synthetic, Student');self.assertEqual(r['apaar'],'990000000001');self.assertEqual(r['scheme'],'TFW');self.assertEqual(r['nationality'],'IN');self.assertEqual(r['social_category'],'EWS');self.assertEqual(r['category'],'GENERAL')
 def test_reference_format_never_invents_student_identity(self):
    data=b'apaar_id,student_name,date_of_birth,program_code,admission_date,seat_type,nationality\n990000000001,Synthetic,2004-01-01,P1,2026-08-01,Within Intake,Indian'
    with self.assertRaisesRegex(ValueError,'student_id'):parse(data,'reference.csv')
 def test_alias_conflicts_and_wrong_academic_year_are_rejected(self):
    with self.assertRaisesRegex(ValueError,'Duplicate'):parse(b'apaar,apaar_id\n1,2','conflict.csv')
    fields='student_id,apaar,name,dob,program_id,academic_year,admission_date,scheme,category,nationality'
    data=fields+'\nTEST1,990000000001,Synthetic,2004-01-01,P1,2025-26,2026-08-01,WITHIN,GENERAL,IN'
    with self.assertRaisesRegex(ValueError,'academic_year'):parse(data.encode(),'wrong-year.csv',2026)
 def test_import_does_not_register_unknown_apaar_as_verified(self):
    original=row();c=context([original]);data='student_id,apaar_id,student_name,date_of_birth,program_code,admission_date,seat_type,nationality\nTEST2,999999999999,Synthetic Person,2004-01-01,P1,2026-08-01,Within Intake,Indian'
    imported=parse(data.encode(),'unknown.csv')[0];result=validate([imported],c)[0]
    self.assertTrue(any(i['code']=='V03' for i in result['issues']));self.assertEqual(len(c['registry']),1);self.assertEqual(result['identity_status'],'Not found')
 def test_pending_apaar_requires_reason_and_bounded_deadline(self):
    r=row();r.update(apaar='',apaar_pending_reason='Institution has requested academic ID',apaar_pending_deadline='2026-09-20')
    c=context([r]);result=validate([r],c)[0];self.assertEqual(result['identity_status'],'Pending');self.assertFalse(any(i['severity']=='error' for i in result['issues']))
    r['apaar_pending_reason']='short';self.assertEqual(validate([r],c)[0]['status'],'error')
    r.update(apaar_pending_reason='Valid long reason here',apaar_pending_deadline='2027-12-01');self.assertEqual(validate([r],c)[0]['status'],'error')
 def test_independent_category_flags_lateral_and_window(self):
    r=row();c=context([r]);r.update(fn_status='Y',oci_status='Y',nationality='US',passport='ZZ00001',year_of_study='1',admission_mode='Lateral');c['approvals'][0].update(admission_start='2026-09-01',admission_end='2026-09-30')
    issues=validate([r],c)[0]['issues'];self.assertTrue({'V10','V11','SYS'}<={i['code'] for i in issues})
 def test_critical_intake_is_reviewable_without_hiding_finding(self):
    r=row();c=context([r]);c['approvals'][0]['approved_intake']=0
    for rule in c['rules']:
        if rule['code']=='V08':rule['severity']='critical'
    result=validate([r],c)[0];self.assertEqual(result['status'],'warning');self.assertTrue(any(i['code']=='V08' and i['severity']=='critical' for i in result['issues']))
if __name__=='__main__':unittest.main()
