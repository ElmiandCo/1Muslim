import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export async function POST(request:NextRequest){
 try{
  const bearer=request.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer "))return NextResponse.json({error:"Authentication required."},{status:401});
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!supabaseUrl||!supabaseKey)return NextResponse.json({error:"Authentication is not configured."},{status:503});
  const supabase=createClient(supabaseUrl,supabaseKey,{auth:{persistSession:false}});
  const {data:{user},error}=await supabase.auth.getUser(bearer.slice(7));
  if(error||!user)return NextResponse.json({error:"Invalid session."},{status:401});
  // Temporary server-side entitlement gate until the billing subscription table is connected.
  // No user-provided profile flag or browser value can unlock this endpoint.
  const allowed=new Set((process.env.HUDHUD_PREMIUM_USER_IDS||"").split(",").map(v=>v.trim()).filter(Boolean));
  if(!allowed.has(user.id))return NextResponse.json({error:"HudHud AI is available to Premium members. Subscription activation is coming soon."},{status:403});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return NextResponse.json({error:"AI service is not configured."},{status:503});
  const body=await request.json().catch(()=>null);
  const message=typeof body?.message==="string"?body.message.trim():"";
  if(!message||message.length>1200)return NextResponse.json({error:"Message must be between 1 and 1200 characters."},{status:400});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  let response:Response;
  try{response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.HUDHUD_OPENAI_MODEL||"gpt-4o-mini",max_tokens:350,messages:[{role:"system",content:"You are HudHud, the friendly AI assistant in 1Muslim. Help users navigate 1Muslim, learn, and find resources. Do not invent Quran citations or religious rulings. For uncertain religious questions, recommend qualified scholarship. Be concise."},{role:"user",content:message}]}),signal:controller.signal})}finally{clearTimeout(timeout)}
  if(!response.ok)return NextResponse.json({error:"AI service temporarily unavailable."},{status:502});
  const result=await response.json();
  const reply=result?.choices?.[0]?.message?.content;
  if(typeof reply!=="string")return NextResponse.json({error:"No AI response returned."},{status:502});
  return NextResponse.json({reply},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"HudHud AI could not complete this request."},{status:500})}
}
