import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Analytics unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const today=new Date();const start=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-13));
 const buckets=new Map<string,{visits:number;visitors:Set<string>}>();
 for(let i=0;i<14;i++){const day=new Date(start.getTime()+i*86400000).toISOString().slice(0,10);buckets.set(day,{visits:0,visitors:new Set()})}
 let capped=false;let processed=0;
 for(let offset=0;offset<100000;offset+=1000){
  const {data,error}=await db.from("nav_retention_events").select("created_at,visitor_hash").eq("event_type","visit").gte("created_at",start.toISOString()).order("id",{ascending:true}).range(offset,offset+999);
  if(error)return NextResponse.json({error:"Unable to load live audience growth"},{status:503});
  for(const row of data||[]){const day=String(row.created_at).slice(0,10),b=buckets.get(day);if(!b)continue;b.visits++;if(row.visitor_hash)b.visitors.add(row.visitor_hash);processed++}
  if(!data||data.length<1000)break;
  if(offset+1000>=100000)capped=true;
 }
 const points=[...buckets.entries()].map(([date,b])=>({date,visitors:b.visitors.size,visits:b.visits}));
 return NextResponse.json({points,metric:"Daily unique visitors",source:"Supabase navigation visits",timezone:"UTC",updatedAt:new Date().toISOString(),capped,processed},{headers:{"Cache-Control":"private,no-store"}});
}
