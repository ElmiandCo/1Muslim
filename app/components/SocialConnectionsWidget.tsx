"use client";
import {useEffect,useState} from "react";
import ProfileConnectionsPanel from "./ProfileConnectionsPanel";

/** A shared, permission-aware social connections surface.
 * Only the verified review account is offered active TikTok OAuth. */
export default function SocialConnectionsWidget(){
 const [available,setAvailable]=useState(false);
 useEffect(()=>{
  let mounted=true;
  void fetch("/api/tiktok/status",{cache:"no-store"})
    .then(async r=>r.json().catch(()=>({available:false})))
    .then(v=>{if(mounted)setAvailable(v.available===true)})
    .catch(()=>{if(mounted)setAvailable(false)});
  return()=>{mounted=false};
 },[]);
 return <ProfileConnectionsPanel isAdmin={available}/>;
}
