import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {AccessToken} from "livekit-server-sdk";
export const runtime="nodejs";
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[a-f0-9-]{36}$/i.test(v);
export async function handler(request:Request,method:"GET"|"POST"){
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Calling service unavailable"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const body=method==="POST"?await request.json().catch(()=>({})):null;
 const conversationId=method==="GET"?new URL(request.url).searchParams.get("conversationId"):body?.conversationId;
 if(!uuid(conversationId))return NextResponse.json({error:"Invalid conversation"},{status:400});
 const {data:members,error:memberError}=await db.from("dm_participants").select("user_id").eq("conversation_id",conversationId);
 if(memberError||!members?.some(m=>m.user_id===user.id))return NextResponse.json({error:"Conversation access denied"},{status:403});
 if(members.length!==2)return NextResponse.json({error:"Only one-to-one calls are supported"},{status:400});
 const peer=members.find(m=>m.user_id!==user.id)?.user_id;
 if(!peer)return NextResponse.json({error:"Invalid participants"},{status:400});
 const {data:conversation}=await db.from("dm_conversations").select("request_status").eq("id",conversationId).maybeSingle();
 if(conversation?.request_status!=="accepted")return NextResponse.json({error:"Messaging request must be accepted first"},{status:403});
 const {data:blocks}=await db.from("dm_blocks").select("blocker_id").in("blocker_id",[user.id,peer]).in("blocked_id",[user.id,peer]);
 if(blocks?.length)return NextResponse.json({error:"Call unavailable"},{status:403});
 if(method==="GET"){
  const {data,error}=await db.from("dm_calls").select("id,caller_id,callee_id,mode,status,created_at").eq("conversation_id",conversationId).in("status",["ringing","accepted"]).order("created_at",{ascending:false}).limit(1);
  if(error)return NextResponse.json({error:"Unable to load call state; apply migration"},{status:503});
  return NextResponse.json({call:data?.[0]??null});
 }
 const action=body?.action;
 if(action==="invite"){
  if(!["audio","video"].includes(body.mode))return NextResponse.json({error:"Invalid mode"},{status:400});
  const {data:existing}=await db.from("dm_calls").select("id").eq("conversation_id",conversationId).in("status",["ringing","accepted"]).limit(1);
  if(existing?.length)return NextResponse.json({error:"A call is already active"},{status:409});
  const {data,error}=await db.from("dm_calls").insert({conversation_id:conversationId,caller_id:user.id,callee_id:peer,mode:body.mode}).select("id").single();
  return error?NextResponse.json({error:"Could not invite; apply migration"},{status:503}):NextResponse.json({callId:data.id});
 }
 if(!uuid(body?.callId))return NextResponse.json({error:"Invalid call"},{status:400});
 const {data:call}=await db.from("dm_calls").select("*").eq("id",body.callId).eq("conversation_id",conversationId).maybeSingle();
 if(!call||![call.caller_id,call.callee_id].includes(user.id))return NextResponse.json({error:"Call not found"},{status:404});
 if(action==="accept"||action==="decline"){
  if(call.callee_id!==user.id||call.status!=="ringing")return NextResponse.json({error:"Call cannot be answered"},{status:409});
  const status=action==="accept"?"accepted":"declined";
  const {data,error}=await db.from("dm_calls").update({status,...(status==="accepted"?{accepted_at:new Date().toISOString()}:{ended_at:new Date().toISOString()})}).eq("id",call.id).eq("status","ringing").select("id").maybeSingle();
  return error||!data?NextResponse.json({error:"Call state changed"},{status:409}):NextResponse.json({status});
 }
 if(action==="end"){
  const {error}=await db.from("dm_calls").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",call.id).in("status",["ringing","accepted"]);
  return error?NextResponse.json({error:"Unable to end"},{status:503}):NextResponse.json({status:"ended"});
 }
 if(action==="token"){
  if(call.status!=="accepted")return NextResponse.json({error:"Call not accepted"},{status:403});
  const apiKey=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,livekitUrl=process.env.LIVEKIT_URL;
  if(!apiKey||!secret||!livekitUrl)return NextResponse.json({error:"LiveKit unavailable"},{status:503});
  const token=new AccessToken(apiKey,secret,{identity:user.id,name:user.user_metadata?.full_name||"1Muslim member",ttl:"1h"});
  token.addGrant({roomJoin:true,room:"1muslim-private-"+call.id,canPublish:true,canSubscribe:true,canPublishData:true});
  return NextResponse.json({token:await token.toJwt(),url:livekitUrl,mode:call.mode});
 }
 return NextResponse.json({error:"Unknown action"},{status:400});
}
export async function GET(request:Request){return handler(request,"GET")}
export async function POST(request:Request){return handler(request,"POST")}
