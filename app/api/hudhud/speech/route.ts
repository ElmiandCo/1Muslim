import {NextRequest,NextResponse} from "next/server";
import {claimSearchQuota} from "../../../../lib/server/search-api-quota";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status:number)=>NextResponse.json(body,{status,headers});
// Use proven speech-style instructions rather than changing the model or
// inserting words that are absent from the on-screen response.
const voiceDirection=(spokenText:string)=>{
 const islamicContext=/\b(?:allah|islam|islamic|muslim|qur['’]?an|quran|sura[h]?|ayah|verse|prophet|muhammad|hadith|salah|shahada|ramadan|sunnah|du['’]?a|sahaba)\b/i.test(spokenText);
 return islamicContext
  ?"Express genuine warmth, joy and engaged curiosity about Islam and the prophets. Sound alive, uplifting and conversational, with natural variation in emphasis; never shout, imitate a sermon, or exaggerate. Always maintain reverence when speaking of Allah, the Qur'an and Prophet Muhammad. Pronounce Islamic names and Arabic words carefully. Read exactly the supplied words, without adding commentary."
  :"Warm, clear, natural North American feminine speech. Express lively, conversational interest and friendly confidence, with natural pauses and emphasis. Read exactly the supplied words, without adding commentary.";
};

/** Public voice uses the same atomic, globally shared budget guard as search.
 * No audio or private OpenAI credentials are ever stored on the client.
 * Built-in API voices cannot reproduce ChatGPT's Sol exactly.
 * Nova is a North American, feminine approximation until an approved voice is available.
 */
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return json({error:"Cross-origin request refused"},403);
 const data=await req.json().catch(()=>null);
 const text=typeof data?.text==="string"?data.text.trim():"";
 if(!text||text.length>1800||/[\u0000-\u0008\u000e-\u001f]/.test(text))return json({error:"Invalid spoken text"},400);
 const key=process.env.OPENAI_API_KEY;
 if(!key)return json({error:"AI voice is not configured"},503);
 const quota=await claimSearchQuota(req,"voice");
 if(quota==="limited")return json({error:"Voice is temporarily at capacity"},429);
 if(quota==="unavailable")return json({error:"Voice is temporarily unavailable"},503);
 try{
  const upstream=await fetch("https://api.openai.com/v1/audio/speech",{
   method:"POST",
   headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify({
    model:"gpt-4o-mini-tts",voice:"nova",input:text,
    instructions:voiceDirection(text),
    response_format:"mp3",speed:1.0
   }),
   signal:AbortSignal.timeout(20000),cache:"no-store"
  });
  if(!upstream.ok)return json({error:"HudHud voice generation failed"},502);
  const audio=await upstream.arrayBuffer();
  if(audio.byteLength===0||audio.byteLength>8_000_000)return json({error:"Invalid voice response"},502);
  return new NextResponse(audio,{status:200,headers:{...headers,"Content-Type":"audio/mpeg"}});
 }catch{return json({error:"AI voice is temporarily unavailable"},503)}
}
