import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user)return NextResponse.json({members:[]},{headers:{"Cache-Control":"private,no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({members:[]},{headers:{"Cache-Control":"private,no-store"}});
 const db=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const cutoff=new Date(Date.now()-90000).toISOString();
 const {data,error}=await db.from("site_presence").select("user_id").gte("last_seen",cutoff).eq("page","/ummah").limit(80);
 if(error)return NextResponse.json({members:[]},{headers:{"Cache-Control":"private,no-store"}});
 const ids=[...new Set((data||[]).map(x=>x.user_id))].filter(id=>id!==user.id).slice(0,30);
 if(!ids.length)return NextResponse.json({members:[]},{headers:{"Cache-Control":"private,no-store"}});
 const {data:profiles}=await db.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);
 return NextResponse.json({members:(profiles||[]).map(p=>({id:p.id,name:p.username||p.display_name||"Member",avatar:p.avatar_url||null}))},{headers:{"Cache-Control":"private,no-store"}});
}
