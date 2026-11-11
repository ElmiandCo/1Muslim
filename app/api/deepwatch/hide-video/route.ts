import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.videoId!=="string"||!/^[-_A-Za-z0-9]{11}$/.test(body.videoId)||body.reason!=="Subscription Required")return NextResponse.json({error:"Invalid video or reason"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Admin service unavailable"},{status:503});
 const db=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.from("admin_video_roster_exclusions").upsert({source:"islamic_video_registry",item_id:body.videoId,reason:body.reason});
 if(error)return NextResponse.json({error:"Could not hide video"},{status:500});
 return NextResponse.json({hidden:true},{headers:{"Cache-Control":"no-store"}});
}
