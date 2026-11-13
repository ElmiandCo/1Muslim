import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.videoId!=="string"||!/^[-_A-Za-z0-9]{11}$/.test(body.videoId))return NextResponse.json({error:"Invalid video"},{status:400});
 const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
 const tags=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==="string").map(x=>clean(x,50)).filter(Boolean))].slice(0,12):[];
 const title=clean(body.displayTitle,110),categories=tags(body.categories),genres=tags(body.genres);
 if(!title)return NextResponse.json({error:"Display title required"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Admin service unavailable"},{status:503});
 const db=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("deepwatch_video_editorial").upsert({video_id:body.videoId,display_title:title,categories,genres,updated_by:user.id,updated_at:new Date().toISOString()}).select("video_id,display_title,categories,genres").single();
 if(error)return NextResponse.json({error:"Could not save video metadata"},{status:500});
 return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}
