"use client";

import ProfileQuranCanvas from "../components/ProfileQuranCanvas";
import ProfileQiblaCompass from "../components/ProfileQiblaCompass";
import MemberGlyph from "../components/MemberGlyph";
import ProfileConnectionsPanel from "../components/ProfileConnectionsPanel";
import RegionDiscovery, {canonicalCountry,canonicalUsState} from "../components/RegionDiscovery";
import SwipeMemberRail from "../components/SwipeMemberRail";
import RecentMuslimDiscovery from "../components/RecentMuslimDiscovery";
import ProfilePagePosts from "../components/ProfilePagePosts";
import ProfileSpotlightEditor from "../components/ProfileSpotlightEditor";
import Link from "next/link";
import NextImage from "next/image";
import HomeAppIcon from "../components/HomeAppIcon";
import PostDesignStudio from "../components/PostDesignStudio";
import HomePostsMagazineRail from "../components/HomePostsMagazineRail";
import AdminParallaxDashboard from "../components/AdminParallaxDashboard";
import {useRouter} from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import {SettingsEmbedContext} from "../components/SettingsEmbedContext";

import ProfileAvatar, { ACCESSORIES, AVATAR_TIERS, tierForXp } from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";
import ProfileContentSections from "../components/ProfileContentSections";
import FeaturedBadge from "../components/FeaturedBadge";
import PublicBadgeSelector from "../components/PublicBadgeSelector";
import HudHudTenFriends from "../components/HudHudTenFriends";
import ProfileAnalytics from "../components/ProfileAnalytics";
import ProfileNextPrayer from "../components/ProfileNextPrayer";
import ProfileControlGlyph from "../components/ProfileControlGlyph";
import ProfileMagneticTiles from "../components/ProfileMagneticTiles";
import ProfileCinematicOverlay from "../components/ProfileCinematicOverlay";
import "./profile-polish.css";
import "./profile-mosaic.css";
import "./profile-home-unification.css";
import "./appearance-modern.css";
import ProfileFirstPostPrompt from "../components/ProfileFirstPostPrompt";
import ProfileNavIcon from "../components/icons/ProfileNavIcon";
import ProfileCinematicPosts from "../components/ProfileCinematicPosts";
import {publicMemberId,publicMemberName} from "../lib/member-id-visibility";
import ProfileQiblaCarousel from "../components/ProfileQiblaCarousel";
import ProfileDeepWatchCarousel from "../components/ProfileDeepWatchCarousel";
import ElmTentAlphabet from "../components/ElmTentAlphabet";
import ProfileSearchHome from "./ProfileSearchHome";

type Profile = {
  id: string; created_at?: string | null; display_name: string; username: string | null; hide_1muslim_id?:boolean|null; first_name: string | null; last_name: string | null;
  city: string | null; state: string | null; country: string | null; gender: string | null; bio: string | null;
  xp_total: number; avatar_gender: string; avatar_package: string; avatar_config: Record<string, unknown>;
  profile_main_image_url?:string|null;
  profile_background_image_url?:string|null;
  profile_background: string; profile_accent: string; community: string | null;
  display_name_changed_at: string | null; username_changed_at: string | null; shahada_verified_at: string | null; shahada_audio_path: string | null; shahada_language: "ar" | "en" | null;
};

// Cached across client route changes, but only exposed after auth confirms ownership.
let warmProfile:{userId:string;profile:Profile;at:number}|null=null;
const WARM_PROFILE_MS=3*60*1000;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function cooldownRemaining(changedAt: string | null) {
  if (!changedAt) return null;
  const remaining = new Date(changedAt).getTime() + THREE_DAYS - Date.now();
  if (remaining <= 0) return null;
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h remaining` : `${hours}h remaining`;
}

const AVATAR_CHOICES=[
  {url:"/assets/avatars/GoldenSister-female.jpg",label:"GoldenSister Female",xp:0,isNew:true},
  {url:"/assets/avatars/SmoothRed-female.PNG",label:"SmoothRed Female",xp:0,isNew:true},
  {url:"/assets/avatars/GreenGem-female.PNG",label:"GreenGem Female",xp:0,isNew:true},
  {url:"/assets/avatars/CoolBlue.PNG",label:"CoolBlue Female",xp:0,isNew:true},
  {url:"/assets/avatars/Pinkish-female.PNG",label:"Pinkish Female",xp:0,isNew:true},
  {url:"/assets/avatars/HawwaTheQueen.PNG",label:"HawwaTheQueen Female",xp:0,isNew:true},

  {url:"/assets/avatars/default-male.jpg",label:"Classic Male",xp:0},
  {url:"/assets/avatars/Default-women.png",label:"Classic Female",xp:0},
  {url:"/assets/avatars/floral-avatar-female.PNG",label:"Floral Female",xp:0},
  {url:"/assets/avatars/silver-avatar-male.jpg",label:"Silver Male",xp:5000},
  {url:"/assets/avatars/silver-avatar-female.jpg",label:"Silver Female",xp:5000},
  {url:"/assets/avatars/gold-avatar-male.PNG",label:"Gold Male",xp:5000},
  {url:"/assets/avatars/gold-avatar-female.PNG",label:"Gold Female",xp:5000},
  {url:"/assets/avatars/water-avatar-male.PNG",label:"Water Male",xp:5000},
  {url:"/assets/avatars/water-avatar-female.PNG",label:"Water Female",xp:5000},
  {url:"/assets/avatars/diamond-avatar-female.PNG",label:"Diamond Female",xp:10000},
  {url:"/assets/avatars/cosmic-avatar-male.PNG",label:"Cosmic Male",xp:10000},
  {url:"/assets/avatars/cosmic-avatar-female.PNG",label:"Cosmic Female",xp:10000},
  {url:"/assets/avatars/emerald-royalty-female.PNG",label:"Emerald Royalty Female",xp:10000},
  {url:"/assets/avatars/violet-sentinel-female.PNG",label:"Violet Sentinel Female",xp:10000},
  {url:"/assets/avatars/tina-the-salafi-female.PNG",label:"Tina The Salafi Female",xp:20000}
] as const;
const COVER_STOCK=[{id:"emerald",label:"Emerald",url:"/assets/profile-backgrounds/emerald.PNG"},{id:"sapphire",label:"Sapphire",url:"/assets/profile-backgrounds/sapphire.PNG"},{id:"ruby",label:"Ruby",url:"/assets/profile-backgrounds/rose-gold.PNG"},{id:"amethyst",label:"Amethyst",url:"/assets/profile-backgrounds/amethyst.PNG"},{id:"titanium",label:"Titanium",url:"/assets/profile-backgrounds/silver-dust.PNG"},{id:"obsidian",label:"Obsidian",url:"/assets/profile-backgrounds/obsidian.PNG"}] as const;
// Keep the existing cover and optional new portrait art distinct.
const profileCoverImage=(profile:Pick<Profile,"avatar_config"|"profile_background_image_url">)=>typeof profile.avatar_config?.profileCoverUrl==="string"?profile.avatar_config.profileCoverUrl:profile.profile_background_image_url||COVER_STOCK.find(c=>c.id===profile.avatar_config?.profileBackgroundTheme)?.url||COVER_STOCK[5].url;
// Pre-size built-in cover art for the 3×4 Explore mosaic, rather than loading
// the multi-megabyte original in twelve independently painted tiles.
const profileMosaicImage=(url:string)=>
 url.startsWith("/assets/profile-backgrounds/")
  ? "/_next/image?url="+encodeURIComponent(url)+"&w=1080&q=60"
  : url;
const MEMBER_ACCENT_COLORS:Record<string,string>={emerald:"#579879",gold:"#b89b53",blue:"#689bd5",violet:"#9780c4",rose:"#c47e98",slate:"#829392",black:"#151515"};
const MEMBER_TEXT_COLORS:Record<string,string>={emerald:"#174635",gold:"#58400c",blue:"#173e70",violet:"#42276a",rose:"#692a42",slate:"#293c3b",black:"#141414"};
const PROFILE_EDITOR_SECTIONS=[
  {id:"profile",label:"Identity",glyph:"✎"},
  {id:"avatar",label:"Avatars",glyph:"◉"},
  {id:"header",label:"Appearance",glyph:"✧"},
  {id:"live",label:"Connections",glyph:"◎"},
  {id:"shahada",label:"Verification",glyph:"✓"},
  {id:"analytics",label:"Analytics",glyph:"▤"}
] as const;
const memberAccent=(accent:string|null|undefined)=>MEMBER_ACCENT_COLORS[accent||""]||MEMBER_ACCENT_COLORS.black;
const memberAccentStyle=(accent:string|null|undefined)=>({"--member-accent":memberAccent(accent),"--member-text":MEMBER_TEXT_COLORS[accent||""]||MEMBER_TEXT_COLORS.black} as CSSProperties);
const BACKGROUND_CHOICES=[
  {id:"obsidian-black",accent:"black",label:"Obsidian Black"},
  {id:"emerald-night",accent:"emerald",label:"Emerald Night"},
  {id:"gold-dusk",accent:"gold",label:"Gold Dusk"},
  {id:"water-blue",accent:"blue",label:"Water Blue"},
  {id:"violet-sky",accent:"violet",label:"Violet Sky"},
  {id:"rose-garden",accent:"rose",label:"Rose Garden"},
  {id:"slate-stone",accent:"slate",label:"Slate Stone"}
] as const;




function ProfileSubscriptionStatus(){
 const [status,setStatus]=useState<"loading"|"unlocked"|"free"|"unavailable">("loading");
 useEffect(()=>{let live=true;fetch("/api/stripe/status",{cache:"no-store"}).then(async r=>{if(r.status===401)return {unlocked:false};if(!r.ok)throw Error("status unavailable");return r.json()}).then(d=>{if(live)setStatus(d.unlocked?"unlocked":"free")}).catch(()=>{if(live)setStatus("unavailable")});return()=>{live=false}},[]);
 return <div style={{padding:"16px 18px",margin:"14px 0",border:"1px solid #d6e2f1",borderRadius:16,background:"#fff",color:"#173251"}}>
  <strong>Membership</strong><div style={{marginTop:8,fontSize:16,fontWeight:700}}>{status==="loading"?"Checking membership…":status==="unlocked"?"1Muslim Unlocked":status==="free"?"Free membership":"Membership status unavailable"}</div>
  {status==="free"&&<Link href="/unlocked" style={{display:"inline-block",marginTop:12,padding:"9px 16px",borderRadius:12,background:"#183f77",color:"#fff",textDecoration:"none",fontWeight:700}}>Unlocked → Upgrade</Link>}
  {status==="unlocked"&&<Link href="/unlocked" style={{display:"inline-block",marginTop:10,color:"#225f9a"}}>Manage Unlocked</Link>}
 </div>;
}
function LauncherLineIcon({name,prayerIconSrc="/assets/sujud.PNG"}:{name:string;prayerIconSrc?:string}){
 const shared={width:60,height:60,viewBox:"0 0 64 64",fill:"none",stroke:"url(#launcherMetal)",strokeWidth:3.1,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
 const frame=<defs><linearGradient id="launcherMetal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f7f8fa"/><stop offset=".14" stopColor="#9299a5"/><stop offset=".38" stopColor="#12151a"/><stop offset=".68" stopColor="#33363c"/><stop offset="1" stopColor="#050607"/></linearGradient><linearGradient id="launcherGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0d3"/><stop offset=".45" stopColor="#b58c5b"/><stop offset="1" stopColor="#5d4736"/></linearGradient><filter id="launcherRelief" x="-35%" y="-35%" width="170%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#15171c" floodOpacity=".35"/></filter></defs>;
 switch(name){
 case "DeepWatch":return <svg {...shared} style={{filter:"drop-shadow(0 4px 3px rgba(10,12,18,.28))"}}>{frame}<rect x="9" y="22" width="46" height="32" rx="5"/><path d="M9 22l4-12 43 0-4 12zM22 10l-5 12M38 10l-5 12M51 10l-5 12"/><path d="m27 31 13 7-13 7z" fill="url(#launcherGold)" stroke="none"/></svg>;
 case "News":return <svg {...shared}>{frame}<rect x="13" y="12" width="38" height="42" rx="4"/><path d="M20 21h24M20 27h24M20 45h24M20 49h17"/><rect x="20" y="32" width="13" height="9" rx="1"/><path d="M37 33h7M37 38h7"/></svg>;
 case "Qur’an":return <svg {...shared}>{frame}<path d="M13 11h35a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4z"/><path d="M15 11v44M20 17h26v32H20zM32 21l3 5 6 1-4.5 4.5 1 6-5.5-3-5.5 3 1-6L23 27l6-1z"/><path d="M24 44h16"/></svg>;
 case "Compass":return <svg {...shared} strokeWidth="2.4">{frame}<circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="20" strokeOpacity=".45"/><circle cx="32" cy="32" r="3" fill="url(#launcherGold)" stroke="none"/><path d="M32 7v6M32 51v6M7 32h6M51 32h6M16 16l4 4M44 44l4 4M48 16l-4 4M20 44l-4 4" strokeWidth="2"/><path d="m41 18-6 19-17 9 9-18z" fill="url(#launcherGold)" strokeWidth="2.1"/><path d="m41 18-14 10 8 9z" stroke="#f4f5f7" fill="#ebe5d6" strokeWidth="1.5"/><circle cx="32" cy="32" r="1.8" fill="#232d39" stroke="none"/></svg>;
 case "Prayer":return <NextImage src={prayerIconSrc} alt="" aria-hidden="true" width={64} height={64} sizes="(max-width: 480px) 54px, 44px" className="profilePrayerSujudIcon" loading="lazy"/>;
 case "Arabic":return <svg {...shared} strokeWidth="2.5">{frame}<rect x="11" y="8" width="42" height="48" rx="9"/><path d="M17 14h30M17 50h30" strokeOpacity=".45" strokeWidth="1.5"/><text x="32" y="43" textAnchor="middle" fill="url(#launcherGold)" stroke="none" fontFamily="serif" fontSize="36" fontWeight="700" lang="ar">ا</text><path d="M43 18l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" strokeWidth="1.3"/></svg>;
 case "Live":return <svg {...shared}>{frame}<path d="M32 37v17M24 54h16"/><path d="m27 25 11 7-11 7z" fill="url(#launcherGold)" stroke="none"/><path d="M19 19a19 19 0 0 0 0 26M45 19a19 19 0 0 1 0 26M13 13a27 27 0 0 0 0 38M51 13a27 27 0 0 1 0 38"/></svg>;
 case "Post":return <svg {...shared}>{frame}<rect x="11" y="12" width="42" height="42" rx="7"/><path d="m22 43 4-10 16-16 6 6-16 16zM22 43l10-4M38 21l6 6"/></svg>;
 case "Messages":return <svg {...shared}>{frame}<path d="M10 15h44v30H29L18 54v-9h-8z"/><path d="M19 26h26M19 33h19"/><circle cx="47" cy="10" r="4" fill="url(#launcherGold)" stroke="none"/></svg>;
 case "Ummah":return <svg {...shared}>{frame}<rect x="8" y="10" width="29" height="28" rx="4"/><circle cx="17" cy="19" r="3" strokeWidth="2.3"/><path d="m11 32 8-8 6 5 5-6 4 5" strokeWidth="2.4"/><rect x="30" y="23" width="26" height="23" rx="5" fill="#f8f9fb" strokeWidth="2.6"/><path d="m40 29 9 5-9 5z" fill="url(#launcherGold)" stroke="none"/><path d="M11 45h18a5 5 0 0 1 5 5v2H22l-6 5v-5h-5z" strokeWidth="2.6"/><path d="M41 51c-3-3 1-7 4-4 3-3 7 1 4 4l-4 5z" fill="url(#launcherGold)" strokeWidth="1.8"/></svg>;
 case "Profile":return <svg {...shared}>{frame}<circle cx="32" cy="23" r="10"/><path d="M12 53c1-12 8-19 20-19s19 7 20 19"/><circle cx="32" cy="32" r="27" opacity=".32"/></svg>;
 case "Muslims":return <svg {...shared}>{frame}<circle cx="32" cy="17" r="8"/><circle cx="14" cy="28" r="6"/><circle cx="50" cy="28" r="6"/><path d="M17 53c0-11 5-17 15-17s15 6 15 17M5 52c0-8 3-13 10-13M59 52c0-8-3-13-10-13"/><path d="M19 12a24 24 0 0 1 26 0" opacity=".5"/></svg>;
 case "Notifications":return <svg {...shared}>{frame}<path d="M18 43h28l-4-6V28c0-7-4-12-10-13-6 1-10 6-10 13v9z"/><path d="M27 48c1 5 9 5 10 0"/><path d="M32 10v4"/><circle cx="48" cy="16" r="5" fill="url(#launcherGold)" stroke="none"/></svg>;
 default:return null;
 }
}

function ProfileAppLauncher({onProfile,coverUrl,prayerIconSrc}:{onProfile:()=>void;coverUrl:string;prayerIconSrc:string}){
 const magneticGridRef=useRef<HTMLDivElement|null>(null);
 const fastCover=profileMosaicImage(coverUrl);
 const [failedCover,setFailedCover]=useState<string|null>(null);
 const mosaicUrl=failedCover===fastCover?coverUrl:fastCover;
 const [decodedCover,setDecodedCover]=useState<string|null>(null);
 const mosaicLoaded=decodedCover===mosaicUrl;
 const onMosaicLoaded=async(event:SyntheticEvent<HTMLImageElement>)=>{
  const img=event.currentTarget;
  const source=mosaicUrl;
  // An incomplete progressive image must not appear as blank lower rows.
  try{await img.decode()}catch{if(!img.complete||!img.naturalWidth)return}
  setDecodedCover(source);
 };
 const onMosaicError=()=>{
  if(mosaicUrl!==coverUrl)setFailedCover(fastCover);
  else setDecodedCover(null);
 };
 const [postOpen,setPostOpen]=useState(false);
 const [quranOpen,setQuranOpen]=useState(false);
 const [qiblaOpen,setQiblaOpen]=useState(false);
 const [arabicOpen,setArabicOpen]=useState(false);
 const arabicRef=useRef<HTMLElement|null>(null);
 const [qiblaMotionPermission,setQiblaMotionPermission]=useState<boolean|null>(null);
 const qiblaRef=useRef<HTMLDivElement|null>(null);
 const openQibla=(forceOpen=false)=>{
  if(qiblaOpen){if(forceOpen){qiblaRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});return}setQiblaOpen(false);return}
  // iOS requires requestPermission() in the actual tile-tap gesture.
  // Do not wait for the widget to mount before asking.
  const orientation=typeof window!=="undefined"?(window as Window&{DeviceOrientationEvent?:typeof DeviceOrientationEvent}).DeviceOrientationEvent:undefined;
  const request=orientation&&(orientation as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<"granted"|"denied">}).requestPermission;
  if(typeof request==="function"){
   void request.call(orientation).then(result=>setQiblaMotionPermission(result==="granted")).catch(()=>setQiblaMotionPermission(false));
  }else setQiblaMotionPermission(null);
  setQuranOpen(false);setPostOpen(false);setArabicOpen(false);setExpanded(false);setQiblaOpen(true);
  window.setTimeout(()=>qiblaRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),160)
 };
 useEffect(()=>{const open=()=>openQibla(true);window.addEventListener("1muslim:profile-open-qibla",open);return()=>window.removeEventListener("1muslim:profile-open-qibla",open)},[qiblaOpen]);
 const quranRef=useRef<HTMLDivElement|null>(null);
 
 const openQuran=()=>{setQiblaOpen(false);setArabicOpen(false);if(quranOpen){setQuranOpen(false);return}setPostOpen(false);setExpanded(false);setQuranOpen(true);window.setTimeout(()=>quranRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),160)};
 const postRef=useRef<HTMLDivElement|null>(null);
 const openPost=()=>{setQiblaOpen(false);setArabicOpen(false);if(quranOpen){setQuranOpen(false)}setExpanded(false);setPostOpen(true);window.setTimeout(()=>postRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),160)};
 const openArabic=()=>{
  setQiblaOpen(false);setQuranOpen(false);setPostOpen(false);
  if(arabicOpen){setArabicOpen(false);return}
  setExpanded(false);setArabicOpen(true);
  window.setTimeout(()=>arabicRef.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),160);
 };
 const [expanded,setExpanded]=useState(true);
 // Deep links from prayer/Adhan must open the existing Qibla tool, not a dead anchor.
 // Do not request iOS motion permission in an effect: browsers require a tap.
 useEffect(()=>{
  const reveal=()=>{
   setQuranOpen(false);setPostOpen(false);setArabicOpen(false);
   setExpanded(false);setQiblaOpen(true);
   window.setTimeout(()=>{
    qiblaRef.current?.scrollIntoView({
     behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",
     block:"start"
    });
   },230);
  };
  if(new URLSearchParams(window.location.search).get("compass")==="1")reveal();
  const fromAdhan=()=>reveal();
  const fromHistory=()=>{if(new URLSearchParams(window.location.search).get("compass")==="1")reveal()};
  window.addEventListener("1muslim:open-qibla",fromAdhan);
  window.addEventListener("popstate",fromHistory);
  return()=>{window.removeEventListener("1muslim:open-qibla",fromAdhan);window.removeEventListener("popstate",fromHistory)};
 },[]);
 const [launcherBadges,setLauncherBadges]=useState<Record<string,number>>({});
 useEffect(()=>{try{const stored=localStorage.getItem("1muslim:profile-explore-expanded");if(stored!==null)setExpanded(stored==="true")}catch{}},[]);
 useEffect(()=>{
  let active=true;const db=createClient();let channel:ReturnType<typeof db.channel>|null=null;let timer:number|undefined;
  const seenKey=(name:string)=>"1muslim:explore-seen:"+name;
  const baseline=(name:string)=>{try{const saved=localStorage.getItem(seenKey(name));if(saved)return saved;const now=new Date().toISOString();localStorage.setItem(seenKey(name),now);return now}catch{return new Date().toISOString()}};
  const refresh=async(userId:string)=>{
   const deepwatchSeen=baseline("deepwatch"),newsSeen=baseline("news");
   const results=await Promise.all([
    db.from("notifications").select("id",{count:"exact",head:true}).eq("recipient_id",userId).is("read_at",null),
    db.from("dm_participants").select("conversation_id,last_read_at").eq("user_id",userId),
    db.from("islamic_video_registry").select("video_id",{count:"exact",head:true}).eq("status","approved").gt("reviewed_at",deepwatchSeen),
    db.from("live_streams").select("id",{count:"exact",head:true}).eq("status","live"),
    db.from("qibla_articles").select("id",{count:"exact",head:true}).eq("status","published").gt("published_at",newsSeen),
    db.from("qibla_pages").select("id",{count:"exact",head:true}).eq("published",true).gt("created_at",newsSeen)
   ]);
   const notificationCount=results[0].count??0,participants=results[1].data??[],deepwatchCount=results[2].count??0,liveCount=results[3].count??0,articleCount=results[4].count??0,legacyArticleCount=results[5].count??0;
   let unreadMessages=0;const ids=[...new Set(participants.map(x=>x.conversation_id))];
   if(ids.length){const messageResult=await db.from("dm_messages").select("conversation_id,sender_id,created_at").in("conversation_id",ids).order("created_at",{ascending:false}).limit(1000);const readMap=new Map(participants.map(x=>[x.conversation_id,x.last_read_at]));for(const message of messageResult.data??[]){if(message.sender_id===userId)continue;const read=readMap.get(message.conversation_id);if(!read||Date.parse(message.created_at)>Date.parse(read))unreadMessages++}}
   if(active)setLauncherBadges({Notifications:notificationCount,Messages:unreadMessages,DeepWatch:deepwatchCount,Live:liveCount,News:articleCount+legacyArticleCount});
  };
  void (async()=>{const auth=await db.auth.getUser();const user=auth.data.user;if(!user||!active)return;const update=()=>void refresh(user.id);update();timer=window.setInterval(update,10000);channel=db.channel("profile-explore-badges-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:"recipient_id=eq."+user.id},update).on("postgres_changes",{event:"INSERT",schema:"public",table:"dm_messages"},update).on("postgres_changes",{event:"*",schema:"public",table:"live_streams"},update).on("postgres_changes",{event:"*",schema:"public",table:"islamic_video_registry"},update).on("postgres_changes",{event:"*",schema:"public",table:"qibla_articles"},update).on("postgres_changes",{event:"*",schema:"public",table:"qibla_pages"},update).subscribe()})();
  return()=>{active=false;if(timer)clearInterval(timer);if(channel)void db.removeChannel(channel)}
 },[]);
 const toggleExpanded=()=>setExpanded(v=>{const next=!v;try{localStorage.setItem("1muslim:profile-explore-expanded",String(next))}catch{}return next});
 const items=[
  {label:"DeepWatch",href:"/deepwatch",icon:"▶",tone:"#d9aa63"},
  {label:"News",href:"/qibla/newsroom",icon:"◇",tone:"#d878c8"},
  {label:"Qur’an",href:"/quran-library",icon:"۞",tone:"#8ad8cb"},
  {label:"Live",href:"/streaming/go-live",icon:"▣",tone:"#6bd9db"},
  {label:"Post",href:"#create-post",icon:"✚",tone:"#77d8c6"},
  {label:"Messages",href:"/messages",icon:"✉",tone:"#8dc8e6"},
  {label:"Muslims",href:"/profile?section=muslimeen",icon:"◎",tone:"#c5b5f0"},
  {label:"Ummah",href:"/posts",icon:"☷",tone:"#e3a58d"},
  {label:"Notifications",href:"/notifications",icon:"🔔",tone:"#b8a6db"},
  {label:"Prayer",href:"/widget-tools/prayer",icon:"🤲",tone:"#cbb892"},
  {label:"Compass",href:"#qibla-compass",icon:"⌖",tone:"#a4b7c7"},
  {label:"Arabic",href:"#arabic-learning",icon:"ا",tone:"#ddb58e"}
 ];
 return <section className="profileAppLauncher" aria-label="Explore 1Muslim apps">
  <div className="profileAppLauncherHeading"><h2>Explore 1Muslim</h2>
   {expanded&&<span className="profileMagneticHint" aria-hidden="true">Hold + drag to rearrange</span>}
   <button type="button" className="profileLauncherToggle" onClick={toggleExpanded} aria-expanded={expanded} aria-label={expanded?"Collapse Explore 1Muslim":"Expand Explore 1Muslim"} title={expanded?"Collapse":"Expand"}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={expanded?"M5 15l7-7 7 7":"M5 9l7 7 7-7"}/></svg></button>
  </div>
  {/* Start downloading before the launcher scrolls into view. Not a grid child:
       the magnetic grid's 3-column positioning depends on exactly 12 cells. */}
  <img key={mosaicUrl} src={mosaicUrl} alt="" aria-hidden="true" className="profileMosaicPreloader"
   loading="eager" decoding="async" fetchPriority="high" onLoad={onMosaicLoaded} onError={onMosaicError}/>
  <div ref={magneticGridRef} className={expanded?"profileAppLauncherGrid"+(mosaicLoaded?" profileMosaicLoaded":""):"profileAppLauncherGrid compact"} style={{"--profile-grid-cover":`url(${JSON.stringify(mosaicUrl)})`} as CSSProperties} aria-label="Explore 1Muslim app shortcuts">
   <ProfileMagneticTiles items={items} expanded={expanded} gridRef={magneticGridRef} renderTile={item=><Link key={item.label} href={item.href} onClick={event=>{
    if(item.label==="DeepWatch"||item.label==="News"){try{localStorage.setItem("1muslim:explore-seen:"+(item.label==="News"?"news":"deepwatch"),new Date().toISOString())}catch{}setLauncherBadges(current=>({...current,[item.label]:0}))}
    if(item.label==="Profile"){event.preventDefault();setExpanded(false);onProfile()}
    else if(item.label==="Post"){event.preventDefault();openPost()}
    else if(item.label==="Qur’an"){event.preventDefault();openQuran()}
    else if(item.label==="Compass"){event.preventDefault();openQibla()}
    else if(item.label==="Arabic"){event.preventDefault();openArabic()}
    else if(item.label==="Muslims"){event.preventDefault();window.dispatchEvent(new CustomEvent("1muslim:discover-muslims",{detail:{}}))}
   }} className="profileAppTile">
    <span className="profileAppTileIcon" aria-hidden="true"><LauncherLineIcon name={item.label} prayerIconSrc={prayerIconSrc}/></span>
    {(launcherBadges[item.label]??0)>0&&<span className={"profileAppBadge "+(item.label==="Live"?"isLive":"")} aria-label={String(launcherBadges[item.label])+" new "+item.label.toLowerCase()+" item"+(launcherBadges[item.label]===1?"":"s")}>{launcherBadges[item.label]>99?"99+":launcherBadges[item.label]}</span>}
    <span className="profileAppTileLabel">{item.label}</span>
   </Link>}/>
  </div>{qiblaOpen&&<div ref={qiblaRef} id="qibla-compass"><ProfileQiblaCompass motionPermission={qiblaMotionPermission}/></div>}{arabicOpen&&<section ref={arabicRef} id="arabic-learning" className="profileArabicPanel" aria-label="Arabic alphabet lessons"><header className="profileArabicPanelHeader"><div><small>ELM TENT · ARABIC</small><h3>Learn Arabic</h3></div><button type="button" onClick={()=>setArabicOpen(false)} aria-label="Close Arabic lessons">✕</button></header><ElmTentAlphabet compact/></section>}{quranOpen&&<div ref={quranRef}><ProfileQuranCanvas/></div>}{postOpen&&<div ref={postRef} id="create-post" className="profilePostComposer" aria-label="Create a community post"><PostDesignStudio/><HomePostsMagazineRail/></div>}<style jsx>{`.profileArabicPanel{margin-top:16px;scroll-margin-top:84px;min-width:0;max-width:100%;animation:arabicPanelEnter .32s ease-out}.profileArabicPanelHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;padding:0 4px}.profileArabicPanelHeader small{font-size:10px;letter-spacing:.12em;font-weight:800;color:var(--theme-accent,#bb9355)}.profileArabicPanelHeader h3{margin:4px 0 0;font-size:19px;color:inherit}.profileArabicPanelHeader button{width:40px;height:40px;border:1px solid var(--line,#d5d9dc);background:var(--panel,#fff);color:inherit;border-radius:50%;cursor:pointer}.profileArabicPanelHeader button:focus-visible{outline:3px solid var(--theme-accent,#d5b677);outline-offset:3px}@keyframes arabicPanelEnter{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.profileArabicPanel{animation:none}}.profileInlineQuran{margin-top:16px;scroll-margin-top:80px;background:#fff;color:#111;border:1px solid #e6e6e6;border-radius:18px;overflow:hidden}.profileInlineQuranHeader{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border-bottom:1px solid #e7e7e7}.profileInlineQuranHeader strong{font-size:17px}.profileInlineQuranActions{display:flex;flex-wrap:wrap;gap:6px}.profileInlineQuranActions button,.profileInlineQuranActions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 10px;border:1px solid #ddd;border-radius:9px;background:#fff;color:#111;text-decoration:none;font-size:12px;font-weight:700;cursor:pointer}.profileInlineQuran iframe{display:block;width:100%;height:min(66vh,610px);min-height:360px;border:0;background:#fff}@media(max-width:450px){.profileInlineQuranHeader{align-items:flex-start}.profileInlineQuranActions{width:100%;justify-content:space-between}.profileInlineQuranActions button,.profileInlineQuranActions a{padding:8px 7px;font-size:11px}}.profilePostComposer{margin-top:16px;scroll-margin-top:80px;min-width:0;width:100%;overflow:hidden}.profilePostComposer :global(.omPostsRail){margin-top:14px}.profileAppLauncher{margin:16px 0;padding:18px 14px;background:transparent;color:inherit;border:0;border-radius:22px;box-shadow:none;backdrop-filter:none}.profileAppLauncherHeading{display:flex;align-items:center;justify-content:space-between;gap:10px}.profileAppLauncherHeading h2{margin:0;font-size:20px}.profileAppLauncherHeading button{border:1px solid #667085;border-radius:20px;background:rgba(255,255,255,.10);color:inherit;padding:7px 13px}.profileAppLauncherGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(9px,2vw,22px);margin-top:20px;padding:12px 5px 22px}.profileAppLauncherGrid :global(.profileAppTile){position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-width:0;aspect-ratio:1.08/1;padding:10px 4px 12px;box-sizing:border-box;text-decoration:none;color:#0b0c0f!important;border:1px solid #d9dce3;border-radius:clamp(18px,4vw,34px);background:linear-gradient(148deg,#fff 2%,#fafbfd 38%,#e9ebf0 100%);box-shadow:inset 0 2px 2px #ffffff,inset 0 -3px 6px #bfc4cf66,0 12px 18px #1d243024,0 3px 5px #1017221c;transition:transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s ease,border-color .28s ease;animation:none!important;overflow:hidden}.profileAppLauncherGrid :global(.profileAppTile)::before{content:"";position:absolute;inset:1px;border-radius:inherit;border:1px solid #ffffffc7;pointer-events:none}.profileAppLauncherGrid :global(.profileAppTile):hover{transform:translateY(-4px);box-shadow:inset 0 2px 2px #fff,0 18px 24px #1d243032,0 4px 8px #10172220}.profileAppLauncherGrid :global(.profileAppTile):active{transform:translateY(1px) scale(.97);box-shadow:inset 0 3px 9px #8c95a333,0 3px 6px #10172220}.profileAppLauncherGrid :global(.profileAppTile):focus-visible{outline:3px solid #456da8;outline-offset:3px}.profileAppLauncherGrid :global(.profileAppTileIcon){display:grid;place-items:center;width:100%;height:clamp(48px,8vw,100px);color:#101115;line-height:1;filter:none}.profileAppLauncherGrid :global(.profileAppTileIcon svg){width:clamp(44px,7.5vw,92px);height:clamp(44px,7.5vw,92px);overflow:visible}.profileAppLauncherGrid :global(.profileAppTileIcon .profilePrayerSujudIcon){width:clamp(44px,7.5vw,92px);height:clamp(44px,7.5vw,92px);object-fit:contain;display:block;filter:saturate(.72) contrast(1.06) drop-shadow(0 3px 2px rgba(20,24,30,.21));transform:scale(1.07);transform-origin:center}.profileAppLauncherGrid :global(.profileAppTileLabel){display:block;position:relative;z-index:1;text-align:center;line-height:1.1;font-size:clamp(12px,2.1vw,23px);font-weight:850;letter-spacing:-.035em;color:#0a0b0d;text-shadow:0 1px 0 #fff}.profileAppLauncherGrid :global(.profileAppBadge){position:absolute;z-index:4;top:8px;right:8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;display:grid;place-items:center;background:#d92d20;color:#fff;border:2px solid #fff;font-size:11px;font-weight:900;line-height:1;box-shadow:0 4px 11px #0003;animation:profileBadgePop .25s ease-out}.profileAppLauncherGrid :global(.profileAppBadge.isLive){background:#e11d48;box-shadow:0 0 0 4px #e11d4822,0 4px 11px #0003;animation:profileBadgeLive 1.8s ease-in-out infinite}@keyframes profileBadgePop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}@keyframes profileBadgeLive{50%{transform:scale(1.08);box-shadow:0 0 0 7px #e11d4812,0 4px 11px #0003}}.profileAppLauncherGrid.compact{display:flex;overflow-x:auto;gap:10px;padding:10px 4px 16px;scrollbar-width:none}.profileAppLauncherGrid.compact :global(.profileAppTile){flex:0 0 90px;width:90px;min-width:90px;aspect-ratio:1;padding:8px 3px}.profileAppLauncherGrid.compact :global(.profileAppTileIcon){height:45px}.profileAppLauncherGrid.compact :global(.profileAppTileIcon svg){width:43px;height:43px}.profileAppLauncherGrid.compact :global(.profileAppTileIcon .profilePrayerSujudIcon){width:43px;height:43px}.profileAppLauncherGrid.compact :global(.profileAppTileLabel){font-size:12px}.profileAppLauncherGrid:not(.compact){gap:10px;margin-top:10px;padding:7px 3px 16px}.profileAppLauncherGrid:not(.compact) :global(.profileAppTile){aspect-ratio:auto;min-height:105px;max-height:122px;border-radius:20px;padding:10px 3px;box-shadow:inset 0 2px 2px #fff,0 6px 13px #1d24301b}.profileAppLauncherGrid:not(.compact) :global(.profileAppTileIcon){height:42px}.profileAppLauncherGrid:not(.compact) :global(.profileAppTileIcon svg){width:40px;height:40px}.profileAppLauncherGrid:not(.compact) :global(.profileAppTileIcon .profilePrayerSujudIcon){width:40px;height:40px}.profileAppLauncherGrid:not(.compact) :global(.profileAppTileLabel){font-size:clamp(12px,2.7vw,15px);letter-spacing:-.02em}.profileAppLauncherGrid :global(.profileAppOpenCenter){display:none}@media(max-width:480px){.profileAppLauncherGrid{gap:10px;padding:9px 1px 18px}.profileAppLauncherGrid :global(.profileAppTile){border-radius:20px;padding:8px 2px}.profileAppLauncherGrid :global(.profileAppTileIcon){height:54px}.profileAppLauncherGrid :global(.profileAppTileIcon svg){width:50px;height:50px}.profileAppLauncherGrid :global(.profileAppTileIcon .profilePrayerSujudIcon){width:50px;height:50px}.profileAppLauncherGrid :global(.profileAppTileLabel){font-size:12px}}@media(prefers-reduced-motion:reduce){.profileAppLauncherGrid :global(.profileAppTile){transition:none!important;animation:none!important}}`}</style></section>
}

function ProfileCompactStats({userId,postCount,followers,following}:{userId:string;postCount:number|null;followers:number;following:number}){
 const [contributeHref,setContributeHref]=useState("/qibla/newsroom/apply");
 useEffect(()=>{let active=true;const db=createClient();void (async()=>{const {data:{user}}=await db.auth.getUser();if(!user||user.id!==userId)return;const [staff,superAdmin,legacyAdmin]=await Promise.all([db.from("qibla_staff").select("role").eq("user_id",user.id).maybeSingle(),db.rpc("qibla_is_superadmin"),db.rpc("qibla_is_admin")]);if(active)setContributeHref(staff.data?.role||superAdmin.data===true||legacyAdmin.data===true?"/qibla/studio":"/qibla/newsroom/apply")})();return()=>{active=false}},[userId]);
 const [counts,setCounts]=useState<{posts:number|null;videos:number|null;articles:number|null}>({posts:null,videos:null,articles:null});
 useEffect(()=>{let active=true;const db=createClient();void Promise.all([db.from("posts").select("*",{count:"exact",head:true}).eq("user_id",userId),db.from("post_media").select("*",{count:"exact",head:true}).eq("user_id",userId).like("mime_type","video/%"),db.from("newsletter_articles").select("*",{count:"exact",head:true}).eq("author_id",userId)]).then(([p,v,a])=>{if(active)setCounts({posts:p.error?null:p.count??0,videos:v.error?null:v.count??0,articles:a.error?null:a.count??0})});return()=>{active=false}},[userId]);
 return <div className="profileCompactStats" aria-label="Profile statistics">{([{label:"Followers",value:followers},{label:"Following",value:following},{label:"Posts",value:counts.posts??postCount},{label:"Videos",value:counts.videos},{label:"Articles",value:counts.articles}] as const).map(x=>x.label==="Articles"?<a key={x.label} href={contributeHref} aria-label="Open Qibla editorial contribution" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"inherit",textDecoration:"none",cursor:"pointer",borderRadius:12}}><strong>{x.value===null?"—":x.value.toLocaleString()}</strong><span>{x.label}</span></a>:x.label==="Followers"||x.label==="Following"?<Link key={x.label} href={`/profile?section=muslimeen&filter=${x.label.toLowerCase()}`} onClick={(event)=>{event.preventDefault();window.dispatchEvent(new CustomEvent("1muslim:open-members-filter",{detail:{filter:x.label.toLowerCase()}}));window.history.replaceState(null,"",`/profile?section=muslimeen&filter=${x.label.toLowerCase()}`)}} aria-label={`View ${x.label.toLowerCase()} on Muslims discovery`} className="profileStatShortcut" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"inherit",textDecoration:"none",cursor:"pointer",border:0,background:"transparent",font:"inherit",padding:"4px 0",minWidth:0}}><strong>{x.value===null?"—":x.value.toLocaleString()}</strong><span>{x.label}</span></Link>:<button type="button" key={x.label} className="profileStatShortcut" aria-label={`Open profile ${x.label.toLowerCase()}`} onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:profile-open-panel",{detail:{panel:x.label.toLowerCase()}}))}><strong>{x.value===null?"—":x.value.toLocaleString()}</strong><span>{x.label}</span></button>)}</div>;
}

