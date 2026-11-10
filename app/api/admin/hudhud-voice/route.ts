import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
export async function POST(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({error:"OPENAI_API_KEY is not configured on the server"},{status:503});
 try{
  const upstream=await fetch("https://api.openai.com/v1/realtime/client_secrets",{
   method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
   body:JSON.stringify({session:{type:"realtime",model:"gpt-realtime",instructions:"You are HudHud, the helpful voice assistant in the private 1Muslim Admin Command Center. Be concise, clear and accurate. You cannot access live analytics or perform admin actions in this voice session. Never invent statistics or claim an action was performed. Speak naturally.",audio:{output:{voice:"marin"}}}}),cache:"no-store"
  });
  const payload=await upstream.json();
  if(!upstream.ok)return NextResponse.json({error:payload?.error?.message||"Voice session unavailable"},{status:502});
  const secret=payload?.value||payload?.client_secret?.value;
  if(typeof secret!=="string")return NextResponse.json({error:"No session credential returned"},{status:502});
  return NextResponse.json({clientSecret:secret},{headers:{"Cache-Control":"private,no-store"}});
 }catch{return NextResponse.json({error:"Unable to connect to voice service"},{status:502})}
}
