import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export const runtime="nodejs";
export async function POST(request:Request){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Unauthorized"},{status:403});
 const endpoint=process.env.HUDHUD_OPENCLAW_CHAT_URL;
 const token=process.env.HUDHUD_OPENCLAW_API_TOKEN;
 if(!endpoint||!token)return NextResponse.json({error:"HudHud gateway is not configured on the server."},{status:503});
 let url:URL;
 try{url=new URL(endpoint);if(url.protocol!=="https:"&&!(process.env.NODE_ENV!=="production"&&url.hostname==="localhost"))throw Error()}catch{return NextResponse.json({error:"Invalid gateway configuration"},{status:503})}
 const body=await request.json().catch(()=>({}));
 const message=typeof body.message==="string"?body.message.trim().slice(0,4000):"";
 if(!message)return NextResponse.json({error:"Message required"},{status:400});
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  let upstream:Response;
  try{upstream=await fetch(url.toString(),{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({model:process.env.HUDHUD_OPENCLAW_MODEL||"openclaw",messages:[{role:"system",content:"You are HudHud, the private 1Muslim admin assistant. Do not claim access to live analytics unless provided by verified tools."},{role:"user",content:message}],stream:false}),cache:"no-store",signal:controller.signal})}finally{clearTimeout(timer)}
  if(!upstream.ok)return NextResponse.json({error:"HudHud gateway unavailable"},{status:502});
  const data=await upstream.json();
  const answer=data?.choices?.[0]?.message?.content;
  if(typeof answer!=="string")return NextResponse.json({error:"Gateway response format unsupported"},{status:502});
  return NextResponse.json({answer},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"HudHud request timed out or failed"},{status:502})}
}