function ProfileOrbitStudio({profile,onEdit,ashab,isOwner=true,viewerId,activeQuickPanel,onQuickPanel,showProfileDetails=true}:{profile:Profile;onEdit:()=>void;ashab:Profile[];isOwner?:boolean;viewerId?:string;editing?:boolean;editorTab?:string;activeQuickPanel?:"posts"|"videos"|"settings"|null;onQuickPanel?:(panel:"posts"|"videos"|"settings")=>void;showProfileDetails?:boolean}){
 const [section,setSection]=useState<"activity"|"connections"|"analytics">("activity");
 // Visitors land in the full cinematic profile first; the owner still controls when it opens.
 const [cinematicOpen,setCinematicOpen]=useState(!isOwner);
 useEffect(()=>{if(!isOwner)setCinematicOpen(true)},[isOwner,profile.id]);
 const [idHidden,setIdHidden]=useState(!!profile.hide_1muslim_id);
 const [idVisibilityError,setIdVisibilityError]=useState("");
 useEffect(()=>{
  let mounted=true;
  if(!isOwner){setIdHidden(!!profile.hide_1muslim_id);return}
  // Migrate the older device-only Hide setting to the account-level preference.
  const key="1muslim:owner-id-hidden:"+profile.id;
  let legacy=false;try{legacy=localStorage.getItem(key)==="1"}catch{}
  setIdHidden(!!profile.hide_1muslim_id||legacy);
  if(legacy&&!profile.hide_1muslim_id){
   void createClient().from("profiles").update({hide_1muslim_id:true}).eq("id",profile.id).then(({error})=>{
    if(!mounted)return;
    if(error)setIdVisibilityError("Could not sync hidden ID to your account. Try again in Settings.");
    else{try{localStorage.removeItem(key)}catch{}window.dispatchEvent(new CustomEvent("1muslim:member-id-visibility-changed",{detail:{memberId:profile.id,hidden:true}}))}
   });
  }
  return()=>{mounted=false};
 },[isOwner,profile.id]);
 const changeIdVisibility=async(hidden:boolean)=>{
  if(!isOwner)return;
  setIdHidden(hidden);setIdVisibilityError("");
  const {error}=await createClient().from("profiles").update({hide_1muslim_id:hidden}).eq("id",profile.id);
  if(error){
   setIdHidden(!hidden);
   setIdVisibilityError("Could not update your 1Muslim ID visibility. Please try again.");
   return;
  }
  try{localStorage.removeItem("1muslim:owner-id-hidden:"+profile.id)}catch{}
  window.dispatchEvent(new CustomEvent("1muslim:member-id-visibility-changed",{detail:{memberId:profile.id,hidden}}));
 };
 useEffect(()=>{
  if(!isOwner)return;
  const restore=()=>{void changeIdVisibility(false)};
  const toggle=(event:Event)=>{
   const hidden=(event as CustomEvent<{hidden?:boolean}>).detail?.hidden;
   if(typeof hidden==="boolean")void changeIdVisibility(hidden);
  };
  window.addEventListener("1muslim:show-profile-id",restore);
  window.addEventListener("1muslim:toggle-profile-id",toggle);
  return()=>{window.removeEventListener("1muslim:show-profile-id",restore);window.removeEventListener("1muslim:toggle-profile-id",toggle)};
 },[isOwner,profile.id]);
 const hideOwnerId=()=>{void changeIdVisibility(true)};
 const [followCounts,setFollowCounts]=useState({followers:0,following:0});
 useEffect(()=>{
  let live=true;
  const db=createClient();
  let revision=0;
  const load=async()=>{
   const request=++revision;
   const [a,b]=await Promise.all([db.from("profile_follows").select("follower_id",{count:"exact",head:true}).eq("following_id",profile.id),db.from("profile_follows").select("following_id",{count:"exact",head:true}).eq("follower_id",profile.id)]);
   if(live&&request===revision&&!a.error&&!b.error)setFollowCounts({followers:a.count||0,following:b.count||0});
  };
  const onFollow=(event:Event)=>{
   const detail=(event as CustomEvent<{memberId:string;viewerId:string;following:boolean}>).detail;
   if(!detail||typeof detail.following!=="boolean")return;
   revision++;
   const delta=detail.following?1:-1;
   if(detail.memberId===profile.id)setFollowCounts(current=>({...current,followers:Math.max(0,current.followers+delta)}));
   if(detail.viewerId===profile.id)setFollowCounts(current=>({...current,following:Math.max(0,current.following+delta)}));
  };
  void load();
  window.addEventListener("1muslim:follow-changed",onFollow);
  return()=>{live=false;revision++;window.removeEventListener("1muslim:follow-changed",onFollow)};
 },[profile.id]);
 const coverUrl=profileCoverImage(profile);
 const cinematicImage=profile.profile_main_image_url||((typeof profile.avatar_config?.profileMainUrl==="string")?profile.avatar_config.profileMainUrl:null)||coverUrl;
 const avatar=typeof profile.avatar_config?.selectedAvatarUrl==="string"?profile.avatar_config.selectedAvatarUrl:profile.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
 return <section className="profileProfessional memberAccentProfile" style={memberAccentStyle(profile.profile_accent)}>
  <header className="profileProfessionalCard profileProfessionalHeader">
   <div className="profileProfessionalCover" style={{backgroundImage:`url(${JSON.stringify(coverUrl)})`}} role="button" tabIndex={0} aria-label={`Open full cinematic profile for ${profile.display_name||"member"} by tapping the cover`} onClick={()=>setCinematicOpen(true)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setCinematicOpen(true)}}}><span className="profileCoverBrand">1Muslim</span></div>
   <div className="profileProfessionalIdentity">
    <img className="profileProfessionalAvatar" src={avatar} alt={isOwner?"Your profile avatar — tap to edit":`${publicMemberName(profile)} profile avatar`} role={isOwner?"button":undefined} tabIndex={isOwner?0:undefined} title={isOwner?"Change your avatar":undefined} style={isOwner?{cursor:"pointer"}:undefined} onClick={isOwner?()=>window.dispatchEvent(new CustomEvent("1muslim:edit-profile-tab",{detail:{tab:"avatar"}})):undefined} onKeyDown={isOwner?e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();window.dispatchEvent(new CustomEvent("1muslim:edit-profile-tab",{detail:{tab:"avatar"}}))}}:undefined}/>
    {isOwner&&<button className="profileProfessionalEdit" type="button" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:edit-profile-tab",{detail:{tab:"header"}}))} aria-label="Edit cover photo" title="Edit cover photo">✎</button>}
    {isOwner&&<ProfileNextPrayer initialLocation={{city:profile.city,state:profile.state,country:profile.country}}/>}
    <div className="profileIdentityNameRow">
     <h1>{profile.display_name||"1Muslim Member"}</h1>
     <div className="profileEngravedXP" aria-label={profile.xp_total.toLocaleString()+" experience points"}><strong>{profile.xp_total.toLocaleString()}</strong><small>XP</small></div>
    </div>
    {idVisibilityError&&<p role="alert" className="profileSettingsIdError">{idVisibilityError}</p>}
    {isOwner&&!idHidden&&<div className="profileOwnerId" aria-label="Your private profile ID badge">
     <span className="profileOwnerIdLabel">@{brandedHandle(profile.username)}</span>
     <button type="button" className="profileOwnerIdClose" onClick={hideOwnerId} aria-label="Hide my 1Muslim ID" title="Hide this ID from my profile">×</button>
    </div>}
    {(profile.bio?.trim()||isOwner)&&<p className="profileProfessionalBio">{profile.bio||"Add a bio to introduce yourself to the 1Muslim community."}</p>}
    {(profile.city||profile.state||profile.country)&&<p className="profileProfessionalLocation">📍 {[profile.city,profile.state,profile.country].filter(Boolean).join(", ")}</p>}
    <ProfileCompactStats userId={profile.id} postCount={null} followers={followCounts.followers} following={followCounts.following}/>
    
    {!isOwner&&viewerId&&<MemberFollowControl key={profile.id} viewerId={viewerId} memberId={profile.id}/>}
    
   </div>
  </header>
  {cinematicOpen&&<ProfileCinematicOverlay
    profile={{...profile,hide_1muslim_id:idHidden}} mainImage={cinematicImage} avatar={avatar} accent={memberAccent(profile.profile_accent)}
    followers={followCounts.followers} following={followCounts.following}
    isOwner={isOwner} onEdit={onEdit} onClose={()=>setCinematicOpen(false)}
    followAction={!isOwner&&viewerId?<MemberFollowControl viewerId={viewerId} memberId={profile.id}/>:undefined}
  />}
  {isOwner&&showProfileDetails&&<section className="profileProfessionalCard profileProfessionalQuickMenu" aria-label="Profile quick menu"><h2>My Profile</h2><div className="profileProfessionalQuickGrid"><button type="button" aria-pressed={activeQuickPanel==="posts"} onClick={()=>onQuickPanel?.("posts")}>▦ <span>Posts &amp; Likes</span><small>Posts, videos, likes &amp; saved</small></button><button type="button" aria-pressed={activeQuickPanel==="settings"} onClick={()=>onQuickPanel?.("settings")}>⚙ <span>Settings</span><small>Identity, avatar, appearance &amp; activity</small></button></div></section>}
  
 </section>;
}

