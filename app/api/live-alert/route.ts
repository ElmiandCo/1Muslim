import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const runtime = "nodejs";

// Called by the host only after LiveKit has connected and publishing has begun.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const streamId = typeof body.streamId === "string" ? body.streamId : "";
  if (!/^[a-f0-9-]{36}$/i.test(streamId)) return NextResponse.json({ error: "Invalid stream" }, { status: 400 });
  const { data: stream } = await supabase.from("live_streams").select("id,host_id,title,category,status,started_at").eq("id", streamId).eq("host_id", user.id).maybeSingle();
  if (!stream || stream.status !== "live") return NextResponse.json({ error: "Stream not active or not yours" }, { status: 403 });
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.ADMIN_LIVE_ALERT_EMAIL;
  const sender = process.env.LIVE_ALERT_FROM_EMAIL;
  // Admin email is optional; member alerts are created independently.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://1muslim.vercel.app";
  const link = origin.replace(/\/$/, "") + "/streaming/live/" + stream.id;
  const host = user.user_metadata?.full_name || user.email || "1Muslim host";
  if(apiKey && recipient && sender){const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "1muslim-live-" + stream.id },
    body: JSON.stringify({ from: sender, to: [recipient], subject: "🔴 1Muslim Live: " + stream.title, text: "A 1Muslim member just went live.\n\nHost: " + host + "\nTitle: " + stream.title + "\nCategory: " + stream.category + "\nStarted: " + stream.started_at + "\nWatch: " + link })
  });
  if (!response.ok) console.error("Live admin email failed", response.status);
  }
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!serviceKey||!supabaseUrl)return NextResponse.json({error:"Member notifications require Supabase service role configuration",adminEmailAttempted:Boolean(apiKey&&recipient&&sender)},{status:503});
  const admin=createAdminClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
  let count=0;let failures=0;
  for(let page=1;page<=100;page++){
    const {data,error}=await admin.auth.admin.listUsers({page,perPage:500});
    if(error){console.error("Live audience lookup failed",error.message);failures++;break;}
    const members=data.users.filter(member=>member.id!==user.id);
    for(let i=0;i<members.length;i+=200){
      const rows=members.slice(i,i+200).map(member=>({user_id:member.id,type:"live_started",title:"🔴 Live Now: "+stream.title.slice(0,120),body:host+" just went live on 1Muslim. Tap to watch.",entity_type:"live_stream",entity_id:stream.id}));
      if(!rows.length)continue;
      const {error:insertError}=await admin.from("notifications").insert(rows);
      if(insertError){console.error("Live audience alert batch failed",insertError.message);failures++;}else count+=rows.length;
    }
    if(data.users.length<500)break;
  }
  return NextResponse.json({ok:failures===0,notified:count,failedBatches:failures},{status:failures?207:200});
}
