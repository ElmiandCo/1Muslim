import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
const sessionId=(id:unknown):id is string=>typeof id==="string"&&/^[a-zA-Z0-9-]{1,64}$/.test(id);

async function current(){
 const db=await createClient();
 const {data:{user},error}=await db.auth.getUser();
 return {db,user,error};
}
export async function GET(){
 try{
  const {db,user,error}=await current();
  if(error||!user)return reply({signedIn:false,enabled:false,sessions:[]});
  const {data:preference,error:prefError}=await db.from("hudhud_memory_preferences")
   .select("enabled").eq("user_id",user.id).maybeSingle();
  if(prefError)throw prefError;
  if(!preference?.enabled)return reply({signedIn:true,enabled:false,sessions:[]});
  const {data:rows,error:sessionError}=await db.from("hudhud_ai_chat_sessions")
   .select("id,title,lines").eq("user_id",user.id)
   .order("updated_at",{ascending:false}).limit(20);
  if(sessionError)throw sessionError;
  return reply({signedIn:true,enabled:true,sessions:rows||[]});
 }catch{return reply({error:"HudHud memory is temporarily unavailable"},503)}
}
export async function POST(req:NextRequest){
 try{
  const {db,user,error}=await current();
  if(error||!user)return reply({error:"Sign in to use account memory"},401);
  const body=await req.json().catch(()=>null);
  if(!body||typeof body!=="object")return reply({error:"Invalid request"},400);
  if(body.action==="preference"){
   if(typeof body.enabled!=="boolean")return reply({error:"Expected a memory preference"},400);
   const {error:saveError}=await db.from("hudhud_memory_preferences")
    .upsert({user_id:user.id,enabled:body.enabled,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(saveError)throw saveError;
   return reply({enabled:body.enabled});
  }
  if(body.action==="clear"){
   const {error:deleteError}=await db.from("hudhud_ai_chat_sessions").delete().eq("user_id",user.id);
   if(deleteError)throw deleteError;
   const {error:disableError}=await db.from("hudhud_memory_preferences")
    .upsert({user_id:user.id,enabled:false,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(disableError)throw disableError;
   return reply({enabled:false,sessions:[]});
  }
  if(body.action!=="save")return reply({error:"Unknown action"},400);
  if(!sessionId(body.id)||typeof body.title!=="string"||body.title.length>100)
   return reply({error:"Invalid conversation"},400);
  const {data:pref,error:prefError}=await db.from("hudhud_memory_preferences")
   .select("enabled").eq("user_id",user.id).maybeSingle();
  if(prefError)throw prefError;
  if(!pref?.enabled)return reply({error:"Enable HudHud account memory first"},403);
  const incoming=body.lines;
  if(!Array.isArray(incoming)||incoming.length>40)return reply({error:"Conversation exceeds memory limit"},400);
  const lines=incoming.map((line:unknown)=>{
   if(!line||typeof line!=="object")return null;
   const value=line as Record<string,unknown>;
   if(value.role!=="user"&&value.role!=="assistant")return null;
   if(typeof value.content!=="string"||value.content.length<1||value.content.length>3000)return null;
   const safe:{role:string;content:string;presentation?:{kind:string;verseKey?:string};verses?:unknown[]}={role:value.role,content:value.content};
   const p=value.presentation as Record<string,unknown>|undefined;
   if(p?.kind==="verse"&&typeof p.verseKey==="string"&&/^\d{1,3}:\d{1,3}$/.test(p.verseKey)){
    safe.presentation={kind:"verse",verseKey:p.verseKey};
    const verses=value.verses;
    if(Array.isArray(verses)&&verses[0]&&typeof verses[0]==="object"){
     const v=verses[0] as Record<string,unknown>;
     if(["key","arabic","english","translation"].every(k=>typeof v[k]==="string")&&
       JSON.stringify(v).length<=7000)safe.verses=[{key:v.key,arabic:v.arabic,english:v.english,translation:v.translation}];
    }
   }else if(p?.kind==="text")safe.presentation={kind:"text"};
   // Directory matches are not trusted as persistent cross-visit links.
   return safe;
  });
  if(lines.some(x=>x===null))return reply({error:"Invalid conversation history"},400);
  const {count,error:countError}=await db.from("hudhud_ai_chat_sessions")
   .select("id",{head:true,count:"exact"}).eq("user_id",user.id);
  if(countError)throw countError;
  const {data:existing,error:existingError}=await db.from("hudhud_ai_chat_sessions")
   .select("id").eq("user_id",user.id).eq("id",body.id).maybeSingle();
  if(existingError)throw existingError;
  if(!existing&&(count||0)>=20)return reply({error:"Memory is full. Clear an older chat before saving a new one."},409);
  const title=body.title.trim()||"New chat";
  const payload=JSON.stringify(lines);
  if(payload.length>45000)return reply({error:"Conversation too long to remember"},400);
  const {error:writeError}=await db.from("hudhud_ai_chat_sessions")
   .upsert({user_id:user.id,id:body.id,title,lines,updated_at:new Date().toISOString()},{onConflict:"user_id,id"});
  if(writeError)throw writeError;
  return reply({saved:true});
 }catch{return reply({error:"Could not update HudHud memory"},503)}
}
