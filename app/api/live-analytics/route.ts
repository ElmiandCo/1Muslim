import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const body=await request.json().catch(()=>({}));const streamId=body.streamId,viewers=body.viewers;
 if(typeof streamId!=="string"||!/^[-a-f0-9]{36}$/i.test(streamId)||!Number.isInteger(viewers)||viewers<0||viewers>10000000)return NextResponse.json({error:"Invalid sample"},{status:400});
 const {data:stream}=await session.from("live_streams").select("id,host_id,status").eq("id",streamId).eq("host_id",user.id).maybeSingle();
 if(!stream||stream.status!=="live")return NextResponse.json({error:"Live not active or not yours"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Analytics not configured"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:last}=await db.from("live_analytics_samples").select("captured_at").eq("stream_id",streamId).order("captured_at",{ascending:false}).limit(1).maybeSingle();
 if(last&&Date.now()-new Date(last.captured_at).getTime()<12000)return NextResponse.json({ok:true,throttled:true});
 const {error}=await db.from("live_analytics_samples").insert({stream_id:streamId,viewers});
 if(error)return NextResponse.json({error:"Unable to record sample"},{status:503});
 return NextResponse.json({ok:true});
}
