const normalize=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
export function createTranslator(dictionary){
 const exact=new Map(Object.entries(dictionary).map(([source,target])=>[normalize(source),target]));
 const patterns=Object.entries(dictionary).filter(([key])=>/\{\{\d+\}\}/.test(key)).map(([key,value])=>{
  const indexes=[];
  const source=key.split(/(\{\{\d+\}\})/g).map(part=>{const match=part.match(/^\{\{(\d+)\}\}$/);if(match){indexes.push(Number(match[1]));return '(.+?)'}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('');
  return {pattern:new RegExp('^'+source+'$','i'),value,indexes};
 });
 function translate(text,language){
  if(language!=='hi'||!text.trim())return text;
  const body=text.replace(/\s+/g,' ').trim(),leading=text.match(/^\s*/)?.[0]||'',trailing=text.match(/\s*$/)?.[0]||'';
  const found=exact.get(normalize(body));if(found)return leading+found+trailing;
  for(const {pattern,value,indexes} of patterns){const match=body.match(pattern);if(match)return leading+value.replace(/\{\{(\d+)\}\}/g,(_,n)=>{const at=indexes.indexOf(Number(n));return at<0?'':translate(match[at+1],language)})+trailing}
  const suffix=body.match(/^(.+?)(\s*[.:：→↗↓]+)$/);
  if(suffix){const value=exact.get(normalize(suffix[1]));if(value)return leading+value+suffix[2]+trailing}
  return text;
 }
 return translate;
}
