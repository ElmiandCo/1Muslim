import {NextRequest,NextResponse} from "next/server";
import {claimSearchQuota} from "../../../../lib/server/search-api-quota";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status:number)=>NextResponse.json(body,{status,headers});
// Use proven speech-style instructions rather than changing the model or
// inserting words that are absent from the on-screen response.
const voiceDirection=(spokenText:string,mood:"calm"|"warm"|"engaged"|"reflective")=>{
 const islamicContext=/\\b(?:allah|islam|islamic|muslim|qur['’]?an|quran|sura[h]?|ayah|verse|prophets?|messenger|muhammad|hadith|salah|shahada|ramadan|sunnah|du['’]?a|sahaba)\\b/i.test(spokenText);
 const moodInstruction={
  calm:"Calm, attentive and understated, with small natural pauses. Respect the user's time. Never sound pushy or preachy.",
  warm:"Warm and genuinely welcoming, like a considerate conversational partner. Clear, natural and not theatrical.",
  engaged:"More animated, confident and curious for helpful recommendations, a little quicker without sounding argumentative.",
  reflective:"Quiet sincerity and measured reverence, with gentle pauses. Do not imitate Qur'an recitation or sermons."
 }[mood];
 const topic=islamicContext
  ?"Express genuine curiosity and hope when discussing Islam and the prophets, with respectful and accurate pronunciation of Allah, Qur'an and Muhammad. Never sound like a sermon."
  :"Sound perceptive, compassionate and friendly, with natural speech rhythm and no forced enthusiasm.";
 return moodInstruction+" "+topic+" Use clear North American feminine speech. Read only the supplied words, without adding commentary.";
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
 const mood: "calm"|"warm"|"engaged"|"reflective" =["calm","warm","engaged","reflective"].includes(data?.mood)?data.mood:"warm";
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
    instructions:voiceDirection(text,mood),
    response_format:"mp3",speed:mood==="calm"||mood==="reflective"?.95:mood==="engaged"?1.045:1.0
   }),
   signal:AbortSignal.timeout(20000),cache:"no-store"
  });
  if(!upstream.ok)return json({error:"HudHud voice generation failed"},502);
  const audio=await upstream.arrayBuffer();
  if(audio.byteLength===0||audio.byteLength>8_000_000)return json({error:"Invalid voice response"},502);
  return new NextResponse(audio,{status:200,headers:{...headers,"Content-Type":"audio/mpeg"}});
 }catch{return json({error:"AI voice is temporarily unavailable"},503)}
}
