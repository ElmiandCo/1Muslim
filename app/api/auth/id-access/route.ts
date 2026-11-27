import {createHmac} from "node:crypto";
import {createClient as adminClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {createClient as sessionClient} from "../../../../utils/supabase/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const normalize=(v:unknown)=>String(v||"").trim().replace(/^@/,"").toLowerCase();
const valid=(v:string)=>/^[\p{L}\p{N}_.-]{3,30}$/u.test(v);
const quotas={check:{count:60,seconds:900,perName:14},signin:{count:12,seconds:600,perName:6},recover:{count:5,seconds:3600,perName:2}} as const;
type Action=keyof typeof quotas;
function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error("Identity lookup unavailable");
 return adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function limited(req:NextRequest,action:Action,id:string){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/,"");
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return "unavailable";
 const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()||
  req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const digest=(value:string)=>createHmac("sha256",key).update(value).digest("hex").slice(0,42);
 const claim=async(k:string,max:number)=>{
  try{
   const response=await fetch(url+"/rest/v1/rpc/claim_search_api_quota",{
    method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({p_key:k,p_max:max,p_window_seconds:quotas[action].seconds}),
    signal:AbortSignal.timeout(4000),cache:"no-store"
   });
   if(!response.ok)return null;
   return (await response.json())===true;
  }catch{return null}
 };
 const visitor=await claim("identity:"+action+":ip:"+digest(ip),quotas[action].count);
 if(visitor===null)return "unavailable";
 if(!visitor)return "limited";
 const user=await claim("identity:"+action+":name:"+digest(id),quotas[action].perName);
 return user===null?"unavailable":user?"allowed":"limited";
}
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return reply({error:"Invalid origin"},403);
 if(!req.headers.get("content-type")?.includes("application/json"))return reply({error:"Invalid request"},415);
 const raw=await req.json().catch(()=>null);
 const action=raw?.action as Action;
 const id=normalize(raw?.identifier);
 if(!["check","signin","recover"].includes(action)||!valid(id))return reply({error:"Invalid account ID"},400);
 const limit=await limited(req,action,id);
 if(limit!=="allowed")return reply({error:limit==="limited"?"Try again in a little while.":"Account access is temporarily unavailable."},limit==="limited"?429:503);
 try{
  const db=admin();
  const {data:profile,error}=await db.from("profiles").select("id").eq("username",id).maybeSingle();
  if(error)throw error;
  if(action==="check")return reply({available:!profile});
  if(action==="recover"){
   if(profile){
    const {data}=await db.auth.admin.getUserById(profile.id);
    if(data.user?.email){
     const dest=new URL("/auth/reset-password",req.nextUrl.origin);
     // Never return email addresses or reveal whether a username exists.
     await db.auth.resetPasswordForEmail(data.user.email,{redirectTo:dest.toString()}).catch(()=>{});
    }
   }
   return reply({sent:true});
  }
  if(typeof raw?.password!=="string"||raw.password.length>256)return reply({error:"Sign-in unsuccessful"},401);
  if(!profile)return reply({error:"Sign-in unsuccessful"},401);
  const {data}=await db.auth.admin.getUserById(profile.id);
  const email=data.user?.email;
  if(!email)return reply({error:"Sign-in unsuccessful"},401);
  const client=await sessionClient();
  const {error:loginError}=await client.auth.signInWithPassword({email,password:raw.password});
  if(loginError)return reply({error:"Sign-in unsuccessful"},401);
  return reply({authenticated:true});
 }catch{
  return reply({error:action==="signin"?"Sign-in unsuccessful":"Account access temporarily unavailable"},action==="signin"?401:503);
 }
}
