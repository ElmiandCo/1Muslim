import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const maxDuration=60;
/** Server-only ingestion of authorized audio. Never expose the speech API key to browsers. */
export async function POST(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 const key=process.env.OPENAI_API_KEY;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const dbKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!url||!dbKey)return NextResponse.json({error:"Speech provider or database not configured"},{status:503});
 const form=await request.formData();
 const videoId=String(form.get("videoId")||"");
 const offset=Number(form.get("offsetSeconds")||0);
 const audio=form.get("audio");
 if(!/^[A-Za-z0-9_-]{11}$/.test(videoId)||!Number.isFinite(offset)||offset<0||!(audio instanceof File))return NextResponse.json({error:"Provide videoId, optional offsetSeconds, and an audio file"},{status:400});
 if(audio.size>25*1024*1024||audio.size===0)return NextResponse.json({error:"Audio must be 1 byte to 25 MB"},{status:413});
 const gate=await createClient(url,dbKey,{auth:{persistSession:false,autoRefreshToken:false}}).from("admin_feature_switches").select("enabled").eq("key","speechsync").maybeSingle();if(gate.error||gate.data?.enabled!==true)return NextResponse.json({error:"SpeechSync disabled"},{status:403});
 const payload=new FormData();payload.set("model","whisper-1");payload.set("response_format","verbose_json");payload.set("timestamp_granularities[]","word");payload.set("file",audio,audio.name||"audio.mp3");
 const response=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${key}`},body:payload,signal:AbortSignal.timeout(55000)});
 if(!response.ok)return NextResponse.json({error:"Transcription provider failed",status:response.status},{status:502});
 const transcript=await response.json() as {words?:{word:string;start:number;end:number}[]};
 const words=(transcript.words||[]).filter(w=>typeof w.word==="string"&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start).map((w,i)=>({video_id:videoId,language:"en",word_index:i,word:w.word.trim().slice(0,100),start_seconds:w.start+offset,end_seconds:w.end+offset}));
 if(!words.length)return NextResponse.json({error:"No timed words recognized"},{status:422});
 const db=createClient(url,dbKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.from("video_word_captions").upsert(words,{onConflict:"video_id,language,word_index"});
 if(error)return NextResponse.json({error:"Unable to store transcription"},{status:503});
 return NextResponse.json({videoId,wordCount:words.length,first:words[0].start_seconds,last:words[words.length-1].end_seconds});
}
