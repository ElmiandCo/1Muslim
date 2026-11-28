import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {createClient} from "../../../../utils/supabase/server";
import {cleanHudHudPersonalText,loadHudHudMemberSnapshot,verifiedHudHudNotes,type HudHudNote} from "../../../lib/hudhud-member-context";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});

export async function GET(){
 try{
  const db=await createClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)return response({signedIn:false,profile:null,privateContext:null},200);
  const snapshot=await loadHudHudMemberSnapshot(db,user.id);
  if(!snapshot.storeReady)return response({error:"Personal HudHud memory is temporarily unavailable. Your public profile is still accessible."},503);
  return response(snapshot);
 }catch{return response({error:"Could not load HudHud personal context"},503)}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return response({error:"Cross-origin request refused"},403);
 try{
  const db=await createClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)return response({error:"Sign in to manage private HudHud context"},401);
  const body=await req.json().catch(()=>null);
  if(!body||typeof body!=="object")return response({error:"Invalid request"},400);
  const action=typeof body.action==="string"?body.action:"";
  if(action==="clear"){
   const {error:deleteError}=await db.from("hudhud_personal_context").delete().eq("user_id",user.id);
   if(deleteError)throw deleteError;
   return response({cleared:true});
  }
  if(action==="update"){
   const about=cleanHudHudPersonalText(body.aboutMe,6000);
   const preferences=cleanHudHudPersonalText(body.answerPreferences,2000);
   if(about===null||preferences===null||typeof body.allowRememberRequests!=="boolean")
    return response({error:"Enter only personal details, not passwords, access keys, security codes, payment card details or other credentials."},400);
   // UPDATE must preserve existing learned notes; omitted upsert columns
   // would reset them to SQL defaults on conflict.
   const {data:present,error:lookupError}=await db.from("hudhud_personal_context")
    .select("user_id").eq("user_id",user.id).maybeSingle();
   if(lookupError)throw lookupError;
   const edit={about_me:about,answer_preferences:preferences,
    allow_remember_requests:body.allowRememberRequests,updated_at:new Date().toISOString()};
   const result=present
    ?await db.from("hudhud_personal_context").update(edit).eq("user_id",user.id)
    :await db.from("hudhud_personal_context").insert({...edit,user_id:user.id});
   if(result.error)throw result.error;
   return response({saved:true});
  }
  if(action==="remember"||action==="add-note"||action==="delete-note"){
   const {data:row,error:loadError}=await db.from("hudhud_personal_context")
    .select("notes,allow_remember_requests").eq("user_id",user.id).maybeSingle();
   if(loadError)throw loadError;
   const notes=verifiedHudHudNotes(row?.notes);
   if(action==="remember"&&row?.allow_remember_requests!==true)
    return response({error:"To let HudHud remember your requests, enable 'Remember when I ask' in HudHud Settings."},403);
   if(action==="delete-note"){
    const id=typeof body.id==="string"?body.id:"";
    if(!/^[a-z0-9-]{1,60}$/i.test(id))return response({error:"Invalid note"},400);
    const next=notes.filter(note=>note.id!==id);
    const {error:writeError}=await db.from("hudhud_personal_context")
     .update({notes:next,updated_at:new Date().toISOString()}).eq("user_id",user.id);
    if(writeError)throw writeError;
    return response({deleted:true,notes:next});
   }
   const text=cleanHudHudPersonalText(body.text,400);
   if(!text)return response({error:"Only short, user-chosen notes are supported. Never submit passwords, security codes, payment card details or access keys."},400);
   const existing=notes.find(note=>note.text.toLocaleLowerCase()===text.toLocaleLowerCase());
   if(existing)return response({saved:true,alreadySaved:true,notes});
   if(notes.length>=50)return response({error:"HudHud has 50 private notes. Delete an older note before saving another."},409);
   const note:HudHudNote={id:randomUUID(),text,savedAt:new Date().toISOString(),source:action==="remember"?"hudhud":"user"};
   const next=[...notes,note];
   // Never overwrite the member's self-description or memory permission.
   const result=row
    ?await db.from("hudhud_personal_context").update({notes:next,updated_at:new Date().toISOString()}).eq("user_id",user.id)
    :await db.from("hudhud_personal_context").insert({user_id:user.id,notes:next,updated_at:new Date().toISOString()});
   if(result.error)throw result.error;
   return response({saved:true,note,notes:next});
  }
  return response({error:"Unknown HudHud context action"},400);
 }catch{return response({error:"Could not save your private context. Please try again."},503)}
}
