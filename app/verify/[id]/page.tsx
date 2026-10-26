import {PublicCertificateCheck} from '@/components/public-certificate-check'
export const metadata={title:'Certificate check | VIDYA',robots:{index:false,follow:false}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PublicCertificateCheck id={id}/>}
