import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(value:string){return value.replace(/[%,().*]/g," ").trim().slice(0,90)}
export async function GET(req:NextRequest){
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const {data:admin,error:adminError}=await db.rpc("is_1muslim_admin");
 if(adminError||admin!==true)return NextResponse.json({error:"Administrator access required"},{status:403});
 const q=clean(req.nextUrl.searchParams.get("q")||"");
 const category=req.nextUrl.searchParams.get("category")||"all";
 const member=req.nextUrl.searchParams.get("member")||"";
 if(!["all","members","posts","lives","reports"].includes(category))return NextResponse.json({error:"Invalid category"},{status:400});
 if(member&&!uuid.test(member))return NextResponse.json({error:"Invalid member"},{status:400});
 const limit=25;
 const result:Record<string,unknown>={members:[],posts:[],lives:[],reports:[],warnings:[]};
 const warnings:string[]=[];
 const tasks:Promise<void>[]=[];
 if(category==="all"||category==="members")tasks.push((async()=>{
  let query=db.from("profiles").select("id,display_name,username,first_name,last_name,city,state,country,xp_total,shahada_verified_at").order("xp_total",{ascending:false}).limit(limit);
  if(member)query=query.eq("id",member);
  else if(q)query=query.or("display_name.ilike.%"+q+"%,username.ilike.%"+q+"%,first_name.ilike.%"+q+"%,last_name.ilike.%"+q+"%,city.ilike.%"+q+"%");
  const {data,error}=await query;if(error)warnings.push("Members: "+error.message);else result.members=data||[];
 })());
 if(category==="all"||category==="posts")tasks.push((async()=>{
  let query=db.from("posts").select("id,user_id,body,created_at").order("created_at",{ascending:false}).limit(limit);
  if(member)query=query.eq("user_id",member);else if(q)query=uuid.test(q)?query.eq("id",q):query.ilike("body","%"+q+"%");
  const {data,error}=await query;if(error)warnings.push("Posts: "+error.message);else result.posts=data||[];
 })());
 if(category==="all"||category==="lives")tasks.push((async()=>{
  let query=db.from("live_streams").select("id,host_id,title,category,status,started_at,viewer_count").order("started_at",{ascending:false}).limit(limit);
  if(member)query=query.eq("host_id",member);else if(q)query=uuid.test(q)?query.eq("id",q):query.ilike("title","%"+q+"%");
  const {data,error}=await query;if(error)warnings.push("Lives: "+error.message);else result.lives=data||[];
 })());
 if(category==="all"||category==="reports")tasks.push((async()=>{
  let query=db.from("moderation_reports").select("id,reporter_id,target_type,target_id,reason,status,created_at").order("created_at",{ascending:false}).limit(limit);
  if(member)query=query.eq("target_id",member);else if(q)query=uuid.test(q)?query.eq("target_id",q):query.ilike("reason","%"+q+"%");
  const {data,error}=await query;if(error)warnings.push("Reports: "+error.message);else result.reports=data||[];
 })());
 await Promise.all(tasks);
 result.warnings=warnings;
 return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
}
