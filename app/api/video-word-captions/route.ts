import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const videoId=request.nextUrl.searchParams.get("videoId")??"";
 if(!/^[a-zA-Z0-9_-]{11}$/.test(videoId))return NextResponse.json({words:[]},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({videoId,words:[],available:false});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("video_word_captions").select("word,start_seconds,end_seconds").eq("video_id",videoId).eq("language","en").order("word_index",{ascending:true}).limit(20000);
  if(error)throw error;
  const gate=await db.from("admin_feature_switches").select("enabled").eq("key","speechsync").maybeSingle();if(gate.error||gate.data?.enabled!==true)return NextResponse.json({videoId,words:[],available:false},{headers:{"Cache-Control":"no-store"}});
  const words=(data??[]).map(row=>({word:row.word,start:row.start_seconds,end:row.end_seconds}));
  return NextResponse.json({videoId,words,available:words.length>0},{headers:{"Cache-Control":"public, max-age=30"}});
 }catch{return NextResponse.json({videoId,words:[],available:false},{status:503})}
}
