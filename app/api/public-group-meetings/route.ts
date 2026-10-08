import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {AccessToken} from "livekit-server-sdk";
export const runtime="nodejs";
const valid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f-]{36}$/i.test(v);
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
export async function GET(){
 const db=admin();if(!db)return NextResponse.json({error:"Unavailable"},{status:503});
 const {data,error}=await db.from("dm_group_calls").select("id,title,mode,starts_at,duration_minutes,broadcast_started_at").eq("is_public",true).not("broadcast_started_at","is",null).lte("starts_at",new Date(Date.now()+15*60000).toISOString()).gte("starts_at",new Date(Date.now()-5*3600000).toISOString()).order("broadcast_started_at",{ascending:false}).limit(10);
 if(error)return NextResponse.json({error:"Public meetings unavailable"},{status:503});
 const now=Date.now();return NextResponse.json({meetings:(data||[]).filter(c=>now<=new Date(c.starts_at).getTime()+(c.duration_minutes+30)*60000)});
}
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));if(!valid(body.callId))return NextResponse.json({error:"Invalid meeting"},{status:400});
 const db=admin();if(!db)return NextResponse.json({error:"Unavailable"},{status:503});
 const {data:call}=await db.from("dm_group_calls").select("id,group_id,creator_id,mode,starts_at,duration_minutes,is_public,broadcast_started_at").eq("id",body.callId).maybeSingle();
 if(!call)return NextResponse.json({error:"Meeting not found"},{status:404});
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 if(body.action==="visibility"){
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const {data:member}=await db.from("dm_group_members").select("role").eq("group_id",call.group_id).eq("user_id",user.id).maybeSingle();
  if(!member||!["owner","admin","moderator"].includes(member.role))return NextResponse.json({error:"Only organizers can change broadcast visibility"},{status:403});
  const now=Date.now(),start=new Date(call.starts_at).getTime();
  if(now<start-15*60000||now>start+(call.duration_minutes+30)*60000)return NextResponse.json({error:"Meeting is outside its broadcast window"},{status:403});
  if(typeof body.public!=="boolean")return NextResponse.json({error:"Choose public or private"},{status:400});
  const {error}=await db.from("dm_group_calls").update({is_public:body.public,broadcast_started_at:body.public?new Date().toISOString():null}).eq("id",call.id);
  return error?NextResponse.json({error:"Could not update visibility; migration required"},{status:503}):NextResponse.json({public:body.public});
 }
 if(body.action==="watch"){
  if(!call.is_public||!call.broadcast_started_at)return NextResponse.json({error:"This meeting is private"},{status:403});
  const now=Date.now(),start=new Date(call.starts_at).getTime();
  if(now<start-15*60000||now>start+(call.duration_minutes+30)*60000)return NextResponse.json({error:"Meeting not live"},{status:403});
  const key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,url=process.env.LIVEKIT_URL;
  if(!key||!secret||!url)return NextResponse.json({error:"Live video unavailable"},{status:503});
  const identity=user?.id||"viewer-"+crypto.randomUUID();
  const token=new AccessToken(key,secret,{identity,name:user?.user_metadata?.full_name||"Viewer",ttl:"30m"});
  token.addGrant({roomJoin:true,room:"1muslim-group-"+call.id,canPublish:false,canSubscribe:true,canPublishData:!!user});
  return NextResponse.json({token:await token.toJwt(),url,canComment:!!user});
 }
 return NextResponse.json({error:"Invalid action"},{status:400});
}
