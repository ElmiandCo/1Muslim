import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const revalidate=0;
type Row={video_id:string;title:string;categories:string[]|null;format:string;duration_seconds:number|null;quality_score:number|null;recommended_start_seconds:number|null;verification_status:string|null;is_classic:boolean|null;view_count:number|null};
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({videos:[],source:"fallback"},{headers:{"Cache-Control":"no-store"}});
 try{
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await db.from("islamic_video_registry").select("video_id,title,categories,format,duration_seconds,quality_score,recommended_start_seconds,verification_status,is_classic,view_count").eq("status","approved").order("quality_score",{ascending:false,nullsFirst:false}).limit(250);
  if(error)throw error;
  const rows=(data||[]) as Row[];
  const used=new Set<string>();const byCategory=new Map<string,number>();
  const ranked=rows.filter(v=>v.verification_status!=="unavailable").sort((a,b)=>Number(b.is_classic)-Number(a.is_classic)||Number(b.quality_score||0)-Number(a.quality_score||0));
  const videos=ranked.filter(v=>{
   if(!/^[\w-]{11}$/.test(v.video_id)||used.has(v.video_id))return false;
   const category=v.categories?.[0]||"Islamic Learning";
   if((byCategory.get(category)||0)>=20)return false;
   used.add(v.video_id);byCategory.set(category,(byCategory.get(category)||0)+1);return true;
  }).slice(0,100).map(v=>({videoId:v.video_id,title:v.title,category:v.categories?.[0]||"Islamic Learning",startSeconds:Math.max(0,Math.min(v.recommended_start_seconds||0,Math.max(0,(v.duration_seconds||0)-30))),endSeconds:null,format:v.format==="short"?"phone":"desktop"}));
  return NextResponse.json({videos,source:"approved"},{headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=60"}});
 }catch{return NextResponse.json({videos:[],source:"fallback"},{headers:{"Cache-Control":"no-store"}})}
}
