import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signedInDestination(){
 const client=await createSupabaseServerClient();if(!client)return null
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return null
 return '/auth/workspace'
}
