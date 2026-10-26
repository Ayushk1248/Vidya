import {readFileSync} from 'node:fs';
import path from 'node:path';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import {AccessError} from './access.mjs';
export async function renderCertificate(payload,signature,verifyUrl){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(readFileSync(path.join(process.cwd(),'assets/fonts/DejaVuSans.ttf')),{subset:true});const supported=new Set(font.getCharacterSet());
 const p=doc.addPage([595.28,841.89]),navy=rgb(.078,.169,.286),teal=rgb(.086,.522,.486),muted=rgb(.36,.42,.49),light=rgb(.93,.97,.96);const r=payload.record;
 function text(value,x,y,size=10,color=navy,width=490,maxLines=3){const source=String(value??'');if([...source].some(c=>!supported.has(c.codePointAt(0))&&!/\s/.test(c)))throw new AccessError('A record contains characters unavailable in the certificate font. Contact the prototype administrator.',400);let lines=[],line='';for(const word of source.replace(/\s+/g,' ').split(' ')){const candidate=line?line+' '+word:word;if(font.widthOfTextAtSize(candidate,size)>width){if(line)lines.push(line);line=word;while(font.widthOfTextAtSize(line,size)>width){let cut=line.length-1;while(cut>0&&font.widthOfTextAtSize(line.slice(0,cut),size)>width)cut--;lines.push(line.slice(0,cut));line=line.slice(cut)}}else line=candidate}if(line)lines.push(line);if(lines.length>maxLines)throw new AccessError('A record field is too long for the certificate layout. Shorten the submitted value and reapprove the record.',400);lines.forEach((l,i)=>p.drawText(l,{x,y:y-i*(size+5),font,size,color}));return lines.length*(size+5)}
 p.drawRectangle({x:24,y:24,width:547.28,height:793.89,borderWidth:1,borderColor:rgb(.82,.87,.90)});p.drawRectangle({x:24,y:799,width:547.28,height:19,color:navy});
 text('VIDYA',48,757,30);text('STUDENT DATA PLATFORM',49,735,9,muted);text('SYNTHETIC-DATA PROTOTYPE',353,758,9,teal,200);text('SIH26263',353,739,10,muted,180);
 p.drawLine({start:{x:48,y:716},end:{x:547,y:716},thickness:1,color:rgb(.82,.87,.90)});
 text('VERIFIABLE ACADEMIC RECORD',48,681,22);text('Issued after Institution Head sign-off',49,658,11,muted);
 text('STUDENT NAME',49,621,8,muted);const nameHeight=text(r.name,49,600,19,navy,495,2);
 let y=600-nameHeight-15;
 p.drawRectangle({x:48,y:y-62,width:499,height:68,color:light});text('MOCK APAAR ID',63,y-13,8,muted);text(r.apaar,63,y-36,17,navy,230,1);text('STUDENT ID',315,y-13,8,muted);text(r.student_id,315,y-36,12,navy,210,2);y-=90;
 function field(label,value){text(label.toUpperCase(),49,y,8,muted);y-=19;y-=text(value,49,y,11,navy,495,2)+11}
 field('Institution',r.institution_name);field('Program',r.program_name);
 text('ACADEMIC YEAR',49,y,8,muted);text('RECORD VERSION',234,y,8,muted);text('ADMISSION SCHEME',398,y,8,muted,145);y-=21;text(`${r.academic_year}-${r.academic_year+1}`,49,y,11);text(String(r.version),234,y,11);text(r.scheme,398,y,11,navy,145);y-=27;
 text(r.registry_confirmed?'Identity fields matched the mock registry at sign-off.':'Identity fields are institution-submitted; this signature does not confirm registry matching.',49,y,9,muted,495,2);
 if(y<310)throw new AccessError('Record text is too long for a one-page certificate.',400);
 const qr=await doc.embedPng(await QRCode.toBuffer(verifyUrl,{type:'png',width:420,margin:4,errorCorrectionLevel:'M',color:{dark:'#142b49',light:'#ffffff'}}));p.drawImage(qr,{x:414,y:145,width:130,height:130});
 text('VERIFY THIS RECORD',49,273,10,teal);text('Scan the QR to check the current status.',49,251,10,navy,350);text('On the check page, select this PDF to detect file changes.',49,231,9,muted,340,2);text('Certificate reference',49,192,8,muted);text(payload.certificate_id,49,175,9,navy,350,2);text('Issued '+new Date(payload.issued_at).toISOString().slice(0,10)+' UTC',49,146,9,muted,340);
 p.drawLine({start:{x:48,y:125},end:{x:547,y:125},thickness:1,color:rgb(.82,.87,.90)});
 text('Ed25519 record signature | '+payload.key_id,49,108,7,muted);text(signature,49,95,6.8,muted,495,2);text('Demonstration only. Not an official AICTE / APAAR credential.',49,64,8,teal);text('The record is signed digitally. The PDF file is checked against its stored fingerprint.',49,49,7,muted,500,1);
 doc.setTitle('VIDYA synthetic academic record');doc.setAuthor('VIDYA - SIH26263 prototype');doc.setSubject('Ed25519-signed synthetic academic record with online verification');doc.setCreationDate(new Date(payload.issued_at));doc.setModificationDate(new Date(payload.issued_at));return doc.save();
}
