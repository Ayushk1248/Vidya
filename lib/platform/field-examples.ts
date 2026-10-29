export const fieldKinds:Record<string,string>={institution:'institution',institution_id:'institution',program:'program',program_id:'program',student_id:'student',apaar:'apaar',name:'identity_name',dob:'identity_dob',parent_name:'identity_parent',region:'region',state:'state',certificate:'certificate'}
export const fieldExamples:Record<string,string[]>={
 year:['2026','2025','2024','2023'],academic_year:['2026','2025','2024','2023'],
 gender:['M','F','T'],year_of_study:['1','2','3','4','5'],admission_mode:['Regular','Lateral'],
 scheme:['WITHIN','TFW','FN','OCI'],category:['GENERAL','NRI','OCI','FN'],social_category:['GEN','EWS','OBC','SC','ST'],
 nationality:['IN','US','NP','BD','LK'],nri_status:['N','Y'],oci_status:['N','Y'],fn_status:['N','Y'],
 enrolment_status:['Active','Left','Transferred','Graduated'],rule_code:Array.from({length:14},(_,i)=>'V'+String(i+1).padStart(2,'0')),
 admission_date:['2026-08-01'],admission_start:['2026-07-01'],admission_end:['2026-09-30'],deadline:['2026-10-31'],
 status_date:['2026-08-01'],apaar_pending_deadline:['2026-11-30'],mobile:['0000000000'],email:['synthetic@example.invalid'],
 organisation:['Synthetic Verification Services'],designation:['Admissions Officer','Principal','Regional Officer'],client_name:['Synthetic Institution ERP','Synthetic University Connector'],
 reason:['Synthetic demonstration: explain the requested access or correction before submitting.'],
 apaar_pending_reason:['Synthetic example: APAAR creation is pending; follow up before the stated deadline.'],
 url:['https://erp.example.invalid/vidya/webhook'],title:['{{title}}'],template:['{{body}}'],
 action:['access.requested','access.approved','access.rejected','access.revoked','upload.created','consent.approved'],
 from:['2026-10-27','2026-10-01'],to:['2026-10-27'],
}
export const fieldLabels:Record<string,string>={year:'Academic year',academic_year:'Academic year',student_id:'Student ID',apaar:'Mock APAAR ID',name:'Student name',dob:'Date of birth',program_id:'Approved program code',institution_id:'Institution ID',organisation:'Organisation',designation:'Designation',email:'Email',mobile:'Mobile',purpose:'Verification purpose',reason:'Reason',summary:'Question',description:'What should your institution review?',response:'Response',note:'Review note',client_name:'Client name'}
export const textExamples:Record<string,string[]>={
 purpose:['Synthetic internship demonstration: request only the selected academic fields with the student’s consent.','Synthetic admission verification demonstration: confirm the selected academic details.'],
 description:['Synthetic correction request: please review the program or admission date against the institution’s source record.'],
 summary:['Synthetic review query: please explain the enrolment and approved-intake difference and provide supporting evidence.'],
 response:['Synthetic response draft: describe the correction made or explain why the submitted record is accurate.'],
 note:['Synthetic review draft: record the evidence considered and explain the decision before submitting.'],
 reason:['Synthetic demonstration: describe why access or a record correction is required.'],
 template:['{{body}}'],
}
