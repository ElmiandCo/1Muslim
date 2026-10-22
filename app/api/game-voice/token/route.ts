import {NextResponse} from "next/server";
import {AccessToken,TrackSource} from "livekit-server-sdk";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
export async function POST(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to use proximity voice."},{status:401});
 const key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,url=process.env.LIVEKIT_URL;
 if(!key||!secret||!url)return NextResponse.json({error:"Voice service is not configured."},{status:503});
 const token=new AccessToken(key,secret,{identity:user.id,name:user.user_metadata?.full_name||"Player",ttl:"1h"});
 token.addGrant({roomJoin:true,room:"1muslim-game-city-proximity-v1",canPublish:true,canPublishSources:[TrackSource.MICROPHONE],canSubscribe:true,canPublishData:false});
 return NextResponse.json({token:await token.toJwt(),url});
}
