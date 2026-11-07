import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Unauthorized"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const now=Date.now(),cutoff=new Date(now-90000).toISOString();
 const {data,error}=await admin.from("site_presence").select("user_id,page,last_seen,last_active").gte("last_seen",cutoff).order("last_seen",{ascending:false}).limit(1000);
 if(error)return NextResponse.json({error:"Unavailable"},{status:503});
 const unique=new Map<string,{id:string;page:string;lastSeen:string;lastActive:string}>();
 for(const row of data||[])if(!unique.has(row.user_id))unique.set(row.user_id,{id:row.user_id,page:row.page,lastSeen:row.last_seen,lastActive:row.last_active});
 const ids=[...unique.keys()];
 const {data:profiles}=ids.length?await admin.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[]};
 const byId=new Map((profiles||[]).map(p=>[p.id,p]));
 const members=[...unique.values()].map(p=>{const profile=byId.get(p.id);return{id:p.id,name:profile?.username||profile?.display_name||"Member",avatar:profile?.avatar_url||null,page:p.page,lastSeen:p.lastSeen}});
 return NextResponse.json({online:unique.size,active:[...unique.values()].filter(p=>Date.parse(p.lastActive)>=now-60000).length,members},{headers:{"Cache-Control":"private, no-store"}});
}
