import {NextResponse} from "next/server";
import {AccessToken,TrackSource,RoomServiceClient} from "livekit-server-sdk";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to use proximity voice."},{status:401});
 const key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET,url=process.env.LIVEKIT_URL;
 if(!key||!secret||!url)return NextResponse.json({error:"Voice service is not configured."},{status:503});
 const body=await request.json().catch(()=>({}));const ship=body?.mode==="ship";const audioRoom=body?.mode==="audio-room";
 const roomName=ship?"1muslim-game-spaceship-v1":audioRoom?"1muslim-game-merged-audio-room-v1":"1muslim-game-city-proximity-v1";
 let captain=false;
 if(ship||audioRoom){
   try{
     const service=new RoomServiceClient(url,key,secret);
     const passengers=await service.listParticipants(roomName).catch(()=>[]);
     if(passengers.length>=12&&!passengers.some(p=>p.identity===user.id))return NextResponse.json({error:"Spaceship room full (12 passengers)."},{status:409});
     captain=passengers.length===0||passengers[0]?.identity===user.id;
   }catch{return NextResponse.json({error:"Unable to verify ship capacity."},{status:503})}
 }
 const token=new AccessToken(key,secret,{identity:user.id,name:user.user_metadata?.full_name||"Player",ttl:"1h"});
 token.addGrant({roomJoin:true,room:roomName,canPublish:true,canPublishSources:ship?[TrackSource.MICROPHONE,TrackSource.CAMERA,TrackSource.SCREEN_SHARE,TrackSource.SCREEN_SHARE_AUDIO]:[TrackSource.MICROPHONE],canSubscribe:true,canPublishData:false});
 return NextResponse.json({token:await token.toJwt(),url,captain,room:roomName,capacity:ship||audioRoom?12:null});
}
