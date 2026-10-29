export const portals = {
 students: {label:'Students',roles:['student'],description:'Review sharing requests and approve only the fields you want to share.'},
 institutions: {label:'Institutions',roles:['institution_operator','institution_head','awarding_body'],description:'Operators submit records; Heads review and sign off; awarding bodies issue certificates.'},
 aicte: {label:'AICTE officers',roles:['regional_officer','aicte_admin','system_admin'],description:'Review regional or national data, anomalies, cases and reports.'},
 verifiers: {label:'External verifiers',roles:['external_verifier'],description:'Request academic details and view only what the student approves.'},
};
export function validPortal(value){return typeof value==='string'&&Object.hasOwn(portals,value)?value:null}
export function rolePortal(role){return Object.keys(portals).find(key=>portals[key].roles.includes(role))||null}
export function portalPath(path,category){return validPortal(category)&&path.startsWith('/')&&!path.startsWith('//')&&!path.startsWith('/portal/')&&!path.startsWith('/api/')&&!path.startsWith('/auth/')?'/portal/'+category+path:path}
export function parsePortalPath(path){const match=path.match(/^\/portal\/([^/]+)(\/.*)?$/);return match&&validPortal(match[1])?{category:match[1],path:match[2]||'/'}:null}
export function demoCookie(category){return validPortal(category)?'vidya-demo-'+category:'vidya-demo'}
export function demoIdentity(category,data){return data&&validPortal(category)&&portals[category].roles.some(role=>data.id==='demo-'+role)?data.id:null}
export function legacyPortal(path){return /^\/(uploads|certificates)(\/|$)/.test(path)?'institutions':/^\/(reports|anomalies|cases)(\/|$)/.test(path)?'aicte':null}
export function requestPortal(url,referer){const direct=parsePortalPath(new URL(url).pathname);if(direct)return direct.category;try{const ref=new URL(referer);if(ref.origin===new URL(url).origin)return parsePortalPath(ref.pathname)?.category||legacyPortal(ref.pathname)}catch{}return null}
export function portalApiPath(path,category){if(!validPortal(category)||!path.startsWith('/api/'))return path;const url=new URL(path,'http://portal.invalid');url.searchParams.set('portal',category);return url.pathname+url.search+url.hash}

// Keep client-side URL updates inside the current portal tab.
export function clientPortalPath(path){return typeof window==='undefined'?path:portalPath(path,parsePortalPath(window.location.pathname)?.category)}
