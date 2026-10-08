import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const body=await request.json().catch(()=>({}));
 const id=body.recordingId,note=typeof body.note==="string"?body.note.trim():"";
 if(typeof id!=="string"||!/^[-a-f0-9]{36}$/i.test(id)||note.length>500)return NextResponse.json({error:"Invalid submission"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Submissions unavailable"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:recording,error:lookupError}=await admin.from("live_recordings").select("id,user_id").eq("id",id).maybeSingle();
 if(lookupError)return NextResponse.json({error:"Unable to verify recording"},{status:503});
 if(!recording)return NextResponse.json({error:"Recording not found"},{status:404});
 if(recording.user_id!==user.id)return NextResponse.json({error:"Not your recording"},{status:403});
 const {data:existing}=await admin.from("live_feature_submissions").select("status").eq("recording_id",id).maybeSingle();
 if(existing)return NextResponse.json({error:"This recording was already submitted",status:existing.status},{status:409});
 const {error}=await admin.from("live_feature_submissions").insert({recording_id:id,host_id:user.id,note});
 if(error)return NextResponse.json({error:"Unable to submit recording"},{status:503});
 return NextResponse.json({submitted:true,status:"pending"});
}
