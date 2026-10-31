import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const {room}=await request.json();
  if(typeof room!=="string"||!/^1muslim-live-[a-zA-Z0-9-]+$/.test(room))return NextResponse.json({error:"Invalid room"},{status:400});
  const {data:stream}=await supabase.from("live_streams").select("id,host_id,status").eq("room_name",room).maybeSingle();
  if(!stream||stream.host_id!==user.id)return NextResponse.json({error:"Host access only"},{status:403});
  if(stream.status!=="live")return NextResponse.json({viewerCount:0,viewers:[]});
  const url=process.env.LIVEKIT_URL,key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET;
  if(!url||!key||!secret)return NextResponse.json({error:"Live service unavailable"},{status:503});
  const participants=await new RoomServiceClient(url,key,secret).listParticipants(room);
  const viewers=participants.filter(p=>p.identity!==stream.host_id);
  const ids=[...new Set(viewers.map(p=>p.identity).filter(id=>/^[0-9a-f-]{36}$/i.test(id)))];
  const profiles=new Map<string,Record<string,unknown>>();
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY,serviceUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(ids.length&&serviceKey&&serviceUrl){
   const service=createServiceClient(serviceUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data}=await service.from("profiles").select("*").in("id",ids);
   for(const profile of data||[])profiles.set(String(profile.id),profile);
  }
  const roster=viewers.map((p,index)=>{
   const profile=profiles.get(p.identity);
   const name=String(profile?.username||profile?.display_name||p.name||`Viewer ${index+1}`);
   const avatar=profile?.avatar_url||profile?.profile_picture_url||profile?.avatar||null;
   const xp=profile?.total_xp??profile?.xp??profile?.xp_points??null;
   return {id:p.identity,username:name,avatar:typeof avatar==="string"?avatar:null,xp:typeof xp==="number"?xp:null};
  });
  return NextResponse.json({viewerCount:viewers.length,viewers:roster},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Live viewer roster error",error);return NextResponse.json({error:"Could not load viewers"},{status:500})}
}
