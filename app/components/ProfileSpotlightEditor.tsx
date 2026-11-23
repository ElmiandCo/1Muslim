"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import {safeMediaUrl,youtubeEmbed,isDirectVideo,uploadMemberMedia,type MemberMediaKind} from "./profile-member-media";
import ProfilePublicMedia from "./ProfilePublicMedia";
import "./ProfileSpotlight.css";

type Spotlight={user_id:string;title:string;caption:string;media_kind:MemberMediaKind;media_url:string};
export default function ProfileSpotlightEditor({userId}:{userId:string}){
 const [current,setCurrent]=useState<Spotlight|null>(null),[title,setTitle]=useState(""),[caption,setCaption]=useState("");
 const [kind,setKind]=useState<MemberMediaKind>("video"),[url,setUrl]=useState(""),[file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[status,setStatus]=useState("");
 useEffect(()=>{let live=true;void createClient().from("profile_spotlights").select("user_id,title,caption,media_kind,media_url").eq("user_id",userId).maybeSingle().then(({data,error})=>{
  if(!live)return;setLoading(false);if(error){setStatus("Could not load your Spotlight yet.");return}
  if(data){const row=data as Spotlight;setCurrent(row);setTitle(row.title);setCaption(row.caption);setKind(row.media_kind);setUrl(row.media_url)}
 });return()=>{live=false}},[userId]);
 const save=async()=>{
  if(busy)return;setBusy(true);setStatus("");
  try{
   const db=createClient();const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==userId)throw Error("Please sign in to edit your Spotlight.");
   let newUrl=safeMediaUrl(url),newKind=kind;
   if(file){const result=await uploadMemberMedia(file,userId);newUrl=result.url;newKind=result.kind}
   if(!newUrl)throw Error("Add a valid HTTPS image/video URL, YouTube link or upload a file.");
   if(!file&&(youtubeEmbed(newUrl)||isDirectVideo(newUrl)))newKind="video";
   const trimmedTitle=title.trim()||"My Spotlight";
   const patch:Spotlight={user_id:userId,title:trimmedTitle.slice(0,100),caption:caption.trim().slice(0,300),media_kind:newKind,media_url:newUrl};
   const {error}=await db.from("profile_spotlights").upsert({...patch,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)throw Error(error.message);
   setCurrent(patch);setTitle(patch.title);setKind(patch.media_kind);setUrl(patch.media_url);setFile(null);
   setStatus("✓ Your Spotlight is live in the full cinematic profile.");window.dispatchEvent(new Event("1muslim:spotlight-updated"));
  }catch(e){setStatus(e instanceof Error?e.message:"Couldn't save Spotlight")}finally{setBusy(false)}
 };
 const remove=async()=>{
  if(!current||!window.confirm("Remove your Spotlight from your full profile?"))return;
  setBusy(true);setStatus("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();if(user?.id!==userId)throw Error("Please sign in again.");
   const {error}=await db.from("profile_spotlights").delete().eq("user_id",userId);
   if(error)throw Error(error.message);
   setCurrent(null);setTitle("");setCaption("");setUrl("");setFile(null);setStatus("Spotlight removed.");
   window.dispatchEvent(new Event("1muslim:spotlight-updated"));
  }catch(e){setStatus(e instanceof Error?e.message:"Could not remove your Spotlight")}finally{setBusy(false)}
 };
 return <section className="profileSpotlightEditor" aria-label="My Spotlight media settings">
  <div className="spotlightEditorHeading"><div><span>✦ YOUR SIGNATURE SPACE</span><h2>1M Spotlight</h2><p>Show your favorite video, image or meaningful media in your <strong>full cinematic profile</strong> only. It will not appear on the compact profile card.</p></div><b>EXCLUSIVE</b></div>
  {loading?<p>Loading your Spotlight…</p>:<>
   {current&&!file&&<div className="spotlightEditorPreview"><ProfilePublicMedia url={current.media_url} kind={current.media_kind} title={current.title}/></div>}
   <div className="spotlightEditorFields"><label>Spotlight title<input maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="My favorite video ✦"/></label><label>Caption (optional)<textarea rows={2} maxLength={300} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Why this means something to me…"/></label></div>
   <div className="spotlightEditorModes"><button type="button" aria-pressed={kind==="video"} onClick={()=>setKind("video")}>▷ Video / YouTube</button><button type="button" aria-pressed={kind==="image"} onClick={()=>setKind("image")}>▣ Image</button></div>
   <label className="spotlightEditorUrl">Media link<input type="url" value={url} disabled={!!file} onChange={e=>setUrl(e.target.value)} placeholder="https://youtu.be/… or image/video URL"/></label>
   <div className="spotlightEditorOr">or upload directly to your Spotlight</div>
   <label className="spotlightEditorUpload">↥ Choose image or video (up to 50 MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={e=>{setFile(e.target.files?.[0]||null);e.currentTarget.value=""}}/></label>
   {file&&<div className="spotlightEditorFile">✓ {file.name} <button type="button" onClick={()=>setFile(null)} aria-label="Remove selected file">×</button></div>}
   <div className="spotlightEditorFooter"><button type="button" className="spotlightEditorSave" onClick={()=>void save()} disabled={busy||(!file&&!url.trim())}>{busy?"Saving…":current?"Update Spotlight ✦":"Publish Spotlight ✦"}</button>{current&&<button type="button" onClick={()=>void remove()} disabled={busy} className="spotlightEditorRemove">Remove</button>}</div>
  </>}
  {status&&<p role="status" className="spotlightEditorStatus">{status}</p>}
 </section>;
}
