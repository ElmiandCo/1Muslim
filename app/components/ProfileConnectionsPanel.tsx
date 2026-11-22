"use client";

import {useEffect,useState} from "react";
import ProfileTikTokGallery from "./ProfileTikTokGallery";
import "./profile-connections.css";

const pending=[
 {name:"TikTok",kind:"tiktok",subtitle:"Bring your public videos into 1Muslim",mark:"♪"},
 {name:"YouTube",kind:"youtube",subtitle:"Connect your creator video library",mark:"▶"},
 {name:"Twitch",kind:"twitch",subtitle:"Link your live streaming account",mark:"◈"}
] as const;

export default function ProfileConnectionsPanel({isAdmin}:{isAdmin:boolean}){
 const [priorLink,setPriorLink]=useState(false);
 const [unlinking,setUnlinking]=useState(false);
 const [unlinkMessage,setUnlinkMessage]=useState("");
 useEffect(()=>{
  if(isAdmin)return;
  let alive=true;
  void fetch("/api/tiktok/status",{cache:"no-store"})
   .then(r=>r.json()).then(d=>{if(alive)setPriorLink(d.canDisconnect===true)})
   .catch(()=>{});
  return()=>{alive=false};
 },[isAdmin]);
 const unlink=async()=>{
  if(!window.confirm("Disconnect your previously linked TikTok account?"))return;
  setUnlinking(true);setUnlinkMessage("");
  try{
   const r=await fetch("/api/tiktok/disconnect",{method:"POST"});
   if(!r.ok)throw Error("Could not disconnect. Please try again.");
   setPriorLink(false);setUnlinkMessage("Your previous TikTok connection has been disconnected.");
  }catch(e){setUnlinkMessage(e instanceof Error?e.message:"Unable to disconnect")}
  finally{setUnlinking(false)}
 };
 return <section className="pcxShell" aria-label="External social connections">
   <div className="pcxIntro">
    <span className="pcxEyebrow">1MUSLIM · CONNECTED ACCOUNTS</span>
    <div className="pcxHeading"><div><h2>Connect your world.</h2><p>{isAdmin
      ?"Review the real TikTok connection flow before enabling it for everyone."
      :"Your favorite creator platforms, thoughtfully connected to your 1Muslim profile. We're preparing a secure launch."}</p></div>
      <span className={"pcxState "+(isAdmin?"pcxTesting":"")}>{isAdmin?"PRIVATE TEST":"COMING SOON"}</span>
    </div>
   </div>
   {isAdmin
    ? <div className="pcxReviewArea">
       <ProfileTikTokGallery/>
       <details className="pcxReviewNotes">
        <summary><span>Approval recording guide</span><span className="pcxChevron" aria-hidden="true">⌄</span></summary>
        <div>
         <p><strong>Record the real integration on 1muslim.live</strong>, using a TikTok sandbox test account with public videos. Do not simulate a successful API response.</p>
         <ol>
          <li>Open <b>Profile → Edit Profile → Connections</b> and show the TikTok permission explanation.</li>
          <li>Tap <b>Connect TikTok securely</b>, show TikTok's own authorization page, and grant <code>user.info.basic</code> plus <code>video.list</code>.</li>
          <li>After TikTok redirects back, show the connected display name/avatar and public video tiles returned by the Display API.</li>
          <li>Preview a real video. Optionally choose <b>Share to Ummah</b> and show the published post; make clear sharing is manual and consent-based.</li>
          <li>Show <b>Connection settings → Disconnect</b>, without disclosing any tokens or secrets.</li>
         </ol>
         <p>The reviewer needs a complete end-to-end recording. TikTok requires the sandbox for first review and the recorded domain to match the registered website. If videos fail to load, fix scope/approval access rather than recording a fabricated success.</p>
        </div>
       </details>
      </div>
    :<div className="pcxUpcoming">
      <div className="pcxUpcomingMark" aria-hidden="true"><svg viewBox="0 0 32 32" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19v7h18v-7M5 12h22v7H5zM8 12V7h16v5M13 7V4h6v3M10 19h12"/></svg></div>
      <div><strong>Social connections are on the way</strong><p>TikTok, YouTube and Twitch will become available here after integration review. Nothing to set up yet.</p></div>
    </div>}
   <div className="pcxServiceList" aria-label="Connection availability">
    {pending.filter(service=>!isAdmin||service.name!=="TikTok").map(service=>
     <article key={service.kind} className="pcxService" aria-label={service.name+" — coming soon"}>
       <span className={"pcxLogo pcxLogo-"+service.kind} aria-hidden="true">{service.mark}</span>
       <div className="pcxServiceText"><strong>{service.name}</strong><span>{service.subtitle}</span></div>
       <span className="pcxSoonLabel">Soon</span>
     </article>)}
   </div>
   {!isAdmin&&priorLink&&<div className="pcxOldLink"><p>Previously linked TikTok? You can remove that authorization now.</p><button type="button" disabled={unlinking} onClick={()=>void unlink()}>{unlinking?"Disconnecting…":"Disconnect existing TikTok account"}</button></div>}
   {unlinkMessage&&<p className="pcxLinkFeedback" role="status">{unlinkMessage}</p>}
   <p className="pcxFootnote">External accounts will only connect with your permission. No automatic TikTok video publishing is enabled.</p>
 </section>;
}
