import os,secrets,io,csv,base64,zipfile,datetime
from fastapi import FastAPI,Request,HTTPException
from fastapi.responses import Response
from openpyxl import load_workbook,Workbook
from .engine import validate
app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)
FIELDS=['student_id','apaar','name','dob','program_id','admission_date','scheme','category','nationality','mobile','email','passport']
@app.middleware('http')
async def guard(request:Request,call_next):
    token=os.environ.get('VALIDATION_SERVICE_TOKEN','')
    if not token or not secrets.compare_digest(request.headers.get('x-service-token',''),token): return Response(status_code=403)
    if int(request.headers.get('content-length','0'))>24_000_000: return Response(status_code=413)
    return await call_next(request)
@app.get('/health')
def health(): return {'ok':True}
def parse(data,filename):
    if len(data)>8_000_000: raise ValueError('Maximum file size is 8 MB.')
    if filename.lower().endswith('.xlsx'):
        z=zipfile.ZipFile(io.BytesIO(data))
        if sum(i.file_size for i in z.infolist())>30_000_000: raise ValueError('Workbook expands beyond the allowed size.')
        w=load_workbook(io.BytesIO(data),read_only=True,data_only=False); sheet=w.active
        if sheet.max_row and sheet.max_row>10001: raise ValueError('Maximum 10,000 rows.')
        rows=[]
        for cells in sheet.iter_rows():
            if any(c.data_type=='f' for c in cells): raise ValueError('Formulas are not allowed; paste values instead.')
            rows.append([c.value.isoformat()[:10] if isinstance(c.value,(datetime.date,datetime.datetime)) else str(c.value if c.value is not None else '').strip() for c in cells])
            if len(rows)>10001: raise ValueError('Maximum 10,000 rows.')
        w.close()
    elif filename.lower().endswith('.csv'): rows=list(csv.reader(io.StringIO(data.decode('utf-8-sig'))))
    else: raise ValueError('Upload a CSV or XLSX file.')
    if not rows: raise ValueError('File is empty.')
    headers=[h.strip().lower() for h in rows[0]]
    if len(set(headers))!=len(headers) or not set(FIELDS[:9]).issubset(headers): raise ValueError('Use the template headers; the first nine columns are required.')
    result=[{k:dict(zip(headers,r)).get(k,'').strip() for k in FIELDS} for r in rows[1:] if any(r)]
    if not result or len(result)>10000: raise ValueError('Upload between 1 and 10,000 rows.')
    if any(len(v)>250 or v.startswith(('=','+','@')) for r in result for v in r.values()): raise ValueError('Cells must be plain text, at most 250 characters.')
    return result
@app.post('/parse')
async def parse_api(request:Request):
    try:
        body=await request.json(); return {'rows':parse(base64.b64decode(body['data'],validate=True),body['filename'])}
    except Exception as e: raise HTTPException(400,str(e) if isinstance(e,ValueError) else 'Cannot parse this file. Use the provided template.')
@app.post('/validate')
async def validation(request:Request):
    body=await request.json(); return {'results':validate(body['rows'],body['context'])}
@app.post('/template')
async def template(request:Request):
    body=await request.json(); w=Workbook(); s=w.active; s.title='Synthetic students';s.append(FIELDS)
    for row in body['rows']: s.append([str(row.get(k,'')) for k in FIELDS])
    for col in s.columns:
        for cell in col: cell.number_format='@'
        s.column_dimensions[col[0].column_letter].width=24
    s.freeze_panes='A2'; b=io.BytesIO();w.save(b)
    return Response(b.getvalue(),media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# Keep model fitting off the ASGI event loop so upload validation stays responsive.
from starlette.concurrency import run_in_threadpool
@app.post('/anomalies')
async def anomaly_analysis(request:Request):
    payload=await request.json()
    def run():
        from .anomalies import analyse
        return analyse(payload)
    return await run_in_threadpool(run)
