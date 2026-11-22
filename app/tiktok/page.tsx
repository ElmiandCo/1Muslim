"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import ProfileConnectionsPanel from "../components/ProfileConnectionsPanel";

/** Public launch is paused while TikTok developer-review access is verified.
 * The live OAuth and Display API remain usable by the authorized reviewer. */
export default function TikTokConnectionPage(){
 const [access,setAccess]=useState<"checking"|"admin"|"upcoming">("checking");
 useEffect(()=>{
  let live=true;
  void fetch("/api/tiktok/status",{cache:"no-store"})
   .then(async r=>r.ok?r.json():({available:false}))
   .then(data=>{if(live)setAccess(data.available?"admin":"upcoming")})
   .catch(()=>{if(live)setAccess("upcoming")});
  return()=>{live=false};
 },[]);
 return <main style={{minHeight:"100vh",background:"#f9fbfc",color:"#20364a",paddingBottom:90}}>
  <SiteNav/>
  <div style={{maxWidth:780,margin:"0 auto",padding:"clamp(20px,5vw,38px) clamp(13px,3vw,22px)"}}>
   <Link href="/profile" style={{display:"inline-flex",gap:7,alignItems:"center",color:"#536e83",fontSize:12,textDecoration:"none",fontWeight:750,marginBottom:18}}>← Back to profile</Link>
   {access==="checking"?<div role="status" style={{background:"#fff",border:"1px solid #e0e8ef",borderRadius:19,padding:28,fontSize:13,color:"#6c8090"}}>Checking connection availability…</div>
    :<>
      <ProfileConnectionsPanel isAdmin={access==="admin"}/>
      {access==="admin"&&<Link href="/profile?section=tiktok" style={{display:"inline-block",color:"#376783",fontSize:12,fontWeight:800,textDecoration:"none",marginTop:20}}>Open the profile Connections tab for the reviewer recording ↗</Link>}
    </>}
  </div>
 </main>;
}
