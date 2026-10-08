import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({error:"Sign in is required."},{status:401});
    const { room } = await request.json();
    if (typeof room !== "string" || !/^1muslim-live-[a-zA-Z0-9-]+$/.test(room)) return NextResponse.json({error:"Invalid live room."},{status:400});
    const {data:stream}=await supabase.from("live_streams").select("id,host_id,status").eq("room_name",room).maybeSingle();
    if(!stream || stream.status!=="live") return NextResponse.json({viewerCount:0,totalViews:null});
    const url=process.env.LIVEKIT_URL, key=process.env.LIVEKIT_API_KEY, secret=process.env.LIVEKIT_API_SECRET;
    if(!url||!key||!secret) return NextResponse.json({error:"LiveKit is not configured."},{status:503});
    const client=new RoomServiceClient(url,key,secret);
    const participants=await client.listParticipants(room);
    const viewerCount=participants.filter((participant:any)=>participant.identity!==stream.host_id).length;
    const hostPresent=participants.some((participant:any)=>participant.identity===stream.host_id);
    await supabase.from("live_streams").update({
      viewer_count:viewerCount,
      ...(hostPresent ? { last_heartbeat_at:new Date().toISOString() } : {}),
      updated_at:new Date().toISOString()
    }).eq("id",stream.id);
    // Count authenticated unique people who actually joined LiveKit, not page loads.
    let totalViews:number|null=null;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
    if(serviceKey&&supabaseUrl){
      const service=createServiceClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
      const viewerIds=[...new Set(participants.filter((p:any)=>p.identity!==stream.host_id&&/^[0-9a-f-]{36}$/i.test(p.identity)).map((p:any)=>p.identity as string))];
      if(viewerIds.length){
        const {error:insertError}=await service.from("live_unique_viewers").upsert(viewerIds.map(viewer_id=>({stream_id:stream.id,viewer_id})),{onConflict:"stream_id,viewer_id",ignoreDuplicates:true});
        if(insertError) console.warn("Live unique audience tracking unavailable:",insertError.code);
      }
      const {count,error:countError}=await service.from("live_unique_viewers").select("viewer_id",{count:"exact",head:true}).eq("stream_id",stream.id);
      if(!countError)totalViews=count??0;
    }
    return NextResponse.json({viewerCount,totalViews},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    console.error("Live viewer count error",error);
    return NextResponse.json({error:"Could not read live viewer count."},{status:500});
  }
}