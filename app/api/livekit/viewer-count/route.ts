import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "../../../../utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({error:"Sign in is required."},{status:401});
    const { room } = await request.json();
    if (typeof room !== "string" || !/^1muslim-live-[a-zA-Z0-9-]+$/.test(room)) return NextResponse.json({error:"Invalid live room."},{status:400});
    const {data:stream}=await supabase.from("live_streams").select("id,host_id,status").eq("room_name",room).maybeSingle();
    if(!stream || stream.status!=="live") return NextResponse.json({viewerCount:0});
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
    return NextResponse.json({viewerCount});
  } catch(error) {
    console.error("Live viewer count error",error);
    return NextResponse.json({error:"Could not read live viewer count."},{status:500});
  }
}