import {NextRequest,NextResponse} from "next/server";
import {claimSearchQuota} from "../../../../lib/server/search-api-quota";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status:number)=>NextResponse.json(body,{status,headers});
// Use proven speech-style instructions rather than changing the model or
// inserting words that are absent from the on-screen response.
const voiceDirection=(spokenText:string)=>{
 const islamicContext=/\b(?:allah|islam|islamic|muslim|qur['’]?an|quran|sura[h]?|ayah|verse|prophets?|messenger|muhammad|hadith|salah|shahada|ramadan|sunnah|du['’]?a|sahaba|assalamu|salaam|salam|alaykum|bismillah|inshallah|mashaallah)\b/i.test(spokenText);
 return islamicContext
  ?"Express genuine warmth, joy and engaged curiosity about Islam and the prophets. Sound alive, uplifting and conversational, with natural variation in emphasis; never shout, imitate a sermon, or exaggerate. Always maintain reverence when speaking of Allah, the Qur'an and Prophet Muhammad. Pronounce Islamic names and Arabic words carefully. Read exactly the supplied words, without adding commentary."
  :"Warm, exceptionally natural North American feminine conversational speech with vivid but believable emotional color, spontaneous phrasing rhythm, gentle energy, subtle expressive emphasis and pauses only where meaningful. Sound like a thoughtful person speaking directly to a friend, never like a corporate narrator. Begin promptly. Read the supplied words exactly, without added introductions.";
};

/** Public voice uses the same atomic, globally shared budget guard as search.
 * No audio or private OpenAI credentials are ever stored on the client.
 * Built-in API voices cannot reproduce ChatGPT's Sol exactly.
 * Marin is a high-quality built-in voice, not a reproduction of any specific human or ChatGPT voice.
 */
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return json({error:"Cross-origin request refused"},403);
 const data=await req.json().catch(()=>null);
 const text=typeof data?.text==="string"?data.text.trim():"";
 const streamed=data?.stream===true;
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
    model:"gpt-4o-mini-tts-2025-12-15",voice:"marin",input:text,
    instructions:voiceDirection(text),
    response_format:streamed?"pcm":"mp3",speed:1.02
   }),
   signal:AbortSignal.timeout(20000),cache:"no-store"
  });
  if(!upstream.ok)return json({error:"HudHud voice generation failed"},502);
  if(streamed){
   if(!upstream.body)return json({error:"Voice stream unavailable"},502);
   return new NextResponse(upstream.body,{status:200,headers:{...headers,"Content-Type":"audio/L16;rate=24000;channels=1","X-HudHud-Voice":"stream"}});
  }
  const audio=await upstream.arrayBuffer();
  if(audio.byteLength===0||audio.byteLength>8_000_000)return json({error:"Invalid voice response"},502);
  return new NextResponse(audio,{status:200,headers:{...headers,"Content-Type":"audio/mpeg"}});
 }catch{return json({error:"AI voice is temporarily unavailable"},503)}
}
