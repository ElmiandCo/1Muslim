import {NextRequest,NextResponse} from "next/server";
import {createClient as serviceClient} from "@supabase/supabase-js";
import {createHmac} from "node:crypto";
export const runtime="nodejs";
const pages=["Live","Qur’an","Posts","Messages","Elm Tent","Community","Profile"];
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const page=String(body.page||"");
  const event=String(body.event||"");
  const visitor=String(body.visitor||"");
  const visit=String(body.visit||"");
  const cycle=Number(body.cycle||0);
  if(!pages.includes(page)||!["visit","milestone"].includes(event)||!/^[0-9a-f-]{36}$/i.test(visit)||!/^[0-9a-f-]{36}$/i.test(visitor)||!Number.isInteger(cycle)||cycle<0||cycle>1000)return NextResponse.json({error:"Invalid event"},{status:400});
  if(event==="visit"&&cycle!==0)return NextResponse.json({error:"Invalid cycle"},{status:400});
  if(event==="milestone"&&cycle<1)return NextResponse.json({error:"Invalid milestone"},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
  const hash=createHmac("sha256",key).update(visitor).digest("hex");
  const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await db.from("nav_retention_events").upsert({visitor_hash:hash,visit_id:visit,page_name:page,event_type:event,cycle},{onConflict:"visit_id,event_type,cycle",ignoreDuplicates:true});
  if(error)throw error;
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to record"},{status:500})}
}
