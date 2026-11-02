import {NextResponse} from "next/server";
import {createClient as createServiceClient} from "@supabase/supabase-js";
import {createClient} from "../../../../utils/supabase/server";

export const runtime="nodejs";
export async function POST(request:Request){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to send feedback"},{status:401});
 const payload=await request.json().catch(()=>null);
 const feedback=typeof payload?.feedback==="string"?payload.feedback.trim():"";
 const rating=Number(payload?.rating)||0;
 if(!feedback||feedback.length>2000||rating<0||rating>5)return NextResponse.json({error:"Invalid feedback"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Feedback service unavailable"},{status:503});
 const admin=createServiceClient(url,key,{auth:{persistSession:false}});
 let adminId:string|undefined;
 for(let page=1;page<=20&&!adminId;page++){
  const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});
  if(error)return NextResponse.json({error:"Admin lookup failed"},{status:503});
  adminId=data.users.find(u=>u.email?.toLowerCase()==="hudhudbyelmi@gmail.com")?.id;
  if(data.users.length<100)break;
 }
 if(!adminId)return NextResponse.json({error:"Admin recipient unavailable"},{status:503});
 if(adminId===user.id)return NextResponse.json({error:"Cannot DM yourself"},{status:400});
 const {data:existing}=await admin.from("dm_participants").select("conversation_id").eq("user_id",user.id).limit(200);
 let conversationId:string|undefined;
 for(const row of existing||[]){
  const {data:participants}=await admin.from("dm_participants").select("user_id").eq("conversation_id",row.conversation_id);
  if(participants?.length===2&&participants.some(p=>p.user_id===adminId)){conversationId=row.conversation_id;break}
 }
 if(!conversationId){
  const {data:created,error}=await admin.from("dm_conversations").insert({requested_by:user.id,request_status:"accepted"}).select("id").single();
  if(error||!created)return NextResponse.json({error:"Unable to open admin conversation"},{status:500});
  conversationId=created.id;
  const {error:participantsError}=await admin.from("dm_participants").insert([{conversation_id:conversationId,user_id:user.id},{conversation_id:conversationId,user_id:adminId}]);
  if(participantsError)return NextResponse.json({error:"Unable to add DM participants"},{status:500});
 }
 await admin.from("dm_conversations").update({request_status:"accepted"}).eq("id",conversationId);
 const body="[Live quality feedback"+(rating?" · "+rating+"/5 stars":"")+"]\n"+feedback;
 const {error}=await admin.from("dm_messages").insert({conversation_id:conversationId,sender_id:user.id,body});
 if(error)return NextResponse.json({error:"Unable to send feedback"},{status:500});
 return NextResponse.json({sent:true});
}
