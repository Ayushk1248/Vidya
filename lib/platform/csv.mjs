// RFC-style quoting and UTF-8 BOM; spreadsheet formula prefixes remain inert text.
export function csvCell(value){const text=String(value??'');const safe=/^[\s\u0000-\u001f]*[=+@-]/.test(text)?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"'}
export function csvDocument(columns,rows){return Buffer.from('\uFEFF'+[columns,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'utf8')}
