import { NextResponse } from "next/server";
import { createClient as serviceClient } from "@supabase/supabase-js";
import { createClient as sessionClient } from "../../../utils/supabase/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const BUCKET="quran-community-recitals";
const formatMime:Record<string,string>={webm:"audio/webm",m4a:"audio/mp4",ogg:"audio/ogg",mp3:"audio/mpeg"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const admin=()=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("Recitation archive is not configured.");
 return serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
};
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const chapter=Number(params.get("chapter")||0);
  const page=Math.max(0,Math.min(100,Number(params.get("page")||0)||0));
  if(chapter&&(chapter<1||chapter>114||!Number.isInteger(chapter)))return NextResponse.json({error:"Invalid surah"},{status:400});
  const db=admin();
  let q=db.from("quran_chapter_recitals").select("id,user_id,chapter_number,storage_path,duration_seconds,created_at")
    .eq("visibility","public").order("created_at",{ascending:false}).range(page*24,page*24+23);
  if(chapter)q=q.eq("chapter_number",chapter);
  const {data:rows,error}=await q;
  if(error)throw error;
  const ids=[...new Set((rows||[]).map(r=>r.user_id))];
  const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,username,avatar_url").in("id",ids):{data:[]};
  const profilesById=new Map((profiles||[]).map(p=>[p.id,p]));
  const items=(rows||[]).map(row=>{
   const p=profilesById.get(row.user_id);
   return {
    id:row.id,chapter:row.chapter_number,
    title:"Surah "+row.chapter_number,
    author:p?.display_name||p?.username||"1Muslim reciter",
    avatar:p?.avatar_url||null,
    authorId:row.user_id,
    duration:row.duration_seconds,createdAt:row.created_at,
    audioUrl:db.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl
   };
  });
  return NextResponse.json({items,hasMore:items.length===24},{headers:{"Cache-Control":"public, s-maxage=45, stale-while-revalidate=90"}});
 }catch(err){
  console.error("Qur’an recitation list failed",err);
  return NextResponse.json({error:"Recitations are temporarily unavailable"},{status:503});
 }
}
export async function POST(request:Request){
 try{
  const session=await sessionClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to publish your recitation."},{status:401});
  const body=await request.json().catch(()=>({}));
  const chapter=Number(body.chapter);
  const seconds=Number(body.duration);
  const id=String(body.id||"");
  const ext=String(body.extension||"").toLowerCase();
  if(!Number.isInteger(chapter)||chapter<1||chapter>114||!uuid.test(id)||
     !Number.isInteger(seconds)||seconds<5||seconds>3600||!(ext in formatMime)){
   return NextResponse.json({error:"Invalid chapter, recording or duration."},{status:400});
  }
  const path=user.id+"/"+id+"."+ext;
  // This checks the uploaded file, not an untrusted size supplied by the client.
  const {data:files,error:listError}=await session.storage.from(BUCKET).list(user.id,{search:id,limit:20});
  if(listError)return NextResponse.json({error:"Cannot verify your uploaded audio."},{status:503});
  const file=files?.find(f=>f.name===id+"."+ext);
  const bytes=Number(file?.metadata?.size||0);
  if(!file||!Number.isFinite(bytes)||bytes<10240||bytes>31457280){
   return NextResponse.json({error:"Upload an audio file between 10 KB and 30 MB first."},{status:400});
  }
  const {data:recital,error:insertError}=await session.from("quran_chapter_recitals")
    .insert({id,user_id:user.id,chapter_number:chapter,storage_path:path,
      duration_seconds:seconds,mime_type:formatMime[ext],file_size_bytes:bytes})
    .select("id,chapter_number").single();
  if(insertError)return NextResponse.json({error:insertError.code==="23505"?"This recording was already published.":"Could not publish this recording."},{status:409});
  let xpAwarded=0;
  let xpPending=false;
  try{
   const {data:award,error:awardError}=await session.rpc("claim_quran_chapter_recital_xp",{p_recital:recital.id});
   if(awardError)xpPending=true;
   else xpAwarded=Number((Array.isArray(award)?award[0]:award)?.awarded)||0;
  }catch{xpPending=true}
  return NextResponse.json({ok:true,id:recital.id,chapter,awarded:xpAwarded,xpPending},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(err){
  console.error("Recitation publish failed",err);
  return NextResponse.json({error:"Publishing failed. Your local recording is still available."},{status:503});
 }
}
