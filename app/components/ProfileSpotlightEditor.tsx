"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import {safeMediaUrl,youtubeEmbed,isDirectVideo,uploadMemberMedia} from "./profile-member-media";
import ProfilePublicMedia from "./ProfilePublicMedia";
import "./ProfileSpotlight.css";

type Kind="none"|"image"|"video"|"link";
type Spotlight={user_id:string;title:string;caption:string;media_kind:Kind;media_url:string|null};

export default function ProfileSpotlightEditor({userId}:{userId:string}){
 const [current,setCurrent]=useState<Spotlight|null>(null);
 const [title,setTitle]=useState(""),[caption,setCaption]=useState("");
 const [kind,setKind]=useState<Kind>("none"),[url,setUrl]=useState(""),[file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[status,setStatus]=useState("");
 useEffect(()=>{
  let alive=true;
  void createClient().from("profile_spotlights").select("user_id,title,caption,media_kind,media_url").eq("user_id",userId).maybeSingle().then(({data,error})=>{
   if(!alive)return;
   setLoading(false);
   if(error){setStatus("Could not load your Spotlight.");return;}
   if(data){
    const row=data as Spotlight;
    setCurrent(row);setTitle(row.title);setCaption(row.caption);setKind(row.media_kind);setUrl(row.media_url||"");
   }
  });
  return()=>{alive=false};
 },[userId]);
 const chooseKind=(next:Kind)=>{if(busy)return;setKind(next);setUrl("");setFile(null);setStatus("")};
 const canPublish=kind==="none"?!!(title.trim()||caption.trim()):!!(file||url.trim());
 const save=async()=>{
  if(busy||!canPublish)return;setBusy(true);setStatus("");
  try{
   const db=createClient(),{data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==userId)throw Error("Please sign in to edit your Spotlight.");
   let newUrl:string|null=null,newKind:Kind=kind;
   if(kind!=="none"){
    if(file){
     if(kind==="link")throw Error("Select Photo or Video to upload a file.");
     const uploaded=await uploadMemberMedia(file,userId);
     newUrl=uploaded.url;newKind=uploaded.kind;
    }else{
     newUrl=safeMediaUrl(url);
     if(!newUrl)throw Error("Enter a valid HTTPS link or upload a file.");
     if(kind!=="link"&&(youtubeEmbed(newUrl)||isDirectVideo(newUrl)))newKind="video";
    }
   }
   const patch:Spotlight={
    user_id:userId,title:(title.trim()||(kind==="none"?"My thoughts":"My Spotlight")).slice(0,100),
    caption:caption.trim().slice(0,300),media_kind:newKind,media_url:newUrl
   };
   const {error}=await db.from("profile_spotlights").upsert({...patch,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)throw Error(error.message);
   setCurrent(patch);setTitle(patch.title);setCaption(patch.caption);setKind(patch.media_kind);setUrl(patch.media_url||"");setFile(null);
   setStatus("✓ Pinned to your cinematic profile.");window.dispatchEvent(new Event("1muslim:spotlight-updated"));
  }catch(e){setStatus(e instanceof Error?e.message:"Could not save Spotlight");}finally{setBusy(false)}
 };
 const remove=async()=>{
  if(!current||!window.confirm("Remove your Spotlight from your full profile?"))return;
  setBusy(true);setStatus("");
  try{
   const db=createClient(),{data:{user}}=await db.auth.getUser();
   if(user?.id!==userId)throw Error("Please sign in again.");
   const {error}=await db.from("profile_spotlights").delete().eq("user_id",userId);
   if(error)throw Error(error.message);
   setCurrent(null);setTitle("");setCaption("");setKind("none");setUrl("");setFile(null);
   setStatus("Spotlight removed.");window.dispatchEvent(new Event("1muslim:spotlight-updated"));
  }catch(e){setStatus(e instanceof Error?e.message:"Could not remove Spotlight");}finally{setBusy(false)}
 };
 return <section className="profileSpotlightEditor spotlightComposer" aria-label="Profile Spotlight">
  <header className="spotlightEditorHeading">
   <div><span>✦ YOUR SPOTLIGHT</span><h2>What matters to you?</h2><p>Pin a mission, favorite ayah, photo, video or link.</p></div>
   <details className="spotlightComposerHelp"><summary>What’s this?</summary><div className="spotlightComposerHelpBody">
    <strong>One thing that tells your story.</strong>
    <p>Share your purpose, what you love about Allah, Islam, the Qur’an or the Prophet ﷺ — or something that inspires you. Visitors see it in your full profile. Change it anytime.</p>
   </div></details>
  </header>
  {loading?<p role="status" className="spotlightEditorStatus">Loading Spotlight…</p>:<>
   {current&&<details className="spotlightCurrentPreview"><summary>✓ Your Spotlight is live · Preview</summary>
    {(current.media_kind==="image"||current.media_kind==="video")&&current.media_url?
     <div className="spotlightEditorPreview"><ProfilePublicMedia url={current.media_url} kind={current.media_kind} title={current.title}/></div>:
     <p>{current.title}{current.caption?" — "+current.caption:""}</p>}
   </details>}
   <label className="spotlightComposerField">Your headline
    <input maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="My mission, my favorite ayah…" />
   </label>
   <div className="spotlightComposerModes" role="group" aria-label="What to share">
    {([{id:"none",label:"Write",icon:"✎"},{id:"image",label:"Photo",icon:"▧"},{id:"video",label:"Video",icon:"▷"},{id:"link",label:"Link",icon:"↗"}] as const).map(item=>
     <button key={item.id} type="button" aria-pressed={kind===item.id} onClick={()=>chooseKind(item.id)} disabled={busy}>
      <span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
   </div>
   {kind==="none"?
    <label className="spotlightComposerField">Your message
     <textarea rows={3} maxLength={300} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="What do you want people to remember about you?" />
    </label>:
    <>
     <div className="spotlightComposerMedia">
      <label className="spotlightComposerField">{kind==="link"?"Paste a link":kind==="image"?"Image URL (optional)":"Video or YouTube URL (optional)"}
       <input type="url" value={url} disabled={!!file} onChange={e=>setUrl(e.target.value)} placeholder={kind==="video"?"https://youtu.be/…":"https://…"} />
      </label>
      {kind!=="link"&&<label className="spotlightComposerUpload">
       <span aria-hidden="true">↥</span><strong>{file?file.name:kind==="image"?"Upload a photo":"Upload a video"}</strong><small>{file?"Tap to replace":"Up to 50 MB"}</small>
       <input type="file" disabled={busy} accept={kind==="image"?"image/jpeg,image/png,image/webp,image/gif":"video/mp4,video/webm,video/quicktime"}
        onChange={e=>{const selected=e.target.files?.[0];if(selected){setFile(selected);setStatus("")}e.target.value=""}}/>
      </label>}
      {file&&<button className="spotlightComposerRemoveFile" type="button" onClick={()=>setFile(null)}>× Remove file</button>}
     </div>
     <details className="spotlightComposerCaption" key={kind}><summary>Add a caption (optional)</summary>
      <textarea rows={2} maxLength={300} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Why is this meaningful to you?" />
     </details>
    </>}
   <footer className="spotlightEditorFooter">
    <button type="button" className="spotlightEditorSave" disabled={busy||!canPublish} onClick={()=>void save()}>{busy?"Saving…":current?"Update Spotlight":"✦ Pin to my profile"}</button>
    {current&&<button type="button" onClick={()=>void remove()} disabled={busy} className="spotlightEditorRemove">Remove</button>}
   </footer>
  </>}
  {status&&<p role="status" className="spotlightEditorStatus">{status}</p>}
 </section>;
}
