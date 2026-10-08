import {NextRequest,NextResponse} from "next/server";
import {createClient as serverClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=["post","profile","comment","live","community"];
export async function POST(req:NextRequest){
 try{
 const session=await serverClient();
 const {data:{user},error:authError}=await session.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Sign in required."},{status:401});
 const body=await req.json();
 const {targetType,targetId,reason}=body;
 if(!allowed.includes(targetType)||!uuid.test(targetId)||typeof reason!=="string"||reason.trim().length<3||reason.length>1000)return NextResponse.json({error:"Invalid report."},{status:400});
 const {error}=await session.from("moderation_reports").insert({reporter_id:user.id,target_type:targetType,target_id:targetId,reason:reason.trim()});
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to submit report."},{status:500})}
}
export async function DELETE(req:NextRequest){
 try{
 const session=await serverClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 const {data:admin,error:adminError}=await session.rpc("is_1muslim_admin");
 if(adminError||admin!==true)return NextResponse.json({error:"Admin access required."},{status:403});
 const {targetType,targetId,confirmation}=await req.json();
 if(!["post","profile","comment"].includes(targetType)||!uuid.test(targetId)||confirmation!=="DELETE")return NextResponse.json({error:"Invalid deletion request."},{status:400});
 if(targetType==="profile"&&targetId===user.id)return NextResponse.json({error:"You cannot delete your own admin account here."},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Server moderation credentials not configured."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 if(targetType==="post"){
 const {error}=await db.from("posts").delete().eq("id",targetId).select("id").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 }else if(targetType==="comment"){
 const {error}=await db.from("verse_comments").delete().eq("id",targetId).select("id").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 }else{
 // Auth deletion may fail when owned Storage objects or foreign keys remain.
 // Do not falsely claim media/content cleanup: a separate cleanup job is needed.
 const {error}=await db.auth.admin.deleteUser(targetId);
 if(error)return NextResponse.json({error:error.message},{status:400});
 }
 await db.from("moderation_audit").insert({admin_id:user.id,action:"permanent_delete",target_type:targetType,target_id:targetId});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Deletion failed."},{status:500})}
}
