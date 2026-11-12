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
 const days=7;const today=new Date();const dates=Array.from({length:days},(_,i)=>new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-days+1+i)).toISOString().slice(0,10));
 const since=dates[0]+"T00:00:00.000Z";
 const daily=dates.map(date=>({date,visits:0,unique:0}));const visitors=dates.map(()=>new Set<string>());
 let scanned=0,capped=false;
 for(let offset=0;offset<50000;offset+=1000){
  const {data,error}=await db.from("nav_retention_events").select("created_at,visitor_hash").eq("event_type","visit").gte("created_at",since).order("created_at",{ascending:true}).range(offset,offset+999);
  if(error)return NextResponse.json({error:"Traffic unavailable"},{status:503});
  for(const row of data||[]){const day=String(row.created_at).slice(0,10),idx=dates.indexOf(day);if(idx>=0){daily[idx].visits++;if(row.visitor_hash)visitors[idx].add(row.visitor_hash)}scanned++}
  if(!data||data.length<1000)break;
  if(offset===49000)capped=true;
 }
 daily.forEach((d,i)=>{d.unique=visitors[i].size});
 const count=async(table:string,filter?:{column:string;value:string})=>{
  let q=db.from(table).select("*",{count:"exact",head:true}).gte("created_at",since);
  if(filter)q=q.eq(filter.column,filter.value);
  const {count,error}=await q;return {count:count??0,error};
 };
 const [posts,community,ummah,likes,reactions,shares]=await Promise.all([
  count("posts"),count("community_posts"),count("ummah_feed_posts"),count("post_likes"),count("ummah_post_reactions",{column:"kind",value:"like"}),count("ummah_post_shares")
 ]);
 if([posts,community,ummah,likes,reactions,shares].some(x=>x.error))return NextResponse.json({error:"Engagement unavailable"},{status:503});
 return NextResponse.json({periodDays:days,daily,visits:daily.reduce((n,d)=>n+d.visits,0),posts:posts.count+community.count+ummah.count,likes:likes.count+reactions.count,shares:shares.count,capped,updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store"}});
}
