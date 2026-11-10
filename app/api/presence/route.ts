import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json().catch(()=>null);
 if(typeof body?.sessionId!=="string"||!/^[0-9a-f-]{36}$/i.test(body.sessionId))return NextResponse.json({error:"Invalid session"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const now=Date.now();const lastActive=Number(body.lastActive);
 const safeActive=Number.isFinite(lastActive)?new Date(Math.min(now,Math.max(now-86400000,lastActive))).toISOString():new Date(now).toISOString();
 const page=typeof body.page==="string"&&body.page.startsWith("/")?body.page.slice(0,100):"/";
 const {error}=await admin.from("site_presence").upsert({session_id:body.sessionId,user_id:user.id,page,last_seen:new Date(now).toISOString(),last_active:safeActive},{onConflict:"session_id"});
 if(error)return NextResponse.json({error:"Unavailable"},{status:503});
 // Record a daily activity only after a recent user interaction, not passive background presence.
 if(Date.parse(safeActive)>=now-120000){
  const day=new Date(now).toISOString().slice(0,10);
  const {error:activityError}=await admin.from("user_activity_days").upsert({user_id:user.id,activity_date:day,last_seen:new Date(now).toISOString()},{onConflict:"user_id,activity_date"});
  // Keep presence available if the retention migration has not yet been applied.
  if(activityError)console.warn("Retention daily rollup unavailable",activityError.code);
 }
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
