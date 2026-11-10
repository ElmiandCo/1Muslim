import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json([],{headers:{"Cache-Control":"no-store"}});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("admin_video_roster_exclusions").select("item_id").eq("source","islamic_video_registry").limit(10000);
 if(error)return NextResponse.json({error:"Unable to load video exclusions"},{status:503});
 return NextResponse.json(data||[],{headers:{"Cache-Control":"public,max-age=0,s-maxage=30"}});
}
