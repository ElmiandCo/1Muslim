import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const since=new Date(Date.now()-24*60*60*1000).toISOString();
 const seen=new Set<string>();let events=0;
 for(let start=0;start<200000;start+=1000){
  const {data,error}=await db.from("nav_retention_events").select("visitor_hash").eq("event_type","visit").gte("created_at",since).order("id",{ascending:true}).range(start,start+999);
  if(error)return NextResponse.json({error:"Unable to load visitor count"},{status:503});
  for(const row of data||[]){events++;if(row.visitor_hash)seen.add(row.visitor_hash)}
  if(!data||data.length<1000)break;
 }
 return NextResponse.json({uniqueVisitors:seen.size,visits:events,windowHours:24,updatedAt:new Date().toISOString(),capped:events>=200000},{headers:{"Cache-Control":"private,no-store"}});
}
