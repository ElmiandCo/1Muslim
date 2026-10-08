import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
async function context(){
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();if(!user)return null;
 const {data:admin}=await session.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return null;
 return {user,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
export async function GET(){
 const ctx=await context();if(!ctx)return NextResponse.json({error:"Admin access required or service unavailable"},{status:403});
 const {data,error}=await ctx.db.from("live_feature_submissions").select("id,recording_id,host_id,note,status,submitted_at,reviewed_at").order("submitted_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Unable to load submissions; check migration"},{status:503});
 const ids=(data??[]).map(x=>x.recording_id);
 const {data:recordings}=ids.length?await ctx.db.from("live_recordings").select("id,title,duration_seconds,video_path").in("id",ids):{data:[]};
 return NextResponse.json({submissions:(data??[]).map(x=>({...x,recording:recordings?.find(r=>r.id===x.recording_id)??null}))});
}
export async function PATCH(request:Request){
 const ctx=await context();if(!ctx)return NextResponse.json({error:"Admin access required"},{status:403});
 const body=await request.json().catch(()=>({}));
 if(typeof body.id!=="string"||!/^[-a-f0-9]{36}$/i.test(body.id)||!["approved","rejected"].includes(body.status))return NextResponse.json({error:"Invalid decision"},{status:400});
 const {data,error}=await ctx.db.from("live_feature_submissions").update({status:body.status,reviewed_at:new Date().toISOString(),reviewed_by:ctx.user.id}).eq("id",body.id).eq("status","pending").select("id,status").maybeSingle();
 if(error)return NextResponse.json({error:"Unable to save decision"},{status:503});
 if(!data)return NextResponse.json({error:"Submission already reviewed"},{status:409});
 return NextResponse.json({submission:data,note:"Approval is recorded. Homepage publication requires the featured-player integration."});
}
