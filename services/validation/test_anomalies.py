import unittest,copy
from services.validation.anomalies import analyse

def dataset(count=24):
    p=dict(year=2026,policy=dict(min_peers=8,min_enrolments=10,high_threshold=70,moderate_threshold=40),name_threshold=85,institutions=[],records=[])
    for i in range(count):
        key=f'I{i:03}'; abnormal=i<2; n=100 if abnormal else 20
        p['institutions'].append(dict(id=key,region='North',institution_type='Engineering',intake=60,previous=20))
        for j in range(n):
            p['records'].append(dict(id=f'{key}-{j}',student_id=f'S-{key}-{j}',institution_id=key,scheme='WITHIN',post_signoff_edits=1 if abnormal else 0,name='Synthetic Student',dob='2004-01-01',apaar=f'990{i*100+j:09}',registry_name='Synthetic Student',registry_dob='2004-01-01',mobile_key='shared' if abnormal else f'phone-{key}-{j}'))
    return p

class AnomalyTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
    cls.payload=dataset();cls.result=analyse(cls.payload)
 def test_planted_risk_and_three_reasons(self):
    for row in self.result['results'][:2]:
        self.assertGreaterEqual(row['score'],70);self.assertEqual(len(row['reasons']),3);self.assertTrue(all('peer median' in r for r in row['reasons']))
    self.assertLess(self.result['results'][10]['score'],40)
 def test_deterministic_scores_and_peer_exclusion(self):
    again=analyse(self.payload);self.assertEqual(self.result,again)
    self.assertEqual(self.result['results'][0]['features']['peer_count'],23)
 def test_insufficient_cohort_never_fabricates_low_risk(self):
    result=analyse(dataset(5));self.assertTrue(all(r['score'] is None and r['band']=='insufficient' for r in result['results']))
 def test_empty_new_small_and_zero_intake(self):
    p=dataset(5);p['records']=[];p['institutions'][0]['intake']=0;p['institutions'][1]['previous']=0
    result=analyse(p);self.assertTrue(all(r['score'] is None for r in result['results']));self.assertIsNone(result['results'][1]['features']['metrics'][0]['value']);self.assertIsNone(result['results'][0]['features']['metrics'][1]['value'])
 def test_supernumerary_does_not_inflate_ratio_and_blanks_not_shared(self):
    p=dataset(5)
    for row in p['records']:
        row['scheme']='TFW';row['mobile_key']=None
    result=analyse(p)
    for row in result['results']:
        self.assertEqual(row['features']['metrics'][1]['value'],0);self.assertEqual(row['features']['shared_students'],0)
 def test_registry_counts_dob_and_missing_not_just_format(self):
    p=dataset(5);p['records'][0]['registry_dob']='2000-01-01';p['records'][1]['registry_name']=None
    result=analyse(p)['results'][0];self.assertEqual(result['features']['unresolved_identities'],2);self.assertEqual(result['features']['missing_registry'],1)
if __name__=='__main__':unittest.main()
