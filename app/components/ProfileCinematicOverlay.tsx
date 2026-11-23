"use client";

import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from "react";
import {createPortal} from "react-dom";
import FeaturedBadge from "./FeaturedBadge";
import ProfileSpotlightHero from "./ProfileSpotlightHero";
import styles from "./ProfileCinematicOverlay.module.css";

type PublicIdentity={
 id:string;display_name:string|null;username:string|null;bio:string|null;
 city:string|null;state:string|null;country:string|null;
 xp_total:number;shahada_verified_at:string|null;
};
type Props={
 profile:PublicIdentity; mainImage:string; avatar:string; accent:string;
 followers:number;following:number;isOwner:boolean;
 followAction?:ReactNode;onEdit?:()=>void;onClose:()=>void;
};
const fmt=(n:number)=>new Intl.NumberFormat("en-US").format(n);
export default function ProfileCinematicOverlay({profile,mainImage,avatar,accent,followers,following,isOwner,followAction,onEdit,onClose}:Props){
 const [mounted,setMounted]=useState(false);
 const [counts,setCounts]=useState<{posts:number;videos:number;articles:number}|null>(null);
 const scroller=useRef<HTMLDivElement>(null);
 const art=useRef<HTMLDivElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const frame=useRef<number|null>(null);
 const dialogTitle="Cinematic profile for "+(profile.display_name||"1Muslim member");
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!mounted)return;
  const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const formerOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  closeButton.current?.focus({preventScroll:true});
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape"){e.preventDefault();closeRef.current();}
   // Keep keyboard focus inside the open profile instead of the page behind it.
   if(e.key==="Tab"&&scroller.current){
    const nodes=Array.from(scroller.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')).filter(node=>node.getClientRects().length>0);
    if(!nodes.length)return;
    const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  };
  window.addEventListener("keydown",onKey);
  return()=>{
   document.body.style.overflow=formerOverflow;
   window.removeEventListener("keydown",onKey);
   if(frame.current!==null)cancelAnimationFrame(frame.current);
   previouslyFocused?.focus({preventScroll:true});
  };
 },[mounted]);

 useEffect(()=>{
  if(!mounted)return;
  let alive=true;
  // Read only currently displayed public counters, never private messages.
  void (async()=>{
   const {createClient}=await import("../../utils/supabase/client");
   const db=createClient();
   const [p,v,a]=await Promise.all([
    db.from("posts").select("id",{count:"exact",head:true}).eq("user_id",profile.id),
    db.from("post_media").select("id",{count:"exact",head:true}).eq("user_id",profile.id).like("mime_type","video/%"),
    db.from("newsletter_articles").select("id",{count:"exact",head:true}).eq("author_id",profile.id)
   ]);
   if(alive)setCounts({posts:p.count??0,videos:v.count??0,articles:a.count??0});
  })().catch(()=>{});
  return()=>{alive=false};
 },[mounted,profile.id]);

 const onScroll=()=>{
  if(frame.current!==null)return;
  frame.current=requestAnimationFrame(()=>{
   frame.current=null;
   const offset=scroller.current?.scrollTop??0;
   if(art.current&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    art.current.style.transform=`translate3d(0,${Math.min(120,offset*.25)}px,0) scale(1.085)`;
   }
  });
 };
 const share=async()=>{
  const url=window.location.origin+"/profile/"+encodeURIComponent(profile.id);
  if(navigator.share){try{await navigator.share({title:profile.display_name||"1Muslim profile",url})}catch{}}
  else{try{await navigator.clipboard.writeText(url)}catch{window.prompt("Copy profile link",url)}}
 };
 if(!mounted)return null;
 return createPortal(
  <div className={styles.backdrop} role="presentation" style={{"--cm-accent":accent} as CSSProperties}>
   <div ref={scroller} className={styles.screen} role="dialog" aria-modal="true" aria-label={dialogTitle} onScroll={onScroll}>
    <div className={styles.scene} aria-hidden="true">
     <div ref={art} className={styles.art} style={{backgroundImage:`url(${JSON.stringify(mainImage)})`}}/>
     <div className={styles.vignette}/>
    </div>
    <button ref={closeButton} type="button" className={styles.sceneExit} aria-label="Close full profile by tapping the background" title="Close full profile" onClick={onClose}/>
    <nav className={styles.topbar} aria-label="Full profile controls">
     <span className={styles.xpCrown} aria-label={fmt(profile.xp_total)+" XP"}>✦ <strong>{fmt(profile.xp_total)}</strong> <small>XP</small></span>
     <span className={styles.brand}>1MUSLIM · PROFILE</span>
     <button type="button" onClick={()=>void share()} className={styles.round} aria-label="Share this profile">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true"><path d="M4 18.5C12 18.5 14.4 9.8 19 5"/><path d="M12 4.5h7.5V12"/></svg>
     </button>
    </nav>
    <main className={styles.body}>
     <div className={styles.avatarRing}><img src={avatar} alt={profile.display_name?profile.display_name+"'s avatar":"Member avatar"} /></div>
     <div className={styles.identity}>
      <h1>{profile.display_name||"1Muslim member"}</h1>
      {profile.shahada_verified_at&&<span className={styles.verified} title="Shahada verified" aria-label="Shahada verified">✓</span>}
     </div>
     <p className={styles.handle}>@{profile.username||"member"}</p>
     {profile.shahada_verified_at&&<span className={styles.verifiedLabel}>✦ Shahada verified</span>}
     {profile.bio?.trim()&&<p className={styles.bio}>{profile.bio}</p>}
     {[profile.city,profile.state,profile.country].some(Boolean)&&<p className={styles.location}>⌖ {[profile.city,profile.state,profile.country].filter(Boolean).join(", ")}</p>}
     <div className={styles.stats} aria-label="Profile activity">
      <div><b>{fmt(followers)}</b><span>Followers</span></div>
      <div><b>{fmt(following)}</b><span>Following</span></div>
      <div><b>{counts?fmt(counts.posts):"—"}</b><span>Posts</span></div>
      <div><b>{counts?fmt(counts.videos):"—"}</b><span>Videos</span></div>
      <div><b>{counts?fmt(counts.articles):"—"}</b><span>Articles</span></div>
     </div>
     <div className={styles.actions}>
      {isOwner?<button type="button" className={styles.mainAction} onClick={()=>{onClose();onEdit?.()}} aria-label="Edit profile" title="Edit profile"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m4 17 12-12 3 3L7 20l-4 1zM14 7l3 3"/></svg></button>
      :followAction?<div className={styles.followAction}>{followAction}</div>
      :<span className={styles.publicLabel}>Public profile</span>}
     </div>
     <ProfileSpotlightHero userId={profile.id}/>
     <section className={styles.badgeVault} aria-label="Member badges">
      <div className={styles.badgeHeading}><span>✦ MEMBER BADGES</span><strong>Achievements</strong></div>
      <div className={styles.badgeCollection}>
       <div className={styles.featured}><FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at} compact /></div>
       <div className={styles.lockedBadge} aria-label="Additional badges locked, coming soon"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.3"/><path d="M8.2 11V7a3.8 3.8 0 0 1 7.6 0v4"/><circle cx="12" cy="16" r="1"/></svg></span><strong>More badges</strong><small>COMING SOON · LOCKED</small></div>
      </div>
     </section>
    </main>
   </div>
  </div>,document.body
 );
}
