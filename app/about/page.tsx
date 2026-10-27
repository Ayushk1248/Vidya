import Link from 'next/link'
import {redirect} from 'next/navigation'
import {pageSession} from '@/lib/platform/web-session'
import {workspaceHome} from '@/lib/platform/workspace-navigation'
import {WorkspaceShell,PageHeading} from '@/components/workspace-shell'
import {Text} from '@/components/language'
export const dynamic='force-dynamic'
export default async function About(){
 const {user,actor}=await pageSession();if(!actor)redirect('/onboarding')
 return <WorkspaceShell actor={actor} name={user.user_metadata?.display_name||user.email?.split('@')[0]||'Account'} active="about">
 <PageHeading eyebrow="VIDYA · SIH26263" title="About VIDYA" description="Student data management and verification."/>
 <article className="card" style={{maxWidth:880}}>
 <h2><Text en="What the platform does" hi="यह प्लेटफ़ॉर्म क्या करता है"/></h2>
 <p><Text en="VIDYA brings institution-submitted academic records, validation and verification into one workspace. Institutions submit records for review, authorised officers inspect issues, and students decide which requested details external verifiers can access." hi="VIDYA संस्थानों द्वारा जमा शैक्षणिक रिकॉर्ड, जाँच और सत्यापन को एक कार्यक्षेत्र में लाता है। संस्थान समीक्षा के लिए रिकॉर्ड जमा करते हैं, अधिकृत अधिकारी समस्याओं की जाँच करते हैं और छात्र तय करते हैं कि बाहरी सत्यापनकर्ता कौन-सी अनुरोधित जानकारी देख सकते हैं।"/></p>
 <h2><Text en="Your workspace and access" hi="आपका कार्यक्षेत्र और पहुँच"/></h2>
 <p><Text en="The sidebar shows the tasks available for your assigned role. Access to records follows your institution, region or student scope. Opening this page keeps you in your current workspace; use the button below to return to your main task." hi="साइडबार आपकी निर्धारित भूमिका के अनुसार उपलब्ध कार्य दिखाता है। रिकॉर्ड तक पहुँच आपके संस्थान, क्षेत्र या छात्र दायरे के अनुसार होती है। यह पृष्ठ आपको वर्तमान कार्यक्षेत्र में ही रखता है; अपने मुख्य कार्य पर लौटने के लिए नीचे दिया बटन उपयोग करें।"/></p>
 <h2><Text en="About this prototype" hi="इस प्रोटोटाइप के बारे में"/></h2>
 <p><Text en="Built for Smart India Hackathon problem SIH26263, this prototype uses synthetic institutions and student records, a mock APAAR registry and demonstration approvals. It is not an official AICTE or Government of India service and does not connect to a live APAAR registry." hi="स्मार्ट इंडिया हैकाथॉन की समस्या SIH26263 के लिए बनाया गया यह प्रोटोटाइप कृत्रिम संस्थानों और छात्र रिकॉर्ड, एक नकली APAAR रजिस्ट्री और प्रदर्शन अनुमोदनों का उपयोग करता है। यह AICTE या भारत सरकार की आधिकारिक सेवा नहीं है और वास्तविक APAAR रजिस्ट्री से जुड़ा नहीं है।"/></p>
 <Link className="button" style={{marginTop:24}} href={workspaceHome(actor.role)}><Text en="Back to my workspace" hi="मेरे कार्यक्षेत्र में वापस जाएँ"/> →</Link>
 </article></WorkspaceShell>
}