function ProfileOverview({profile,tier,ashab,postCount,postText,setPostText,posting,publishFirstPost,onEdit,isOwner=true,viewerId}:{profile:Profile;tier:any;ashab:Profile[];postCount:number;postText:string;setPostText:(v:string)=>void;posting:boolean;publishFirstPost:()=>void;onEdit:()=>void;isOwner?:boolean;viewerId?:string}){
  useEffect(()=>{if(!isOwner)return;const root=document.documentElement;root.style.setProperty("--profile-dock-accent",memberAccent(profile.profile_accent));root.classList.add("profileDockThemed");return()=>{root.classList.remove("profileDockThemed");root.style.removeProperty("--profile-dock-accent")}},[profile.profile_accent,isOwner]);
  const [activeQuickPanel,setActiveQuickPanel]=useState<"posts"|"videos"|"settings"|null>(isOwner?null:"posts");
  useEffect(()=>{if(new URLSearchParams(window.location.search).get("panel")==="settings")setActiveQuickPanel("settings")},[]);
  const [showProfileDetails,setShowProfileDetails]=useState(false);
  // Passive icon spotlight only. It never changes tabs or the content currently open.
  const [profileSpotlight,setProfileSpotlight]=useState(0);
  useEffect(()=>{
   if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   const timer=window.setInterval(()=>setProfileSpotlight(index=>(index+1)%(isOwner?6:4)),3000);
   return()=>window.clearInterval(timer);
  },[isOwner]);
  const openProfilePanel=(panel:"posts"|"videos"|"settings")=>{
   setShowProfileDetails(true);
   setActiveQuickPanel(panel);
   window.setTimeout(()=>{
    if(panel==="settings"){
     const activity=document.getElementById("profile-activity-toggle") as HTMLDetailsElement|null;
     if(activity)activity.open=true;
    }
    document.getElementById("profile-panel-content")?.scrollIntoView({
     behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"
    });
   },90);
  };
  useEffect(()=>{
   const handle=(event:Event)=>{const panel=(event as CustomEvent<{panel:string}>).detail?.panel;if(panel==="posts"||panel==="videos"||panel==="settings")openProfilePanel(panel)};
   window.addEventListener("1muslim:profile-open-panel",handle);
   return()=>window.removeEventListener("1muslim:profile-open-panel",handle);
  },[]);
  const toggleQuickPanel=(panel:"posts"|"videos"|"settings")=>setActiveQuickPanel(current=>current===panel?null:panel);
  return <section className="profileOverview profileFullAccent" style={memberAccentStyle(profile.profile_accent)}>
    <style>{`
/* Personalized trim stays on the owner's profile; embedded posts and members retain their own colors. */
.profileFullAccent .profileAppLauncherGrid .profileAppTile{position:relative!important;isolation:isolate;overflow:hidden;border:1px solid color-mix(in srgb,var(--member-accent) 44%,#dce3ed)!important;background:radial-gradient(ellipse at 50% 18%,color-mix(in srgb,var(--member-accent) 6%,white),#fff 72%)!important;box-shadow:inset 0 1px #fff,0 8px 22px color-mix(in srgb,var(--member-accent) 12%,transparent)!important;transition:transform .2s ease,box-shadow .2s ease!important}
.profileFullAccent .profileAppLauncherGrid .profileAppTile::after{content:"";position:absolute;pointer-events:none;left:14%;right:14%;bottom:0;height:2px;border-radius:3px;background:linear-gradient(90deg,transparent,var(--member-accent),transparent);opacity:.65}
.profileFullAccent .profileAppLauncherGrid .profileAppTile .profileAppTileIcon{filter:drop-shadow(0 3px 5px color-mix(in srgb,var(--member-accent) 14%,transparent))}
.profileFullAccent .profileAppLauncherGrid .profileAppTile:active{transform:scale(.965)!important;box-shadow:inset 0 1px 8px color-mix(in srgb,var(--member-accent) 9%,transparent),0 2px 8px var(--profile-glow)!important}
@media(hover:hover){.profileFullAccent .profileAppLauncherGrid .profileAppTile:hover{transform:translateY(-2px);box-shadow:0 12px 26px color-mix(in srgb,var(--member-accent) 16%,transparent)!important}}
@media(prefers-reduced-motion:reduce){.profileFullAccent .profileAppLauncherGrid .profileAppTile{transition:none!important}.profileFullAccent .profileAppLauncherGrid .profileAppTile:hover,.profileFullAccent .profileAppLauncherGrid .profileAppTile:active{transform:none!important}}
.profileFullAccent{--profile-trim:color-mix(in srgb,var(--member-accent) 55%,#d8e1eb);--profile-glow:color-mix(in srgb,var(--member-accent) 10%,transparent)}
.profileFullAccent .profilePremiumTabs{border:1px solid var(--profile-trim)!important;box-shadow:0 6px 20px var(--profile-glow)!important;background:color-mix(in srgb,var(--member-accent) 3%,white)!important}
.profileFullAccent .profilePremiumTabs button{border-color:var(--profile-trim)!important}
.profileFullAccent .profilePremiumTabs button[aria-pressed="true"]{box-shadow:inset 0 -2px var(--member-accent)!important}
.profileFullAccent .profileAppLauncherHeading{border-bottom:1px solid var(--profile-trim)!important;padding-bottom:12px!important}
.profileFullAccent .profileAppLauncherHeading h2{color:var(--member-text)!important}
.profileFullAccent .profileLauncherToggle{border-color:var(--profile-trim)!important;box-shadow:0 3px 12px var(--profile-glow)!important}
.profileFullAccent .profileAppTile{border-color:var(--profile-trim)!important;box-shadow:0 6px 18px var(--profile-glow)!important;background:color-mix(in srgb,var(--member-accent) 2%,white)!important}
.profileFullAccent .profileAppTile:focus-visible{outline:2px solid var(--member-accent);outline-offset:3px}
.profileFullAccent>.profileOverviewSection,.profileFullAccent>.profileProfessionalWorkspace,.profileFullAccent>.profileElmTentAlphabet{border-top:2px solid var(--profile-trim)!important;box-shadow:0 7px 24px var(--profile-glow)!important}
.profileFullAccent .profileSettingsHeader{border-bottom:1px solid var(--profile-trim)!important}
.profileFullAccent :is(.profileCinematicPosts,.profileQiblaCarousel,.profileDeepWatchCarousel){border-top:1px solid var(--profile-trim)!important}
.profileFullAccent :is(.profileCinematicPosts,.profileQiblaCarousel,.profileDeepWatchCarousel) :is(h2,h3){text-decoration-color:var(--member-accent)}
.profileFullAccent :is(.profileCinematicPosts,.profileQiblaCarousel,.profileDeepWatchCarousel) button[aria-label*="Previous"],.profileFullAccent :is(.profileCinematicPosts,.profileQiblaCarousel,.profileDeepWatchCarousel) button[aria-label*="Next"]{border-color:var(--profile-trim)!important;box-shadow:0 3px 12px var(--profile-glow)!important}
.profileFullAccent :is(.profileCinematicPosts,.profileQiblaCarousel,.profileDeepWatchCarousel) article{border-color:var(--profile-trim)!important;box-shadow:0 6px 18px var(--profile-glow)!important}
@media(prefers-reduced-motion:reduce){.profileFullAccent .profileAppTile{transition:none!important}}
`}</style>
    <ProfileOrbitStudio profile={profile} onEdit={onEdit} ashab={ashab} isOwner={isOwner} viewerId={viewerId} activeQuickPanel={activeQuickPanel} onQuickPanel={toggleQuickPanel} showProfileDetails={showProfileDetails}/>
    <div className="profileCommandBar profileCompactIconMenu" aria-label="Profile controls">
     <div className="profileSocialActions" aria-label="Profile actions">
      {isOwner?<button type="button" className="profileAction profileSocialPrimary" data-spotlight={profileSpotlight===0} onClick={onEdit} aria-label="Edit profile"><ProfileControlGlyph kind="edit"/><span className="profileActionLabel"><span className="profileActionLabelFull">Edit profile</span><span className="profileActionLabelShort">Edit</span></span></button>:<Link className="profileAction profileSocialPrimary" data-spotlight={profileSpotlight===0} href={"/messages?to="+encodeURIComponent(profile.id)+"&from=profile"} aria-label="Message member"><ProfileControlGlyph kind="message"/><span className="profileActionLabel">Message</span></Link>}
      <button type="button" className="profileAction" data-spotlight={profileSpotlight===1} aria-label="Share profile" onClick={async()=>{const url=window.location.origin+"/profile/"+encodeURIComponent(profile.id);if(navigator.share){try{await navigator.share({title:profile.display_name||"1Muslim profile",url})}catch{}}else{try{await navigator.clipboard.writeText(url);window.alert("Profile link copied")}catch{window.prompt("Copy profile link",url)}}}}><svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.2 19C13.2 18 15.5 11 20 5"/><path d="M13.1 4.8H20v7"/></svg><span className="profileActionLabel">Share</span></button>
      {isOwner&&<button type="button" className="profileAction" data-spotlight={profileSpotlight===2} aria-label="Open profile insights" onClick={()=>window.dispatchEvent(new Event("1muslim:open-profile-analytics"))}><ProfileControlGlyph kind="insights"/><span className="profileActionLabel">Insights</span></button>}
      {isOwner&&<button type="button" className="profileAction" data-spotlight={profileSpotlight===3} aria-label="Open profile settings" title="Settings" onClick={()=>openProfilePanel("settings")} aria-pressed={activeQuickPanel==="settings"}><ProfileControlGlyph kind="settings"/><span className="profileActionLabel">Settings</span></button>}
     </div>
     <nav className="profilePremiumTabs" aria-label="Profile content">
      <button type="button" className="profileTabAction" data-spotlight={profileSpotlight===(isOwner?4:2)} aria-label="Show profile posts" title="Posts" aria-pressed={activeQuickPanel==="posts"} onClick={()=>openProfilePanel("posts")}><ProfileControlGlyph kind="posts"/><span className="profileActionLabel">Posts</span></button>
      <button type="button" className="profileTabAction" data-spotlight={profileSpotlight===(isOwner?5:3)} aria-label="Show profile videos" title="Videos" aria-pressed={activeQuickPanel==="videos"} onClick={()=>openProfilePanel("videos")}><ProfileControlGlyph kind="videos"/><span className="profileActionLabel">Videos</span></button>
     </nav>
    </div>
    <ProfilePagePosts profileId={profile.id} isOwner={isOwner}/>
    <RecentMuslimDiscovery excludeId={isOwner?profile.id:undefined}/>
    {showProfileDetails&&<div id="profile-details" aria-label="Profile details"/>}

    <div className="profileLegacyOverview" hidden>
    <header className={"profileOverviewHero header-"+profile.profile_accent}>
      <div className="profileOverviewCover"><div className="backPagesBrand">1Muslim</div><div className="profileOverviewActions"><button type="button" className="profileSignOut" aria-label="Sign out" onClick={()=>window.dispatchEvent(new Event("1muslim:profile-signout"))}>↪</button><Link href="/find" className="ghost">⌕ Discover</Link><button className="primary" onClick={onEdit}>✎ Edit</button></div></div>
      <div className="profileOverviewBody">
        <div className="profileOverviewMain"><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p className="profileHandle">{publicMemberId(profile)?publicMemberId(profile)+" · ":""}{tier.name} · {profile.xp_total.toLocaleString()} XP</p><p className="profileBio">{profile.bio||"Your profile is your space. Add a short bio so the community can get to know you."}</p>
          <FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at}/><Link href="/arabic-badges" className="ghost" style={{display:"inline-flex",marginTop:10}}>🔤 Arabic Badge Program →</Link><div className="profileChips">{profile.city&&<span>📍 {profile.city}{profile.state?", "+profile.state:""}</span>}<span>⭐ {profile.xp_total.toLocaleString()} XP</span>{profile.shahada_verified_at&&<span>✓ Shahadah verified</span>}</div>
        </div></div>
      <div className="profileOverviewStats"><div><b>{postCount}</b><span>Posts</span></div><div><b>{profile.xp_total.toLocaleString()}</b><span>XP</span></div><div><b>{profile.community?"1":"0"}</b><span>Community</span></div></div>
    </header>
    </div>
    {activeQuickPanel==="posts"&&<section id="profile-panel-content" className="profileOverviewSection profileLibraryWrapper">
      {isOwner&&!postCount&&<ProfileFirstPostPrompt userId={profile.id} text={postText} onTextChange={setPostText} posting={posting} onPublish={publishFirstPost}/>}
      <ProfileContentSections userId={profile.id} initialTab="posts"/>
    </section>}
    {activeQuickPanel==="videos"&&<section id="profile-panel-content" className="profileOverviewSection profileLibraryWrapper" aria-label="Your videos"><ProfileContentSections userId={profile.id} initialTab="videos"/></section>}
    {isOwner&&activeQuickPanel==="settings"&&<section id="profile-panel-content" className="profileProfessionalCard profileProfessionalWorkspace profileCompactSettings" aria-label="Profile settings"><div className="profileSettingsHeader"><div><span className="profileSettingsEyebrow">YOUR PROFILE</span><h2>Settings</h2><p>Manage your identity, avatar and appearance.</p></div><button type="button" className="profileSettingsEdit" onClick={onEdit} aria-label="Edit profile" title="Edit profile">✎ <span>Edit</span></button></div><button type="button" className="profileSettingsRestoreId" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:toggle-profile-id",{detail:{hidden:!profile.hide_1muslim_id}}))} aria-pressed={!profile.hide_1muslim_id}>{profile.hide_1muslim_id?"↺ Show my 1Muslim ID publicly":"⊘ Hide my 1Muslim ID everywhere"}</button><details id="profile-activity-toggle" className="profileSettingsActivity" open><summary><span>Your Activity</span><small>Screen time, page visits &amp; insights</small><span className="profileActivityChevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary><ProfileAnalytics inline userId={profile.id}/></details></section>}
    <ProfileAppLauncher onProfile={()=>setActiveQuickPanel(null)} coverUrl={profileCoverImage(profile)} prayerIconSrc={(() => {
      // Gender is the member's chosen profile setting, never inferred from their photograph.
      const genders=[profile.avatar_gender,profile.gender,profile.avatar_config?.gender].map(v=>typeof v==="string"?v.toLowerCase():"");
      if(!genders.some(v=>v==="female"||v==="woman"||v==="sister"))return "/assets/sujud.PNG";
      if(profile.profile_accent==="blue")return "/assets/prayer-sujud-women-blue.webp";
      if(profile.profile_accent==="emerald")return "/assets/prayer-sujud-women-emerald.webp";
      return "/assets/prayer-sujud-women-platinum.webp";
    })()}/>
    <ProfileCinematicPosts profileId={profile.id} variant="recentCards" feedMode="community" limit={4}/>
    <ProfileQiblaCarousel/>
    <ProfileDeepWatchCarousel/>
    
    <style jsx>{`.profileSocialActions{display:grid;grid-template-columns:1.3fr repeat(3,minmax(0,1fr));gap:8px;margin:0}.profileSocialActions button,.profileSocialActions a{display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;min-width:0;min-height:44px;padding:9px 7px;border-radius:13px;border:1px solid #dae2e9;background:#f9fbfc;color:#213b47;font-size:12px;font-weight:780;cursor:pointer;white-space:nowrap;transition:transform .2s ease,background .2s ease}.profileSocialActions .profileSocialPrimary{background:#163e36;color:#fff;border-color:#163e36;box-shadow:0 4px 13px #164b3729}.profileSocialActions button:active,.profileSocialActions a:active{transform:scale(.97)}.profileSocialActions button:focus-visible,.profileSocialDiscoveryShortcut a:focus-visible{outline:3px solid #4c8edb;outline-offset:3px}.profileSocialDiscoveryShortcut,.profileContentIntroduction{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;margin:12px 0;border:1px solid #e4e9e7;border-radius:16px;background:linear-gradient(125deg,#fff,#f9fbfa);color:#172d35}.profileSocialDiscoveryShortcut strong,.profileContentIntroduction strong{font-size:14px;letter-spacing:-.02em}.profileSocialDiscoveryShortcut p,.profileContentIntroduction p{font-size:11px;color:#6b7c83;margin:2px 0 0}.profileSocialDiscoveryShortcut a,.profileContentIntroduction button{flex-shrink:0;border:1px solid #dce9e2;border-radius:999px;padding:9px 12px;background:#edf6f0;color:#18543d;text-decoration:none;font-weight:800;font-size:11px;cursor:pointer}.profileFullAccent .profilePremiumTabs{border-color:#e5e8ed!important;box-shadow:none!important;background:#fff!important}.profileFullAccent .profilePremiumTabs button{border-color:transparent!important}.profileFullAccent .profileAppLauncher{margin-top:18px!important}.profileCommandBar{display:grid;gap:9px;margin:9px 0 11px;padding:12px;border-radius:18px;border:1px solid #e1e8e8;background:#fff;box-shadow:0 5px 17px #1b3d3620}.profileFullAccent .profileCommandBar .profilePremiumTabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.profileFullAccent .profileCommandBar .profilePremiumTabs button{background:#f5f8f7!important;border:1px solid #e1e8e5!important;border-radius:11px!important;min-height:42px!important;color:#435765!important;font-size:13px!important;font-weight:800!important}.profileFullAccent .profileCommandBar .profilePremiumTabs button[aria-pressed="true"]{background:#e7f3eb!important;color:#16533d!important;border-color:color-mix(in srgb,var(--member-accent) 45%,#bed1c4)!important;box-shadow:inset 0 -2px var(--member-accent)!important}.profileSocialActions button[aria-pressed="true"]{background:#e4f2eb;color:#155039;border-color:#9cc1af}.profileSocialActions button>span,.profileSocialActions a>span{font-size:17px}.profileDiscoveryGlyph{height:36px;width:36px;display:grid;place-items:center;flex:0 0 36px;border-radius:12px;background:#e9f2ea;color:#185f49;font-size:25px}.profileSocialDiscoveryShortcut>div{flex:1;min-width:0}@media(max-width:420px){.profileSocialActions{gap:5px}.profileSocialActions button,.profileSocialActions a{font-size:10px;padding:8px 3px;gap:3px}.profileSocialActions button>span,.profileSocialActions a>span{font-size:15px}.profileCommandBar{padding:9px}.profileSocialDiscoveryShortcut,.profileContentIntroduction{padding:10px 12px}.profileSocialDiscoveryShortcut a,.profileContentIntroduction button{font-size:11px;padding:9px 8px}}@media(prefers-reduced-motion:reduce){.profileSocialActions button{transition:none}}`}</style>
    <style jsx>{`.profileCompactSettings{padding:16px!important;margin-top:12px!important}.profileSettingsHeader{display:flex;align-items:center;justify-content:space-between;gap:12px}.profileSettingsHeader h2{font-size:21px;margin:3px 0;color:#19395f}.profileSettingsHeader p{font-size:12px;margin:0;color:#66788f}.profileSettingsEyebrow{font-size:10px;letter-spacing:.14em;color:#6380a2;font-weight:800}.profileSettingsEdit{display:flex;align-items:center;gap:6px;padding:9px 13px;border-radius:999px;border:1px solid #d5dfec;background:#f6f9fc;color:#244c76;font-weight:750;font-size:12px;white-space:nowrap}.profileSettingsActivity{margin-top:14px;border-top:1px solid #e4eaf2;padding-top:12px}.profileSettingsActivity summary{cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;color:#234a70;font-weight:750;font-size:13px;list-style:none}.profileSettingsActivity summary::-webkit-details-marker{display:none}.profileSettingsActivity summary:after{content:"⌄";font-size:19px}.profileSettingsActivity[open] summary:after{content:"⌃"}.profileSettingsActivity summary small{font-size:10px;font-weight:500;color:#70839b;text-align:right}.profileSettingsActivity[open] summary{margin-bottom:12px}.backPagesBrand{position:absolute;top:18px;left:0;right:0;text-align:center;font-size:25px;font-weight:800;letter-spacing:-.04em;color:var(--gold);pointer-events:none}.profileOverviewActions{top:76px!important;left:18px!important;right:18px!important;justify-content:center!important}.profileOverviewActions button,.profileOverviewActions a{border-radius:999px!important;min-height:40px!important;padding:9px 16px!important;font-size:12px!important;font-weight:650!important;box-shadow:none!important;background:color-mix(in srgb,var(--panel) 80%,transparent)!important;border:1px solid var(--line)!important;color:var(--text)!important;transition:transform .2s ease,background .2s ease!important}.profileOverviewActions button:active,.profileOverviewActions a:active{transform:scale(.97)}.profileOverviewActions .ghost{display:inline-flex!important;align-items:center!important}.profileSignOut{min-width:44px!important}.profileOverviewCover{height:150px!important;background:linear-gradient(135deg,var(--panel2),var(--panel))!important}@media(max-width:700px){.profileOverviewActions{gap:8px!important}.profileOverviewActions button,.profileOverviewActions a{padding:9px 13px!important}.backPagesBrand{font-size:23px}}`}</style><style jsx>{`.profileOverview{max-width:1120px;margin:0 auto;padding:24px 18px 80px}.profileOverviewHero{overflow:hidden;border:1px solid var(--line);border-radius:28px;background:var(--panel);box-shadow:var(--shadow)}.profileOverviewCover{height:185px;position:relative;background:linear-gradient(135deg,#102218,#0b130e)}.profileOverviewCover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(214,231,184,.18),transparent 30%)}.profileOverviewActions{position:absolute;right:18px;top:18px;z-index:2;display:flex;gap:8px}.profileOverviewActions button,.profileOverviewActions a{backdrop-filter:blur(12px)}.profileSignOut{background:linear-gradient(120deg,#123b57,#142339)!important;border:1px solid #80e6ff!important;color:#fff!important;box-shadow:0 0 16px #65caff55;font-weight:800;cursor:pointer}.profileOverviewBody{padding:0 30px 10px;position:relative}.profileOverviewAvatar{margin-top:-76px;position:relative;z-index:3;width:150px}.profileOverviewMain{margin-top:15px}.profileOverviewMain h1{font-size:44px;letter-spacing:-.06em;margin:6px 0 2px}.profileHandle{color:var(--muted);font-size:12px;margin:0}.profileBio{max-width:680px;color:#aab5ae;line-height:1.65;font-size:14px;margin:14px 0 0}.profileChips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.profileChips span{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 10px;color:var(--muted);font-size:10px;font-weight:800}.profileOverviewStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 30px 28px}.profileOverviewStats>div{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:14px}.profileOverviewStats b{display:block;font-size:23px}.profileOverviewStats span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:3px}.profileOverviewSection{margin-top:18px;border:1px solid var(--line);background:var(--panel);border-radius:24px;padding:24px}.sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.sectionHeading h2{margin:6px 0 2px;font-size:24px;letter-spacing:-.04em}.sectionHeading p{margin:0;color:var(--muted);font-size:11px}.carouselHint{color:#6f7d75;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.ashabCarousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;scrollbar-width:none}.ashabCarousel::-webkit-scrollbar{display:none}.ashabCard{flex:0 0 175px;scroll-snap-align:start;text-align:left;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:18px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;transition:.18s}.ashabCard:hover{transform:translateY(-2px);border-color:#52664f}.ashabCard strong{font-size:13px;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ashabCard small{font-size:10px;color:var(--muted)}.ashabCard em{font-style:normal;font-size:8px;font-weight:900;letter-spacing:.12em;color:var(--gold);margin-top:4px}.ashabEmpty{min-width:100%;box-sizing:border-box;border:1px dashed #354239;border-radius:18px;padding:20px;display:flex;align-items:center;gap:14px}.ashabEmptyIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#1a241b;color:var(--gold)}.ashabEmpty h3{margin:0 0 4px;font-size:15px}.ashabEmpty p{margin:0;color:var(--muted);font-size:11px}.ashabEmpty .ghost{margin-left:auto;white-space:nowrap}@media(max-width:700px){.profileOverview{padding:12px 12px 70px}.profileOverviewCover{height:150px}.profileOverviewBody{padding:0 18px 8px}.profileOverviewAvatar{width:120px;margin-top:-60px}.profileOverviewMain h1{font-size:34px}.profileOverviewActions .ghost{display:none}.profileOverviewActions button{padding:9px 12px}.profileOverviewStats{padding:16px 18px 20px}.profileOverviewSection{padding:18px}.ashabCard{flex-basis:160px}.ashabEmpty{display:grid}.ashabEmpty .ghost{margin:0;width:100%;text-align:center}}`}</style>
  </section>
}

function MemberFollowControl({viewerId,memberId}:{viewerId:string;memberId:string}){
 const [following,setFollowing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  let live=true;setLoading(true);setError("");setFollowing(false);
  const db=createClient();
  void db.from("profile_follows").select("follower_id").eq("follower_id",viewerId).eq("following_id",memberId).maybeSingle()
   .then(({data,error})=>{if(!live)return;if(error)setError("Unable to check follow status.");else setFollowing(!!data);setLoading(false)});
  return()=>{live=false};
 },[viewerId,memberId]);
 // Both the normal profile and full-screen view share the same follow state.
 useEffect(()=>{
  const sync=(event:Event)=>{
   const detail=(event as CustomEvent<{memberId:string;viewerId:string;following:boolean}>).detail;
   if(detail?.memberId===memberId&&detail.viewerId===viewerId)setFollowing(!!detail.following);
  };
  window.addEventListener("1muslim:follow-changed",sync);
  return()=>window.removeEventListener("1muslim:follow-changed",sync);
 },[viewerId,memberId]);
 const toggle=async()=>{
  if(saving||loading||viewerId===memberId)return;
  setSaving(true);setError("");
  const db=createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||user?.id!==viewerId){setError("Sign in to follow members.");setSaving(false);return}
  const result=following
   ?await db.from("profile_follows").delete().eq("follower_id",viewerId).eq("following_id",memberId)
   :await db.from("profile_follows").insert({follower_id:viewerId,following_id:memberId});
  if(result.error&&result.error.code!=="23505"){console.error("Profile follow request failed",result.error);setError(`Could not update your follow (${result.error.code||"unknown"}). Please try again.`)}
  else{const nextFollowing=!following;setFollowing(nextFollowing);window.dispatchEvent(new CustomEvent("1muslim:follow-changed",{detail:{memberId,viewerId,following:nextFollowing}}))}
  setSaving(false);
 };
 if(viewerId===memberId)return null;
 return <div className="profileMemberFollowWrap"><button type="button" className={"profileMemberFollowButton"+(following?" isFollowing":"")} disabled={loading||saving} aria-pressed={following} onClick={()=>void toggle()}>{loading?"Checking…":saving?"Saving…":following?"✓ Following":"+ Follow"}</button>{error&&<span role="alert" className="profileMemberFollowError">{error}</span>}
 <style>{`.profileMemberFollowWrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}.profileMemberFollowButton{min-width:128px;padding:12px 19px;border:1px solid #285d99;border-radius:14px;background:#285d99;color:white;font-size:15px;font-weight:750;cursor:pointer}.profileMemberFollowButton.isFollowing{background:white;color:#285d99}.profileMemberFollowButton:disabled{opacity:.55;cursor:wait}.profileMemberFollowError{color:#9b3333;font-size:12px}`}</style></div>;
}

