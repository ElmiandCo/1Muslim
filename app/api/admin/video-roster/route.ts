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
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({removed:true});
}

export async function PATCH(request:NextRequest){
 const db=await authorize();if(!db)return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await request.json().catch(()=>null);
 const ids=body?.ids;
 if(!Array.isArray(ids)||ids.length<1||ids.length>1000||ids.some((id:unknown)=>typeof id!=="string"||!/^[-_A-Za-z0-9]{11}$/.test(id)))return NextResponse.json({error:"Select 1–1000 valid YouTube videos"},{status:400});
 const unique=[...new Set(ids as string[])];
 const {data,error}=await db.from("islamic_video_registry").update({status:"approved"}).in("video_id",unique).eq("status","pending").select("video_id");
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({approved:data?.length||0,requested:unique.length},{headers:{"Cache-Control":"no-store"}});
}
