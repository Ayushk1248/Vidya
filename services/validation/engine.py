import re, collections, datetime
from rapidfuzz.fuzz import WRatio

class MockRegistry:
    def __init__(self, records): self.records={r['apaar']:r for r in records}
    def lookup(self, apaar): return self.records.get(apaar)

def validate(rows, ctx):
    registry=MockRegistry(ctx['registry']); rules={r['code']:r for r in ctx['rules']}
    approvals={p['program_id']:p for p in ctx['approvals']}; caps={c['scheme']:c['cap_percent'] for c in ctx['caps']}
    replaced={r.get('target_id') for r in rows if r.get('target_id')}
    existing=[e for e in ctx['existing'] if e['id'] not in replaced]
    projected=collections.Counter((e['program_id'],e['scheme']) for e in existing if e['institution_id']==ctx['institution_id'])
    projected.update((r.get('program_id'),r.get('scheme')) for r in rows)
    duplicates=collections.Counter(r.get('apaar') for r in rows if r.get('apaar'))
    students=collections.Counter(r.get('student_id') for r in rows)
    result=[]
    for row in rows:
        r=dict(row); issues=[]; a=r.get('apaar',''); approval=approvals.get(r.get('program_id')); found=registry.lookup(a)
        def issue(code,message,**details):
            rule=rules.get(code,{'enabled':1,'severity':'error'})
            if rule['enabled'] or code in ('V01','V02','V03','V12','SYS'):
                severity='error' if code in ('V01','V02','V03','V12','SYS') else rule['severity']
                issues.append(dict(code=code,severity=severity,message=message,details=details))
        if not r.get('name') or not re.fullmatch(r'[A-Za-z0-9_-]{3,60}',r.get('student_id','')): issue('SYS','Name and a valid student ID are required.')
        if students[r.get('student_id')]>1: issue('SYS','Student ID occurs more than once in this batch.')
        if r.get('foreign_student'): issue('SYS','Student ID is already assigned outside this institution.')
        if r.get('scheme') not in caps: issue('SYS','Choose a configured admission scheme.')
        if not a: issue('V01','APAAR is missing.')
        elif not re.fullmatch(r'[0-9]{12}',a): issue('V02','APAAR must contain exactly 12 digits.')
        elif not found: issue('V03','APAAR was not found in the mock registry.')
        name_ok=bool(found and WRatio(r.get('name','').casefold(),found['name'].casefold())>=rules.get('V04',{}).get('configuration',{}).get('threshold',85))
        dob_ok=bool(found and r.get('dob')==found['dob'])
        if found and not(name_ok and dob_ok): issue('V04','Name or date of birth does not match the mock registry.')
        if a and duplicates[a]>1: issue('V05','APAAR occurs more than once in this file.')
        matches=[e for e in existing if a and e.get('apaar')==a]
        if any(e['institution_id']==ctx['institution_id'] for e in matches): issue('V06','APAAR is already enrolled in this institution this year.')
        if any(e['institution_id']!=ctx['institution_id'] for e in matches): issue('V07','APAAR is enrolled in another institution this year. Officer review required.')
        if not approval or not approval['approved']: issue('V12','Program is not approved for this institution and year.')
        if approval:
            count=projected[(r.get('program_id'),r.get('scheme'))]; intake=approval['approved_intake']
            if r.get('scheme')=='WITHIN' and count>intake: issue('V08',f'Within-intake admissions: {count} / {intake}; {count-intake} excess.',excess=count-intake,count=count,intake=intake)
            elif r.get('scheme') in caps and r.get('scheme')!='WITHIN':
                cap=int(intake*caps[r['scheme']]/100)
                if count>cap: issue('V09',f"{r['scheme']} admissions: {count} / {cap}; {count-cap} excess.",excess=count-cap,cap=cap)
            if ctx['today']>approval['deadline']: issue('V13','Submission is after the program deadline.')
        if (r.get('category') in ('FN','OCI') and (r.get('nationality')=='IN' or not r.get('passport'))) or (r.get('scheme') in ('FN','OCI') and r.get('category')!=r.get('scheme')): issue('V10','FN/OCI category, nationality and passport are inconsistent.')
        try:
            dob=datetime.date.fromisoformat(r.get('dob','')); admission=datetime.date.fromisoformat(r.get('admission_date','')); today=datetime.date.fromisoformat(ctx['today'])
            if dob>=admission or admission>today or not(ctx['year']<=admission.year<=ctx['year']+1) or (admission-dob).days<14*365: issue('V11','Check birth date, admission date and academic year (minimum age 14).')
        except ValueError: issue('V11','Dates must be valid YYYY-MM-DD dates.')
        if not a and any(e.get('dob')==r.get('dob') and WRatio(e.get('name','').casefold(),r.get('name','').casefold())>=rules.get('V14',{}).get('configuration',{}).get('threshold',85) for e in existing): issue('V14','A possible duplicate person has the same DOB and a similar name.')
        provenance={k:'Registry-confirmed' if ok else 'Institution-submitted' for k,ok in [('apaar',bool(found)),('name',name_ok),('dob',dob_ok)]}
        result.append(dict(issues=issues,provenance=provenance,status='error' if any(i['severity']=='error' for i in issues) else 'warning' if issues else 'ok'))
    return result