function ProfileSocialHub({profile,children}:{profile:Profile;children:React.ReactNode}){
 const [active,setActive]=useState<"feed"|"profile"|"muslimeen">("profile");
 useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get("section")==="muslimeen"){setActive("muslimeen");const filter=params.get("filter");if(filter==="following"||filter==="followers")setMemberFilter(filter)}},[]);
 const [arabic,setArabic]=useState<string|null>(null);
 const [messenger,setMessenger]=useState(false);
 const [feed,setFeed]=useState<Array<{id:string;body:string|null;created_at:string;user_id:string}>>([]);
 const [members,setMembers]=useState<Profile[]>([]);
 const [discoveryFilter,setDiscoveryFilter]=useState<"all"|"brothers"|"sisters"|"regions"|"top"|"recent">("all");
 const [selectedRegion,setSelectedRegion]=useState("");
 const [selectedState,setSelectedState]=useState("");
 const [memberFilter,setMemberFilter]=useState<"all"|"following"|"followers">("all");
 useEffect(()=>{const open=(event:Event)=>{const filter=(event as CustomEvent<{filter:string}>).detail?.filter;if(filter!=="following"&&filter!=="followers")return;setSelected(null);setMemberFilter(filter);setDiscoveryFilter("all");setSearch("");setMemberPage(0);setActive("muslimeen");window.scrollTo({top:0,behavior:"smooth"})};window.addEventListener("1muslim:open-members-filter",open);return()=>window.removeEventListener("1muslim:open-members-filter",open)},[]);
 const [connections,setConnections]=useState<{following:Set<string>;followers:Set<string>}>({following:new Set(),followers:new Set()});
 const [memberLoading,setMemberLoading]=useState(true);
 const [memberError,setMemberError]=useState("");
 const [memberPage,setMemberPage]=useState(0);
 const [loadedPage,setLoadedPage]=useState(0);
 const [hasMoreMembers,setHasMoreMembers]=useState(true);
 const [sortMembers,setSortMembers]=useState<"recent"|"name">("recent");
 const [loadingMore,setLoadingMore]=useState(false);
 const [,setMemberSection]=useState<"posts"|"clips"|"about"|"journey">("posts");
 const directoryPosition=useRef(0);
 const [search,setSearch]=useState("");
 useEffect(()=>{try{const saved=sessionStorage.getItem("muslimeen-discovery-preferences");if(!saved)return;const prefs=JSON.parse(saved);if(["all","brothers","sisters","regions","top","recent"].includes(prefs.filter))setDiscoveryFilter(prefs.filter);if(["recent","name"].includes(prefs.sort))setSortMembers(prefs.sort);if(typeof prefs.region==="string")setSelectedRegion(prefs.region)}catch{}},[]);
 useEffect(()=>{try{sessionStorage.setItem("muslimeen-discovery-preferences",JSON.stringify({filter:discoveryFilter,sort:sortMembers,region:selectedRegion}))}catch{}},[discoveryFilter,sortMembers,selectedRegion]);
 const [selected,setSelected]=useState<string|null>(null);
 // Same-page directory navigation cannot rely on Next Link alone: the profile
 // stays mounted while only its search params change. Keep UI + history in sync.
 useEffect(()=>{
  const resolve=()=>{const params=new URLSearchParams(window.location.search);const id=params.get("member");
   if(params.get("section")==="muslimeen"){setActive("muslimeen");setSelected(id&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)?id:null)}
   else{setActive("profile");setSelected(null)}
  };
  const navigate=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;
   const next=id?"/profile?section=muslimeen&member="+encodeURIComponent(id):"/profile?section=muslimeen";
   window.history.pushState(null,"",next);
   setMemberFilter("all");setSelected(id||null);setActive("muslimeen");window.scrollTo({top:0,behavior:"smooth"});
  };
  window.addEventListener("1muslim:discover-muslims",navigate);window.addEventListener("popstate",resolve);
  return()=>{window.removeEventListener("1muslim:discover-muslims",navigate);window.removeEventListener("popstate",resolve)};
 },[]);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const member=params.get("member");if(member&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(member)){setActive("muslimeen");setSelected(member)}},[]);
 const [memberProfile,setMemberProfile]=useState<Profile|null>(null);
 const [memberProfileError,setMemberProfileError]=useState(false);
 const positions=useRef<Record<string,number>>({});
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{let live=true;const client=createClient();setMemberLoading(true);setMemberError("");setLoadedPage(0);setHasMoreMembers(true);
  const query=client.from("profiles").select("*").order(sortMembers==="recent"?"created_at":"display_name",{ascending:sortMembers==="name"}).range(0,49);
  void query.then(({data,error})=>{if(!live)return;if(error)setMemberError("Could not load members. Please try again.");else{setMembers((data||[]).filter(m=>m.id!==profile.id) as Profile[]);setHasMoreMembers((data||[]).length===50)}setMemberLoading(false)});
  const loadConnections=()=>{void Promise.all([client.from("profile_follows").select("following_id").eq("follower_id",profile.id),client.from("profile_follows").select("follower_id").eq("following_id",profile.id)]).then(([a,b])=>{if(live)setConnections({following:new Set((a.data||[]).map(x=>x.following_id)),followers:new Set((b.data||[]).map(x=>x.follower_id))})})};
  loadConnections();window.addEventListener("1muslim:follow-changed",loadConnections);return()=>{live=false;window.removeEventListener("1muslim:follow-changed",loadConnections)};
 },[profile.id,sortMembers]);
 const loadMoreMembers=async()=>{if(loadingMore||!hasMoreMembers)return;setLoadingMore(true);const next=loadedPage+1;const {data,error}=await createClient().from("profiles").select("*").order(sortMembers==="recent"?"created_at":"display_name",{ascending:sortMembers==="name"}).range(next*50,next*50+49);if(error)setMemberError("Could not load more members.");else{setMembers(old=>{const ids=new Set(old.map(m=>m.id));return [...old,...((data||[]) as Profile[]).filter(m=>m.id!==profile.id&&!ids.has(m.id))]});setLoadedPage(next);setHasMoreMembers((data||[]).length===50)}setLoadingMore(false)};
 useEffect(()=>{let live=true;if(!selected){setMemberProfile(null);return;}setMemberProfile(null);setMemberProfileError(false);setMemberSection("posts");void createClient().from("profiles").select("*").eq("id",selected).single().then(({data,error})=>{if(live){setMemberProfile(data as Profile|null);setMemberProfileError(Boolean(error||!data))}});return()=>{live=false}},[selected]);
 const [debouncedSearch,setDebouncedSearch]=useState("");
 useEffect(()=>{const timer=setTimeout(()=>{setDebouncedSearch(search.trim().toLowerCase());setMemberPage(0)},220);return()=>clearTimeout(timer)},[search]);

 const [spotlightPick,setSpotlightPick]=useState(0);
 useEffect(()=>{setSpotlightPick(Math.floor(Math.random()*6))},[]);
 const regionRailMembers=useMemo(()=>members.filter(m=>(!selectedRegion||canonicalCountry(m.country)===canonicalCountry(selectedRegion))&&(!selectedState||canonicalUsState(m.state).toLowerCase()===selectedState.toLowerCase())),[members,selectedRegion,selectedState]);
 const newestMembers=useMemo(()=>[...regionRailMembers].sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))),[regionRailMembers]);
 const featuredMembers=useMemo(()=>[...regionRailMembers].filter(m=>(m.xp_total||0)>0).sort((a,b)=>(b.xp_total||0)-(a.xp_total||0)).slice(0,8),[regionRailMembers]);
 const visibleMembers=useMemo(()=>{const result=(discoveryFilter==="regions"&&profile?[profile,...members]:members).filter(m=>(memberFilter==="all"||(memberFilter==="following"?connections.following:connections.followers).has(m.id))&&((m.display_name||"")+" "+(m.hide_1muslim_id?"":m.username||"")).toLowerCase().includes(debouncedSearch)&&(discoveryFilter!=="brothers"||m.gender==="male")&&(discoveryFilter!=="sisters"||m.gender==="female")&&(!selectedRegion||canonicalCountry(m.country)===canonicalCountry(selectedRegion))&&(!selectedState||canonicalUsState(m.state).toLowerCase()===selectedState.toLowerCase()));return discoveryFilter==="top"?[...result].sort((a,b)=>(b.xp_total||0)-(a.xp_total||0)):discoveryFilter==="recent"?[...result].sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))):result},[members,memberFilter,connections,debouncedSearch,discoveryFilter,selectedRegion,selectedState]);
 const selectedIndex=selectedRegion||selectedState?-1:visibleMembers.findIndex(m=>m.id===selected);
 const moveMember=(direction:number)=>{const next=visibleMembers[selectedIndex+direction];if(next)setSelected(next.id)};
 const openMember=(id:string)=>{directoryPosition.current=window.scrollY;setSelected(id);window.scrollTo({top:0,behavior:"smooth"})};
 const closeMember=()=>{setSelected(null);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:directoryPosition.current,behavior:"instant"})))};
 useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current)},[]);
 const switchTab=(next:typeof active)=>{positions.current[active]=window.scrollY;setActive(next);setSelected(null);setArabic(next);if(timeout.current)clearTimeout(timeout.current);timeout.current=setTimeout(()=>setArabic(null),1000);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:positions.current[next]||0,behavior:"instant"})));};
 const names:{id:typeof active;en:string;ar:string}[]=[{id:"feed",en:"Feed",ar:"الأمة"},{id:"profile",en:"My Profile",ar:"ملفي الشخصي"},{id:"muslimeen",en:"1Muslimeen",ar:"المسلمون"}];
 return <div className={"profileSocialHub profileSocial-"+active}>
  <nav className="profileSocialTop" aria-label="Social profile navigation"><Link href="/" className="profileSocialHome" aria-label="Go to 1Muslim Home" title="Home"><ProfileNavIcon kind="home"/></Link><div className="profileSocialTabs">{names.map(n=><button type="button" key={n.id} aria-label={n.en} title={n.en} aria-current={active===n.id?"page":undefined} onClick={()=>switchTab(n.id)}><ProfileNavIcon kind={n.id==="muslimeen"?"community":n.id}/></button>)}</div><button type="button" className="profileMessengerTrigger" aria-label="Open Messenger" onClick={()=>setMessenger(true)}><ProfileNavIcon kind="messages"/><span>Messenger</span></button></nav>
  <div hidden={active!=="profile"}>{children}</div>
  <section hidden={active!=="feed"} className="profileSocialFeedFrame" aria-label="The Ummah Feed"><iframe title="1Muslim Posts — The Ummah Feed" src="/posts" loading="lazy" className="profileSocialCommunityEmbed"/><div className="profileSocialFeedFooter"><Link href="/posts">Open full Ummah Feed ↗</Link></div></section>
  <style>{`
.muslimeenRegionPanel{display:flex;flex-direction:column;gap:7px;background:#f8faff;border:1px solid #dce4ee;border-radius:16px;padding:13px;margin:10px 0}.muslimeenRegionPanel label{font-size:13px;font-weight:800}.muslimeenRegionPanel select{width:100%;border:1px solid #d1dbe8;background:#fff;border-radius:12px;padding:11px;font-size:14px}.muslimeenRegionPanel small{font-size:11px;color:#64758a}.muslimeenFilterRow{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden;gap:8px!important;max-width:100%;padding:3px 1px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}.muslimeenFilterRow button{height:40px!important;min-height:40px!important;min-width:max-content;padding:0 15px!important;border-radius:999px!important;font-size:13px!important;line-height:1!important;scroll-snap-align:start;transition:background-color .2s,border-color .2s,color .2s,transform .2s}.muslimeenFilterRow button[aria-pressed="true"]{background:#152c50!important;color:#fff!important;border-color:#152c50!important}.muslimeenCompactSort{display:flex!important;justify-content:flex-end;align-items:center;gap:8px;margin:4px 0 12px!important;font-size:12px!important}.muslimeenCompactSort select{width:auto!important;max-width:190px;min-height:38px!important;padding:7px 10px!important;font-size:13px!important;border-radius:11px!important}.profileSocialSearch input#muslimeen-search{height:46px!important;min-height:46px!important;padding:10px 15px!important;font-size:15px!important}.muslimeenFilterRow::-webkit-scrollbar{display:none}@media(prefers-reduced-motion:reduce){.muslimeenFilterRow button{transition:none!important}}
.muslimeenFilterRow{scrollbar-width:none}.muslimeenFilterRow button{white-space:nowrap;flex-shrink:0}.muslimeenRailItem small{font-size:10px;color:#5a6b83}.muslimeenSpotlight{min-height:205px;border-radius:18px;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:space-between;color:#fff;padding:22px;margin:13px 0 19px;box-shadow:0 7px 18px #142b4720}
.muslimeenSpotlightEyebrow{font-size:10px;font-weight:850;letter-spacing:.16em;color:#e6eef9}
.muslimeenSpotlightMain{display:flex;gap:14px;align-items:center;margin:15px 0}
.muslimeenSpotlightMain img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff}
.muslimeenSpotlightMain div{min-width:0;display:flex;flex-direction:column;gap:4px}
.muslimeenSpotlightMain strong{font-size:clamp(20px,4vw,29px);overflow-wrap:anywhere}
.muslimeenSpotlightMain span{font-size:12px;color:#e2e9f3}
.muslimeenSpotlightMain p{font-size:12px;line-height:1.4;margin:3px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.muslimeenSpotlightActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.muslimeenSpotlightActions>button{border:1px solid #ffffff99;border-radius:999px;background:#ffffffed;color:#102a4c;padding:10px 16px;font-size:12px;font-weight:800}
.muslimeenSpotlightActions .profileDiscoveryFollow{position:static!important}
.muslimeenRails{display:grid;gap:18px;margin:18px 0}
.muslimeenRailHeading{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.muslimeenRailHeading h2{font-size:18px;color:#142d50;margin:0}
.muslimeenRailHeading button{border:0;background:transparent;color:#355577;font-size:12px;font-weight:800}.muslimeenRailActions{display:flex;align-items:center;gap:5px}.muslimeenRailActions .muslimeenRailArrow{border:1px solid #d6e0eb;background:#fff;color:#143250;border-radius:999px;width:34px;height:34px;display:grid;place-items:center;font-size:23px;line-height:1;cursor:pointer;touch-action:manipulation}.muslimeenRailTrack{scroll-behavior:smooth}.muslimeenRailTrack .muslimeenRailItem{touch-action:manipulation}@media(prefers-reduced-motion:reduce){.muslimeenRailTrack{scroll-behavior:auto}}
.muslimeenRailTrack{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scroll-padding-inline:12px;padding:3px 12px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:auto;min-width:0;max-width:100%;width:100%;box-sizing:border-box;cursor:grab}.muslimeenRailTrack:active{cursor:grabbing}.muslimeenRailTrack::-webkit-scrollbar{display:none}
.muslimeenRailItem{flex:0 0 128px;scroll-snap-align:start;scroll-snap-stop:normal;touch-action:pan-x;display:flex;flex-direction:column;align-items:center;gap:6px;border:1px solid #e5eaf1;background:#fff;border-radius:14px;padding:13px 8px;box-shadow:0 3px 11px #112b4b0c;color:#132b49;min-width:0}
.muslimeenRailItem img{width:60px;height:60px;border-radius:50%;object-fit:cover}
.muslimeenRailItem strong{font-size:12px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.muslimeenRailItem span{font-size:10px;color:#748197;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryBio{border:0!important;background:transparent!important;box-shadow:none!important;text-align:center!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryBioLabel{display:none!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryBioText{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#617087;font-size:12px}
.profileSocialDiscovery{background:#fff!important;color:#112846!important;padding:clamp(12px,3vw,28px)!important;border-radius:24px!important}
.muslimeenBrand{text-align:center!important;padding:12px 0 16px!important}
.muslimeenBrandMark{font-size:12px;font-weight:800;color:#5b6c82}
.muslimeenBrand h1{font-size:clamp(27px,5vw,42px)!important;letter-spacing:-.05em;margin:3px 0!important;color:#102846!important}
.muslimeenBrand p{font-size:13px!important;color:#65758c!important;margin:0!important}
.muslimeenTopNav{display:flex;gap:8px;overflow-x:auto;padding:8px 2px 16px;scrollbar-width:none}
.muslimeenTopNav button{flex:0 0 auto;border:1px solid #d8e0eb;background:#fff;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:750;color:#162e50;box-shadow:0 4px 12px #122b4b12}
.muslimeenTopNav button[aria-pressed=true]{background:#16365f;color:#fff}
.muslimeenHero{position:relative;overflow:hidden;border-radius:20px;min-height:215px;display:flex;align-items:center;background:linear-gradient(90deg,#ffffffed 0%,#ffffffdc 38%,#ffffff10 85%),url('/assets/avatars/default-male.jpg') center/cover;box-shadow:0 8px 25px #20314e19;margin-bottom:18px}
.muslimeenHeroCopy{position:relative;z-index:1;padding:22px;max-width:420px}
.muslimeenHeroCopy>span{font-size:10px;letter-spacing:.14em;font-weight:850;color:#446083}
.muslimeenHeroCopy h2{font-family:Georgia,serif;font-size:clamp(27px,5vw,43px);line-height:1.04;margin:9px 0;color:#112a4d}
.muslimeenHeroCopy p{font-size:13px;line-height:1.5;max-width:260px;color:#293c56}
.muslimeenHeroCopy button{border:0;border-radius:999px;background:#102b50;color:#fff;padding:11px 17px;font-weight:800}
.profileSocialDiscovery .profileSocialSearch{display:block!important;font-size:0!important;margin:0 0 10px!important}
.muslimeenSearchLabel{font-size:13px;font-weight:800;color:#244367;display:block;margin-bottom:7px}
.profileSocialDiscovery .profileSocialSearch input{width:100%;border-radius:999px!important;padding:13px 18px!important;font-size:15px!important}
.profileSocialDiscovery .profileDiscoveryFilters{display:flex;gap:8px;overflow-x:auto;padding:6px 0!important}
.profileSocialDiscovery .profileDiscoveryFilters button{border-radius:999px!important;padding:10px 17px!important}
.profileSocialDiscovery .profileDiscoverySort{display:flex;align-items:center;gap:10px;margin:12px 0!important;font-size:12px!important}
.muslimeenSectionHeading{display:flex;align-items:center;justify-content:space-between;margin:22px 0 12px;gap:10px}
.muslimeenSectionHeading h2{font-size:20px;margin:0;color:#142d50}
.muslimeenSectionHeading span{font-size:12px;color:#66788d}
.profileSocialDiscovery .muslimeenMemberGrid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,215px),1fr))!important;gap:12px!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryCard{min-width:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border-radius:17px!important;box-shadow:0 6px 20px #18345b18!important;padding-bottom:12px!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryOpen{display:flex!important;flex-direction:column!important;align-items:center!important;min-height:0!important;text-align:center!important;padding:0 10px!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryCover{width:calc(100% + 20px)!important;height:95px!important;flex:none!important;margin:0 -10px!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryAvatar{position:relative!important;inset:auto!important;margin:-37px auto 7px!important;width:76px!important;height:76px!important;flex:none!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryIdentity{position:static!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:3px!important;width:100%!important;min-width:0!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryIdentity strong{font-size:16px!important;overflow-wrap:anywhere}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryIdentity span{font-size:12px!important;overflow-wrap:anywhere}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryBio{position:static!important;width:100%!important;margin-top:10px!important;padding:9px!important;font-size:12px!important}
.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryCard>button:last-child{position:static!important;align-self:center!important;margin:12px auto 0!important;width:calc(100% - 24px)!important;max-width:170px!important}
@media(max-width:470px){.profileSocialDiscovery .muslimeenMemberGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.muslimeenHero{min-height:205px}.muslimeenHeroCopy{padding:18px}.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryIdentity strong{font-size:14px!important}.profileSocialDiscovery .muslimeenMemberGrid .profileDiscoveryCard>button:last-child{font-size:12px!important}}
`}</style><section hidden={active!=="muslimeen"} className="profileSocialContent profileSocialDiscovery">
   {!selected?<><header className="muslimeenBrand"><span className="muslimeenBrandMark">✦ 1Muslim</span><h1 className="muslimeenTitle"><MemberGlyph size={30}/> 1Muslimeen</h1><p>Discover · Connect · Follow · Our Ummah</p></header><nav className="muslimeenTopNav" aria-label="Muslims discovery shortcuts"><button type="button" aria-pressed={memberFilter==="all"} onClick={()=>setMemberFilter("all")}>⌂ Discover</button><button type="button" aria-pressed={memberFilter==="following"} onClick={()=>setMemberFilter("following")}><MemberGlyph size={18}/> Following</button><button type="button" aria-pressed={memberFilter==="followers"} onClick={()=>setMemberFilter("followers")}><MemberGlyph size={18}/> Followers</button><button type="button" onClick={()=>{setSortMembers("recent");setMemberFilter("all")}}>✧ New Members</button><button type="button" onClick={()=>document.getElementById("muslimeen-featured")?.scrollIntoView({behavior:"smooth",block:"start"})}>☆ Featured</button><button type="button" onClick={()=>document.getElementById("muslimeen-directory")?.scrollIntoView({behavior:"smooth",block:"start"})}>▦ More</button></nav>{!selectedRegion&&!selectedState&&!memberLoading&&members.length>0&&(()=>{const spotlightPool=spotlightPick<3?newestMembers.slice(0,3):[...members].sort((a,b)=>(b.xp_total||0)-(a.xp_total||0)).slice(0,3);const m=spotlightPool[spotlightPick%3]||newestMembers[0];const cfg=m.avatar_config||{};const cover=typeof cfg.profileCoverUrl==="string"?cfg.profileCoverUrl:COVER_STOCK.find(item=>item.id===cfg.profileBackgroundTheme)?.url||COVER_STOCK[5].url;const avatar=typeof cfg.selectedAvatarUrl==="string"?cfg.selectedAvatarUrl:m.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";return <div className="muslimeenSpotlight" style={{backgroundImage:`linear-gradient(90deg,#091c32dc,#10294585),url("${cover}")`}}><span className="muslimeenSpotlightEyebrow">✦ {spotlightPick<3?"NEWEST MEMBER":"TOP XP MEMBER"}</span><div className="muslimeenSpotlightMain"><img src={avatar} alt="" loading="lazy"/><div><strong>{publicMemberName(m)}</strong><span>{publicMemberId(m)?publicMemberId(m)+" · ":""}{(m.xp_total||0).toLocaleString()} XP</span>{m.bio?.trim()&&<p>{m.bio.trim()}</p>}</div></div><div className="muslimeenSpotlightActions"><button type="button" onClick={()=>openMember(m.id)}>View Profile ↗</button><MemberFollowControl viewerId={profile.id} memberId={m.id}/></div></div>})()}
    <label className="profileSocialSearch"><span className="muslimeenSearchLabel">⌕ Search members</span><input id="muslimeen-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names or usernames" autoComplete="off"/></label>
    <div className="profileDiscoveryFilters muslimeenFilterRow" role="group" aria-label="Discover members by">{(["all","brothers","sisters","regions"] as const).map(key=><button type="button" key={key} aria-pressed={discoveryFilter===key} onClick={()=>{setDiscoveryFilter(key);if(key!=="regions"){setSelectedRegion("");setSelectedState("")}setMemberPage(0)}}>{({all:"All",brothers:"♙ Brothers",sisters:"♙ Sisters",regions:"◎ Regions"} as const)[key]}</button>)}</div>{discoveryFilter==="regions"&&<RegionDiscovery members={[profile,...members]} backgroundImage={profileCoverImage(profile)} onOpenMember={openMember} currentCountry={profile.country} userId={profile.id} selected={canonicalCountry(selectedRegion)} selectedState={selectedState} onSelectState={value=>{setSelectedState(value);setMemberPage(0)}} onSelect={value=>{setSelectedRegion(value);setSelectedState("");setMemberPage(0)}} onSaved={value=>{profile.country=value;setSelectedRegion(value);setSelectedState("");setMemberPage(0)}}/>}
    {selectedRegion||selectedState?<p role="status">Open the map to see country previews from members who chose to be shown. <button type="button" onClick={()=>{setSelectedRegion("");setSelectedState("")}}>Show all members</button></p>:<>
    <label className="profileDiscoverySort muslimeenCompactSort"><span>Sort</span><select aria-label="Sort members" value={discoveryFilter==="top"?"top":discoveryFilter==="recent"?"newest":sortMembers} onChange={e=>{const value=e.target.value;if(value==="top"||value==="newest"){setDiscoveryFilter(value==="top"?"top":"recent");setSortMembers("recent")}else{setDiscoveryFilter(current=>current==="top"||current==="recent"?"all":current);setSortMembers(value as "recent"|"name")}setMemberPage(0)}}><option value="recent">Recently joined</option><option value="name">Name A–Z</option><option value="top">Top XP</option><option value="newest">Newest members</option></select></label>
    {memberLoading?<p role="status">Loading members…</p>:memberError?<p role="alert">{memberError}</p>:visibleMembers.length===0?<p>No matching members found.</p>:<>
    {!debouncedSearch&&memberFilter==="all"&&!memberLoading&&members.length>0&&<div className="muslimeenRails">{([{title:"Featured Members",items:featuredMembers},{title:"Recently Joined",items:newestMembers.slice(0,12)},{title:"People You Follow",items:regionRailMembers.filter(m=>connections.following.has(m.id)).slice(0,10)}] as const).filter(group=>group.items.length>0).map(group=><section className="muslimeenRail" id={group.title==="Featured Members"?"muslimeen-featured":undefined} key={group.title}><div className="muslimeenRailHeading"><h2>{group.title==="Recently Joined"?"✧":group.title==="Featured Members"?"☆":"◎"} {group.title}</h2><div className="muslimeenRailActions"><button className="muslimeenRailArrow" type="button" aria-label={"Previous "+group.title} onClick={()=>document.getElementById("muslimeen-rail-"+group.title.replace(/\s+/g,"-").toLowerCase())?.scrollBy({left:-310,behavior:"smooth"})}>‹</button><button className="muslimeenRailArrow" type="button" aria-label={"Next "+group.title} onClick={()=>document.getElementById("muslimeen-rail-"+group.title.replace(/\s+/g,"-").toLowerCase())?.scrollBy({left:310,behavior:"smooth"})}>›</button><button type="button" onClick={()=>{setMemberFilter(group.title==="People You Follow"?"following":"all");setDiscoveryFilter(group.title==="Featured Members"?"top":"recent");setSortMembers("recent");document.getElementById("muslimeen-directory")?.scrollIntoView({behavior:"smooth",block:"start"})}}>See All →</button></div></div><SwipeMemberRail id={"muslimeen-rail-"+group.title.replace(/\s+/g,"-").toLowerCase()} label={group.title+" · Swipe member cards"}>{group.items.map(m=>{const cfg=m.avatar_config||{};const avatar=typeof cfg.selectedAvatarUrl==="string"?cfg.selectedAvatarUrl:m.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";return <button type="button" key={m.id} className="muslimeenRailItem" onClick={()=>openMember(m.id)}><img src={avatar} alt="" loading="lazy"/><strong>{publicMemberName(m)}</strong>{publicMemberId(m)&&<span>{publicMemberId(m)}</span>}<small>✦ {(m.xp_total||0).toLocaleString()} XP</small></button>})}</SwipeMemberRail></section>)}</div>}
    {discoveryFilter!=="regions"&&<button type="button" className="muslimeenMapShortcut" title="Explore Ummah map and update my region" aria-label="Explore Ummah map and update my region" style={{display:"inline-grid",placeItems:"center",height:44,width:44,borderRadius:"50%",border:"1px solid #bfdace",background:"#f4faf6",color:"#276c52",fontSize:24,margin:"5px 0 10px auto"}} onClick={()=>{setDiscoveryFilter("regions");setMemberPage(0);window.setTimeout(()=>document.querySelector(".ummahAtlas")?.scrollIntoView({behavior:"smooth",block:"center"}),60)}}>⌖</button>}
    <div id="muslimeen-directory" className="muslimeenSectionHeading"><h2>✦ {memberFilter==="following"?"Following":memberFilter==="followers"?"Followers":debouncedSearch?"Search Results":"Discover Members"}</h2><span>{visibleMembers.length} members</span></div><style>{`.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard{position:relative!important;box-shadow:0 6px 20px #18345b18,0 8px 23px color-mix(in srgb,var(--member-accent) 10%,transparent)!important}.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryCover{border-bottom:3px solid var(--member-accent)!important;box-sizing:border-box!important}.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryAvatar{border:4px solid #fff!important;outline:2px solid var(--member-accent)!important;outline-offset:1px!important;border-radius:50%!important;box-shadow:0 3px 12px #162b4022!important}.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileMemberFollowButton{box-shadow:0 4px 14px color-mix(in srgb,var(--member-accent) 10%,transparent)!important}.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryIdentity,.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryIdentity strong,.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryIdentity span,.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryIdentity small,.profileSocialDiscovery .muslimeenMemberGrid .memberAccentCard .profileDiscoveryBioText{color:var(--member-text)!important}.memberAccentProfile .profileProfessionalIdentity h1,.memberAccentProfile .profileProfessionalHandle,.memberAccentProfile .profileProfessionalBio,.memberAccentProfile .profileProfessionalLocation{color:var(--member-text)!important}.memberAccentProfile .profileProfessionalCover{border-bottom:3px solid var(--member-accent)!important}.memberAccentProfile .profileProfessionalAvatar{border:4px solid white!important;outline:2px solid var(--member-accent)!important;outline-offset:1px!important;box-shadow:0 5px 18px color-mix(in srgb,var(--member-accent) 10%,transparent)!important}.memberAccentProfile .profileProfessionalHeader{box-shadow:0 8px 25px color-mix(in srgb,var(--member-accent) 9%,transparent)!important}@media(prefers-reduced-motion:reduce){.memberAccentCard,.memberAccentProfile{transition:none!important}}`}</style><div className="profileSocialMembers muslimeenMemberGrid">{visibleMembers.slice(0,(memberPage+1)*20).map(m=>{const cfg=m.avatar_config||{};const avatar=typeof cfg.selectedAvatarUrl==="string"?cfg.selectedAvatarUrl:m.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";const cover=typeof cfg.profileCoverUrl==="string"?cfg.profileCoverUrl:COVER_STOCK.find(c=>c.id===cfg.profileBackgroundTheme)?.url||COVER_STOCK[5].url;return <article className="profileDiscoveryCard memberAccentCard" key={m.id} style={memberAccentStyle(m.profile_accent)}><button type="button" className="profileDiscoveryOpen" onClick={()=>openMember(m.id)} aria-label={"View "+publicMemberName(m)+" profile"}><span className="profileDiscoveryCover" style={{backgroundImage:`url("${cover}")`}}/><img className="profileDiscoveryAvatar" src={avatar} loading="lazy" alt=""/><span className="profileDiscoveryIdentity"><strong>{m.display_name||"1Muslim member"}</strong>{publicMemberId(m)&&<span>{publicMemberId(m)}</span>}<small>✦ {(m.xp_total||0).toLocaleString()} XP</small></span>{m.bio?.trim()&&<span className="profileDiscoveryBio" aria-label="Member bio"><span className="profileDiscoveryBioLabel">ABOUT</span><span className="profileDiscoveryBioText">{m.bio.trim()}</span></span>}</button><MemberFollowControl viewerId={profile.id} memberId={m.id}/></article>})}</div>
    {(visibleMembers.length>(memberPage+1)*20||hasMoreMembers)&&<button type="button" disabled={loadingMore} className="profileDiscoveryMore" onClick={()=>{if(visibleMembers.length>(memberPage+1)*20)setMemberPage(p=>p+1);else void loadMoreMembers()}}>{loadingMore?"Loading…":"Load more members"}</button>}</>}
    </>}
   </>:<div className="profileDiscoveryDetail">
     <div className="profileDiscoveryToolbar"><button type="button" onClick={closeMember}>← Members</button><div><button type="button" onClick={()=>moveMember(-1)} disabled={selectedIndex<=0} aria-label="Previous member">‹</button><button type="button" onClick={()=>moveMember(1)} disabled={selectedIndex<0||selectedIndex>=visibleMembers.length-1} aria-label="Next member">›</button></div></div>
     {memberProfile?<ProfileOverview key={memberProfile.id} profile={memberProfile} tier={tierForXp(memberProfile.xp_total||0)} ashab={[]} postCount={0} postText="" setPostText={()=>{}} posting={false} publishFirstPost={()=>{}} onEdit={()=>{}} isOwner={false} viewerId={profile.id}/>:memberProfileError?<div role="alert">Unable to load this member. <button type="button" onClick={closeMember}>Back to Muslims</button></div>:<p role="status">Loading profile…</p>}</div>}
  </section>
  {messenger&&<div className="profileMessengerBackdrop" onClick={()=>setMessenger(false)}><aside className="profileMessengerDrawer" aria-label="Messenger" onClick={e=>e.stopPropagation()}><header><h2>Messenger</h2><button type="button" onClick={()=>setMessenger(false)} aria-label="Close Messenger">✕</button></header><iframe title="1Muslim Messenger conversations" src="/messages" className="profileMessengerFrame" loading="lazy"/><Link href="/messages" className="profileMessengerFullLink">Open full Messenger ↗</Link></aside></div>}
 </div>;
}

const brandedHandle=(handle:string|null|undefined)=>handle?.replace(/^1muslim_(?=[0-9a-f]{8}$)/i,"1Muslim_")||"member";
const normalizeMuslimId=(value:string|null|undefined)=>(value||"").trim().replace(/^@+/,"").toLowerCase();
/** Escape LIKE wildcard characters so an underscore in an ID is matched literally. */
const escapeMuslimIdPattern=(value:string)=>value.replace(/[\\%_]/g,"\\$&");
const TAKEN_MUSLIM_ID="1Muslim ID is already taken.";
const isUsernameConflict=(error:{code?:string;message?:string;details?:string;hint?:string})=>
 error.code==="23505" && /username|profiles_username/i.test([error.message,error.details,error.hint].join(" "));
type EmbeddedEditorTab="profile"|"avatar"|"header"|"live"|"shahada"|"analytics";
export default function ProfilePage() {
  const embeddedEditorTab=useContext(SettingsEmbedContext);
  const router=useRouter();
  const [signingOut,setSigningOut]=useState(false);
  const [isHudHudAdmin,setIsHudHudAdmin]=useState(false);
  const [adminAccessChecked,setAdminAccessChecked]=useState(false);
  const [secretAdminOpen,setSecretAdminOpen]=useState(false);
  const [secretAdminDraft,setSecretAdminDraft]=useState("");
  const secretSwipeStart=useRef<{x:number;y:number}|null>(null);
  const [uploadingAvatar,setUploadingAvatar]=useState(false);
  const signOut=async()=>{
    if(signingOut)return;
    setSigningOut(true);
    const {error}=await createClient().auth.signOut();
    if(error){setMessage("Sign out failed: "+error.message);setSigningOut(false);return;}
    try{sessionStorage.setItem("1muslim-hudhud-farewell","1")}catch{}
    window.dispatchEvent(new CustomEvent("1muslim:farewell"));
    warmProfile=null;
    router.replace("/");
    router.refresh();
  };
  const [profile,setProfile]=useState<Profile|null>(null);
  // Reconcile visibility immediately without waiting for a route reload.
  useEffect(()=>{
   const update=(event:Event)=>{
    const detail=(event as CustomEvent<{memberId:string;hidden:boolean}>).detail;
    if(!detail)return;
    setProfile(old=>old?.id===detail.memberId?{...old,hide_1muslim_id:detail.hidden}:old);
   };
   window.addEventListener("1muslim:member-id-visibility-changed",update);
   return()=>window.removeEventListener("1muslim:member-id-visibility-changed",update);
  },[]);
  const [savedUsername,setSavedUsername]=useState<string|null>(null);
  const [usernameStatus,setUsernameStatus]=useState<"idle"|"checking"|"available"|"taken"|"error">("idle");
  const [usernameError,setUsernameError]=useState("");
  const [editing,setEditing]=useState(Boolean(embeddedEditorTab));
  const [searchProfileExpanded,setSearchProfileExpanded]=useState(Boolean(embeddedEditorTab));
  useEffect(()=>{const params=new URLSearchParams(window.location.search);if(["section","panel","member","compass"].some(key=>params.has(key)))setSearchProfileExpanded(true)},[]);
  const closeSearchProfilePanel=()=>{setEditing(false);setSearchProfileExpanded(false);window.scrollTo({top:0,behavior:"smooth"})};
  const openSearchProfilePanel=(panel:"posts"|"settings")=>{setEditing(false);setSearchProfileExpanded(true);window.setTimeout(()=>window.dispatchEvent(new CustomEvent("1muslim:profile-open-panel",{detail:{panel}})),140)};
  const [ashab,setAshab]=useState<Profile[]>([]);
  const [postCount,setPostCount]=useState(0);
  const [postText,setPostText]=useState("");
  const [posting,setPosting]=useState(false);
  const [tab,setTab]=useState<EmbeddedEditorTab>(embeddedEditorTab||"profile");
  useEffect(()=>{
    if(!embeddedEditorTab)return;
    setTab(embeddedEditorTab);setSearchProfileExpanded(true);setEditing(true);
  },[embeddedEditorTab]);
  // Settings slide-out links into the existing full-featured editor.
  // Keep the verified save/upload/connection/vault flows unchanged.
  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get("edit");
    if(!requested||!["profile","avatar","header","live","shahada","analytics"].includes(requested))return;
    const selected=requested as "profile"|"avatar"|"header"|"live"|"shahada"|"analytics";
    setSearchProfileExpanded(true);setTab(selected);setEditing(true);
    const timer=window.setTimeout(()=>document.querySelector(".profileEditorToolbar")?.scrollIntoView({
      behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"
    }),280);
    return()=>window.clearTimeout(timer);
  },[]);

  const editorRailRef=useRef<HTMLDivElement|null>(null);
  const editorSwipeStart=useRef<{x:number;y:number}|null>(null);
  // Keep the selected capsule in view without scrolling the whole page.
  useEffect(()=>{
    if(!editing)return;
    const frame=requestAnimationFrame(()=>{
      const rail=editorRailRef.current;
      const active=rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if(!rail||!active)return;
      const railBox=rail.getBoundingClientRect(),tabBox=active.getBoundingClientRect();
      const offset=tabBox.left+tabBox.width/2-railBox.left-railBox.width/2;
      rail.scrollTo({left:rail.scrollLeft+offset,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
    });
    return()=>cancelAnimationFrame(frame);
  },[editing,tab]);
 useEffect(()=>{
   const params=new URLSearchParams(window.location.search);
   if(params.get("section")!=="tiktok")return;
   // Complete the real OAuth review journey on the exact screen that launched it.
   setEditing(true);setTab("live");
   const returned=params.get("connected")==="1",error=params.get("error");
   if(returned||error)try{
      sessionStorage.setItem("1muslim:tiktok-oauth-result",returned?"connected":"error:"+String(error||"unknown").replace(/[^a-z_]/gi,""));
   }catch{}
   window.history.replaceState(null,"",window.location.pathname);
   const timer=window.setTimeout(()=>document.querySelector(".profileEditorToolbar")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),320);
   return()=>window.clearTimeout(timer);
 },[]);
const [avatarPage,setAvatarPage]=useState(0);
 useEffect(()=>{const open=(e:Event)=>{const tab=(e as CustomEvent<{tab:string}>).detail?.tab;if(tab==="header"||tab==="avatar"||tab==="profile"){setTab(tab);setEditing(true);window.setTimeout(()=>document.querySelector(".profileEditorToolbar")?.scrollIntoView({behavior:"smooth",block:"start"}),100)}};window.addEventListener("1muslim:edit-profile-tab",open);return()=>window.removeEventListener("1muslim:edit-profile-tab",open)},[]);
  useEffect(()=>{const open=()=>{setTab("analytics");setEditing(true);window.setTimeout(()=>document.querySelector(".profileEditorToolbar")?.scrollIntoView({behavior:"smooth",block:"start"}),80)};window.addEventListener("1muslim:open-profile-analytics",open);return()=>window.removeEventListener("1muslim:open-profile-analytics",open)},[]);
  const [avatarTransition,setAvatarTransition]=useState<"unlock"|"change"|null>(null); const [avatarSaving,setAvatarSaving]=useState(false); const [saving,setSaving]=useState(false); const [colorSaving,setColorSaving]=useState(false); const [backgroundStudioOpen,setBackgroundStudioOpen]=useState(true); const [message,setMessage]=useState(""); const [authRequired,setAuthRequired]=useState(false);
  const [liveConnectors,setLiveConnectors]=useState<Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>>({});
  const [vaultUrl,setVaultUrl]=useState("");
  const [profileLoadFailed,setProfileLoadFailed]=useState(false);
  useEffect(()=>{if(profile||authRequired)return;const timer=window.setTimeout(()=>setProfileLoadFailed(true),12000);return()=>window.clearTimeout(timer)},[profile,authRequired]);
  const providers=["tiktok","youtube","twitch"] as const;

  useEffect(()=>{window.addEventListener("1muslim:profile-signout",signOut);return()=>window.removeEventListener("1muslim:profile-signout",signOut)},[signingOut]);
  useEffect(()=>{let active=true;(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!active)return;if(!user){warmProfile=null;setAuthRequired(true);return;}
    setIsHudHudAdmin((user.email||"").toLowerCase()==="hudhudbyelmi@gmail.com");setAdminAccessChecked(true);
    if(warmProfile?.userId===user.id&&Date.now()-warmProfile.at<WARM_PROFILE_MS){setProfile(warmProfile.profile);setSavedUsername(warmProfile.profile.username??null)}
    const {data}=await s.from("profiles").select("*").eq("id",user.id).single();if(!active)return;
    if(data){warmProfile={userId:user.id,profile:data as Profile,at:Date.now()};setProfile(data as Profile);setSavedUsername(data.username??null);}
    const [profilePosts,communityPosts]=await Promise.all([s.from("posts").select("id").eq("user_id",user.id),s.from("community_posts").select("id").eq("author_id",user.id)]);setPostCount((profilePosts.data?.length??0)+(communityPosts.data?.length??0));
    const {data:friendships}=await s.from("ashab_friendships").select("requester_id,addressee_id").eq("status","accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ashabIds=(friendships??[]).map((row:any)=>row.requester_id===user.id?row.addressee_id:row.requester_id).filter(Boolean);
    if(ashabIds.length){const {data:ashabRows}=await s.from("profiles").select("*").in("id",ashabIds);setAshab((ashabRows??[]) as Profile[]);}
    const {data:connectors}=await s.from("live_connectors").select("provider,handle,channel_url,enabled,is_live,live_title").eq("user_id",user.id);
    const map:Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>={};
    for(const row of (connectors??[])) map[row.provider]={handle:row.handle??"",channel_url:row.channel_url??"",enabled:!!row.enabled,is_live:!!row.is_live,live_title:row.live_title??""};
    if(active)setLiveConnectors(map);})();return()=>{active=false}},[]);

  useEffect(()=>{if(tab!=="shahada"||!profile?.shahada_audio_path)return;let active=true;(async()=>{const s=createClient();const {data}=await s.storage.from("shahada-safe-vault").createSignedUrl(profile.shahada_audio_path!,600);if(active&&data?.signedUrl)setVaultUrl(data.signedUrl)})();return()=>{active=false}},[tab,profile?.shahada_audio_path]);

  const uploadAdminAvatar=async(file:File|undefined)=>{
    if(!file||!profile)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("Use a PNG, JPEG or WebP avatar.");return}
    if(file.size>3*1024*1024){setMessage("Avatar must be under 3 MB.");return}
    setUploadingAvatar(true);setMessage("");
    const s=createClient();
    const {data:{user}}=await s.auth.getUser();
    if(!user||user.id!==profile.id){setUploadingAvatar(false);setMessage("Sign in to upload an avatar.");return}
    const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    const path=`${user.id}/custom/avatar-${Date.now()}.${extension}`;
    const {error:uploadError}=await s.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setUploadingAvatar(false);setMessage("Avatar upload failed: "+uploadError.message);return}
    const url=s.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const previous=Array.isArray(profile.avatar_config?.customAvatarHistory)?profile.avatar_config.customAvatarHistory.filter((item:unknown)=>typeof item==="string"):typeof profile.avatar_config?.adminAvatarUrl==="string"?[profile.avatar_config.adminAvatarUrl]:[];
    const history=[url,...previous.filter((item:string)=>item!==url)].slice(0,3);
    const avatar_config={...(profile.avatar_config||{}),adminAvatarUrl:url,selectedAvatarUrl:url,customAvatarHistory:history};
    const {error:saveError}=await s.from("profiles").update({avatar_config}).eq("id",user.id);
    setUploadingAvatar(false);
    if(saveError){setMessage("Avatar uploaded but could not be saved: "+saveError.message);return}
    update({avatar_config});window.dispatchEvent(new Event("1muslim:profile-saved"));setMessage("Custom avatar uploaded, equipped, and saved.");
  };
  const removeCustomAvatar=async(url:string)=>{
    if(!profile||avatarSaving||uploadingAvatar)return;
    const history=Array.isArray(profile.avatar_config?.customAvatarHistory)?profile.avatar_config.customAvatarHistory.filter((item:unknown):item is string=>typeof item==="string"):[];
    if(!history.includes(url))return;
    setAvatarSaving(true);setMessage("Removing custom avatar…");
    const {data:{user}}=await createClient().auth.getUser();
    if(!user||user.id!==profile.id){setAvatarSaving(false);setMessage("Sign in to remove an avatar.");return}
    const nextHistory=history.filter(item=>item!==url);
    const selected=profile.avatar_config?.selectedAvatarUrl===url?AVATAR_CHOICES.find(item=>item.xp<=profile.xp_total)?.url||AVATAR_CHOICES[0].url:profile.avatar_config?.selectedAvatarUrl;
    const avatar_config={...(profile.avatar_config||{}),customAvatarHistory:nextHistory,selectedAvatarUrl:selected,adminAvatarUrl:profile.avatar_config?.adminAvatarUrl===url?null:profile.avatar_config?.adminAvatarUrl};
    const {error}=await createClient().from("profiles").update({avatar_config}).eq("id",user.id);
    if(error){setMessage("Could not remove avatar: "+error.message)}else{
      update({avatar_config});window.dispatchEvent(new Event("1muslim:profile-saved"));setMessage("Custom avatar removed.");
      try{const parsed=new URL(url);const marker="/storage/v1/object/public/avatars/";const relative=decodeURIComponent(parsed.pathname.split(marker)[1]||"");if(relative.startsWith(user.id+"/custom/"))await createClient().storage.from("avatars").remove([relative])}catch{}
    }
    setAvatarSaving(false);
  };
  const equipCustomAvatar=async(url:string)=>{
    if(!profile||avatarSaving)return;
    const history=Array.isArray(profile.avatar_config?.customAvatarHistory)?profile.avatar_config.customAvatarHistory:[];
    if(!history.includes(url))return;
    setAvatarSaving(true);setMessage("Saving avatar…");
    const avatar_config={...(profile.avatar_config||{}),selectedAvatarUrl:url};
    const {error}=await createClient().from("profiles").update({avatar_config}).eq("id",profile.id);
    if(error)setMessage("Could not equip avatar: "+error.message);
    else{update({avatar_config});window.dispatchEvent(new Event("1muslim:profile-saved"));setMessage("Custom avatar equipped.");}
    setAvatarSaving(false);
  };
  const [stockSaving,setStockSaving]=useState(false);
  const selectStockCover=async(url:string)=>{if(!profile||stockSaving)return;setStockSaving(true);setMessage("");const avatar_config={...(profile.avatar_config||{}),profileCoverUrl:url};const {error}=await createClient().from("profiles").update({avatar_config,profile_background_image_url:url}).eq("id",profile.id);if(error)setMessage("Could not save cover: "+error.message);else{update({avatar_config,profile_background_image_url:url});window.dispatchEvent(new CustomEvent("1muslim:profile-cover-changed",{detail:{userId:profile.id,url}}));window.dispatchEvent(new Event("1muslim:profile-saved"));setMessage("Stock cover saved.")}setStockSaving(false)};
  const [coverPreview,setCoverPreview]=useState<string|null>(null);
  const [coverFile,setCoverFile]=useState<File|null>(null);
  const [coverZoom,setCoverZoom]=useState(1);
  const [coverPosition,setCoverPosition]=useState(50);
  const [coverUploading,setCoverUploading]=useState(false);
  useEffect(()=>()=>{if(coverPreview)URL.revokeObjectURL(coverPreview)},[coverPreview]);
  const uploadProfileCover=async()=>{
   if(!profile||!coverFile||coverUploading)return;
   setCoverUploading(true);setMessage("");
   try{
    const img=new Image();const src=URL.createObjectURL(coverFile);
    try{await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Image could not be read"));img.src=src});
     const canvas=document.createElement("canvas");canvas.width=1500;canvas.height=500;
     const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image processing unavailable");
     const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight)*coverZoom;
     const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
     ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)*coverPosition/100,w,h);
     const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Crop failed")),"image/jpeg",.88));
     const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user||user.id!==profile.id)throw new Error("Sign in to save your cover.");
     const path=`${user.id}/profile-covers/cover-${Date.now()}.jpg`;
     const {error:uploadError}=await client.storage.from("avatars").upload(path,blob,{contentType:"image/jpeg",upsert:false});if(uploadError)throw new Error("Cover upload failed: "+uploadError.message);
     const url=client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
     const avatar_config={...(profile.avatar_config||{}),profileCoverUrl:url};
     const {data:savedProfile,error:saveError}=await client.from("profiles").update({avatar_config,profile_background_image_url:url}).eq("id",user.id).select("avatar_config,profile_background_image_url").single();
     if(saveError)throw new Error("Cover uploaded but profile update failed: "+saveError.message);
     const savedConfig=savedProfile?.avatar_config as Record<string,unknown>|null;
     if(savedConfig?.profileCoverUrl!==url)throw new Error("Cover uploaded but the saved profile did not confirm the new image.");
     await new Promise<void>((resolve,reject)=>{const check=new Image();check.onload=()=>resolve();check.onerror=()=>reject(new Error("Cover uploaded but the public image cannot be loaded. Check avatars bucket access."));check.src=url;});
     update({avatar_config:savedConfig,profile_background_image_url:url});setCoverFile(null);setCoverPreview(null);setMessage("Cover image saved to your profile.");if(!embeddedEditorTab){setTab("profile");setEditing(false)}window.dispatchEvent(new CustomEvent("1muslim:profile-cover-changed",{detail:{userId:user.id,url}}));window.dispatchEvent(new Event("1muslim:profile-saved"));if(!embeddedEditorTab)window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})));
    }finally{URL.revokeObjectURL(src)}
   }catch(e){setMessage(e instanceof Error?e.message:"Could not upload cover image.")}finally{setCoverUploading(false)}
  };
  const tier=useMemo(()=>tierForXp(profile?.xp_total??0),[profile?.xp_total]);
  const update=(patch:Partial<Profile>)=>setProfile(p=>{if(!p)return p;const next={...p,...patch};warmProfile={userId:next.id,profile:next,at:Date.now()};return next});
  useEffect(()=>{
    if(!profile)return;
    let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
      window.dispatchEvent(new Event("1muslim:profile-ready"));
      const cover=profileCoverImage(profile);
      if(cover){const img=new Image();img.decoding="async";img.src=cover}
    })});
    return()=>cancelAnimationFrame(frame);
  },[profile?.id]);
  const chooseBackground=async(choice:(typeof BACKGROUND_CHOICES)[number])=>{
    if(!profile||colorSaving||choice.id===profile.profile_background)return;
    const previous={profile_accent:profile.profile_accent,profile_background:profile.profile_background};
    update({profile_accent:choice.accent,profile_background:choice.id});
    setColorSaving(true);setMessage("");
    const {error}=await createClient().from("profiles").update({profile_accent:choice.accent,profile_background:choice.id}).eq("id",profile.id);
    setColorSaving(false);
    if(error){update(previous);setMessage("Could not save background: "+error.message);}
    else {setMessage("✓ Changes saved automatically");}
  };
  const typedMuslimId=normalizeMuslimId(profile?.username);
  useEffect(()=>{
    if(!editing||tab!=="profile"||!profile?.id||!typedMuslimId||typedMuslimId===normalizeMuslimId(savedUsername)||!/^[a-z0-9_.]{3,30}$/.test(typedMuslimId)){
      setUsernameStatus("idle");setUsernameError("");return;
    }
    let active=true;
    setUsernameStatus("checking");setUsernameError("");
    const timer=window.setTimeout(()=>{
      void createClient().from("profiles").select("id,username")
        .ilike("username",escapeMuslimIdPattern(typedMuslimId)).neq("id",profile.id).limit(1)
        .then(({data,error})=>{
          if(!active)return;
          if(error){setUsernameStatus("error");return}
          const taken=!!data?.some(row=>normalizeMuslimId(row.username)===typedMuslimId);
          setUsernameStatus(taken?"taken":"available");
          setUsernameError(taken?TAKEN_MUSLIM_ID:"");
        });
    },400);
    return()=>{active=false;window.clearTimeout(timer)};
  },[editing,tab,profile?.id,typedMuslimId,savedUsername]);
  const displayCooldown=cooldownRemaining(profile?.display_name_changed_at??null);
  const usernameCooldown=cooldownRemaining(profile?.username_changed_at??null);

  const save=async()=>{
    if(!profile||saving)return;
    setSaving(true);setMessage("");
    try{
      const s=createClient();
      const original=await s.from("profiles").select("display_name,username").eq("id",profile.id).single();
      if(original.error||!original.data){
        setMessage("Could not verify your profile. Please try again.");return;
      }
      const displayChanged=profile.display_name!==original.data.display_name;
      const handle=normalizeMuslimId(profile.username);
      const usernameChanged=handle!==normalizeMuslimId(original.data.username);
      if(usernameChanged&&handle&&!/^[a-z0-9_.]{3,30}$/.test(handle)){
        setMessage("1Muslim ID must be 3–30 characters using letters, numbers, underscores, or periods.");return;
      }
      if(usernameChanged&&handle){
        // Helpful early feedback. The database's case-insensitive UNIQUE index
        // is the authoritative protection if two members save simultaneously.
        const {data:taken,error:lookupError}=await s.from("profiles").select("id,username")
          .ilike("username",escapeMuslimIdPattern(handle)).neq("id",profile.id).limit(1);
        if(lookupError){setUsernameStatus("error");setMessage("Unable to verify 1Muslim ID availability. Please try again.");return;}
        if(taken?.some(row=>normalizeMuslimId(row.username)===handle)){
          setUsernameStatus("taken");setUsernameError(TAKEN_MUSLIM_ID);
          setMessage(TAKEN_MUSLIM_ID);setTab("profile");return;
        }
      }
      const config={...(profile.avatar_config??{}),gender:profile.avatar_gender,package:profile.avatar_package,accessories:Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories:[]};
      const {data,error}=await s.from("profiles").update({
        display_name:profile.display_name.trim(),username:handle||null,first_name:profile.first_name,last_name:profile.last_name,city:profile.city,state:profile.state,country:profile.country,gender:profile.gender,bio:profile.bio,avatar_gender:profile.avatar_gender,avatar_package:profile.avatar_package,avatar_config:config,profile_background:profile.profile_background,profile_accent:profile.profile_accent
      }).eq("id",profile.id).select("display_name,username,display_name_changed_at,username_changed_at").single();
      if(error){
        if(isUsernameConflict(error)){
          setUsernameStatus("taken");setUsernameError(TAKEN_MUSLIM_ID);
          setMessage(TAKEN_MUSLIM_ID);setTab("profile");
        }else setMessage(error.message);
        return;
      }
      update({display_name:data?.display_name??profile.display_name,username:data?.username??null,display_name_changed_at:data?.display_name_changed_at??profile.display_name_changed_at,username_changed_at:data?.username_changed_at??profile.username_changed_at});
      setSavedUsername(data?.username??null);
      setUsernameStatus("idle");setUsernameError("");
      setMessage(displayChanged||usernameChanged?"Profile identity updated.":"Profile saved.");
      window.dispatchEvent(new Event("1muslim:profile-saved"));
      if(!embeddedEditorTab)setEditing(false);
    }finally{setSaving(false)}
  };

  const updateConnector=(provider:string,patch:Partial<{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>)=>setLiveConnectors(x=>({...x,[provider]:{handle:x[provider]?.handle??"",channel_url:x[provider]?.channel_url??"",enabled:x[provider]?.enabled??true,is_live:x[provider]?.is_live??false,live_title:x[provider]?.live_title??"",...patch}}));
  const saveConnector=async(provider:string)=>{
    if(!profile)return;
    const row=liveConnectors[provider]??{handle:"",channel_url:"",enabled:true,is_live:false,live_title:""};
    const s=createClient();
    const {error}=await s.from("live_connectors").upsert({user_id:profile.id,provider,handle:row.handle.trim()||null,channel_url:row.channel_url.trim()||null,enabled:row.enabled,is_live:row.is_live,live_title:row.live_title.trim()||null,updated_at:new Date().toISOString()},{onConflict:"user_id,provider"});
    setMessage(error?error.message:`${provider[0].toUpperCase()+provider.slice(1)} live connector saved.`);
  };

  const selectAvatar=async(url:string)=>{
    if(!profile||avatarSaving)return;
    const choice=AVATAR_CHOICES.find(item=>item.url===url);
    if(!choice){setMessage("Invalid avatar image.");return}
    const isSilver=url.includes("silver-avatar");
    if(profile.xp_total<choice.xp){setMessage(`${choice.label} unlocks at ${choice.xp.toLocaleString()} XP.`);return}
    if(profile.avatar_config?.selectedAvatarUrl===url)return;
    setAvatarSaving(true);setMessage("Saving your avatar…");
    const s=createClient();const {data:{user}}=await s.auth.getUser();
    if(!user||user.id!==profile.id){setAvatarSaving(false);setMessage("Sign in to change your avatar.");return}
    const firstSilver=isSilver&&profile.avatar_config?.silverAvatarFirstChangeShown!==true;
    const config={...(profile.avatar_config||{}),selectedAvatarUrl:url,...(firstSilver?{silverAvatarFirstChangeShown:true}:{})};
    const {error}=await s.from("profiles").update({avatar_config:config}).eq("id",user.id);
    if(error){setAvatarSaving(false);setMessage("Could not save avatar: "+error.message);return}
    update({avatar_config:config});window.dispatchEvent(new Event("1muslim:profile-saved"));setAvatarTransition(firstSilver?"unlock":"change");
    setMessage(firstSilver?"✦ Silver avatar equipped!":"Avatar changed and saved.");
    window.setTimeout(()=>setAvatarTransition(null),firstSilver?2600:900);
    setAvatarSaving(false);
    if(firstSilver)await s.from("notifications").insert({user_id:user.id,type:"xp_milestone",title:"✦ Silver avatar unlocked",body:"Your Silver avatar is ready. Visit Profile → Avatar to switch anytime.",entity_type:"profile",entity_id:user.id});
  };
  const toggleAccessory=(id:string)=>{if(!profile)return;const item=ACCESSORIES.find(x=>x.id===id);if(!item)return;const required=AVATAR_TIERS.find(x=>x.key===item.tier)?.minXp??0;if(profile.xp_total<required)return;const current=Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories.map(String):[];const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];update({avatar_config:{...profile.avatar_config,accessories:next}})};

  if(authRequired)return <main className="profileLoadingWhite"><section className="profileEmpty isAuth"><h1>Build your profile.</h1><p>Sign in to customize your OneMuslim identity.</p><Link href="/auth" className="primary">Sign in</Link></section></main>;
  if(!profile)return <main className="profileLoadingWhite"><section className={"profileEmpty"+(profileLoadFailed?" isError":"")} aria-label="Preparing your profile">{profileLoadFailed?<><p>Unable to load your profile. Please try again.</p><button className="primary" type="button" onClick={()=>window.location.reload()}>Try again</button></>:<div className="profileWhiteSkeleton" aria-hidden="true"><div/><div/><div/></div>}</section></main>;

  const publishFirstPost=async()=>{const body=postText.trim();if(!body||posting)return;setPosting(true);const s=createClient();const {error}=await s.from("posts").insert({user_id:profile.id,body});if(error){setMessage(error.message);setPosting(false);return;}setPostText("");setPostCount(x=>x+1);setPosting(false);};

  return <main className={"profilePage profileCommandPage"+(embeddedEditorTab?" scEmbeddedProfile":"")} onTouchStart={e=>{if(!isHudHudAdmin||secretAdminOpen)return;const t=e.touches[0];if(t&&!((e.target as HTMLElement).closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true],.ummahAtlas,.swipeMemberRail")))secretSwipeStart.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const start=secretSwipeStart.current;secretSwipeStart.current=null;const t=e.changedTouches[0];if(start&&t&&t.clientX-start.x>100&&Math.abs(t.clientY-start.y)<65)setSecretAdminOpen(true)}}>{!embeddedEditorTab&&<ProfileSearchHome profile={profile} postCount={postCount} expanded={searchProfileExpanded} editing={editing} onExpand={()=>setSearchProfileExpanded(true)} onCollapse={closeSearchProfilePanel} onEdit={()=>{setSearchProfileExpanded(true);setTab("profile");setEditing(true)}} onSettings={()=>window.dispatchEvent(new CustomEvent("1muslim:open-settings",{detail:{section:"home"}}))} onPosts={()=>openSearchProfilePanel("posts")} onSignOut={()=>void signOut()}/>}{(searchProfileExpanded||editing)&&<ProfileSocialHub profile={profile}>{!editing?<ProfileOverview profile={profile} tier={tier} ashab={ashab} postCount={postCount} postText={postText} setPostText={setPostText} posting={posting} publishFirstPost={publishFirstPost} onEdit={()=>{setTab("profile");setEditing(true)}}/>:<div className="profileShell" style={{"--profile-editor-accent":memberAccent(profile.profile_accent)} as CSSProperties}
      onTouchStart={e=>{
        const el=e.target as HTMLElement,t=e.touches[0];
        editorSwipeStart.current=null;
        // Blank editor surfaces can swipe between sections; forms, maps, media and carousels keep their gestures.
        if(!t||t.clientX<24||!el.closest(".profileEditor,.avatarEditor,.headerEditor")||el.closest("button,a,input,textarea,select,canvas,video,audio,[contenteditable=true],[role=slider],.avatarChoiceGrid,.pcxShell,.p2AutoRail,[data-profile-swipe-block]"))return;
        editorSwipeStart.current={x:t.clientX,y:t.clientY};
      }}
      onTouchEnd={e=>{
        const start=editorSwipeStart.current,t=e.changedTouches[0];
        editorSwipeStart.current=null;
        if(!start||!t||Math.abs(t.clientY-start.y)>48||Math.abs(t.clientX-start.x)<110)return;
        const index=PROFILE_EDITOR_SECTIONS.findIndex(section=>section.id===tab);
        const next=index+(t.clientX<start.x?1:-1);
        if(next>=0&&next<PROFILE_EDITOR_SECTIONS.length)setTab(PROFILE_EDITOR_SECTIONS[next].id);
      }}>
    {!embeddedEditorTab&&<ProfileOrbitStudio profile={profile} onEdit={()=>setEditing(false)} ashab={ashab} editing editorTab={tab}/>}
    
    <div className="profileEditorToolbar">
      <button type="button" className="ghost profileEditorClose" onClick={()=>{if(embeddedEditorTab)window.dispatchEvent(new Event("1muslim:close-settings"));else setEditing(false)}} aria-label="Close profile editor"><span aria-hidden="true">×</span>Close</button>
      <strong>Edit Profile</strong>
      <button type="button" className="primary profileEditorSave" onClick={save} disabled={saving||colorSaving} aria-label="Save profile changes"><span className="profileEditorSaveIcon" aria-hidden="true">✓</span><span>{saving||colorSaving?"Saving…":<>Save<span className="profileEditorSaveExtended"> changes</span></>}</span></button>
    </div>
    <nav className="profileEditorNav" aria-label="Profile editor sections"><div className="profileTabs" ref={editorRailRef}>
      {PROFILE_EDITOR_SECTIONS.map(section=><button type="button" key={section.id} className={tab===section.id?"active":""} aria-pressed={tab===section.id} onClick={()=>setTab(section.id)}><span className="profileEditorTabGlyph" aria-hidden="true">{section.glyph}</span><span>{section.label}</span></button>)}
    </div><span className="profileEditorNavCue" aria-hidden="true">›</span></nav>{tab==="analytics"&&<section className="profileEditor" aria-label="Quran and profile analytics"><ProfileAnalytics inline userId={profile.id}/></section>}
    {tab==="profile"&&<section className="profileEditor"><div className="editorIntro"><h2>Personal Information</h2></div><div className="formGrid">
      <label>Display name<input value={profile.display_name??""} disabled={!!displayCooldown} onChange={e=>update({display_name:e.target.value})}/><small className="fieldNote">{displayCooldown?`You can change your display name again in ${displayCooldown}.`:"You can change this once every 3 days."}</small></label><label>1Muslim ID<input value={profile.username?`@${brandedHandle(profile.username)}`:""} placeholder="@yourID" disabled={!!usernameCooldown} aria-invalid={usernameStatus==="taken"} aria-describedby="profile-muslim-id-feedback" className={usernameStatus==="taken"?"profileMuslimIdInputTaken":""} onChange={e=>{update({username:e.target.value.replace(/^@+/,"")});setUsernameError("");}}/><small className="fieldNote">{usernameCooldown?`You can change your 1Muslim ID again in ${usernameCooldown}.`:"You can change this once every 3 days."}</small><span id="profile-muslim-id-feedback" aria-live="polite" className={usernameStatus==="taken"?"profileMuslimIdError":"profileMuslimIdHint"}>{usernameError|| (usernameStatus==="checking"?"Checking 1Muslim ID…":usernameStatus==="available"?"✓ 1Muslim ID is available":usernameStatus==="error"?"Unable to check availability. Please try again.":"")}</span></label><label>First name<input value={profile.first_name??""} onChange={e=>update({first_name:e.target.value})}/></label><label>Last name<input value={profile.last_name??""} onChange={e=>update({last_name:e.target.value})}/></label>
      <label>Gender<input value={profile.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : "Not selected"} disabled /><small className="fieldNote">Gender is selected once during onboarding and cannot be changed.</small></label>
      <label>City<input value={profile.city??""} onChange={e=>update({city:e.target.value})}/></label><label>State<input value={profile.state??""} onChange={e=>update({state:e.target.value})}/></label><label>Country<input value={profile.country??""} onChange={e=>update({country:e.target.value})}/></label>
      <label className="wide">Bio <small>{(profile.bio??"").length}/35</small><textarea value={profile.bio??""} maxLength={35} rows={2} onChange={e=>update({bio:e.target.value})}/></label>
    </div>{message&&<div className={message===TAKEN_MUSLIM_ID?"saveMessage profileMuslimIdError":"saveMessage"} role={message===TAKEN_MUSLIM_ID?"alert":"status"}>{message}</div>}</section>}

    {tab==="live"&&<section className="profileEditor">{adminAccessChecked?<ProfileConnectionsPanel isAdmin={isHudHudAdmin}/>:<div className="profileConnectionsChecking" role="status">Preparing your connections…</div>}</section>}
    {tab==="shahada"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">PRIVATE SAFE VAULT</span><h2>Your Shahada verification.</h2><p>Your original voice recording is private. Only your authenticated account can request a short-lived playback link. Your public profile never exposes the recording.</p></div>
      <ProfileSubscriptionStatus/><div className="shahadaVaultCard">
        <div className="shahadaVaultStatus"><span className="shahadaVaultSymbol" aria-hidden="true">{profile.shahada_verified_at?"✓":"1M"}</span><div><span className="eyebrow">SHAHADA STATUS</span><h3>{profile.shahada_verified_at?"Shahada verified":"Not yet verified"}</h3><p>{profile.shahada_verified_at?`Completed ${new Date(profile.shahada_verified_at).toLocaleDateString()} · ${profile.shahada_language==="ar"?"Arabic":"English"}`:"Complete your private declaration to receive Shahada verification."}</p></div></div>
        {!profile.shahada_verified_at?<div className="shahadaVaultAction"><p>Choose Arabic or English, record your Shahada, or personally affirm the declaration. Your recording is private and never published.</p><Link className="shahadaVerifyButton" href="/onboarding?return=profile">Verify my Shahada <span aria-hidden="true">→</span></Link></div>:profile.shahada_audio_path?<div className="shahadaVaultPlayer"><div className="shahadaVaultPlayerHead"><span className="shahadaVaultPlaySymbol">♫</span><div><strong>My Shahada</strong><small>Private voice recording · only you can listen</small></div></div>{vaultUrl?<audio controls preload="metadata" src={vaultUrl} aria-label="Play your private Shahada recording"/>:<p className="muted">Preparing your private recording…</p>}</div>:<div className="shahadaVaultAction"><strong>✓ Your declaration is verified</strong><p>You completed verification by personal affirmation. No voice recording was saved.</p></div>}
      </div>
      <style jsx>{`.shahadaVaultCard{border:1px solid #d9e8df;background:linear-gradient(145deg,#fff,#f4faf6);color:#173b2d;border-radius:24px;padding:22px;display:grid;gap:18px;box-shadow:0 8px 30px #163f2510}.shahadaVaultStatus{display:flex;align-items:center;gap:15px}.shahadaVaultSymbol{width:55px;height:55px;flex:0 0 55px;display:grid;place-items:center;border-radius:18px;background:#e0f5e9;color:#176744;font-size:28px}.shahadaVaultCard h3{margin:5px 0;font-size:21px;color:#173b2d}.shahadaVaultCard p{margin:5px 0;color:#637c70;font-size:13px;line-height:1.5}.shahadaVaultAction{border-top:1px solid #e0eae4;padding-top:17px}.shahadaVerifyButton{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;margin-top:16px;padding:15px 18px;background:#176744;color:#fff!important;border-radius:15px;font-size:15px;font-weight:750;text-decoration:none;box-shadow:0 6px 18px #17674430}.shahadaVaultPlayer{border:1px solid #dcece1;border-radius:18px;padding:15px;background:#fff}.shahadaVaultPlayerHead{display:flex;align-items:center;gap:12px;margin-bottom:14px}.shahadaVaultPlaySymbol{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#dcf5e7;color:#176744;font-size:23px}.shahadaVaultPlayerHead strong{display:block;font-size:16px}.shahadaVaultPlayerHead small{display:block;color:#6a8375;font-size:11px;margin-top:3px}.shahadaVaultCard audio{width:100%;height:44px;accent-color:#176744}`}</style>
    </section>}
    <style>{`.profileEditorNav{margin:0 0 12px!important;padding:8px 0!important}.profileEditorToolbar{margin-bottom:6px!important}.profileTabs{gap:6px!important;margin:0!important}.profileTabs button{border-radius:999px!important;padding:9px 12px!important}.avatarEditor{display:block!important;padding:0!important;background:transparent!important;border:0!important}.avatarSettingsCard{background:#fff;color:#172d47;border:1px solid #e3e8ee;border-radius:18px;padding:18px;margin:0 0 16px}.avatarSettingsCard h2{margin:6px 0;font-size:21px}.avatarChoiceGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}.avatarChoice,.avatarUploadTile{border:1px solid #e0e6ee!important;border-radius:14px!important;background:#f9fbfd!important;color:#1c334e!important;box-shadow:none!important;min-width:0!important;overflow:hidden}.avatarChoice.selected{border-color:#6a8eb4!important;background:#edf4fc!important}.avatarUploadTile{cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;min-height:150px;gap:9px}.avatarUploadTile input{position:absolute;width:1px;height:1px;opacity:0}.avatarUploadSymbol{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#e9eef5;color:#42668c;font-size:38px;font-weight:300}.avatarChoice img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px}.avatarChoice span,.avatarChoice small{font-size:12px}.avatarEditor .silverBadgeReveal,.avatarEditor .avatarTransitionStage,.avatarEditor .avatarPreview{display:none!important}`}</style>{tab==="avatar"&&<section className="avatarEditor"><div className="avatarSettingsCard"><span className="eyebrow">YOUR AVATAR</span><h2>Choose your look</h2><p className="muted">Select an official avatar or upload your own image. Changes save automatically.</p><div className="avatarChoiceGrid" role="region" aria-label="Avatar carousel"><label className="avatarChoice avatarUploadTile" aria-label="Upload your image"><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingAvatar} onChange={e=>{void uploadAdminAvatar(e.target.files?.[0]);e.target.value=""}}/><span className="avatarUploadSymbol">{uploadingAvatar?"…":"＋"}</span><span>Your Image</span><small>{uploadingAvatar?"Uploading…":"Upload"}</small></label>{(Array.isArray(profile.avatar_config?.customAvatarHistory)?profile.avatar_config.customAvatarHistory:typeof profile.avatar_config?.adminAvatarUrl==="string"?[profile.avatar_config.adminAvatarUrl]:[]).filter((url:unknown):url is string=>typeof url==="string"&&url.includes("/storage/v1/object/public/avatars/")).slice(0,3).map((url:string,index:number)=><div key={url} className={`avatarChoice ${profile.avatar_config?.selectedAvatarUrl===url?"selected":""}`} style={{position:"relative",display:"flex",flexDirection:"column",gap:6}}><button type="button" disabled={avatarSaving||uploadingAvatar} onClick={()=>void equipCustomAvatar(url)} style={{background:"transparent",border:0,padding:0,color:"inherit",textAlign:"left",width:"100%"}}><img src={url} alt={`Your custom avatar ${index+1}`}/><span>Custom {index+1}</span><small>{profile.avatar_config?.selectedAvatarUrl===url?"Equipped ✓":"Equip"}</small></button><button type="button" disabled={avatarSaving||uploadingAvatar} onClick={()=>void removeCustomAvatar(url)} aria-label={`Remove custom avatar ${index+1}`} style={{position:"absolute",right:5,top:5,borderRadius:20,padding:"5px 9px",background:"#fff",color:"#8b2932",border:"1px solid #d9aab0"}}>✕</button></div>)}{AVATAR_CHOICES.filter(choice=>{const gender=String(profile.avatar_gender||profile.gender||"").toLowerCase();return gender==="female"||gender==="woman"?choice.label.toLowerCase().includes("female"):gender==="male"||gender==="man"?choice.label.toLowerCase().includes("male")&&!choice.label.toLowerCase().includes("female"):true}).map(choice=>{const locked=profile.xp_total<choice.xp;const chosen=profile.avatar_config?.selectedAvatarUrl===choice.url;return <button type="button" key={choice.url} onClick={()=>void selectAvatar(choice.url)} disabled={avatarSaving||locked} className={`avatarChoice ${chosen?"selected":""} ${locked?"locked":""}`}><div style={{position:"relative"}}><img src={choice.url} alt=""/>{("isNew" in choice && choice.isNew) && Date.now()<new Date("2026-11-20T10:00:00Z").getTime() && <span aria-label="New avatar" style={{position:"absolute",right:5,top:5,padding:"4px 7px",borderRadius:8,background:"#eef4ff",color:"#173252",fontSize:10,fontWeight:800,boxShadow:"0 2px 8px #0004"}}>NEW</span>}</div><span>{choice.label}</span><small>{locked?`🔒 ${choice.xp.toLocaleString()} XP`:chosen?"Equipped ✓":"Equip"}</small></button>})}</div><p role="status" className="muted">{message}</p></div></section>}

    <style>{`@keyframes avatarUnlockGlow{0%{transform:scale(.94)}35%{transform:scale(1.065)}100%{transform:scale(1)}}@keyframes avatarSwapFade{0%{opacity:.35;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}@keyframes avatarUnlockLabel{0%{opacity:0;transform:translateY(12px)}25%,75%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}.avatarTransitionStage{position:relative}.avatarUnlock .avatarPreview{animation:avatarUnlockGlow 2.5s ease-in-out both}.avatarSwap .avatarPreview{animation:avatarSwapFade .75s ease-out both}.silverBadgeReveal{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;pointer-events:none;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at center,#0b332dd9 0%,#071a18ed 74%);animation:silverReveal 2.55s ease-in-out both}.silverBadgeHalo{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,#e7d3a04d,transparent 70%);filter:blur(15px);animation:silverHalo 2.5s ease-in-out both}.silverBadgeArt{position:relative;width:min(48%,150px);height:auto;object-fit:contain;filter:drop-shadow(0 6px 22px #b5e6d07a);animation:silverBadgeEnter 2.5s cubic-bezier(.2,.75,.25,1) both}.silverBadgeTitle{position:relative;color:#f2e3b5;font-size:clamp(12px,2.5vw,18px);font-weight:800;letter-spacing:.13em;text-shadow:0 2px 18px #d9c27c99}.silverBadgeSub{position:relative;color:#c1dacb;font-size:11px;letter-spacing:.04em}@keyframes silverReveal{0%{opacity:0}14%,73%{opacity:1}100%{opacity:0}}@keyframes silverHalo{0%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(1.6)}}@keyframes silverBadgeEnter{0%{opacity:0;transform:translateY(18px) scale(.7) rotate(-7deg)}30%,75%{opacity:1;transform:translateY(0) scale(1) rotate(0)}100%{opacity:0;transform:translateY(-8px) scale(1.06)}}@media(prefers-reduced-motion:reduce){.avatarUnlock .avatarPreview,.avatarSwap .avatarPreview,.silverBadgeReveal,.silverBadgeHalo,.silverBadgeArt{animation:none}}`}</style>
    
{tab==="header"&&<section className="headerEditor profileAppearanceModern">
  <header className="appearanceModernIntro">
   <span className="eyebrow">APPEARANCE</span><h2>Make it yours.</h2>
   <p>Pick your cover and the colors that make your profile feel like you.</p>
  </header>
  <div className="profileCoverUploader appearanceModernCover">
   <div className="appearanceModernSectionTop">
    <div><h3>Cover photo</h3><small>Swipe to choose</small></div>
    <label className="appearanceModernUpload">
     <span aria-hidden="true">↥</span> Upload your own
     <input aria-label="Upload profile cover image" type="file" accept="image/jpeg,image/png,image/webp"
      onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){setMessage("Choose a JPG, PNG or WebP under 8 MB.");e.target.value="";return}setCoverFile(file);setCoverPreview(URL.createObjectURL(file));setCoverZoom(1);setCoverPosition(50);e.target.value=""}}/>
    </label>
   </div>
   <div className="profileStockCovers appearanceModernCoverRail" role="region" aria-label="Available profile cover photos, swipe to browse" tabIndex={0}>
    {COVER_STOCK.map(c=><button type="button" key={c.id} disabled={stockSaving} onClick={()=>void selectStockCover(c.url)}
      aria-pressed={profileCoverImage(profile)===c.url} aria-label={`Use ${c.label} profile cover`}
      className={profileCoverImage(profile)===c.url?"selected":""}>
      <img src={c.url} loading="lazy" alt=""/><span>{c.label}</span>
    </button>)}
   </div>
   {coverPreview&&<div className="appearanceModernCrop">
    <p role="status">Preview your upload before saving.</p>
    <div className="profileCoverCrop" style={{backgroundImage:`url("${coverPreview}")`,backgroundSize:`auto ${coverZoom*100}%`,backgroundPosition:`center ${coverPosition}%`}}/>
    <div className="appearanceModernCropControls">
     <label>Zoom<input type="range" min="1" max="2.5" step=".05" value={coverZoom} onChange={e=>setCoverZoom(Number(e.target.value))}/></label>
     <label>Position<input type="range" min="0" max="100" value={coverPosition} onChange={e=>setCoverPosition(Number(e.target.value))}/></label>
    </div>
    <div className="appearanceModernCropActions">
     <button type="button" disabled={coverUploading} onClick={()=>void uploadProfileCover()}>{coverUploading?"Uploading…":"Save cover ✓"}</button>
     <button type="button" className="appearanceModernCancel" onClick={()=>{setCoverFile(null);setCoverPreview(null)}}>Cancel</button>
    </div>
   </div>}
   {stockSaving&&<small role="status" className="appearanceModernSaving">Saving cover…</small>}
  </div>
  <div className="backgroundStudio profileColorStudio" style={{"--theme-preview-accent":memberAccent(profile.profile_accent),"--theme-preview-ink":MEMBER_TEXT_COLORS[profile.profile_accent]||"#20374e"} as CSSProperties}>
   <div className="backgroundStudioHeading">
    <div><span className="eyebrow">PROFILE COLORS</span><h3>Choose your vibe</h3></div>
    <button type="button" className="backgroundStudioToggle" aria-expanded={backgroundStudioOpen} onClick={()=>setBackgroundStudioOpen(v=>!v)}>
     {backgroundStudioOpen?"Hide colors ↑":"Change colors ↓"}
    </button>
   </div>
   {backgroundStudioOpen?<div className="profileColorStudioBody">
    <div className="profileThemePreview" aria-label="Live preview showing profile text, borders and shadows">
     <div className="profileThemePreviewCover" style={{backgroundImage:`url(${JSON.stringify(profileCoverImage(profile))})`}}><span>1Muslim</span></div>
     <div className="profileThemePreviewIdentity">
      <img src={typeof profile.avatar_config?.selectedAvatarUrl==="string"?profile.avatar_config.selectedAvatarUrl:profile.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg"} alt="" />
      <div><strong>{profile.display_name||"Your profile"}</strong><small>{profile.bio||"Let your message inspire."}</small></div>
     </div>
     <div className="profileThemePreviewDetails"><span><b>3</b> Followers</span><span><b>10</b> Following</span><span className="profileThemePreviewAction">✦ Follow</span></div>
    </div>
    <div className="backgroundStudioGrid" role="group" aria-label="Select profile accent color">
     {BACKGROUND_CHOICES.map(choice=><button type="button" key={choice.id}
      className={`backgroundStudioChoice ${profile.profile_background===choice.id?"selected":""}`}
      onClick={()=>void chooseBackground(choice)} disabled={colorSaving} aria-pressed={profile.profile_background===choice.id}>
      <span className={`backgroundStudioGradient backgroundGradient-${choice.accent}`}>{profile.profile_background===choice.id&&<span className="backgroundStudioCheck">✓</span>}</span>
      <span className="backgroundStudioName">{choice.label}</span>
     </button>)}
    </div>
    <p className="profileColorStudioNote">Updates text, trims, borders and glow.</p>
   </div>:<div className="backgroundStudioCollapsed"><span className={`backgroundStudioDot backgroundGradient-${profile.profile_accent}`}/><strong>{BACKGROUND_CHOICES.find(c=>c.id===profile.profile_background)?.label||"Your color"}</strong><span>✓ Saved</span></div>}
   <p role="status" className="backgroundStudioStatus">{colorSaving?"Saving color…":message.startsWith("Could not save background")?message:"✓ Changes save automatically"}</p>
  </div>
 </section>}
    {tab==="header"&&<ProfileSpotlightEditor userId={profile.id}/>}
    <ProfileContentSections userId={profile.id}/>
  </div>}<style>{`body:has(.profilePage){overflow-y:auto!important}.profilePage .muslimMobileDock,body:has(.profilePage) .muslimMobileDock{display:none!important}.profilePage{min-height:100dvh;overflow-x:hidden;overflow-y:visible!important}.profileShell{max-width:1100px;margin:0 auto;padding-bottom:110px!important;overflow:visible!important}.profileTabs{display:flex!important;gap:8px!important;overflow-x:auto!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:8px 4px 15px!important}.profileTabs::-webkit-scrollbar{display:none}.profileTabs button{flex:0 0 auto!important;scroll-snap-align:start;min-height:43px!important;border-radius:999px!important;padding:10px 16px!important;font-size:13px!important;letter-spacing:.01em!important;white-space:nowrap!important;transition:background .2s ease,border-color .2s ease!important}.profileTabs button.active{box-shadow:0 3px 16px rgba(19,110,79,.2)}.profileEditor textarea{min-height:70px!important;resize:vertical}.profileHero{padding-top:160px!important}.profileOverviewBody{padding-top:150px!important}.avatarPreview{min-height:100px!important;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:45px 20px 16px!important;overflow:visible!important}.avatarTransitionStage{overflow:visible!important}@media(max-width:640px){.profileShell{padding-left:12px!important;padding-right:12px!important}.profileTabs{position:sticky;top:0;z-index:20;backdrop-filter:blur(18px);background:rgba(9,33,29,.9);border-radius:16px}}`}</style><style>{`
.profileCommandPage{background:#f3f7fc!important;color:#213954}
.profileCoverBanner{height:clamp(155px,27vw,270px);background:linear-gradient(120deg,#c7d9ed,#eef5fc 55%,#8baed0);background-position:center;background-size:cover;border-radius:22px 22px 0 0;position:relative;overflow:hidden}
.profileCoverBadge{position:absolute;bottom:12px;left:15px;background:#0b274e99;color:white;padding:7px 12px;border-radius:30px;font-size:10px;letter-spacing:.14em}
.profileCoverUploader{background:#f6f9fe;color:#244467;border:1px solid #d3e0ee;padding:18px;border-radius:18px;margin:15px 0;display:grid;gap:12px}
.profileCoverUploader h3,.profileCoverUploader p{margin:0}
.profileStockCovers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.profileStockCovers button{padding:0!important;overflow:hidden;border:2px solid #cad8e9!important;background:#fff!important;color:#244467!important;border-radius:12px;display:grid}.profileStockCovers button.selected{border-color:#2777c5!important}.profileStockCovers img{width:100%;height:64px;object-fit:cover}.profileStockCovers span{font-size:11px;padding:6px 2px}.profileCoverUploader input[type=file]{max-width:100%}.profileCoverUploader label{display:grid;gap:5px}.profileCoverUploader button{background:#24548a;color:white;padding:12px;border-radius:12px;border:0;font-weight:700}
.profileCoverCrop{width:100%;aspect-ratio:3/1;border-radius:12px;background-repeat:no-repeat;background-color:#d8e5f4;background-size:cover!important}
.profileCommandPage .profileOrbitMagazine{background:#f9fbff!important;color:#1c3555!important;border:1px solid #dce6f3!important;border-radius:26px;box-shadow:0 12px 38px #183e6418}
.profileCommandPage .profileOrbitMagazine h2{font-family:inherit!important;font-weight:800!important;letter-spacing:.035em;font-size:clamp(23px,5vw,39px)}
.profileCommandPage .profileOrbitStage{border-radius:26px;overflow:hidden;background:radial-gradient(circle at 50% 50%,#193d6b,#07192e 75%)}
.profileCommandPage .profileOrbitIdentity{background:#fff;color:#1e385a;border-radius:22px;padding:22px;box-shadow:0 5px 22px #1a3d6115}
.profileCommandPage .profileOrbitIdentity h3{color:#18365c}
.profileCommandPage .profileOrbitIdentity button,.profileCommandPage .profileStudioNav button{background:#eaf2fd;color:#224d7d;border:1px solid #c9dbf1;border-radius:14px}
.profileCommandPage .profileShell{background:#f3f7fc;color:#213954}
.profileCommandPage .profileHero,.profileCommandPage .profileEditor,.profileCommandPage .avatarEditor,.profileCommandPage .headerEditor{background:#fff;color:#213954;border:1px solid #dbe6f3;border-radius:22px;box-shadow:0 8px 24px #203e6010;padding:clamp(16px,4vw,28px)}
.profileCommandPage .profileTabs{position:static!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));background:transparent!important;gap:10px!important;overflow:visible!important}
.profileCommandPage .profileTabs button{border:1px solid #c9d9ed!important;border-radius:14px!important;background:#fff!important;color:#24466c!important;min-height:52px!important;font-weight:700}
.profileCommandPage .profileTabs button.active{background:#24548a!important;color:#fff!important}
.profileCommandPage .profileEditor input,.profileCommandPage .profileEditor textarea{background:#f8fbff;color:#1c3451;border:1px solid #cbd9ea;border-radius:12px}
@media(min-width:720px){.profileCommandPage .profileTabs{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* Consistent HudHud Command floating-card visual system throughout Profile */
.profileCommandPage{min-height:100vh;background-color:#f2f6fc!important;background-image:linear-gradient(#2c568009 1px,transparent 1px),linear-gradient(90deg,#2c568009 1px,transparent 1px)!important;background-size:32px 32px!important}
.profileCommandPage .profileShell{max-width:1120px;margin:auto;padding:clamp(12px,3vw,30px)!important;background:transparent!important}
.profileCommandPage .profileOrbitMagazine{background:transparent!important;border:0!important;box-shadow:none!important;display:grid;gap:18px}
.profileCommandPage .profileCoverBanner{border:1px solid #e0e8f3;box-shadow:0 12px 30px #193c631c;border-radius:25px!important}
.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes,.profileCommandPage .profileOverview,.profileCommandPage .profileOverviewCover,.profileCommandPage .profileOverviewBody,.profileCommandPage .profileOverviewMain,.profileCommandPage .profileOverviewStats,.profileCommandPage .profileOverviewSection,.profileCommandPage .profileHeroTop,.profileCommandPage .profileHeroActions,.profileCommandPage .profileEditorToolbar,.profileCommandPage .profileTabs,.profileCommandPage .profileEditor,.profileCommandPage .profileCoverUploader{background:#fff!important;color:#203954!important;border:1px solid #dce5f1!important;border-radius:24px!important;box-shadow:0 9px 28px #203e6017!important}
.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes,.profileCommandPage .profileOverviewSection,.profileCommandPage .profileHeroTop,.profileCommandPage .profileHeroActions,.profileCommandPage .profileEditorToolbar{padding:clamp(16px,3vw,26px)!important}
.profileCommandPage .profileOrbitStage{box-shadow:0 10px 30px #203e601c;border:1px solid #dce5f1}
.profileCommandPage .profileOrbitMagazine h2,.profileCommandPage .profileOrbitMagazine h3,.profileCommandPage .profileOverview h2,.profileCommandPage .profileEditor h2,.profileCommandPage .profileEditor h3{color:#19395f!important}
.profileCommandPage .profileOrbitMagazine p,.profileCommandPage .profileOverview p,.profileCommandPage .profileEditor p{line-height:1.6}
.profileCommandPage .profileOrbitMetrics>*,.profileCommandPage .profileOrbitAnalytics>*,.profileCommandPage .profileOverviewStats>*{border-radius:16px;background:#f7faff;border:1px solid #e2eaf4;padding:12px}
.profileCommandPage .profileEditor{display:grid;gap:18px}
.profileCommandPage .profileEditor label{color:#284768}
.profileCommandPage .profileEditor input,.profileCommandPage .profileEditor textarea,.profileCommandPage .profileEditor select{background:#f8fbff!important;color:#193755!important;border:1px solid #cbd9ea!important;border-radius:12px!important}
.profileCommandPage .profileStockCovers button{box-shadow:0 4px 12px #244c7517;transition:transform .2s ease,box-shadow .2s ease}
.profileCommandPage .profileStockCovers button:active{transform:scale(.98)}
.profileCommandPage .profileTabs{padding:12px!important}
.profileCommandPage .profileTabs button{box-shadow:0 3px 12px #244c7510}
.profileCommandPage .profileOrbitMagazine>section,.profileCommandPage .profileOrbitMagazine>article{min-width:0}
@media(max-width:600px){.profileCommandPage .profileShell{padding:12px!important}.profileCommandPage .profileOrbitMagazine{gap:14px}.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes{padding:16px!important;border-radius:20px!important}.profileCommandPage .profileStockCovers{grid-template-columns:repeat(2,minmax(0,1fr))}}



.profileCommandPage .profileProfessional{display:grid;gap:20px;max-width:1050px;margin:0 auto;color:#1d3553;font-family:Arial,Helvetica,sans-serif}
.profileCommandPage .profileProfessionalCard{background:#fff!important;border:1px solid #dce5f0!important;border-radius:22px!important;box-shadow:0 8px 25px #1d42641a!important;overflow:hidden}
.profileCommandPage .profileProfessionalHeader{padding:0!important}

/* Premium compact profile, scoped to the existing command page. */
.profileCommandPage .profileCompactStats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin:13px 0 2px;padding:10px 0;border-top:1px solid #e6e9ef;border-bottom:1px solid #e6e9ef}.profileCommandPage .profileCompactStats>.profileStatShortcut{appearance:none!important;-webkit-appearance:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;min-width:0!important;margin:0!important;padding:4px 0!important;border:0!important;border-right:1px solid #d8dee8!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;color:#111827!important;text-align:center!important;font:inherit!important;line-height:1.3!important;opacity:1!important}.profileCommandPage .profileCompactStats>.profileStatShortcut:last-child{border-right:0!important}.profileCommandPage .profileCompactStats>.profileStatShortcut strong{color:#111827!important}.profileCommandPage .profileCompactStats>.profileStatShortcut span{color:#526176!important}.profileCommandPage .profileCompactStats>.profileStatShortcut:focus-visible{outline:2px solid #245b95!important;outline-offset:-2px!important}.profileCommandPage .profileCompactStats>div{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;border-right:1px solid #d8dee8;min-width:0}.profileCommandPage .profileCompactStats>div:last-child{border-right:0}.profileCommandPage .profileCompactStats strong{font-size:clamp(14px,3.5vw,22px);font-weight:850;color:#111827}.profileCommandPage .profileCompactStats span{font-size:clamp(9px,2.5vw,12px);color:#526176}.profileCommandPage .profileOverview{padding-bottom:calc(125px + env(safe-area-inset-bottom,0px))}
.profileCommandPage .profileProfessionalCover{height:clamp(120px,22vw,200px)}
.profileCommandPage .profileProfessionalIdentity{padding:0 clamp(15px,3vw,26px) 15px}
.profileCommandPage .profileProfessionalAvatar{width:88px;height:88px;margin-top:-44px;border:4px solid white;box-shadow:0 5px 17px #17263d30}
.profileCommandPage .profileProfessionalIdentity h1{font-size:clamp(23px,4.5vw,32px);margin:7px 0 3px;line-height:1.15}
.profileCommandPage .profileProfessionalIdentity p{margin:5px 0;line-height:1.35}
.profileCommandPage .profileProfessionalBio{font-size:14px}
.profileCommandPage .profileProfessionalHandle{display:inline-block;padding:3px 9px;border:1px solid #d8dee7;border-radius:999px;background:#f4f6f9;font-size:13px}
.profileCommandPage .profileProfessionalLocation{font-size:13px}
.profileCommandPage .profileProfessionalConnection{font-size:13px}
.profileCommandPage .profileProfessionalEdit{width:36px;height:36px;right:16px;top:12px;font-size:19px;background:#ffffffd9;border:1px solid #dce1e8}
.profileCommandPage .profileCoverBrand{position:absolute;top:12px;left:14px;background:#0b1426a8;color:#fff;border:1px solid #ffffff55;border-radius:999px;padding:6px 13px;font-size:14px;font-weight:800;backdrop-filter:blur(12px)}
.profileCommandPage .profilePremiumTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:12px 0 4px;padding:5px;background:linear-gradient(145deg,#f9fafc,#e8ecf2);border:1px solid #d9dfe9;border-radius:22px}
.profileCommandPage .profilePremiumTabs button{border:0;border-radius:17px;background:transparent;color:#23334a;padding:12px 4px;font-size:clamp(11px,2.8vw,14px);font-weight:750;cursor:pointer}
.profileCommandPage .profilePremiumTabs button[aria-pressed=true]{background:#101a2b;color:#fff;box-shadow:0 5px 12px #0b162c35}
@media(max-width:480px){.profileCommandPage .profileProfessionalCover{height:132px}.profileCommandPage .profileProfessionalIdentity{padding-bottom:12px}.profileCommandPage .profileProfessionalIdentity h1{font-size:24px}}
.profileCommandPage .profileProfessionalCover{height:clamp(160px,28vw,270px);background-position:center;background-size:cover;position:relative}
.profileCommandPage .profileCoverEdit{position:absolute;right:18px;top:18px;border:0;border-radius:28px;background:#fffffff0;color:#244b73;padding:10px 15px;font-weight:700}
.profileCommandPage .profileProfessionalIdentity{padding:0 clamp(18px,4vw,36px) 28px;position:relative}
.profileCommandPage .profileProfessionalAvatar{display:block;width:112px;height:112px;border-radius:50%;object-fit:cover;border:5px solid #fff;box-shadow:0 4px 15px #203d5b24;margin-top:-56px;position:relative}
.profileCommandPage .profileProfessionalEdit{position:absolute;right:22px;top:20px;background:#edf4fb;border:1px solid #cddceb;border-radius:50%;width:44px;height:44px;font-size:22px;color:#234d7a}
.profileCommandPage .profileProfessionalIdentity h1{font-size:clamp(27px,5vw,40px);margin:14px 0 6px;font-weight:800;letter-spacing:-.025em;color:#172d47}
/* Premium compact profile, scoped to the existing command page. */
.profileCommandPage .profileProfessionalCover{height:clamp(120px,22vw,200px)}
.profileCommandPage .profileProfessionalIdentity{padding:0 clamp(15px,3vw,26px) 15px}
.profileCommandPage .profileProfessionalAvatar{width:88px;height:88px;margin-top:-44px;border:4px solid white;box-shadow:0 5px 17px #17263d30}
.profileCommandPage .profileProfessionalIdentity h1{font-size:clamp(23px,4.5vw,32px);margin:7px 0 3px;line-height:1.15}
.profileCommandPage .profileProfessionalIdentity p{margin:5px 0;line-height:1.35}
.profileCommandPage .profileProfessionalBio{font-size:14px}
.profileCommandPage .profileProfessionalHandle{display:inline-block;padding:3px 9px;border:1px solid #d8dee7;border-radius:999px;background:#f4f6f9;font-size:13px}
.profileCommandPage .profileProfessionalLocation{font-size:13px}
.profileCommandPage .profileProfessionalConnection{font-size:13px}
.profileCommandPage .profileProfessionalEdit{width:36px;height:36px;right:16px;top:12px;font-size:19px;background:#ffffffd9;border:1px solid #dce1e8}
.profileCommandPage .profileCoverBrand{position:absolute;top:12px;left:14px;background:#0b1426a8;color:#fff;border:1px solid #ffffff55;border-radius:999px;padding:6px 13px;font-size:14px;font-weight:800;backdrop-filter:blur(12px)}
.profileCommandPage .profilePremiumTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:12px 0 4px;padding:5px;background:linear-gradient(145deg,#f9fafc,#e8ecf2);border:1px solid #d9dfe9;border-radius:22px}
.profileCommandPage .profilePremiumTabs button{border:0;border-radius:17px;background:transparent;color:#23334a;padding:12px 4px;font-size:clamp(11px,2.8vw,14px);font-weight:750;cursor:pointer}
.profileCommandPage .profilePremiumTabs button[aria-pressed=true]{background:#101a2b;color:#fff;box-shadow:0 5px 12px #0b162c35}
@media(max-width:480px){.profileCommandPage .profileProfessionalCover{height:132px}.profileCommandPage .profileProfessionalIdentity{padding-bottom:12px}.profileCommandPage .profileProfessionalIdentity h1{font-size:24px}}

.profileCommandPage .profileProfessionalIdentity p{margin:8px 0;line-height:1.55}
.profileCommandPage .profileProfessionalHandle,.profileCommandPage .profileProfessionalLocation{color:#64748b}
.profileCommandPage .profileProfessionalBio{font-size:17px}
.profileCommandPage .profileProfessionalConnection{color:#2463a1;font-weight:700}
.profileCommandPage .profileProfessionalActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.profileCommandPage .profileProfessionalActions button,.profileCommandPage .profileProfessionalActions a,.profileCommandPage .profileProfessionalNav button{border-radius:22px;padding:11px 17px;border:1px solid #b9cee5;background:#f5f9ff;color:#204b79;text-decoration:none;font-weight:700;font-size:14px}
.profileCommandPage .profileProfessionalActions button:first-child,.profileCommandPage .profileProfessionalNav button[aria-pressed=true]{background:#235a93;color:#fff}
.profileCommandPage .profileProfessionalSummary,.profileCommandPage .profileProfessionalWorkspace{padding:clamp(20px,4vw,32px)!important}
.profileCommandPage .profileProfessional h2{font-size:23px;font-weight:800;color:#1a3455;margin:0 0 16px}
.profileCommandPage .profileProfessional h3{font-size:17px;color:#1a3455}
.profileCommandPage .profileProfessionalStatGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.profileCommandPage .profileProfessionalStatGrid>div{background:#f7faff;border:1px solid #e2eaf4;border-radius:16px;padding:16px;display:grid;gap:8px}
.profileCommandPage .profileProfessionalStatGrid strong{font-size:clamp(18px,3vw,26px);color:#204b79;overflow-wrap:anywhere}
.profileCommandPage .profileProfessionalStatGrid span{color:#667991;font-size:12px}
.profileCommandPage .profileProfessionalNav{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.profileCommandPage .profileProfessionalInner{background:#f8fbff;border:1px solid #e2eaf4;border-radius:16px;padding:20px}
.profileCommandPage .profileProfessionalRow{padding:12px;border-bottom:1px solid #dce5f0}
.profileCommandPage .profileOverviewSection{background:#fff!important;color:#203954!important;border:1px solid #dce5f0!important;box-shadow:0 8px 25px #1d42641a!important}
.profileCommandPage .profileOverviewSection *{color:inherit}
.profileCommandPage .profileOverviewSection a{color:#245a95!important}
@media(max-width:550px){.profileCommandPage .profileProfessionalStatGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.profileCommandPage .profileProfessionalAvatar{width:96px;height:96px;margin-top:-48px}.profileCommandPage .profileProfessionalActions{gap:7px}}

.profileCommandPage .profileProfessionalQuickMenu{padding:clamp(18px,3vw,28px)!important}.profileCommandPage .profileProfessionalQuickGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.profileCommandPage .profileProfessionalQuickGrid>a,.profileCommandPage .profileProfessionalQuickGrid>button{min-width:0;display:grid;grid-template-columns:30px 1fr;gap:2px 8px;align-items:center;text-align:left;text-decoration:none;font-size:21px;border-radius:17px;border:1px solid #d4e1f0;background:#f7faff;color:#1d4978;padding:16px;box-shadow:0 5px 14px #244b7210}.profileCommandPage .profileProfessionalQuickGrid span{font-size:15px;font-weight:800;color:#19395f}.profileCommandPage .profileProfessionalQuickGrid small{grid-column:2;font-size:11px;color:#6d8197}.profileCommandPage .profileProfessionalQuickGrid>a:active,.profileCommandPage .profileProfessionalQuickGrid>button:active{transform:scale(.99)}@media(max-width:420px){.profileCommandPage .profileProfessionalQuickGrid>a,.profileCommandPage .profileProfessionalQuickGrid>button{padding:12px 9px;grid-template-columns:22px 1fr;font-size:18px}.profileCommandPage .profileProfessionalQuickGrid span{font-size:12px}}
.profileCommandPage .profileLibraryWrapper{padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}.profileCommandPage .profileLibraryWrapper>.profileMediaLibrary{margin-top:0!important}.profileCommandPage .profileOverview{background:transparent!important}.profileCommandPage .profileLibraryWrapper .contentSection{background:#fff!important}.profileCommandPage .profileLibraryWrapper .contentList{background:transparent!important}.profileCommandPage .profileLibraryWrapper .contentList>a{background:#fff!important;color:#1d3859!important}.profileCommandPage .profileLibraryWrapper .tabs{background:transparent!important}.profileCommandPage .profileLibraryWrapper .tabs button{background:#f6f9ff!important;color:#28496f!important}.profileCommandPage .profileLibraryWrapper .tabs button.on{background:#245b95!important;color:white!important}
.profileSocialHub{min-height:100vh;transition:background-color .4s ease}.profileSocial-feed{background:#fff}.profileSocial-profile{background:#fff}.profileSocial-muslimeen{background:#fff}.profileSocialTop{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px clamp(10px,3vw,28px);background:#fffffff5;border-bottom:1px solid #dce5ef;box-shadow:0 3px 15px #17385712;backdrop-filter:blur(12px)}.profileSocialTabs{display:flex;gap:6px;min-width:0;overflow-x:auto}.profileSocialTabs button,.profileMessengerTrigger{border:1px solid #d4e0ef;background:#f7faff;color:#28486a;padding:12px 15px;border-radius:13px;font-weight:750;white-space:nowrap;min-width:86px}.profileSocialTabs button[aria-current=page]{background:#245b95;color:#fff}.profileSocial-feed .profileSocialTabs button[aria-current=page]{background:#245b95}.profileSocial-muslimeen .profileSocialTabs button[aria-current=page]{background:#245b95}.profileMessengerTrigger{background:#152437;color:#fff;min-width:auto}.profileSocialHome{display:flex;align-items:center;justify-content:center;flex:0 0 42px;height:44px;border:1px solid #d4e0ef;border-radius:13px;background:#f7faff;color:#245b95;text-decoration:none}.profileSocialHome svg,.profileMessengerTrigger svg{width:21px;height:21px;display:block}.profileMessengerTrigger{display:flex;align-items:center;justify-content:center;gap:7px}.profileSocialTabs{flex:1;scrollbar-width:none}.profileSocialTabs::-webkit-scrollbar{display:none}@media(max-width:480px){.profileSocialTop{gap:6px;padding:9px 8px}.profileSocialHome{flex-basis:39px;height:42px}.profileSocialTabs button{min-width:auto;padding:11px 10px;font-size:12px}.profileMessengerTrigger{padding:11px;min-width:42px}.profileMessengerTrigger span{display:none}}.profileSocialTop{justify-content:initial}.profileSocialHome,.profileMessengerTrigger{flex:0 0 48px;min-width:48px;height:48px;box-sizing:border-box}.profileSocialTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;flex:1;overflow:visible}.profileSocialTabs button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;height:48px;padding:0;box-sizing:border-box}.profileSocialTabs svg{width:23px;height:23px;display:block}.profileSocialHome svg,.profileMessengerTrigger svg{width:23px;height:23px}.profileMessengerTrigger span{display:none}@media(max-width:480px){.profileSocialTop{gap:8px;padding:10px 12px}.profileSocialHome,.profileMessengerTrigger{flex-basis:44px;min-width:44px;height:44px}.profileSocialTabs{gap:8px}.profileSocialTabs button{height:44px;padding:0}.profileSocialTabs svg{width:22px;height:22px}}.profileSocialContent{max-width:1050px;margin:20px auto;padding:clamp(14px,3vw,26px);background:#fff;border:1px solid #dce5f0;border-radius:22px;box-shadow:0 9px 28px #203e6017}.profileSocialContent>header h1{margin:0;font-size:27px;color:#183859}.profileSocialContent>header p{color:#667d96}.profileSocialItem{background:#fff;border:1px solid #e1eaf3;box-shadow:0 4px 15px #203e6010;border-radius:17px;padding:18px;margin:12px 0;display:grid;gap:10px}.profileSocialItem>button{border:0;background:transparent;text-align:left;color:#245b95;font-weight:800}.profileSocialItem p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.profileSocialItem a,.profileSocialMemberDetail>a{color:#245b95;font-weight:700}.profileSocialDiscovery .profileSocialMembers{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.profileDiscoverySort{display:flex;align-items:center;gap:10px;font-size:13px;color:#29415f;margin:12px 0}.profileDiscoverySort select{border:1px solid #cbd5e1;border-radius:12px;padding:10px;background:#fff;color:#173657}.profileDiscoveryFilters{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.profileDiscoveryFilters button,.profileDiscoveryToolbar button,.profileDiscoveryTabs button,.profileDiscoveryMore{min-height:44px;border:1px solid #bdcde3;border-radius:24px;background:#fff;color:#173657;padding:9px 16px;font-weight:700}.profileDiscoveryFilters button[aria-pressed=true],.profileDiscoveryTabs button[aria-selected=true]{background:#162c51;color:#fff}.profileSocialDiscovery .profileDiscoveryCard{overflow:hidden;border:1px solid #dce5f0;border-radius:20px;background:#fff;box-shadow:0 6px 20px #162c5112;min-width:0}.profileSocialDiscovery .profileDiscoveryOpen{display:block;width:100%;padding:0;text-align:left;border:0;background:transparent;box-shadow:none;border-radius:0;position:relative}.profileDiscoveryCover{display:block;height:78px;background-size:cover;background-position:center;background-color:#14233c}.profileDiscoveryAvatar{display:block;position:relative;margin:-36px 0 0 16px;width:72px;height:72px;border:4px solid #fff;border-radius:50%;object-fit:cover;background:#fff}.profileDiscoveryIdentity{display:grid;gap:4px;padding:10px 16px 4px;overflow-wrap:anywhere}.profileDiscoveryIdentity strong{color:#172d50;font-size:17px}.profileDiscoveryIdentity span{color:#56708f;font-size:14px}.profileDiscoveryIdentity small{color:#5837aa;font-weight:750}.profileDiscoveryCard .profileMemberFollowWrap{padding:0 16px 12px;margin:0}.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryOpen{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;align-items:start}.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryCover{grid-column:1/-1;grid-row:1}.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryAvatar{grid-column:1;grid-row:2}.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryIdentity{grid-column:1;grid-row:3;min-width:0}.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryBio{grid-column:2;grid-row:3;display:flex;flex-direction:column;gap:7px;align-self:stretch;min-width:0;margin:10px 16px 8px 0;padding:12px 13px;border-radius:14px;border:1px solid #e1e7ef;background:linear-gradient(150deg,#f8fafc,#f1f5fa);text-align:left;box-shadow:inset 0 1px #fff}.profileSocialDiscovery .profileDiscoveryBioLabel{font-size:10px;font-weight:800;letter-spacing:.16em;color:#6c7e97}.profileSocialDiscovery .profileDiscoveryBioText{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden;overflow-wrap:anywhere;font-size:13px;line-height:1.5;color:#2d4360}.profileSocialDiscovery .profileDiscoveryCard .profileMemberFollowWrap{grid-column:1/-1}@media(max-width:380px){.profileSocialDiscovery .profileDiscoveryCard .profileDiscoveryBio{padding:10px;margin-right:10px}.profileSocialDiscovery .profileDiscoveryBioText{font-size:12px}}.profileDiscoveryCard .profileMemberFollowButton{min-width:0;padding:9px 14px;font-size:13px}.profileDiscoveryToolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 20px}.profileDiscoveryToolbar>div{display:flex;gap:6px}.profileDiscoveryToolbar button:disabled{opacity:.35}.profileDiscoveryActions{padding:14px}.profileDiscoveryTabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:16px}.profileDiscoveryTabs button{font-size:13px;padding:8px 12px}.profileDiscoveryTabPanel{padding:16px;border:1px solid #dce5f0;border-radius:14px;margin-top:12px}.profileDiscoveryMore{display:block;margin:20px auto}.profileSocialDiscovery .profileSocialSearch input{background:#f7f9fc;color:#132b4b}.profileSocialDiscovery .profileSocialMembers .profileDiscoveryOpen:focus-visible{outline:3px solid #5b75c8;outline-offset:-3px}@media(max-width:650px){.profileSocialDiscovery .profileSocialMembers{grid-template-columns:1fr}.profileDiscoveryCover{height:68px}}.profileSocialMembers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.profileSocialMembers button{display:grid;gap:8px;text-align:left;background:#fff;border:1px solid #dce5f0;border-radius:16px;padding:18px;box-shadow:0 4px 14px #203e6010}.profileSocialDiscovery .profileSocialMembers .profileMemberFollowButton{display:inline-flex;align-items:center;justify-content:center;min-width:128px;min-height:40px;padding:9px 16px;background:#17365d;color:#fff;border:1px solid #17365d;border-radius:999px;font-size:13px;font-weight:750;line-height:1.2;box-shadow:0 3px 9px #17365d24;text-align:center;white-space:nowrap}.profileSocialDiscovery .profileSocialMembers .profileMemberFollowButton.isFollowing{background:#eaf1fa;color:#17365d;border-color:#a8bbd3}.profileSocialDiscovery .profileSocialMembers .profileMemberFollowButton:disabled{opacity:.72}.profileSocialDiscovery .profileSocialMembers .profileMemberFollowButton:focus-visible{outline:3px solid #6b93ca;outline-offset:2px}.profileSocialMembers span{color:#245b95}.profileSocialMembers small{color:#718399}.profileSocialSearch{display:grid;gap:7px;font-weight:700;color:#28486a}.profileSocialSearch input{padding:13px;border:1px solid #c9d9e9;border-radius:12px}.profileSocialBack{border:0;background:#f4e9c8;color:#775c21;border-radius:12px;padding:10px;margin-top:14px}.profileMessengerBackdrop{position:fixed;inset:0;z-index:100;background:#07121e66;display:flex;justify-content:flex-end}.profileMessengerDrawer{height:100%;width:min(400px,95vw);background:#111b2a;color:white;padding:22px;box-shadow:-12px 0 35px #0005;display:flex;flex-direction:column;gap:16px}.profileMessengerDrawer header{display:flex;justify-content:space-between}.profileMessengerDrawer header button{background:transparent;border:0;color:white;font-size:22px}.profileMessengerDrawer a{color:#fff;background:#263b55;border-radius:14px;padding:16px;text-decoration:none}@media(max-width:570px){.profileSocialTop{padding:9px 7px}.profileSocialTabs button{font-size:12px;min-width:0;padding:10px}.profileMessengerTrigger{padding:10px;font-size:12px}.profileMessengerTrigger span{display:none}.profileSocialMembers{grid-template-columns:1fr}}
.profileSocialFeedFrame{width:100%;max-width:1100px;margin:0 auto;padding:0 8px 24px}.profileSocialCommunityEmbed{display:block;width:100%;height:min(85vh,1050px);min-height:650px;border:0;border-radius:20px;background:#f2eee5}.profileSocialFeedFooter{padding:12px;text-align:right}.profileSocialFeedFooter a{color:#245b95;font-weight:750}@media(max-width:570px){.profileSocialFeedFrame{padding:0 0 15px}.profileSocialCommunityEmbed{border-radius:0;height:calc(100dvh - 100px);min-height:580px}}
.profileMessengerDrawer{width:min(520px,100vw)!important;padding:12px!important}.profileMessengerDrawer>header{flex:0 0 auto;align-items:center;padding:0 8px}.profileMessengerDrawer>header h2{font-size:18px;margin:8px 0}.profileMessengerFrame{width:100%;flex:1 1 auto;min-height:0;border:0;border-radius:12px;background:#f3efe6}.profileMessengerFullLink{flex:0 0 auto;text-align:center;padding:10px!important;font-size:13px}@media(max-width:570px){.profileMessengerDrawer{padding:7px!important}.profileMessengerFrame{border-radius:8px}}

/* Compact profile command redesign: preserve editor sections and data bindings. */
.profileCommandPage .profileEditorToolbar{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;padding:14px 18px!important;margin:10px 0!important;border:1px solid #cad5e3!important;border-radius:20px!important;background:#fff!important;box-shadow:0 10px 24px #182f4b12!important;color:#193553!important}
.profileCommandPage .profileEditorToolbar .ghost{font-size:13px!important;padding:9px 12px!important;border:1px solid #c9d5e2!important;border-radius:12px!important;color:#244768!important;background:#f7f9fc!important}
.profileEditorNav{padding:10px 12px 4px;margin:12px 0 18px;border:1px solid #d3deeb;border-radius:20px;background:#fff;box-shadow:0 12px 28px #1d385017}
.profileCommandPage .profileEditorNav .profileTabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;scroll-snap-type:x mandatory!important;padding:7px 2px 10px!important;scrollbar-width:none!important}
.profileCommandPage .profileEditorNav .profileTabs button{flex:0 0 auto!important;min-width:112px!important;padding:12px 16px!important;border-radius:13px!important;scroll-snap-align:start!important;white-space:nowrap!important;box-shadow:none!important}
.profileNavHint{font-size:11px;color:#70839a;text-align:center;margin:2px 0 8px}
.profileBadgeEditor{margin:10px 0;padding:10px;border-radius:18px;background:#fff;border:1px solid #d8e2ed}
.profileCommandPage .avatarChoiceGrid{display:flex!important;grid-template-columns:none!important;overflow-x:auto!important;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory!important;gap:12px!important;padding:10px 4px 18px!important;scrollbar-width:thin}
.profileCommandPage .avatarChoiceGrid .avatarChoice{flex:0 0 clamp(148px,44vw,200px)!important;scroll-snap-align:start!important;min-width:0!important}
.profileCommandPage .avatarChoiceGrid .avatarChoice img{width:100%!important;aspect-ratio:1!important;object-fit:cover!important}
.profileCommandPage .profileHero{padding:18px!important;margin-bottom:12px!important}
.profileCommandPage .profileHeroActions{gap:10px!important}
@media(max-width:600px){.profileCommandPage .profileEditorToolbar{padding:12px!important}.profileCommandPage .profileHeroActions{display:flex!important;flex-wrap:wrap!important}.profileCommandPage .profileEditorNav .profileTabs button{min-width:108px!important}.profileCommandPage .profileEditor{padding:18px!important}}
/* Compact mobile profile editor: preserve all fields and existing save flow. */
.profileCommandPage .profileProfessionalQuickGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.profileCommandPage .profileProfessionalQuickGrid>button{box-shadow:0 8px 22px #28466c19;transition:transform .25s,box-shadow .25s}.profileCommandPage .profileProfessionalQuickGrid>button:hover{transform:translateY(-3px);box-shadow:0 12px 26px #28466c30}.profileCommandPage .formGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.profileCommandPage .formGrid label{min-width:0}.profileCommandPage .formGrid input,.profileCommandPage .formGrid select{min-height:40px!important;padding:9px 11px!important}@media(max-width:430px){.profileCommandPage .formGrid{gap:7px!important}}
.profileVisibleSignOut{display:inline-flex;align-items:center;gap:6px;margin:14px 0 0;padding:9px 15px;border-radius:999px;border:1px solid #cbd6e2;background:#fff;color:#254b73;font-size:13px;font-weight:750;cursor:pointer}
.profileAppLauncherHeading .profileLauncherToggle{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;min-width:42px;padding:0;border-radius:50%;border:1px solid #cbd6e2;background:#fff;color:#254b73;box-shadow:0 3px 12px #203d5b12;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}.profileAppLauncherHeading .profileLauncherToggle:hover{transform:translateY(-2px);box-shadow:0 5px 16px #203d5b20}.profileAppLauncher{background:transparent!important;border-color:transparent!important;box-shadow:none!important}.profileAppLauncherGrid :global(.profileAppTile){background:transparent!important}
.profileCommandPage:has(.profileEditorToolbar) .profileHero{padding:12px 16px!important;margin-bottom:8px!important;border-radius:16px!important;box-shadow:none!important}
.profileCommandPage:has(.profileEditorToolbar) .profileHeroTop{padding:0!important}
.profileCommandPage:has(.profileEditorToolbar) .profileHeroTop h1{font-size:20px!important;margin:2px 0!important}
.profileCommandPage:has(.profileEditorToolbar) .profileHeroTop p{margin:0!important;font-size:12px!important}
.profileCommandPage:has(.profileEditorToolbar) .profileHeroTop .eyebrow{display:none!important}
.profileCommandPage .profileEditorToolbar{position:sticky!important;top:0!important;z-index:25!important;display:flex!important;justify-content:space-between!important;gap:8px!important;margin:0 0 6px!important;padding:8px 10px!important;border:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important;background:#ffffffed!important;backdrop-filter:blur(14px)}
.profileCommandPage .profileEditorToolbar strong{font-size:14px!important;white-space:nowrap}
.profileCommandPage .profileEditorToolbar button{font-size:12px!important;padding:8px 11px!important;border-radius:10px!important;white-space:nowrap}
.profileCommandPage .profileEditorNav{position:sticky!important;top:52px!important;z-index:24!important;margin:0 0 8px!important;padding:0!important;border:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}
.profileCommandPage .profileEditorNav .profileTabs{gap:16px!important;padding:0 8px!important;margin:0!important;scroll-snap-type:x proximity!important}
.profileCommandPage .profileEditorNav .profileTabs button{min-width:0!important;min-height:40px!important;padding:9px 2px!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;font-size:12px!important}
.profileCommandPage .profileEditorNav .profileTabs button.active{border-bottom-color:#254e81!important;color:#254e81!important}
.profileCommandPage .profileEditor{gap:10px!important;padding:14px!important;border-radius:14px!important;box-shadow:none!important}
.profileCommandPage .profileEditor .editorIntro{margin:0 0 4px!important;padding:0!important}
.profileCommandPage .profileEditor .editorIntro h2{font-size:18px!important;margin:0!important}
.profileCommandPage .profileEditor .formGrid{gap:12px!important}
.profileCommandPage .profileEditor input,.profileCommandPage .profileEditor textarea,.profileCommandPage .profileEditor select{padding:10px 12px!important}
@media(max-width:600px){.profileCommandPage .profileEditor{padding:12px!important}.profileCommandPage .profileEditorToolbar{padding:7px 6px!important}}

/* Profile editor touch navigation: scoped to avoid modifying the public profile. */
.profileCommandPage .profileEditorToolbar{
  min-height:62px!important;padding:8px 12px!important;gap:8px!important;
  border:1px solid #e0e7ed!important;border-radius:16px!important;
  margin:0 0 5px!important;box-shadow:0 8px 24px #152d4312!important;
  background:#fffffff0!important;backdrop-filter:blur(20px)!important;
}
.profileCommandPage .profileEditorToolbar .profileEditorClose,
.profileCommandPage .profileEditorToolbar .profileEditorSave{
  min-height:48px!important;display:inline-flex!important;align-items:center!important;
  justify-content:center!important;gap:7px!important;font-weight:800!important;
  line-height:1!important;white-space:nowrap!important;cursor:pointer;
}
.profileCommandPage .profileEditorToolbar .profileEditorClose{
  padding:10px 12px!important;font-size:13px!important;
  background:#f8fafc!important;border:1px solid #d7e1eb!important;
  border-radius:14px!important;color:#324a63!important;
}
.profileEditorClose>span{font-size:22px;line-height:.65;font-weight:400}
.profileCommandPage .profileEditorToolbar .profileEditorSave{
  min-width:126px!important;padding:11px 16px!important;
  font-size:14px!important;letter-spacing:.005em!important;
  background:color-mix(in srgb,var(--profile-editor-accent,#245b55) 74%,#071e28)!important;
  color:#fff!important;border:1px solid color-mix(in srgb,var(--profile-editor-accent,#245b55) 75%,#071e28)!important;
  border-radius:15px!important;
  box-shadow:0 7px 20px color-mix(in srgb,var(--profile-editor-accent,#245b55) 31%,transparent),inset 0 1px #ffffff33!important;
  transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important;
}
.profileCommandPage .profileEditorSaveIcon{
  width:23px;height:23px;display:grid;place-items:center;border-radius:50%;
  background:#ffffff28;border:1px solid #ffffff55;font-size:15px;
}
.profileCommandPage .profileEditorToolbar .profileEditorSave:not(:disabled):active{transform:scale(.97)}
.profileCommandPage .profileEditorToolbar .profileEditorSave:not(:disabled):hover{filter:brightness(1.09)}
.profileCommandPage .profileEditorToolbar .profileEditorSave:disabled{opacity:.65!important;cursor:wait}
.profileCommandPage .profileEditorNav{
  position:sticky!important;top:66px!important;z-index:24!important;
  margin:0 0 12px!important;padding:6px 0!important;border:0!important;
  border-radius:18px!important;background:#fffffff0!important;
  backdrop-filter:blur(20px)!important;box-shadow:0 7px 22px #102b4310!important;
}
.profileCommandPage .profileEditorNav .profileTabs{
  display:flex!important;gap:9px!important;align-items:center!important;
  overflow-x:auto!important;overscroll-behavior-x:contain;
  scroll-snap-type:x proximity!important;scroll-padding-inline:12px;
  padding:6px 16px 8px 8px!important;margin:0!important;
  scrollbar-width:none!important;
}
.profileCommandPage .profileEditorNav .profileTabs::-webkit-scrollbar{display:none}
.profileCommandPage .profileEditorNav .profileTabs button{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  gap:7px!important;flex:0 0 auto!important;min-width:128px!important;
  min-height:49px!important;padding:11px 15px!important;
  border:1px solid #dce5ec!important;border-radius:999px!important;
  background:#f8fafc!important;color:#304a65!important;box-shadow:none!important;
  font-size:13px!important;font-weight:750!important;line-height:1.2!important;
  scroll-snap-align:center!important;transition:background .22s,border-color .22s,box-shadow .22s,transform .22s!important;
}
.profileEditorTabGlyph{font-size:18px;line-height:1;flex-shrink:0;opacity:.78}
.profileCommandPage .profileEditorNav .profileTabs button.active{
  color:color-mix(in srgb,var(--profile-editor-accent,#245b55) 72%,#071e28)!important;
  border:1px solid color-mix(in srgb,var(--profile-editor-accent,#245b55) 64%,white)!important;
  background:color-mix(in srgb,var(--profile-editor-accent,#245b55) 12%,white)!important;
  box-shadow:0 4px 14px color-mix(in srgb,var(--profile-editor-accent,#245b55) 16%,transparent)!important;
  transform:translateY(-1px);
}
.profileCommandPage .profileEditorNav .profileTabs button.active:after{
  content:"";position:absolute;bottom:4px;width:24px;height:3px;border-radius:99px;
  background:var(--profile-editor-accent,#245b55)
}
.profileCommandPage .profileEditorNav .profileTabs button{position:relative}
.profileEditorNavCue{
  position:absolute;right:0;top:10px;bottom:10px;width:22px;pointer-events:none;
  display:grid;place-items:center;border-radius:0 18px 18px 0;
  background:linear-gradient(90deg,transparent,#ffffffed 65%);font-size:25px;color:#5e7185
}
.profileCommandPage .profileShell>.profileEditor,
.profileCommandPage .profileShell>.avatarEditor,
.profileCommandPage .profileShell>.headerEditor{animation:profileEditorCardEnter .24s ease-out both}
@keyframes profileEditorCardEnter{from{opacity:.72;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.profileCommandPage .profileEditorToolbar button:focus-visible,
.profileCommandPage .profileEditorNav button:focus-visible{outline:3px solid var(--profile-editor-accent,#245b55)!important;outline-offset:2px}
@media(max-width:390px){
  .profileCommandPage .profileEditorToolbar{padding:7px 8px!important;gap:5px!important}
  .profileCommandPage .profileEditorToolbar strong{font-size:12px!important}
  .profileCommandPage .profileEditorToolbar .profileEditorClose{padding:8px!important}
  .profileCommandPage .profileEditorToolbar .profileEditorSave{min-width:90px!important;padding:9px 11px!important}
  .profileEditorSaveExtended{display:none}
}
@media(prefers-reduced-motion:reduce){
  .profileCommandPage .profileShell>.profileEditor,
  .profileCommandPage .profileShell>.avatarEditor,
  .profileCommandPage .profileShell>.headerEditor{animation:none}
  .profileCommandPage .profileEditorNav .profileTabs button,
  .profileCommandPage .profileEditorToolbar .profileEditorSave{transition:none!important}
}
`}</style></ProfileSocialHub>}<footer className="profileQiblaFooter"><div className="profileQiblaFooterBrand">1MUSLIM</div><nav aria-label="1Muslim Qibla footer"><Link href="/qibla/studio">EDITORIAL STUDIO</Link><Link href="/qibla/command">COMMAND CENTER</Link><Link href="/qibla/newsroom/apply">CONTRIBUTE</Link><Link href="/">1MUSLIM HOME</Link><Link href="/terms">TERMS &amp; CONDITIONS</Link><Link href="/privacy">PRIVACY POLICY</Link><Link href="/data-policy">DATA POLICY</Link></nav><small>© 2026 1Muslim. All rights reserved.</small></footer><style>{`.profileQiblaFooter{background:#101217;color:#e8e5df;padding:42px 20px max(40px,env(safe-area-inset-bottom));text-align:center;border-top:1px solid #c6a97955;margin-top:85px}.profileQiblaFooterBrand{font-size:21px;font-weight:800;letter-spacing:.13em;color:#e4c58a;margin-bottom:25px}.profileQiblaFooterBrand span{color:#f2d49a}.profileQiblaFooter nav{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px 24px;max-width:850px;margin:0 auto 25px}.profileQiblaFooter nav a{font-size:11px;letter-spacing:.08em;color:#d5d2cb;text-decoration:none;transition:color .2s ease}.profileQiblaFooter nav a:hover,.profileQiblaFooter nav a:focus-visible{color:#f5d18c;text-decoration:underline}.profileQiblaFooter small{font-size:11px;color:#999a9e}@media(max-width:600px){.profileQiblaFooter{padding:34px 16px 65px;margin-top:75px}.profileQiblaFooter nav{gap:15px 18px}.profileQiblaFooter nav a{font-size:10px}}`}</style>{isHudHudAdmin&&secretAdminOpen&&<div role="dialog" aria-modal="true" aria-label="Secret admin dashboard" className="profileSecretAdminOverlay"><div className="profileSecretAdminToolbar"><strong>Admin Dashboard</strong><button type="button" onClick={()=>setSecretAdminOpen(false)} aria-label="Close admin dashboard">✕</button></div><div className="profileSecretAdminContent"><AdminParallaxDashboard draft={secretAdminDraft} onDraftChange={setSecretAdminDraft}/></div></div>}<style>{`.profileSecretAdminOverlay{position:fixed;inset:0;z-index:2147483000;background:#020b14;color:#d5f5ff;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}.profileSecretAdminToolbar{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #ffffff25}.profileSecretAdminToolbar button{border:1px solid #ffffff55;border-radius:50%;background:#ffffff15;color:#fff;width:38px;height:38px;cursor:pointer}.profileSecretAdminContent{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}`}</style></main>;
}

