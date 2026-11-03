"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";

type Profile = {
  avatar_config: Record<string,unknown>|null;
  avatar_gender: string|null;
  gender: string|null;
  avatar_package: string|null;
  xp_total: number|null;
};

export default function HomeIdleAvatarXp(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [signedIn,setSignedIn]=useState(false);

  useEffect(()=>{
    const db=createClient();
    let active=true;
    let request=0;
    const refresh=async()=>{
      const seq=++request;
      const {data:{user}}=await db.auth.getUser();
      if(!active||seq!==request)return;
      setSignedIn(Boolean(user));
      if(!user){setProfile(null);return;}
      const {data,error}=await db.from("profiles").select("avatar_config,avatar_gender,gender,avatar_package,xp_total").eq("id",user.id).maybeSingle();
      if(active&&seq===request&&!error)setProfile(data as Profile|null);
    };
    void refresh();
    const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
    const onFocus=()=>{void refresh()};
    const onVisible=()=>{if(document.visibilityState==="visible")void refresh()};
    window.addEventListener("focus",onFocus);
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{active=false;request++;subscription.unsubscribe();window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onVisible)};
  },[]);

  if(!signedIn||!profile)return null;
  const config=profile.avatar_config??{};
  const gender=String(config.gender??profile.avatar_gender??profile.gender??"male").toLowerCase();
  const selected=typeof config.selectedAvatarUrl==="string"&&(/^https:\/\//.test(config.selectedAvatarUrl)||/^\/assets\/avatars\/[a-zA-Z0-9._-]+$/.test(config.selectedAvatarUrl))?config.selectedAvatarUrl:null;
  const custom=typeof config.adminAvatarUrl==="string"&&/^https:\/\//.test(config.adminAvatarUrl)?config.adminAvatarUrl:null;
  const src=selected||custom||(gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");
  const xp=Math.max(0,Number(profile.xp_total)||0);
  return <div className="homeIdleAvatarXp" aria-label="Your avatar and experience points">
    <Link href="/profile" className="homeIdleAvatarXpPortrait" aria-label="View your profile">
      <img src={src} alt="Your selected avatar" draggable={false}/>
    </Link>
    <Link href="/profile" className="homeIdleAvatarXpScore" aria-label={`${xp.toLocaleString()} experience points`}>
      <span className="homeIdleAvatarXpValue">{xp.toLocaleString()}</span>
      <span className="homeIdleAvatarXpLabel">XP</span>
    </Link>
  </div>;
}
