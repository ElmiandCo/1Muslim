import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function authorize(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const sources=["post_media","islamic_video_registry","admin_videos","site_video_placements","lesson_videos"] as const;
export async function GET(request:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:"Forbidden"},{status:403});
 if(request.nextUrl.searchParams.get("view")==="movie-acquisitions"){const {data,error,count}=await db.from("deepwatch_movie_acquisition_queue").select("id,title,release_year,runtime_minutes,source_platform,source_url,ai_display_title,primary_group,secondary_groups,genres,audience_review,representation,admin_content_approved,rights_verified,embed_verified,publish_status,notes,created_at",{count:"exact"}).order("created_at",{ascending:false}).limit(200);if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({movies:data||[],count:count||0},{headers:{"Cache-Control":"private, no-store"}})}
 if(request.nextUrl.searchParams.get("view")==="pending"){const page=Math.max(0,Math.min(10000,Number(request.nextUrl.searchParams.get("page")||0)||0));const {data,error,count}=await db.from("islamic_video_registry").select("video_id,title,thumbnail_url,channel_title,categories,discovered_at",{count:"exact"}).eq("status","pending").order("discovered_at",{ascending:false}).range(page*100,page*100+99);if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({videos:data||[],count:count||0,page},{headers:{"Cache-Control":"private, no-store"}})}
 const [media,registry,admin,placements,lessons,excluded,registryCount,pendingCount,approvedCount]=await Promise.all([
 db.from("post_media").select("id,post_id,created_at,mime_type").ilike("mime_type","video/%").order("created_at",{ascending:true}).limit(1000),
 db.from("islamic_video_registry").select("video_id,title,categories,discovered_at").order("discovered_at",{ascending:true}).limit(1000),
 db.from("admin_videos").select("id,title,category,created_at").order("created_at",{ascending:true}).limit(1000),
 db.from("site_video_placements").select("id,title,placement,created_at").order("created_at",{ascending:true}).limit(1000),
 db.from("lesson_videos").select("id,title,created_at").order("created_at",{ascending:true}).limit(1000),
 db.from("admin_video_roster_exclusions").select("source,item_id").limit(10000),
 db.from("islamic_video_registry").select("video_id",{count:"exact",head:true}),
 db.from("islamic_video_registry").select("video_id",{count:"exact",head:true}).eq("status","pending"),
 db.from("islamic_video_registry").select("video_id",{count:"exact",head:true}).eq("status","approved")
 ]);
 for(const result of [media,registry,admin,placements,lessons,excluded,registryCount,pendingCount,approvedCount])if(result.error)return NextResponse.json({error:result.error.message},{status:500});
 const postIds=[...new Set((media.data||[]).map(x=>x.post_id))];
 const posts=postIds.length?await db.from("posts").select("id,body").in("id",postIds):{data:[],error:null};
 if(posts.error)return NextResponse.json({error:posts.error.message},{status:500});
 const titles=new Map((posts.data||[]).map(x=>[x.id,x.body]));
 const entries=[
 ...(media.data||[]).map(x=>({source:"post_media",id:x.id,title:(titles.get(x.post_id)||"Untitled uploaded video").replace(/\\n/g," ").trim().slice(0,110),category:"Uploaded Video",added:x.created_at})),
 ...(registry.data||[]).map(x=>({source:"islamic_video_registry",id:x.video_id,title:x.title,category:(x.categories||[]).join(", ")||"Shorts",added:x.discovered_at})),
 ...(admin.data||[]).map(x=>({source:"admin_videos",id:x.id,title:x.title,category:x.category||"Admin Video",added:x.created_at})),
 ...(placements.data||[]).map(x=>({source:"site_video_placements",id:x.id,title:x.title,category:x.placement||"Featured",added:x.created_at})),
 ...(lessons.data||[]).map(x=>({source:"lesson_videos",id:x.id,title:x.title,category:"Lessons",added:x.created_at}))
 ];
 const hidden=new Set((excluded.data||[]).map(x=>x.source+":"+x.item_id));
 const videos=entries.filter(x=>!hidden.has(x.source+":"+x.id)).sort((a,b)=>new Date(a.added||0).getTime()-new Date(b.added||0).getTime()).map((x,i)=>({...x,number:i+1}));
 return NextResponse.json({videos,registryCount:registryCount.count??0,pendingCount:pendingCount.count??0,approvedCount:approvedCount.count??0},{headers:{"Cache-Control":"private, no-store"}});
}
export async function DELETE(request:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json().catch(()=>null);
 if(!body||!sources.includes(body.source)||typeof body.id!=="string"||!body.id||body.id.length>128)return NextResponse.json({error:"Invalid video"},{status:400});
 const {error}=await db.from("admin_video_roster_exclusions").upsert({source:body.source,item_id:body.id});
 if(!error&&body.source==="islamic_video_registry"){const {error:rejectError}=await db.from("islamic_video_registry").update({status:"rejected",bot_b_reason:"Removed by admin; blocked from rediscovery",updated_at:new Date().toISOString()}).eq("video_id",body.id);if(rejectError)return NextResponse.json({error:rejectError.message},{status:500})}
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({removed:true});
}

