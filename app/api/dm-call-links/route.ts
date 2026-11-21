import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {AccessToken} from "livekit-server-sdk";
import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[a-f0-9-]{36}$/i.test(v);
const getDB=()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null};
const signature=(id:string,expires:number,secret:string)=>createHmac("sha256",secret).update(id+"."+expires).digest("hex");
const verify=(token:unknown,secret:string)=>{if(typeof token!=="string")return null;const match=token.match(/^([a-f0-9-]{36})\.([0-9]{10,13})\.([a-f0-9]{64})$/i);if(!match)return null;const id=match[1],expires=Number(match[2]);if(!uuid(id)||!Number.isSafeInteger(expires)||Date.now()>expires||expires>Date.now()+86400000)return null;const expected=Buffer.from(signature(id,expires,secret),"hex"),provided=Buffer.from(match[3],"hex");return timingSafeEqual(expected,provided)?id:null};
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));
 const db=getDB(),secret=process.env.LIVEKIT_API_SECRET,apiKey=process.env.LIVEKIT_API_KEY,url=process.env.LIVEKIT_URL;
 if(!db||!secret||!apiKey||!url)return NextResponse.json({error:"Calling service unavailable"},{status:503});
 if(body.action==="create"){
  const session=await sessionClient();const auth=await session.auth.getUser();const user=auth.data.user;
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  if(!uuid(body.callId))return NextResponse.json({error:"Invalid call"},{status:400});
  const {data:call}=await db.from("dm_calls").select("id,caller_id,callee_id,status,mode").eq("id",body.callId).maybeSingle();
  if(!call||![call.caller_id,call.callee_id].includes(user.id)||!["ringing","accepted"].includes(call.status))return NextResponse.json({error:"Active call required"},{status:403});
  const expires=Date.now()+2*3600000;
  return NextResponse.json({linkToken:call.id+"."+expires+"."+signature(call.id,expires,secret)},{headers:{"Cache-Control":"no-store"}});
 }
 const id=verify(body.linkToken,secret);
 if(!id)return NextResponse.json({error:"This call link has expired or is invalid"},{status:403});
 const {data:call}=await db.from("dm_calls").select("id,status,mode").eq("id",id).maybeSingle();
 if(!call||!["ringing","accepted"].includes(call.status))return NextResponse.json({error:"This call has ended"},{status:410});
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 const identity=user?.id||"link-guest-"+randomUUID();
 const token=new AccessToken(apiKey,secret,{identity,name:String(user?.user_metadata?.full_name||"Guest").slice(0,70),ttl:"2h"});
 token.addGrant({roomJoin:true,room:"1muslim-private-"+id,canPublish:true,canSubscribe:true,canPublishData:true});
 return NextResponse.json({token:await token.toJwt(),url,mode:call.mode},{headers:{"Cache-Control":"no-store"}});
}
export async function GET(request:Request){
 const linkToken=new URL(request.url).searchParams.get("token");
 const secret=process.env.LIVEKIT_API_SECRET,db=getDB();
 if(!secret||!db)return NextResponse.json({error:"Calling unavailable"},{status:503});
 const id=verify(linkToken,secret);if(!id)return NextResponse.json({error:"Invalid or expired call link"},{status:403});
 const {data:call}=await db.from("dm_calls").select("id,mode,status").eq("id",id).maybeSingle();
 if(!call||!["ringing","accepted"].includes(call.status))return NextResponse.json({error:"This call has ended"},{status:410});
 return NextResponse.json({call:{id:call.id,title:"1Muslim Call",mode:call.mode}},{headers:{"Cache-Control":"no-store"}});
}
