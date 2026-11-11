import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const since=new Date(Date.now()-30*86400000).toISOString();
 const [events,progress,reviews]=await Promise.all([
  db.from("dw_watch_events").select("id,user_id,video_id,event_type,position_seconds,created_at",{count:"exact"}).gte("created_at",since).order("created_at",{ascending:false}).limit(5000),
  db.from("dw_watch_progress").select("user_id,video_id,position_seconds,completed,updated_at",{count:"exact"}).gte("updated_at",since).limit(5000),
  db.from("deepwatch_reviews").select("rating",{count:"exact"}).gte("created_at",since).limit(5000)
 ]);
 if(events.error||progress.error||reviews.error)return NextResponse.json({error:"Analytics unavailable"},{status:503});
 const rows=events.data||[],pr=progress.data||[],rr=reviews.data||[];
 const typeCounts:Record<string,number>={};const videos=new Map<string,number>();const days=new Map<string,number>();
 for(const row of rows){const type=String(row.event_type||"unknown");typeCounts[type]=(typeCounts[type]||0)+1;const id=String(row.video_id||"");if(id)videos.set(id,(videos.get(id)||0)+1);const day=String(row.created_at).slice(0,10);days.set(day,(days.get(day)||0)+1)}
 const daily=Array.from({length:30},(_,i)=>{const d=new Date(Date.now()-(29-i)*86400000).toISOString().slice(0,10);return {date:d,events:days.get(d)||0}});
 return NextResponse.json({periodDays:30,events:events.count||0,uniqueViewers:new Set(rows.map(r=>r.user_id).filter(Boolean)).size,uniqueViewersSampled:rows.length<(events.count||0),eventTypes:typeCounts,progressRecords:progress.count||0,completed:pr.filter(r=>r.completed).length,completionSampled:pr.length<(progress.count||0),reviews:reviews.count||0,averageRating:rr.length?Number((rr.reduce((sum,r)=>sum+Number(r.rating||0),0)/rr.length).toFixed(1)):null,ratingsSampled:rr.length<(reviews.count||0),topVideos:[...videos].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([videoId,count])=>({videoId,count})),daily,eventsSampled:rows.length<(events.count||0)},{headers:{"Cache-Control":"private, no-store"}});
}
