import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 const period=new URL(request.url).searchParams.get("period")||"2weeks";
 if(!["day","week","2weeks","month"].includes(period))return NextResponse.json({error:"Invalid period"},{status:400});
 const hours=period==="day";const days=period==="week"?7:period==="month"?30:period==="day"?1:14;
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Analytics unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const today=new Date();const start=hours?new Date(today.getTime()-24*3600000):new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-(days-1)));
 const buckets=new Map<string,{visits:number;visitors:Set<string>}>();
 for(let i=0;i<(hours?24:days);i++){const date=new Date(start.getTime()+i*(hours?3600000:86400000)).toISOString().slice(0,hours?13:10);buckets.set(date,{visits:0,visitors:new Set()})}
 let capped=false;let processed=0;
 for(let offset=0;offset<100000;offset+=1000){
  const {data,error}=await db.from("nav_retention_events").select("created_at,visitor_hash").eq("event_type","visit").gte("created_at",start.toISOString()).order("id",{ascending:true}).range(offset,offset+999);
  if(error)return NextResponse.json({error:"Unable to load live audience growth"},{status:503});
  for(const row of data||[]){const day=String(row.created_at).slice(0,hours?13:10),b=buckets.get(day);if(!b)continue;b.visits++;if(row.visitor_hash)b.visitors.add(row.visitor_hash);processed++}
  if(!data||data.length<1000)break;
  if(offset+1000>=100000)capped=true;
 }
 const points=[...buckets.entries()].map(([date,b])=>({date,visitors:b.visitors.size,visits:b.visits}));
 return NextResponse.json({points,metric:hours?"Hourly unique visitors":"Daily unique visitors",period,source:"Supabase navigation visits",timezone:"UTC",updatedAt:new Date().toISOString(),capped,processed},{headers:{"Cache-Control":"private,no-store"}});
}
