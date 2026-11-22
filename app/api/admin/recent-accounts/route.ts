import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

// Each row is a browser session. Collapse all sessions by account ID, ranking
// real recorded interaction ahead of passive presence/heartbeat activity.
type SessionRow={user_id:string;page:string|null;last_seen:string;last_active:string|null};
type Person={id:string;name:string;handle:string|null;avatar:string|null;joined:string|null;lastSeen:string;lastActive:string|null;page:string;daysObserved:number;online:boolean;engaged:boolean};

export async function GET(){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com"){
  return NextResponse.json({error:"Forbidden"},{status:403,headers:{"Cache-Control":"private, no-store"}});
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Activity telemetry unavailable"},{status:503});
 const service=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const now=Date.now();
 const since=new Date(now-90*86400_000).toISOString();
 const unique=new Map<string,{lastSeen:string;lastActive:string|null;page:string;days:Set<string>}>();
 let capped=false;
 // Bounded database reads. Do not label this all-time coverage or fake
 // activity for users with no recorded presence.
 for(let offset=0;offset<10000;offset+=1000){
  const {data,error}=await service.from("site_presence")
   .select("user_id,page,last_seen,last_active")
   .gte("last_seen",since).order("last_seen",{ascending:false}).range(offset,offset+999);
  if(error){
   console.error("Recent account presence query failed",error.code);
   return NextResponse.json({error:"Recent account activity unavailable"},{status:503,headers:{"Cache-Control":"private, no-store"}});
  }
  for(const entry of (data||[]) as SessionRow[]){
   if(!entry.user_id||!entry.last_seen)continue;
   let current=unique.get(entry.user_id);
   if(!current){
    current={lastSeen:entry.last_seen,lastActive:entry.last_active||null,page:entry.page||"/",days:new Set()};
    unique.set(entry.user_id,current);
   }else if(entry.last_active&&(!current.lastActive||entry.last_active>current.lastActive)){
    current.lastActive=entry.last_active;
   }
   current.days.add(entry.last_seen.slice(0,10));
  }
  if(!data||data.length<1000)break;
  if(offset>=9000)capped=true;
 }
 const recent=[...unique.entries()]
  .filter(([id])=>id!==user.id)
  .sort((a,b)=>Date.parse(b[1].lastSeen)-Date.parse(a[1].lastSeen))
  .slice(0,200);
 const profiles=new Map<string,{username:string|null;display_name:string|null;avatar_url:string|null;created_at:string|null}>();
 for(let offset=0;offset<recent.length;offset+=100){
  const ids=recent.slice(offset,offset+100).map(([id])=>id);
  const {data,error}=await service.from("profiles")
    .select("id,username,display_name,avatar_url,created_at").in("id",ids);
  if(error){
   console.error("Recent account profile lookup failed",error.code);
   return NextResponse.json({error:"Recent account profiles unavailable"},{status:503,headers:{"Cache-Control":"private, no-store"}});
  }
  for(const p of data||[])profiles.set(p.id,p);
 }
 const members:Person[]=recent.map(([id,a])=>{
  const profile=profiles.get(id);
  const lastSeenMs=Date.parse(a.lastSeen),lastActiveMs=a.lastActive?Date.parse(a.lastActive):0;
  return{
   id,
   name:profile?.display_name||profile?.username||"1Muslim member",
   handle:profile?.username||null,
   avatar:profile?.avatar_url||null,
   joined:profile?.created_at||null,
   lastSeen:a.lastSeen,
   lastActive:a.lastActive,
   page:a.page,
   daysObserved:a.days.size,
   online:lastSeenMs>=now-90_000,
   engaged:lastActiveMs>=now-120_000
  };
 });
 return NextResponse.json({
  members,uniqueAccounts:Math.max(0,unique.size-(unique.has(user.id)?1:0)),
  updatedAt:new Date(now).toISOString(),
  cutoff:since,capped,
  method:"Unique signed-in accounts with a recorded app presence, ordered by most recent recorded presence, with actual interactions reported separately. Passive background heartbeats are not counted as interactions; monitoring began November 2026. Observed days reflect recorded app presence, not a count of page visits."
 },{headers:{"Cache-Control":"private, no-store"}});
}
