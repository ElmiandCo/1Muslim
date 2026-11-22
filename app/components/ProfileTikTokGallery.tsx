"use client";
import {useEffect,useState} from "react";
import "./profile-tiktok-review.css";

type Video={id:string;title:string;cover:string;url:string;embed:string;duration:number};
type Status={available:boolean;connected:boolean;profile?:{displayName:string;username:string;avatarUrl:string}|null;profileUnavailable?:boolean};

function validPreview(url:string){
 try{const u=new URL(url);return u.protocol==="https:"&&(u.hostname==="www.tiktok.com"||u.hostname==="tiktok.com"||u.hostname.endsWith(".tiktok.com"))?u.href:null}
 catch{return null}
}
export default function ProfileTikTokGallery(){
 const [status,setStatus]=useState<Status|null>(null);
 const [videos,setVideos]=useState<Video[]>([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [sharing,setSharing]=useState("");
 const [notice,setNotice]=useState("");
 const [preview,setPreview]=useState<string|null>(null);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [lastChecked,setLastChecked]=useState<string|null>(null);
 const refresh=async()=>{
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/tiktok/status",{cache:"no-store"});
   const s=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(s.error==="status_unavailable"?"TikTok connection status is temporarily unavailable.":"Could not check your TikTok connection.");
   if(!s.available)throw Error("TikTok review tools are not available for this account.");
   setStatus(s);
   if(s.connected)setNotice(prev=>prev.startsWith("TikTok redirected back.")?"TikTok connected. Profile and public video access have been checked against TikTok.":prev);
   if(!s.connected){setVideos([]);setLastChecked(new Date().toISOString());return}
   const result=await fetch("/api/tiktok/videos",{cache:"no-store"});
   const data=await result.json().catch(()=>({}));
   if(!result.ok){setVideos([]);throw Error(data.error||"TikTok video.list could not return public videos. Check sandbox authorization and scopes.");}
   setVideos(Array.isArray(data.videos)?data.videos:[]);
   setLastChecked(new Date().toISOString());
  }catch(e){setError(e instanceof Error?e.message:"Unable to load the TikTok connection");}
  finally{setLoading(false)}
 };
 useEffect(()=>{
  try{
   const result=sessionStorage.getItem("1muslim:tiktok-oauth-result");
   sessionStorage.removeItem("1muslim:tiktok-oauth-result");
   if(result==="connected")setNotice("TikTok redirected back. Verifying your live account and videos…");
   if(result?.startsWith("error:"))setError("TikTok authorization did not complete ("+result.slice(6)+"). Please retry.");
  }catch{}
  void refresh();
 // Intentionally check live TikTok status on mount for the reviewer recording.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const share=async(video:Video)=>{
  if(!window.confirm("Share this selected public TikTok video to your 1Muslim Ummah feed? This is a manual public post."))return;
  setSharing(video.id);setNotice("");setError("");
  try{
   const r=await fetch("/api/tiktok/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:video.id,title:video.title,url:video.url})});
   const payload=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(payload.error||"Could not share this video");
   setNotice(payload.alreadyShared?"This TikTok video was already shared to Ummah.":"Shared to Ummah successfully. Only the selected video was posted.");
  }catch(e){setError(e instanceof Error?e.message:"Sharing failed");}
  finally{setSharing("")}
 };
 const disconnect=async()=>{
  if(!window.confirm("Disconnect TikTok? Your saved 1Muslim posts will not be deleted."))return;
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/tiktok/disconnect",{method:"POST",headers:{"Content-Type":"application/json"}});
   if(!r.ok)throw Error("Could not disconnect TikTok. Please try again.");
   setStatus({available:true,connected:false});setVideos([]);setPreview(null);setSettingsOpen(false);setNotice("TikTok disconnected.");
  }catch(e){setError(e instanceof Error?e.message:"Disconnect failed");}
  finally{setLoading(false)}
 };
 return <div className="ttReview" aria-label="TikTok authorization review connection">
  <div className="ttReviewHeader">
   <div className="ttReviewIdentity"><span className="ttReviewBrand" aria-hidden="true">♪</span><div><span>INTERNAL INTEGRATION · LOGIN KIT + DISPLAY API</span><h3>TikTok</h3></div></div>
   <div className="ttReviewHeaderRight"><span className={"ttReviewBadge "+(status?.connected?"on":"")}>{status?.connected?"Connected":loading?"Checking":"Review mode"}</span><button type="button" className="ttReviewRefresh" onClick={()=>void refresh()} disabled={loading} aria-label="Refresh real TikTok account and video data">↻ <span>Refresh</span></button></div>
  </div>
  <p className="ttReviewIntro">Authorize your TikTok account to display its public profile and videos here. Choose individually whether to share a video to Ummah—nothing is imported or published automatically.</p>
  <div className="ttReviewScope" aria-label="Requested TikTok permissions">
   <span><b>user.info.basic</b> · Display name &amp; avatar</span>
   <span><b>video.list</b> · Your public videos</span>
  </div>
  {status?.connected?<>
   <div className="ttReviewConnected">
    {status.profile?.avatarUrl?<img src={status.profile.avatarUrl} alt="Connected TikTok account avatar" referrerPolicy="no-referrer"/>:<span className="ttReviewAvatarFallback" aria-hidden="true">♪</span>}
    <div><strong>{status.profile?.displayName||"TikTok account connected"}</strong><small>{status.profile?.username?"@"+status.profile.username:status.profileUnavailable?"Profile details temporarily unavailable":"Authorized through TikTok"}</small></div>
    <span className="ttReviewCheck">✓ Authorized</span>
   </div>
   <div className="ttReviewGalleryHeader"><div><strong>Public TikTok videos</strong><p>{loading?"Checking access…":error?"Video access needs attention":videos.length===0?"No public videos returned by video.list yet":videos.length+" real videos returned by TikTok"}</p></div>{lastChecked&&<span>Updated {new Date(lastChecked).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span>}</div>
   {videos.length>0&&<div className="ttReviewGrid">
    {videos.map(video=><article key={video.id} className="ttReviewVideo">
      <button type="button" className="ttReviewCover" aria-label={"Preview "+video.title} onClick={()=>setPreview(preview===video.id?null:video.id)}>
       {video.cover?<img src={video.cover} alt="" referrerPolicy="no-referrer" loading="lazy"/>:<span aria-hidden="true">♪</span>}
       <i aria-hidden="true">▶</i>
      </button>
      <strong title={video.title}>{video.title}</strong>
      <div className="ttReviewVideoActions"><button type="button" disabled={!!sharing} onClick={()=>void share(video)}>{sharing===video.id?"Sharing…":"Share to Ummah"}</button><a href={video.url} target="_blank" rel="noopener noreferrer">TikTok ↗</a></div>
      {preview===video.id&&<div className="ttReviewEmbed">{validPreview(video.embed)?<iframe src={validPreview(video.embed)||undefined} title={"TikTok video preview: "+video.title} allow="fullscreen;encrypted-media" allowFullScreen loading="lazy"/>:<a href={video.url} target="_blank" rel="noopener noreferrer">Watch on TikTok ↗</a>}</div>}
    </article>)}
   </div>}
   {!loading&&!error&&videos.length===0&&<p className="ttReviewEmpty">No public videos returned. For TikTok's reviewer recording, use a sandbox test account with publicly posted videos and ensure both requested scopes are available.</p>}
   <button type="button" className="ttReviewSettingsButton" onClick={()=>setSettingsOpen(v=>!v)} aria-expanded={settingsOpen} aria-controls="tt-review-settings">Connection settings <span aria-hidden="true">{settingsOpen?"−":"+"}</span></button>
   {settingsOpen&&<div className="ttReviewSettings" id="tt-review-settings"><p>Only public TikTok videos are retrieved. Each Ummah share requires a separate confirmation. Disconnecting clears stored authorization.</p><button type="button" disabled={loading} onClick={()=>void disconnect()}>Disconnect TikTok</button></div>}
  </>:!loading&&<div className="ttReviewConnect">
    <span className="ttReviewConnectStatus">● Not authorized</span>
    <p>No TikTok account is connected to this test profile.</p>
    <a className="ttReviewConnectAction" href="/api/tiktok/connect">♪ Connect TikTok securely <span aria-hidden="true">↗</span></a>
    <small>Opens TikTok's official consent page. Requires sandbox permissions and a registered matching redirect URI.</small>
  </div>}
  {notice&&<p className="ttReviewNotice" role="status">{notice}</p>}
  {error&&<p className="ttReviewError" role="alert">{error}</p>}
  {loading&&!status&&<p className="ttReviewLoading" role="status">Checking the real TikTok connection…</p>}
 </div>;
}
