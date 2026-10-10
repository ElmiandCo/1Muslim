import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {screenPost} from "../../../../lib/hudhud-moderation";
export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 let input:unknown;try{input=await request.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 const body=typeof (input as {body?:unknown})?.body==="string"?(input as {body:string}).body.trim():"";
 const type=(input as {contentType?:string})?.contentType||"post";
 if(!body||body.length>10000||!["post","comment","live_chat"].includes(type))return NextResponse.json({error:"Invalid submission"},{status:400});
 const result=screenPost(body);
 if(!result.restricted)return NextResponse.json({restricted:false});
 const {data,error}=await supabase.from("hudhud_moderation_queue").insert({author_id:user.id,body,content_type:type,reason:result.reason,category:result.category}).select("id").single();
 if(error)return NextResponse.json({error:"Could not save restricted submission for review"},{status:500});
 return NextResponse.json({restricted:true,reviewId:data.id,message:"HudHud held your submission for moderator review. It is not public."},{status:202});
}
