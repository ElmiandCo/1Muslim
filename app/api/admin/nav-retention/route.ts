import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const rows:Array<{visitor_hash:string;visit_id:string;page_name:string;event_type:string;cycle:number}>=[];
 for(let start=0;start<100000;start+=1000){
  const {data,error}=await db.from("nav_retention_events").select("visitor_hash,visit_id,page_name,event_type,cycle").gte("created_at",new Date(Date.now()-30*86400000).toISOString()).range(start,start+999).order("id",{ascending:true});
  if(error)return NextResponse.json({error:"Unavailable"},{status:500});
  rows.push(...(data||[]));if(!data||data.length<1000)break;
 }
 const visits=rows.filter(x=>x.event_type==="visit"),milestones=rows.filter(x=>x.event_type==="milestone");
 const byPage=["Live","Qur’an","Posts","Messages","Elm Tent","Community","Profile"].map(page=>{
  const p=milestones.filter(x=>x.page_name===page),v=visits.filter(x=>x.page_name===page);
  return {page,pings:p.length,unique:new Set(p.map(x=>x.visitor_hash)).size,visits:v.length,rate:v.length?Math.round(new Set(p.map(x=>x.visit_id)).size/v.length*1000)/10:0};
 });
 return NextResponse.json({pings:milestones.length,unique:new Set(milestones.map(x=>x.visitor_hash)).size,visits:visits.length,rate:visits.length?Math.round(new Set(milestones.map(x=>x.visit_id)).size/visits.length*1000)/10:0,byPage,period:"Last 30 days"},{headers:{"Cache-Control":"no-store"}});
}
