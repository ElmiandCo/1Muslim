import {NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {AccessToken} from "livekit-server-sdk";
import {randomUUID} from "node:crypto";
export const runtime="nodejs";
export async function POST(request:Request){
 const session=await sessionClient();const {data:{user}}=await session.auth.getUser();
 // A valid unguessable call link grants entry even without group membership or login.
 const body=await request.json().catch(()=>({}));
 const id=body.callId;
 if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Invalid call"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Database unavailable"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:call,error}=await db.from("dm_group_calls").select("id,group_id,mode,starts_at,duration_minutes").eq("id",id).maybeSingle();
 if(error||!call)return NextResponse.json({error:"Meeting unavailable"},{status:404});
 // Link holders join a LiveKit room directly; group chat memberships stay separate.
 // Do not expose the underlying group messages, membership list or files.
 const apiKey=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,livekitUrl=process.env.LIVEKIT_URL;
 if(!apiKey||!secret||!livekitUrl)return NextResponse.json({error:"LiveKit unavailable"},{status:503});
 const identity=user?.id||"link-guest-"+randomUUID();
 const display=user?.user_metadata?.full_name||"Guest";
 const token=new AccessToken(apiKey,secret,{identity,name:String(display).slice(0,70),ttl:"2h"});
 token.addGrant({roomJoin:true,room:"1muslim-group-"+id,canPublish:true,canSubscribe:true,canPublishData:true});
 return NextResponse.json({token:await token.toJwt(),url:livekitUrl,mode:call.mode},{headers:{"Cache-Control":"no-store"}});
}
