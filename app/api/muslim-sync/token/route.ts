import {NextResponse} from "next/server";
import {AccessToken,TrackSource} from "livekit-server-sdk";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
export async function POST(request:Request){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const {sessionId}=await request.json().catch(()=>({}));
 if(typeof sessionId!=="string"||!/^[0-9a-f-]{36}$/i.test(sessionId))return NextResponse.json({error:"Invalid session"},{status:400});
 const {data:session,error}=await db.from("muslim_sync_sessions").select("id,initiator_id,invitee_id,status").eq("id",sessionId).maybeSingle();
 if(error||!session||session.status!=="accepted"||![session.initiator_id,session.invitee_id].includes(user.id))return NextResponse.json({error:"Accepted invitation required"},{status:403});
 const key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,url=process.env.LIVEKIT_URL;
 if(!key||!secret||!url)return NextResponse.json({error:"Voice service unavailable"},{status:503});
 const token=new AccessToken(key,secret,{identity:user.id,ttl:"30m"});
 token.addGrant({roomJoin:true,room:"1muslim-sync-"+session.id,canPublish:true,canPublishSources:[TrackSource.MICROPHONE],canSubscribe:true,canPublishData:false});
 return NextResponse.json({token:await token.toJwt(),url},{headers:{"Cache-Control":"no-store"}});
}
