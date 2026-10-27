"""Synthetic institution screening. Scores are triage indicators, not probabilities."""
from collections import Counter,defaultdict
import re
import numpy as np
import sklearn
from sklearn.ensemble import IsolationForest
from rapidfuzz.fuzz import WRatio
FEATURES=['growth','intake_ratio','identity_mismatch','post_signoff_edits','shared_mobile','category_share','upload_concentration','lifecycle_changes']
LABELS=['Year-on-year enrolment growth','Within-intake / approved-intake ratio','APAAR identity checks unsuccessful','Records edited after sign-off','Students sharing a mobile number','Supernumerary / overseas category share','Same-day upload concentration','Withdrawn or transferred enrolments']
FLOORS=[0.15,0.15,5.0,5.0,5.0,5.0,5.0,5.0]
MODEL_VERSION='isolation-forest-peer-v1 / sklearn '+sklearn.__version__

def analyse(payload):
    policy=payload['policy']; institutions=payload['institutions']; records=payload['records']
    grouped=defaultdict(list)
    for record in records: grouped[record['institution_id']].append(record)
    data=[]
    for inst in institutions:
        rows=grouped[inst['id']]; n=len(rows); previous=inst['previous']; intake=inst['intake']
        mobiles=defaultdict(set)
        for row in rows:
            if row.get('mobile_key'): mobiles[row['mobile_key']].add(row['student_id'])
        students={row['student_id'] for row in rows}
        shared=set().union(*(s for s in mobiles.values() if len(s)>1)) if mobiles else set()
        unresolved=0; missing=0
        for row in rows:
            exists=bool(row.get('registry_name'))
            ok=exists and bool(re.fullmatch(r'[0-9]{12}',row.get('apaar') or '')) and row['dob']==row['registry_dob'] and WRatio(row['name'].casefold(),row['registry_name'].casefold())>=payload['name_threshold']
            unresolved+=not ok;missing+=not exists
        within=sum(row['scheme']=='WITHIN' for row in rows)
        edited=sum(row['post_signoff_edits']>0 for row in rows)
        values=[(n-previous)/previous if previous else None,within/intake if intake else None,100*unresolved/n if n else None,100*edited/n if n else None,100*len(shared)/len(students) if students else None]
        category=sum(r.get('scheme')!='WITHIN' or r.get('category') in ('NRI','OCI','FN') for r in rows)
        dates=Counter(str(r.get('submitted_at',''))[:10] for r in rows if r.get('submitted_at'))
        lifecycle=sum(r.get('enrolment_status') in ('Left','Transferred') for r in rows)
        values += [100*category/n if n else None,100*max(dates.values())/n if n and dates else None,100*lifecycle/n if n else None]
        notes=[]
        if not previous:notes.append('No previous-year enrolments: growth is unavailable, not zero.')
        if not intake:notes.append('No approved intake: ratio is unavailable. Check program approvals separately.')
        if n<policy['min_enrolments']:notes.append(f"Fewer than {policy['min_enrolments']} enrolments: no reliable institution risk score.")
        band='small' if intake<=300 else 'medium' if intake<=1000 else 'large'
        data.append(dict(id=inst['id'],region=inst.get('state') or inst['region'],kind=inst['institution_type'],capacity_band=band,n=n,previous=previous,intake=intake,within=within,unresolved=unresolved,missing_registry=missing,edited=edited,shared_students=len(shared),students=len(students),mobile_present=sum(bool(x.get('mobile_key')) for x in rows),values=values,notes=notes))
    eligible=[d for d in data if d['n']>=policy['min_enrolments'] and d['intake']>0]
    vectors=[]; scored=[]
    for d in data:
        candidates=[x for x in eligible if x['id']!=d['id']]
        definitions=[('State, institution type and approved capacity',lambda x:x['region']==d['region'] and x['kind']==d['kind'] and x['capacity_band']==d['capacity_band']),('Institution type and approved capacity (national)',lambda x:x['kind']==d['kind'] and x['capacity_band']==d['capacity_band']),('Institution type (national)',lambda x:x['kind']==d['kind']),('National fallback',lambda x:True)]
        peers=[];label='Insufficient comparable institutions'
        for description,match in definitions:
            group=[x for x in candidates if match(x)]
            if len(group)>=policy['min_peers']:peers=group;label=description;break
        medians=[];deviations=[];vector=[]
        for j,v in enumerate(d['values']):
            numbers=[p['values'][j] for p in peers if p['values'][j] is not None]
            median=float(np.median(numbers)) if numbers else None
            spread=max(float(np.percentile(numbers,75)-np.percentile(numbers,25)),FLOORS[j]) if numbers else FLOORS[j]
            z=(v-median)/spread if v is not None and median is not None else 0.0
            medians.append(median);deviations.append(z);vector.append(float(np.clip(z,-8,8)))
        d.update(peer_label=label,peer_count=len(peers),medians=medians,deviations=deviations,score=None,raw_score=None,band='insufficient',counterfactual=[0]*len(FEATURES))
        if d in eligible and peers:
            vectors.append(vector);scored.append(d)
        elif d in eligible:d['notes'].append('Peer group is too small for a reliable score.')
    if len(scored)>=policy['min_peers']+1:
        x=np.array(vectors,dtype=float)
        model=IsolationForest(n_estimators=256,max_samples=min(256,len(x)),contamination='auto',random_state=26263,n_jobs=1).fit(x)
        raw=-model.score_samples(x)
        for i,d in enumerate(scored):
            score=round(float(np.clip((raw[i]-0.35)/0.40*100,0,100)),1)
            d['raw_score']=round(float(raw[i]),6);d['score']=score;d['band']='high' if score>=policy['high_threshold'] else 'moderate' if score>=policy['moderate_threshold'] else 'low'
            replacements=np.tile(x[i],(len(FEATURES),1))
            for j in range(len(FEATURES)):replacements[j,j]=0
            changes=raw[i]-(-model.score_samples(replacements))
            d['counterfactual']=[round(float(v),6) for v in changes]
    results=[]
    def display(v,j):
        if v is None:return 'unavailable'
        if j==0:return f'{v*100:+.1f}%'
        if j==1:return f'{v:.2f}x'
        return f'{v:.1f}%'
    for d in data:
        metrics=[]
        for j,key in enumerate(FEATURES):
            metrics.append(dict(key=key,label=LABELS[j],value=d['values'][j],peer_median=d['medians'][j],display=display(d['values'][j],j),peer_display=display(d['medians'][j],j),deviation=round(d['deviations'][j],3),model_score_drop=d['counterfactual'][j]))
        order=sorted(range(len(FEATURES)),key=lambda j:(max(0,d['counterfactual'][j]),abs(d['deviations'][j])),reverse=True)
        reasons=[]
        for j in order:
            if d['values'][j] is None or d['medians'][j] is None:continue
            direction='above' if d['deviations'][j]>0.01 else 'below' if d['deviations'][j]<-0.01 else 'equal to'
            reasons.append(f"{LABELS[j]} is {display(d['values'][j],j)}, {direction} the peer median of {display(d['medians'][j],j)}.")
            if len(reasons)==3:break
        if not reasons:reasons=['Insufficient comparable data. Review the available counts before interpreting risk.']
        results.append(dict(institution_id=d['id'],score=d['score'],band=d['band'],reasons=reasons,features=dict(metrics=metrics,peer_label=d['peer_label'],peer_count=d['peer_count'],capacity_band=d['capacity_band'],notes=d['notes'],enrolments=d['n'],previous_enrolments=d['previous'],approved_intake=d['intake'],within_intake=d['within'],unresolved_identities=d['unresolved'],missing_registry=d['missing_registry'],edited_records=d['edited'],shared_students=d['shared_students'],distinct_students=d['students'],mobile_present=d['mobile_present'],raw_score=d['raw_score'],score=d['score'],band=d['band'])))
    return dict(model_version=MODEL_VERSION,results=results)
