import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export async function POST(request:NextRequest){
 try{
  const type=request.headers.get("content-type")||"";
  if(!type.includes("application/json"))return NextResponse.json({error:"Invalid request"},{status:415});
  const raw=await request.text();
  if(raw.length>1600)return NextResponse.json({error:"Too long"},{status:413});
  const payload=JSON.parse(raw) as {message?:unknown;website?:unknown};
  if(payload.website)return NextResponse.json({ok:true});
  const message=typeof payload.message==="string"?payload.message.trim():"";
  if(message.length<5||message.length>700)return NextResponse.json({error:"Message must be 5–700 characters"},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Messaging temporarily unavailable"},{status:503});
  const supabase=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const adminEmail=(process.env.UPGRADE_FEEDBACK_ADMIN_EMAIL||"hudhudbyelmi@gmail.com").toLowerCase();
  let adminId:string|undefined;
  for(let page=1;page<=10;page++){
   const {data,error}=await supabase.auth.admin.listUsers({page,perPage:100});
   if(error)throw error;
   adminId=data.users.find(u=>u.email?.toLowerCase()===adminEmail)?.id;
   if(adminId||data.users.length<100)break;
  }
  if(!adminId)return NextResponse.json({error:"Messaging temporarily unavailable"},{status:503});
  const {error}=await supabase.from("notifications").insert({
   recipient_id:adminId,type:"upgrade_feedback",title:"Anonymous upgrade feedback",
   body:message,entity_type:null,entity_id:null
  });
  if(error)throw error;
  return NextResponse.json({ok:true});
 }catch(error){console.error("Upgrade feedback delivery failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Unable to deliver message"},{status:503})}
}
