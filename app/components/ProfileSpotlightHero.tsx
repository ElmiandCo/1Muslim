"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import ProfilePublicMedia from "./ProfilePublicMedia";
import {type MemberMediaKind} from "./profile-member-media";
import "./ProfileSpotlight.css";
type Spotlight={title:string;caption:string;media_kind:MemberMediaKind;media_url:string};
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
  <div className="spotlightHeroMedia"><ProfilePublicMedia url={spotlight.media_url} kind={spotlight.media_kind} title={spotlight.title}/></div>
  {spotlight.caption?.trim()&&<p>{spotlight.caption}</p>}
 </section>;
}
