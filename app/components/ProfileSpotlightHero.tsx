"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import ProfilePublicMedia from "./ProfilePublicMedia";
import {safeMediaUrl} from "./profile-member-media";
import "./ProfileSpotlight.css";
type Spotlight={title:string;caption:string;media_kind:"none"|"image"|"video"|"link";media_url:string|null};
export default function ProfileSpotlightHero({userId}:{userId:string}){
 const [spotlight,setSpotlight]=useState<Spotlight|null>(null);
 useEffect(()=>{
  let live=true;const load=async()=>{
   const {data,error}=await createClient().from("profile_spotlights").select("title,caption,media_kind,media_url").eq("user_id",userId).maybeSingle();
   if(live&&(!error))setSpotlight(data as Spotlight|null);
  };
  void load();window.addEventListener("1muslim:spotlight-updated",load);
  return()=>{live=false;window.removeEventListener("1muslim:spotlight-updated",load)};
 },[userId]);
 if(!spotlight)return null;
 return <section className="profileSpotlightHero" aria-label="Member Spotlight">
  <div className="spotlightHeroHeader"><div><span>✦ 1M SIGNATURE SPOTLIGHT</span><strong>{spotlight.title||"My Spotlight"}</strong></div><span className="spotlightHeroStar" aria-hidden="true">✧</span></div>
  {(spotlight.media_kind==="image"||spotlight.media_kind==="video")&&spotlight.media_url&&<div className="spotlightHeroMedia">
   <ProfilePublicMedia url={spotlight.media_url} kind={spotlight.media_kind} title={spotlight.title}/>
  </div>}
  {spotlight.media_kind==="link"&&spotlight.media_url&&safeMediaUrl(spotlight.media_url)&&<a className="spotlightHeroLink" href={safeMediaUrl(spotlight.media_url)!} target="_blank" rel="noopener noreferrer">
   <span aria-hidden="true">↗</span><span>Explore my link</span><small>{new URL(spotlight.media_url).hostname}</small>
  </a>}
  {spotlight.media_kind==="none"&&!spotlight.caption.trim()&&<div className="spotlightHeroTextOnly" aria-hidden="true">✦</div>}
  {spotlight.caption?.trim()&&<p className="spotlightHeroCaption" dir="auto">{spotlight.caption}</p>}
 </section>;
}