export async function PATCH(request:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json().catch(()=>null);
 if(body?.action==="approve-movie-content"){
  if(!Array.isArray(body.ids)||body.ids.length<1||body.ids.length>100||body.ids.some((id:unknown)=>typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id)))return NextResponse.json({error:"Select 1–100 movie records"},{status:400});
  const {data,error}=await db.from("deepwatch_movie_acquisition_queue").update({admin_content_approved:true}).in("id",[...new Set(body.ids)]).select("id");
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({approved:data?.length||0,published:0,message:"Content approved for the private Movie Bank. Public playback remains gated by source and distribution authorization."});
 }
 const ids=body?.ids;
 if(!Array.isArray(ids)||ids.length<1||ids.length>1000||ids.some((id:unknown)=>typeof id!=="string"||!/^[-_A-Za-z0-9]{11}$/.test(id)))return NextResponse.json({error:"Select 1–1000 valid YouTube videos"},{status:400});
 const unique=[...new Set(ids as string[])];
 // Final-review path: only explicitly submitted, edited AI suggestions are published.
 if(body?.reviews!==undefined){
  if(!Array.isArray(body.reviews)||body.reviews.length!==unique.length)return NextResponse.json({error:"Every selected video needs a final review"},{status:400});
  const reviews=body.reviews as Record<string,unknown>[];
  const byId=new Map(reviews.map(x=>[x.video_id,x]));
  if(byId.size!==unique.length||unique.some(id=>!byId.has(id)))return NextResponse.json({error:"Review IDs must match selection"},{status:400});
  const types=new Set(["movie","series","episode","documentary","show","other"]);
  for(const item of reviews){
   if(typeof item.clean_title!=="string"||!item.clean_title.trim()||item.clean_title.length>180||!types.has(String(item.content_type))||
      !Array.isArray(item.categories)||item.categories.length>8||item.categories.some(x=>typeof x!=="string"||x.length>80)||
      !Array.isArray(item.genres)||item.genres.length>8||item.genres.some(x=>typeof x!=="string"||x.length>80)||
      (item.series_title!=null&&(typeof item.series_title!=="string"||item.series_title.length>160))||
      (item.season_number!=null&&(!Number.isInteger(item.season_number)||Number(item.season_number)<1))||
      (item.episode_number!=null&&(!Number.isInteger(item.episode_number)||Number(item.episode_number)<1)))
     return NextResponse.json({error:"Invalid review metadata"},{status:400});
  }
  const {data:blocked,error:blockedError}=await db.from("admin_video_roster_exclusions").select("item_id").eq("source","islamic_video_registry").in("item_id",unique);
  if(blockedError)return NextResponse.json({error:blockedError.message},{status:500});
  if(blocked?.length)return NextResponse.json({error:"Selection includes blocked videos"},{status:409});
  const {data:pending,error:pendingError}=await db.from("islamic_video_registry").select("video_id").in("video_id",unique).eq("status","pending");
  if(pendingError)return NextResponse.json({error:pendingError.message},{status:500});
  if(pending?.length!==unique.length)return NextResponse.json({error:"Some videos are no longer pending. Refresh before publishing."},{status:409});
  const seriesIds=new Map<string,string>();let approved=0;
  for(const id of unique){
   const item=byId.get(id)!;const seriesTitle=typeof item.series_title==="string"?item.series_title.trim():"";
   let seriesId:string|null=null;
   if(seriesTitle&&["series","episode"].includes(String(item.content_type))){
    const lookup=seriesTitle.toLowerCase();
    if(seriesIds.has(lookup))seriesId=seriesIds.get(lookup)!;
    else{
     const {data:existing,error:lookupError}=await db.from("deepwatch_series").select("id").ilike("canonical_title",seriesTitle).limit(1);
     if(lookupError)return NextResponse.json({error:lookupError.message,approved},{status:500});
     if(existing?.[0])seriesId=existing[0].id;
     else{
      const {data:created,error:createError}=await db.from("deepwatch_series").insert({canonical_title:seriesTitle,status:"approved"}).select("id").single();
      if(createError)return NextResponse.json({error:createError.message,approved},{status:500});
      seriesId=created.id;
     }
     seriesIds.set(lookup,seriesId!);
    }
   }
   const {data,error}=await db.from("islamic_video_registry").update({
    title:(item.clean_title as string).trim(),canonical_title:(item.clean_title as string).trim(),
    content_type:item.content_type,categories:item.categories,genres:item.genres,
    series_id:seriesId,season_number:item.season_number??null,episode_number:item.episode_number??null,
    metadata_review_status:"reviewed",status:"approved",reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()
   }).eq("video_id",id).eq("status","pending").select("video_id");
   if(error)return NextResponse.json({error:error.message,approved},{status:500});
   approved+=data?.length||0;
  }
  return NextResponse.json({approved,requested:unique.length},{headers:{"Cache-Control":"no-store"}});
 }

 const {data:blocked,error:blockedError}=await db.from("admin_video_roster_exclusions").select("item_id").eq("source","islamic_video_registry").in("item_id",unique);
 if(blockedError)return NextResponse.json({error:blockedError.message},{status:500});
 const allowed=unique.filter(id=>!(blocked||[]).some(x=>x.item_id===id));
 const {data,error}=await db.from("islamic_video_registry").update({status:"approved"}).in("video_id",allowed.length?allowed:["__none__"]).eq("status","pending").select("video_id");
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({approved:data?.length||0,requested:unique.length},{headers:{"Cache-Control":"no-store"}});
}
