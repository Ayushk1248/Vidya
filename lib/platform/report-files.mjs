import ExcelJS from 'exceljs';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {readFileSync} from 'node:fs';
import path from 'node:path';
export async function reportXlsx(data){
 const book=new ExcelJS.Workbook();book.creator='VIDYA';book.created=new Date(data.generated_at);
 const info=book.addWorksheet('Read me');info.columns=[{width:26},{width:110}];
 for(const row of [['VIDYA report',data.title],['Academic year',data.year],['Scope',data.scope],['Generated (UTC)',data.generated_at],['Exported rows',data.rows.length],...data.notes.map(n=>['Note',n])]){const r=info.addRow(row);r.alignment={vertical:'top',wrapText:true};r.height=Math.max(25,Math.ceil(String(row[1]).length/95)*17)}
 const sheet=book.addWorksheet('Report',{views:[{state:'frozen',ySplit:1}]});sheet.columns=data.columns.map((header,n)=>({header,key:'c'+n,width:Math.min(48,Math.max(16,header.length+3))}));
 for(const row of data.rows)sheet.addRow(row.map(v=>v===null?'':v));
 sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:data.columns.length}};
 sheet.getRow(1).height=32;sheet.getRow(1).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF142B49'}};c.font={bold:true,color:{argb:'FFFFFFFF'}};c.alignment={wrapText:true,vertical:'middle'}});
 sheet.eachRow((row,n)=>{
  if(n===1)return;
  row.alignment={vertical:'top',wrapText:true};
  const lineCount=Math.max(1,...row.values.slice(1).map((v,i)=>Math.ceil(String(v??'').length/(sheet.columns[i].width-2))));
  row.height=Math.max(32,Math.min(409,lineCount*14+12));
  row.eachCell(c=>{
   c.font={size:11,color:{argb:'FF142B49'}};
   if(n%2===0)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F8F8'}};
  });
 });
 return Buffer.from(await book.xlsx.writeBuffer());
}
export async function reportPdf(data){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(readFileSync(path.join(process.cwd(),'assets/fonts/DejaVuSans.ttf')),{subset:true});const supported=new Set(font.getCharacterSet());
 const clean=v=>[...String(v??'')].map(c=>supported.has(c.codePointAt(0))?c:'?').join('');
 const navy=rgb(.078,.169,.286),muted=rgb(.35,.43,.49),teal=rgb(.08,.47,.44);let page,y=0;
 const width=774,cellWidth=width/data.columns.length;
 function wrap(value,w,size=8){
  const lines=[];let line='';
  for(const word of clean(value).replace(/\s+/g,' ').split(' ')){
   const candidate=line?line+' '+word:word;
   if(font.widthOfTextAtSize(candidate,size)<=w){line=candidate;continue}
   if(line)lines.push(line);line=word;
   while(font.widthOfTextAtSize(line,size)>w){let n=line.length-1;while(n>1&&font.widthOfTextAtSize(line.slice(0,n),size)>w)n--;lines.push(line.slice(0,n));line=line.slice(n)}
  }
  if(line||!lines.length)lines.push(line);return lines;
 }
 function text(value,x,pos,size=8,color=navy){page.drawText(clean(value),{x,y:pos,size,font,color})}
 const rows=data.rows.slice(0,1000),notes=[...data.notes,`PDF contains ${rows.length} of ${data.rows.length} rows. Excel includes all exported rows. Cell text in PDF is limited to 240 characters; use Excel for full text.`];
 function newPage(){page=doc.addPage([842,595]);text('VIDYA / '+data.title,34,559,16);text(`Academic year ${data.year} | Scope: ${data.scope} | Generated: ${data.generated_at}`,34,537,8,muted);text('SYNTHETIC PROTOTYPE - Not an official government report',34,520,8,teal);y=496;const h=Math.max(...data.columns.map(c=>wrap(c,cellWidth-10,8).length))*11+16;page.drawRectangle({x:34,y:y-h+8,width,height:h,color:navy});data.columns.forEach((c,i)=>wrap(c,cellWidth-10).forEach((line,j)=>text(line,39+i*cellWidth,y-j*11,8,rgb(1,1,1))));y-=h+4}
 newPage();
 for(const row of rows){const cells=row.map(v=>wrap(String(v??'').slice(0,240),cellWidth-10)),h=Math.max(...cells.map(c=>c.length))*10+12;if(y-h<45)newPage();cells.forEach((lines,i)=>lines.forEach((line,j)=>text(line,39+i*cellWidth,y-j*10)));y-=h;page.drawLine({start:{x:34,y:y+8},end:{x:808,y:y+8},thickness:.4,color:rgb(.85,.89,.91)})}
 if(!rows.length){text('No matching records.',39,y);y-=24}
 // Notes may continue onto additional pages; never draw past the page footer.
 for(const note of notes){for(const line of wrap(note,width,9)){if(y<50){page=doc.addPage([842,595]);text('VIDYA / Report notes',34,559,16);y=529}text(line,34,y,9,muted);y-=13}y-=10}
 doc.getPages().forEach((p,i)=>p.drawText(`Page ${i+1} of ${doc.getPageCount()}`,{x:720,y:22,font,size:8,color:muted}));return Buffer.from(await doc.save());
}
