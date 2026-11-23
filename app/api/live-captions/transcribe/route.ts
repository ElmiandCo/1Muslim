import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const form=await request.formData().catch(()=>null);
  const streamId=form?.get("streamId");
  const audio=form?.get("audio");
  if(typeof streamId!=="string"||!/^[0-9a-f-]{36}$/i.test(streamId)||!(audio instanceof File)||audio.size<100||audio.size>4_000_000)
    return NextResponse.json({error:"Invalid caption audio or stream"},{status:400});
  const {data:stream,error}=await supabase.from("live_streams").select("id").eq("id",streamId).eq("host_id",user.id).eq("status","live").maybeSingle();
  if(error||!stream)return NextResponse.json({error:"Active host broadcast required"},{status:403});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return NextResponse.json({error:"Transcription is not configured"},{status:503});
  const payload=new FormData();
  payload.append("file",audio,audio.type.includes("mp4")?"caption.mp4":"caption.webm");
  payload.append("model","gpt-4o-mini-transcribe");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${key}`},body:payload,signal:controller.signal,cache:"no-store"});
    if(!response.ok){console.error("Caption transcription request failed",response.status);return NextResponse.json({error:"Transcription temporarily unavailable"},{status:502});}
    const data=await response.json();
    return NextResponse.json({text:typeof data.text==="string"?data.text.slice(0,700):""},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Caption transcription timed out"},{status:504});}
  finally{clearTimeout(timer);}
}
