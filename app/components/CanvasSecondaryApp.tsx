"use client";
import {Fragment,useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import Link from "next/link";
import GameLabProfileHub from "./GameLabProfileHub";
import ProfileContentGallery from "./ProfileContentGallery";
import {createClient} from "../../utils/supabase/client";
import HomeMessagesChooser from "./HomeMessagesChooser";
import ProfileAvatar from "./ProfileAvatar";
import UnifiedAvatarCarousel from "./UnifiedAvatarCarousel";
import PublicBadgeSelector from "./PublicBadgeSelector";
import ElmTentAlphabet from "./ElmTentAlphabet";
import PostDesignStudio from "./PostDesignStudio";
import "./canvas-ummah-feed.css";

type Profile={display_name?:string|null;username?:string|null;xp_total?:number|null;bio?:string|null;shahada_verified_at?:string|null;id?:string;gender?:string|null;avatar_gender?:string|null;avatar_package?:string|null;avatar_config?:Record<string,unknown>|null;profile_accent?:string|null};
type DailyPost={id:string;content?:string|null;body?:string|null;text?:string|null;created_at?:string|null};
const destinations=["/profile","/recording-studio/shahadah","/community","/messages","/elm-tent","/community"];
const titles=["My Profile","Record Studio","Daily Posts · Ummah","Messenger","Elm Tent 🏕️","Community"];

function ProfileApp({active,section="My Profile",heroOnly=false}:{active:boolean;section?:"My Profile"|"Avatars"|"Background"|"Badges"|"Settings";heroOnly?:boolean}){
 const [profile,setProfile]=useState<Profile|null>(null);const [earnedBadges,setEarnedBadges]=useState<string[]>([]);const [status,setStatus]=useState("Loading your profile…");const [editingAvatar,setEditingAvatar]=useState(false);const [savingAvatar,setSavingAvatar]=useState(false);const [avatarMotion,setAvatarMotion]=useState(false);const [selectedAvatar,setSelectedAvatar]=useState<string|null>(null);const [selectedBackground,setSelectedBackground]=useState<string|null>(null);const [savingBackground,setSavingBackground]=useState(false);const [editNotice,setEditNotice]=useState("");const [tab,setTab]=useState<"content"|"avatar"|"appearance"|"badges">("content");
 useEffect(()=>{if(!active)return;const open=()=>{setSlide("profile");setTab("appearance")};window.addEventListener("1muslim:open-profile-background",open);if(new URLSearchParams(window.location.search).get("profile")==="background")open();return()=>window.removeEventListener("1muslim:open-profile-background",open)},[active]);
 useEffect(()=>{setTab(section==="Background"?"appearance":section==="Badges"?"badges":section==="Avatars"?"avatar":"content");if(section==="Settings")setSlide("settings");else setSlide("profile")},[section]);useEffect(()=>{if(!active)return;try{if(sessionStorage.getItem("1muslim:post-success-destination")==="videos"){sessionStorage.removeItem("1muslim:post-success-destination");setTab("content");setSlide("profile")}}catch{}},[active]);const [usernameDraft,setUsernameDraft]=useState("");const [savingUsername,setSavingUsername]=useState(false);const [namePopupOpen,setNamePopupOpen]=useState(false);const namePopupRef=useRef<HTMLDivElement|null>(null);const [bioDraft,setBioDraft]=useState("");const [savingBio,setSavingBio]=useState(false);const [bioEditing,setBioEditing]=useState(false);const [slide,setSlide]=useState<"profile"|"ranks"|"settings">("profile");const [rankCountry,setRankCountry]=useState("All");const [rankGender,setRankGender]=useState("All");const [rankings,setRankings]=useState<Array<{id:string;display_name:string|null;username:string|null;xp_total:number|null;country:string|null;gender:string|null}>>([]);const [rankStatus,setRankStatus]=useState("Select Ranks to load the leaderboard.");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();(async()=>{
  const {data:{user}}=await db.auth.getUser();if(!alive)return;
  if(!user){setStatus("Sign in to see your profile.");return}
  const {data,error}=await db.from("profiles").select("id,display_name,username,xp_total,bio,shahada_verified_at,gender,avatar_gender,avatar_package,avatar_config,profile_accent").eq("id",user.id).maybeSingle();
  if(!alive)return;if(error){setStatus("Profile is unavailable right now.");return}
  setProfile(data);setUsernameDraft(data?.username||"");setBioDraft((data?.bio||"").slice(0,35));setStatus(data?"":"Complete your profile to begin.");const badges=await db.from("member_badges").select("badge_key").eq("user_id",user.id);if(alive)setEarnedBadges((badges.data??[]).map(row=>row.badge_key));
 })();return()=>{alive=false}},[active]);
 useEffect(()=>{const onChange=(event:Event)=>{const detail=(event as CustomEvent<{userId:string;avatarConfig?:Record<string,unknown>;avatarPackage?:string}>).detail;if(!detail?.userId)return;setProfile(p=>p?.id===detail.userId?{...p,avatar_config:detail.avatarConfig??p.avatar_config,avatar_package:detail.avatarPackage??p.avatar_package}:p);setAvatarMotion(true);window.setTimeout(()=>setAvatarMotion(false),1200)};window.addEventListener("1muslim:avatar-changed",onChange);return()=>window.removeEventListener("1muslim:avatar-changed",onChange)},[]);
 const chooseAvatar=async(url:string)=>{
  if(!profile?.id||savingAvatar)return;
  const silver=url.includes("silver-avatar");
  if(silver&&(profile.xp_total??0)<2000){setEditNotice("Silver unlocks at 2,000 XP.");return;}
  setSavingAvatar(true);setEditNotice("");setAvatarMotion(true);window.setTimeout(()=>setAvatarMotion(false),1200);
  const db=createClient();const {data:{user}}=await db.auth.getUser();
  if(!user||user.id!==profile.id){setEditNotice("Sign in to customize your profile.");setSavingAvatar(false);return;}
  const config={...(profile.avatar_config??{}),selectedAvatarUrl:url};
  const {error}=await db.from("profiles").update({avatar_config:config}).eq("id",user.id);
  if(error)setEditNotice(error.message);else{window.dispatchEvent(new CustomEvent("1muslim:avatar-changed",{detail:{userId:user.id,avatarConfig:config}}));setProfile(p=>p?{...p,avatar_config:config}:p);setEditNotice("✓ Avatar saved");setSelectedAvatar(null);try{const audio=new Audio("/audio/hudhud-welcome.mp3");audio.volume=.65;void audio.play().catch(()=>{});}catch{}}
  setSavingAvatar(false);
 };
 useEffect(()=>{const sync=(event:Event)=>{const detail=(event as CustomEvent<{id:string;username:string}>).detail;if(detail?.id)setProfile(p=>p?.id===detail.id?{...p,username:detail.username}:p)};window.addEventListener("1muslim:profile-identity-updated",sync);return()=>window.removeEventListener("1muslim:profile-identity-updated",sync)},[]);
 const saveUsername=async()=>{if(!profile?.id||savingUsername)return;const username=usernameDraft.trim().replace(/^@/,"");if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)){setEditNotice("Username needs 3–30 letters, numbers, or underscores.");return;}setSavingUsername(true);const db=createClient();const {data,error}=await db.from("profiles").update({username}).eq("id",profile.id).select("username").single();if(error||data?.username!==username){setEditNotice("Username save failed. Please try again.");}else{setProfile(p=>p?{...p,username:data.username}:p);setUsernameDraft(data.username);window.dispatchEvent(new CustomEvent("1muslim:profile-identity-updated",{detail:{id:profile.id,username:data.username}}));setEditNotice("✓ Username saved to your account");setNamePopupOpen(false);}setSavingUsername(false);};
  // Identity fields save on blur or Enter; Escape cancels via input handlers.
 const backgrounds=[
 {key:"emerald-mosaic",name:"Jannah Green",swatch:"linear-gradient(135deg,#064c35,#17b879,#d5b665)"},
 {key:"sapphire-mosaic",name:"Nur Blue",swatch:"linear-gradient(135deg,#061b4e,#1687f5,#d3e5ff)"},
 {key:"golden-geometry",name:"Najma Gold",swatch:"linear-gradient(135deg,#4a2c09,#d8ae54,#fff2c2)"},
 {key:"silver-eclipse",name:"Mulk Black",swatch:"linear-gradient(135deg,#050505,#555,#c9c9c9)"},
 {key:"amethyst-mirage",name:"Ward Pink",swatch:"linear-gradient(135deg,#26083b,#a43bdf,#f9a1dc)"},
 {key:"ruby-red",name:"Ruby Red",swatch:"linear-gradient(135deg,#6b0009,#f32639,#ff7b8b)"},
 {key:"ruby-gold",name:"Ruby Gold",swatch:"linear-gradient(135deg,#490713,#bd1c36,#e5ad62)"},
 {key:"emerald",name:"Emerald",swatch:"linear-gradient(135deg,#064c35,#17b879,#d5b665)"},
 {key:"ruby",name:"Ruby",swatch:"linear-gradient(135deg,#390713,#d82342,#f0bb75)"},
 {key:"titanium",name:"Titanium",swatch:"linear-gradient(135deg,#080a0e,#67717c,#e1e7ef)"},
 {key:"obsidian",name:"Obsidian",swatch:"linear-gradient(135deg,#050505,#24211c,#d8ae54)"},
 {key:"sapphire",name:"Sapphire",swatch:"linear-gradient(135deg,#061b4e,#1687f5,#d3e5ff)"},
 {key:"amethyst",name:"Amethyst",swatch:"linear-gradient(135deg,#26083b,#a43bdf,#f9a1dc)"}
 ] as const;
 const legacyThemeNames:Record<string,string>={"rose-gold":"ruby","silver-dust":"titanium","carbon-fiber":"obsidian"};
 const currentBackground=legacyThemeNames[String(profile?.avatar_config?.profileBackgroundTheme||"emerald")]||String(profile?.avatar_config?.profileBackgroundTheme||"emerald");
 const [backgroundImageReady,setBackgroundImageReady]=useState(false);
 const [parallaxOffset,setParallaxOffset]=useState({x:0,y:0});
 const swipeStart=useRef<{x:number;y:number}|null>(null);
 const backgroundUrl=(key:string)=>"/assets/profile-backgrounds/"+(({ruby:"rose-gold",titanium:"silver-dust"} as Record<string,string>)[key]||key)+".PNG";
 useEffect(()=>{setBackgroundImageReady(false);const image=new Image();image.onload=()=>setBackgroundImageReady(true);image.onerror=()=>setBackgroundImageReady(false);image.src=backgroundUrl(currentBackground);return()=>{image.onload=null;image.onerror=null}},[currentBackground]);
 const slideParallaxTarget=slide==="profile"?0:slide==="ranks"?1:-1;
 useEffect(()=>{setParallaxOffset({x:slideParallaxTarget*12,y:0});const timer=window.setTimeout(()=>setParallaxOffset({x:0,y:0}),350);return()=>window.clearTimeout(timer)},[slide]);
 // Content gestures must never change the active profile slide. Tabs remain explicit.
 // The outer Home/Profile navigation must separately validate top-boundary intent.
 const profileParallax={
  onTouchStart:(e:React.TouchEvent<HTMLDivElement>)=>{if((e.target as Element).closest("[data-profile-horizontal-gallery]")){swipeStart.current=null;return;}const t=e.touches[0];if(t)swipeStart.current={x:t.clientX,y:t.clientY}},
  onTouchMove:(e:React.TouchEvent<HTMLDivElement>)=>{const start=swipeStart.current,t=e.touches[0];if(!start||!t)return;const dx=t.clientX-start.x,dy=t.clientY-start.y;setParallaxOffset({x:Math.max(-22,Math.min(22,-dx*.11)),y:Math.max(-22,Math.min(22,-dy*.11))})},
  onTouchEnd:()=>{swipeStart.current=null;setParallaxOffset({x:0,y:0})},
  onTouchCancel:()=>{swipeStart.current=null;setParallaxOffset({x:0,y:0})}
 };
 const saveBackground=async(key:string)=>{
  if(!profile?.id||savingBackground)return;
  setSavingBackground(true);setEditNotice("");
  const db=createClient();const {data:{user}}=await db.auth.getUser();
  if(!user||user.id!==profile.id){setEditNotice("Sign in to save your background.");setSavingBackground(false);return;}
  const config={...(profile.avatar_config??{}),profileBackgroundTheme:key};
  const {error}=await db.from("profiles").update({avatar_config:config}).eq("id",user.id);
  if(error){setEditNotice("Could not save background.");}else{
   setProfile(p=>p?{...p,avatar_config:config}:p);setSelectedBackground(null);setEditNotice("✓ Background saved");window.dispatchEvent(new CustomEvent("1muslim:profile-background-changed",{detail:key}));
   
  }
  setSavingBackground(false);
 };
 const avatars=[
{name:"Default",url:"/assets/avatars/default-male.jpg",xp:0,gender:"male",category:"Basic"},
{name:"Default",url:"/assets/avatars/Default-women.png",xp:0,gender:"female",category:"Basic"},
...(["Silver","Gold","Water","Cosmic"] as const).flatMap(name=>(["male","female"] as const).map(gender=>({name,url:`/assets/avatars/${name.toLowerCase()}-avatar-${gender}.${name==="Silver"?"jpg":"PNG"}`,xp:["Silver","Gold","Water"].includes(name)?2000:5000,gender,category:["Silver","Gold","Water"].includes(name)?"Elemental":"Elite"}))),
{name:"Floral",url:"/assets/avatars/floral-avatar-female.PNG",xp:5000,gender:"female",category:"Elite"},
{name:"Diamond",url:"/assets/avatars/diamond-avatar-female.PNG",xp:5000,gender:"female",category:"Elite"},
{name:"Silk",url:"/assets/avatars/silk-avatar-female.PNG",xp:5000,gender:"female",category:"Elite"},
{name:"Lunar",url:"/assets/avatars/lunar-avatar-female.PNG",xp:5000,gender:"female",category:"Elite"},
{name:"Ice",url:"/assets/avatars/ice-avatar-female.PNG",xp:5000,gender:"female",category:"Elite"},
{name:"Emerald Royalty",url:"/assets/avatars/emerald-royalty-female.PNG",xp:10000,gender:"female",category:"Elite"},
{name:"Violet Sentinel",url:"/assets/avatars/violet-sentinel-female.PNG",xp:10000,gender:"female",category:"Elite"},
  {name:"Tina The Salafi",url:"/assets/avatars/tina-the-salafi-female.PNG",xp:20000,gender:"female",category:"Elite"}
];
const avatarGender=(profile?.avatar_gender||profile?.gender||"").toLowerCase();const visibleAvatars=avatars.filter(a=>avatarGender==="male"||avatarGender==="female"?a.gender===avatarGender:true);
const badgeOptions=[{key:"shahada",name:"Shahadah Certified",image:"/assets/badges/shahada-badge.png"},{key:"dua",name:"Dua Badge",image:"/assets/badges/dua-badge.PNG"},{key:"tiktok",name:"TikTok Connected",image:"/assets/badges/1Muslim-TikTok-badge.PNG"}];
 const productSlots=["Qur’an Studio","1Umma","Keemy’s Adventure World","Go Live","1Muslim Games","Qibla","Audio Rooms","1Muslim Posts","Learning Studio","1Muslim XP Store"];
 const previewBadges=productSlots.map((name,i)=>({key:"product-slot-"+i,name}));
 useEffect(()=>{if(!active||slide!=="ranks")return;let alive=true;const db=createClient();setRankStatus("Loading rankings…");(async()=>{const {data,error}=await db.from("profiles").select("id,display_name,username,xp_total,country,gender").order("xp_total",{ascending:false}).limit(100);if(!alive)return;if(error){setRankStatus("Rankings unavailable.");return;}setRankings(data||[]);setRankStatus(data?.length?"":"No ranked members yet.");})();return()=>{alive=false}},[active,slide]);
 const countries=[...new Set(rankings.map(p=>p.country?.trim()).filter((v):v is string=>!!v))].sort();
 const filteredRanks=rankings.filter(p=>(rankCountry==="All"||p.country===rankCountry)&&(rankGender==="All"||p.gender?.toLowerCase()===rankGender.toLowerCase()));
 const panelStyle={background:"rgba(5,35,32,.52)",border:"1px solid rgba(215,180,98,.28)",borderRadius:16,padding:12};
  const saveBio=async()=>{if(!profile?.id||savingBio)return;setSavingBio(true);setEditNotice("");const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||user.id!==profile.id){setEditNotice("Sign in to save your bio.");setSavingBio(false);return;}const bio=bioDraft.trim().slice(0,35);const {error}=await db.from("profiles").update({bio}).eq("id",user.id);if(error)setEditNotice("Could not save bio.");else{setProfile(p=>p?{...p,bio}:p);setEditNotice("✓ Bio saved");setBioEditing(false);}setSavingBio(false);};
 const avatarAnimation=<style>{`@keyframes profileAvatarTransition{0%{transform:scale(1);opacity:1}35%{transform:scale(.9) rotate(2deg);opacity:.65}100%{transform:scale(1);opacity:1}}.profile-avatar-changing{animation:profileAvatarTransition 1.2s ease;filter:drop-shadow(0 0 15px var(--theme-edge,#c4b7ef))}@media(prefers-reduced-motion:reduce){.profile-avatar-changing{animation:none}}`}</style>;
 if(heroOnly)return profile?<div className="profile-shared-avatar-hero">{avatarAnimation}<div className="canvas-native-avatar profile-glass-avatar" aria-label="Your selected avatar" style={{display:"flex",justifyContent:"center",alignItems:"center",margin:"0 auto",width:"100%",maxWidth:164,minHeight:154,padding:"18px 4px 17px",position:"relative",isolation:"isolate",overflow:"hidden",border:"1px solid rgba(244,212,142,.18)",boxShadow:"0 12px 34px rgba(0,0,0,.16),inset 0 0 28px rgba(255,255,255,.04)",borderRadius:28,background:"transparent",backdropFilter:"blur(5px)"}}><div className={"profile-avatar-portrait"+(avatarMotion?" profile-avatar-changing":"")}><ProfileAvatar name={profile.username||profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="md"/></div><strong className="profile-avatar-xp" style={{position:"absolute",bottom:5,left:8,right:8,textAlign:"center",fontSize:13,color:"#e6c77e",textShadow:"0 1px 5px #082c25"}}>✦ {(profile.xp_total||0).toLocaleString()} XP</strong></div></div>:null;
 return <div className="canvas-native-profile profile-inner-scroll-content" {...profileParallax} style={{touchAction:"auto",overscrollBehaviorY:"contain",position:"relative",isolation:"isolate",overflowY:"visible",overflowX:"clip",height:"auto",minHeight:0,maxHeight:"none",WebkitOverflowScrolling:"touch",background:"transparent",border:"none",borderRadius:0,padding:"8px 12px 8px",backdropFilter:"none"}}>
 {backgroundImageReady&&<div key={currentBackground} className="profile-theme-scene" aria-hidden="true" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55)),url("${backgroundUrl(currentBackground)}")`,opacity:.5,filter:"blur(9px)",transform:"scale(1.045)",maskImage:"radial-gradient(ellipse 82% 76% at 50% 50%,black 46%,transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 82% 76% at 50% 50%,black 46%,transparent 100%)",pointerEvents:"none"}}/>}
 {false&&backgroundImageReady&&<div aria-hidden="true" style={{position:"absolute",inset:-24,zIndex:-2,pointerEvents:"none",backgroundImage:`linear-gradient(180deg,rgba(3,20,18,.48),rgba(3,20,18,.74)),url("${backgroundUrl(currentBackground)}")`,backgroundSize:"cover",backgroundPosition:"center",transform:`translate3d(${parallaxOffset.x}px,${parallaxOffset.y}px,0) scale(1.035)`,transition:"transform .65s cubic-bezier(.22,1,.36,1)",willChange:"transform"}}/>}
 {false&&backgroundImageReady&&<div aria-hidden="true" className="profile-background-particles" style={{position:"absolute",inset:0,zIndex:-1,pointerEvents:"none",opacity:.55,backgroundImage:"radial-gradient(circle,rgba(255,255,255,.75) 1px,transparent 2px),radial-gradient(circle,rgba(240,209,148,.6) 1px,transparent 2px)",backgroundSize:"93px 137px,151px 113px",backgroundPosition:`${parallaxOffset.x*.4}px ${parallaxOffset.y*.4}px,${-parallaxOffset.x*.3}px ${-parallaxOffset.y*.3}px`,transition:"background-position .8s cubic-bezier(.22,1,.36,1)"}}/>}
 {slide==="ranks"?<section aria-label="XP leaderboard" style={panelStyle}><h3 style={{margin:"0 0 8px"}}>✦ Community Ranks</h3><p style={{fontSize:12,opacity:.8}}>Top 100 XP profiles · filters</p><div style={{display:"flex",gap:8,marginBottom:12}}><select aria-label="Filter country" value={rankCountry} onChange={e=>setRankCountry(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option>{countries.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Filter gender" value={rankGender} onChange={e=>setRankGender(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option><option value="male">Male</option><option value="female">Female</option></select></div><div data-ranks-scroll style={{maxHeight:350,overflowY:"auto",overscrollBehaviorY:"contain",touchAction:"pan-y",display:"grid",gap:6}}>{filteredRanks.length?filteredRanks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:"rgba(255,255,255,.045)",borderRadius:12}}><strong style={{minWidth:27,color:"#e6c77e"}}>#{rankings.indexOf(p)+1}</strong><span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.display_name||p.username||"Member"}</span><strong style={{fontSize:12}}>{(p.xp_total||0).toLocaleString()} XP</strong></div>):<p role="status">{rankings.length?"No matching profiles.":rankStatus}</p>}</div></section>:slide==="settings"?<section aria-label="Profile settings" style={{display:"grid",gap:10,textAlign:"left"}}>{[{title:"Account & identity",items:[["Edit profile","/profile"],["Avatar & background","/profile#avatar"],["Account connections","/profile#connections"]]},{title:"Privacy & safety",items:[["Privacy and account controls","/profile"],["Safety and reporting","/profile"]]},{title:"Notifications & preferences",items:[["Notification preferences","/profile"],["Display preferences","/profile"]]},{title:"Community",items:[["Badges & rewards","/profile#badges"],["Social connections","/profile#connections"]]}].map(group=><div key={group.title} style={panelStyle}><h4 style={{margin:"0 0 5px",color:"#e6c77e",fontSize:12}}>{group.title}</h4>{group.items.map(([label,href])=><Link key={label} href={href} style={{display:"flex",justifyContent:"space-between",padding:"9px 2px",borderBottom:"1px solid rgba(255,255,255,.08)",fontSize:13}}>{label}<span aria-hidden="true">›</span></Link>)}</div>)}</section>:profile?<><div className="profile-glass-tabs profile-tabs-compact" role="tablist" aria-label="Profile sections" style={{display:"flex",gap:4,width:"100%",position:"sticky",top:0,zIndex:5,backdropFilter:"blur(18px)"}}>{(["content","avatar","appearance","badges"] as const).map(t=><button key={t} type="button" role="tab" aria-selected={tab===t} onClick={()=>setTab(t)} className="profile-icon-tab" style={{flex:1,minWidth:0,padding:"10px 3px",fontSize:11}}>{({content:"Content",avatar:"Avatars",appearance:"Appearance",badges:"Achievements"} as const)[t]}</button>)}</div>{tab==="avatar"&&<div role="tabpanel" style={{display:"grid",gap:6,alignContent:"start",minHeight:"min(240px,36dvh)"}}><UnifiedAvatarCarousel avatars={visibleAvatars} xpTotal={profile.xp_total??0} selectedAvatar={selectedAvatar} savingAvatar={savingAvatar} onSelect={url=>{void chooseAvatar(url)}}/></div>}{tab==="appearance"&&<div role="tabpanel" aria-label="Profile appearance and backgrounds" style={{display:"grid",gap:10,justifyItems:"center",minHeight:"min(240px,36dvh)",alignContent:"start"}}><section className="profile-glass-identity profile-identity-compact profile-identity-stealth" aria-label="Profile identity — tap to edit" style={{width:"calc(100% - 12px)",maxWidth:"none",margin:"24px auto 5px",padding:"3px 10px",borderRadius:10,background:"rgba(9,45,41,.07)",border:"1px solid rgba(226,203,145,.07)",backdropFilter:"blur(4px)",boxShadow:"none",transition:"background .25s ease,border-color .25s ease"}}>
 <form onSubmit={e=>{e.preventDefault();void saveUsername()}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&namePopupOpen&&!savingUsername)void saveUsername()}} style={{display:"flex",alignItems:"center",gap:8,minHeight:namePopupOpen?39:27,borderBottom:"1px solid rgba(226,203,145,.09)",transition:"min-height .22s ease"}}><label htmlFor="profile-inline-username" style={{fontSize:11,color:"#e6c77e",flex:"0 0 68px",opacity:.75}}>Username</label><input id="profile-inline-username" aria-label="Username, tap to edit" maxLength={30} readOnly={!namePopupOpen} value={namePopupOpen?usernameDraft:(profile.username||profile.display_name||"")} onFocus={()=>{setUsernameDraft(profile.username||"");setNamePopupOpen(true)}} onClick={e=>{if(!namePopupOpen){setUsernameDraft(profile.username||"");setNamePopupOpen(true);e.currentTarget.focus()}}} onChange={e=>setUsernameDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Escape"){setUsernameDraft(profile.username||"");setNamePopupOpen(false);e.currentTarget.blur()}}} style={{flex:1,minWidth:0,padding:namePopupOpen?"7px 5px":"3px 0",fontSize:16,color:"#f6f2e6",background:namePopupOpen?"rgba(255,255,255,.045)":"transparent",border:namePopupOpen?"1px solid rgba(226,203,145,.24)":"1px solid transparent",borderRadius:7,outline:"none",textOverflow:"ellipsis",transition:"background .2s,border-color .2s,padding .2s",cursor:namePopupOpen?"text":"pointer"}}/></form>
 <form onSubmit={e=>{e.preventDefault();void saveBio()}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&bioEditing&&!savingBio)void saveBio()}} style={{display:"flex",alignItems:"center",gap:8,minHeight:bioEditing?39:27,transition:"min-height .22s ease"}}><label htmlFor="profile-inline-bio" style={{fontSize:11,color:"#e6c77e",flex:"0 0 68px",opacity:.75}}>Bio</label><input id="profile-inline-bio" aria-label="Bio, tap to edit" maxLength={35} readOnly={!bioEditing} value={bioEditing?bioDraft:(profile.bio||"")} onFocus={()=>{setBioDraft(profile.bio||"");setBioEditing(true)}} onClick={e=>{if(!bioEditing){setBioDraft(profile.bio||"");setBioEditing(true);e.currentTarget.focus()}}} onChange={e=>setBioDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Escape"){setBioDraft(profile.bio||"");setBioEditing(false);e.currentTarget.blur()}}} placeholder="Tap to add a bio…" style={{flex:1,minWidth:0,padding:bioEditing?"7px 5px":"3px 0",fontSize:16,color:"#f6f2e6",background:bioEditing?"rgba(255,255,255,.045)":"transparent",border:bioEditing?"1px solid rgba(226,203,145,.24)":"1px solid transparent",borderRadius:7,outline:"none",textOverflow:"ellipsis",transition:"background .2s,border-color .2s,padding .2s",cursor:bioEditing?"text":"pointer"}}/></form></section>
 <div className="profile-glass-gallery" data-profile-horizontal-gallery="true" role="region" aria-label="Background themes, swipe to browse all options" tabIndex={0} style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:"minmax(104px,31%)",overflowX:"auto",overflowY:"hidden",scrollSnapType:"none",touchAction:"auto",overscrollBehaviorX:"contain",WebkitOverflowScrolling:"touch",justifyContent:"start",gap:9,width:"100%",minWidth:0,boxSizing:"border-box",padding:"5px 0 12px"}}>{backgrounds.map((b,i)=><Fragment key={b.key}>{(i===0||i===7)&&<span aria-hidden="true" style={{alignSelf:"center",fontSize:11,color:"#e9d09b",fontWeight:700,whiteSpace:"nowrap"}}>{i===0?"Colors":"Mosque"}</span>}<button className="profile-glass-theme-card" key={b.key} type="button" aria-pressed={currentBackground===b.key} disabled={savingBackground} onClick={()=>{if(selectedBackground===b.key)void saveBackground(b.key);else{setSelectedBackground(b.key);setEditNotice("Tap again to save "+b.name);}}} style={{width:"100%",minWidth:0,border:(selectedBackground||currentBackground)===b.key?"2px solid #f5d47a":"1px solid rgba(221,190,116,.6)",borderRadius:16,padding:7,background:"rgba(2,28,24,.6)",color:"#f5e8c8",display:"grid",gap:6,justifyItems:"center"}}><span style={{width:"100%",height:70,borderRadius:12,background:`${b.swatch} center / cover`,backgroundImage:`linear-gradient(180deg,transparent,rgba(0,0,0,.2)),url("${backgroundUrl(b.key)}")`,display:"block"}}/><small style={{fontWeight:700}}>{b.name}</small>{currentBackground===b.key&&<small>✓ Saved</small>}</button></Fragment>)}{productSlots.map((name,i)=><div key={"background-slot-"+i} style={{width:"100%",minWidth:0,scrollSnapAlign:"none",border:"1px solid rgba(221,190,116,.48)",borderRadius:16,padding:7,background:"rgba(2,28,24,.6)",display:"grid",gap:6,justifyItems:"center"}}><span style={{width:"100%",height:70,borderRadius:12,background:"linear-gradient(135deg,#165a50,#102c37)",display:"grid",placeItems:"center",color:"#e6c77e",fontSize:25}}>✦</span><small style={{fontSize:9,lineHeight:1.1,textAlign:"center",overflowWrap:"anywhere"}}>{name}</small><small style={{fontSize:8,lineHeight:1}}>Art soon</small></div>)}</div>
 </div>}{tab==="content"&&<div role="tabpanel" aria-label="Content gallery"><ProfileContentGallery/></div>}{tab==="badges"&&<div role="tabpanel" style={{display:"grid",gap:10,minHeight:"min(240px,36dvh)",alignContent:"start"}}><div data-profile-horizontal-gallery="true" role="region" aria-label="Badges, swipe to browse all options" tabIndex={0} style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:"minmax(110px,35%)",overflowX:"auto",overflowY:"hidden",scrollSnapType:"none",touchAction:"auto",overscrollBehaviorX:"contain",WebkitOverflowScrolling:"touch",gap:9,width:"100%",minWidth:0,boxSizing:"border-box",padding:"5px 12px 12px"}}>{badgeOptions.map(b=>{const earned=earnedBadges.includes(b.key)||(b.key==="shahada"&&Boolean(profile.shahada_verified_at));return <div key={b.key} style={{minWidth:0,scrollSnapAlign:"none",padding:"8px 5px",borderRadius:16,border:"1px solid rgba(221,190,116,.48)",background:"linear-gradient(150deg,rgba(20,75,60,.75),rgba(3,27,25,.65))",display:"grid",justifyItems:"center",gap:6,textAlign:"center",opacity:earned?1:.6}}><img src={b.image} alt={b.name} loading="lazy" style={{width:57,height:57,objectFit:"contain",filter:earned?"drop-shadow(0 2px 7px rgba(229,188,100,.4))":"grayscale(1)"}}/><strong style={{fontSize:11}}>{b.name}</strong><small style={{fontSize:10}}>{earned?"Earned":"🔒 Locked"}</small></div>})}{previewBadges.map(b=><div key={b.key} style={{minWidth:0,scrollSnapAlign:"none",padding:"8px 5px",borderRadius:16,border:"1px solid rgba(221,190,116,.48)",background:"rgba(20,75,60,.55)",display:"grid",justifyItems:"center",gap:6,textAlign:"center"}}><span aria-hidden="true" style={{width:57,height:57,display:"grid",placeItems:"center",fontSize:28,color:"#e6c77e"}}>✦</span><strong style={{fontSize:11}}>{b.name}</strong><small style={{fontSize:10}}>Preview · Art soon</small></div>)}</div><small style={{color:"#d8c89c"}}>Earned badges are managed in your public profile · up to 3 visible.</small></div>}{["content","avatar","appearance","badges"].includes(tab)&&<div aria-hidden="true" style={{height:24,minHeight:24,flexShrink:0}} />}{editNotice&&<small role="status">{editNotice}</small>}</>:<p role="status">{status}</p>}</div>
}
function RecorderApp({active}:{active:boolean}){
 const [recording,setRecording]=useState(false);const [clip,setClip]=useState<string|null>(null);const [error,setError]=useState("");const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const chunks=useRef<Blob[]>([]);
 useEffect(()=>()=>{if(recorder.current?.state==="recording")recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 const toggle=async()=>{
  if(recording){recorder.current?.stop();setRecording(false);return}
  if(!active)return;
  try{setError("");if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw Error("Recording is not supported in this browser.");
   stream.current=await navigator.mediaDevices.getUserMedia({audio:true});chunks.current=[];
   const r=new MediaRecorder(stream.current);recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
   r.onstop=()=>{setClip(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(new Blob(chunks.current,{type:r.mimeType||"audio/webm"}))});stream.current?.getTracks().forEach(t=>t.stop());stream.current=null};
   r.start();setRecording(true);
  }catch(e){setError(e instanceof Error?e.message:"Microphone unavailable.")}
 };
 return <div className="canvas-native-recorder"><div className={"canvas-recorder-ring"+(recording?" is-recording":"")}>♫</div><p>{recording?"Recording your voice…":"Record an audio message or reflection."}</p><button type="button" onClick={()=>void toggle()}>{recording?"■ Stop recording":"● Start recording"}</button>{clip&&<><audio controls src={clip}/><a href={clip} download="1muslim-recording.webm">Save recording to device ↓</a></>}{error&&<p role="alert">{error}</p>}<small>Recordings stay on this device until you choose to save them.</small></div>
}
type UmmahPost={id:string;body:string;created_at:string;author_name:string;author_handle:string;author_id?:string;avatar_url?:string|null;media_url?:string|null;media_type?:string|null;image_url?:string|null;video_url?:string|null;link?:string|null;shahada_verified?:boolean;post_theme?:string|null};
const postThemeClass=(theme?:string|null)=>["emerald","sapphire","ruby","amethyst","titanium","obsidian"].includes(theme||"")?theme:"emerald";
const youtubePreview=(body:string)=>{const match=body.match(/(?:youtube\.com\/watch\?[^\s]*v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/i);return match?{id:match[1],url:"https://www.youtube.com/watch?v="+match[1],thumbnail:"https://img.youtube.com/vi/"+match[1]+"/hqdefault.jpg"}:null};
const postThemes=["emerald","gold","makkah","midnight","garden","purple"] as const;
const backgroundForPost=(id:string)=>{let hash=2166136261;for(let i=0;i<id.length;i++)hash=Math.imul(hash^id.charCodeAt(i),16777619);return `/post-backgrounds/${postThemes[(hash>>>0)%postThemes.length]}.svg`};
type UmmahComment={id:string;post_id:string;parent_id:string|null;name:string;avatar_url?:string|null;body:string;created_at:string;likes:number;liked:boolean};
  const renderPostBody=(body:string)=>{
   // The Add Verse selector inserts a reference, Arabic, and translation as separate paragraphs.
   // Highlight only the selected verse segment; preserve the author's own words separately.
   const match=/Qur[’']an\s+\d{1,3}:\d{1,3}/i.exec(body);
   if(!match)return body;
   const before=body.slice(0,match.index);
   const after=body.slice(match.index+match[0].length).replace(/^\s*\n+/,"");
   const parts=after.split(/\n\s*\n/);
   const arabic=parts[0]&&/[\u0600-\u06ff]/.test(parts[0])?parts.shift():"";
   const translation=parts.length?parts.shift():"";
   const rest=parts.join("\n\n");
   return <>{before&&<span className="ummah-author-words">{before}</span>}<span className="ummah-verse-block" lang="ar"><span className="ummah-verse-label">۞ {match[0]} · Qur’an</span>{arabic&&<span className="ummah-verse-arabic" dir="rtl">{arabic}</span>}{translation&&<span className="ummah-verse-translation" lang="en">{translation}</span>}</span>{rest&&<span className="ummah-author-words">{rest}</span>}</>;
  };

function DailyPostsApp({active}:{active:boolean}){
 const [wideFeed,setWideFeed]=useState(false);
 useEffect(()=>{const media=window.matchMedia("(min-width: 768px), (orientation: landscape)");const sync=()=>setWideFeed(media.matches);sync();media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync)},[]);
 const [posts,setPosts]=useState<UmmahPost[]>([]); const mediaUrlCache=useRef(new Map<string,{url:string,at:number}>()); 
 const [status,setStatus]=useState("Loading Ummah posts…");
 const [selected,setSelected]=useState<string|null>(null);
 const [commentViewport,setCommentViewport]=useState({top:0,height:0});
 useEffect(()=>{
  if(!selected)return;
  const vv=window.visualViewport;
  const sync=()=>setCommentViewport({top:vv?.offsetTop||0,height:vv?.height||window.innerHeight});
  sync();vv?.addEventListener("resize",sync);vv?.addEventListener("scroll",sync);window.addEventListener("resize",sync);
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{vv?.removeEventListener("resize",sync);vv?.removeEventListener("scroll",sync);window.removeEventListener("resize",sync);document.body.style.overflow=previous};
 },[selected]);

 const [comments,setComments]=useState<UmmahComment[]>([]); const [threadPath,setThreadPath]=useState<string[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [likes,setLikes]=useState<Record<string,boolean>>({});
 const [bookmarks,setBookmarks]=useState<Record<string,boolean>>({});
 useEffect(()=>{try{setBookmarks(JSON.parse(localStorage.getItem("1muslim:post-bookmarks")||"{}"))}catch{}},[]);
 const toggleBookmark=(id:string)=>setBookmarks(old=>{const next={...old,[id]:!old[id]};try{localStorage.setItem("1muslim:post-bookmarks",JSON.stringify(next))}catch{}return next});
 const sharePost=async(id:string)=>{const url=new URL(window.location.href);url.searchParams.set("communityPost",id);try{if(navigator.share)await navigator.share({title:"1Muslim Community Post",url:url.toString()});else{await navigator.clipboard.writeText(url.toString());setNotice("Post link copied.")}}catch(e){if((e as Error).name!=="AbortError")setNotice("Unable to share post.")}};
 const [paused,setPaused]=useState(false);
 const [expandedImage,setExpandedImage]=useState<string|null>(null);
 const [postMenu,setPostMenu]=useState<string|null>(null);
 const [likeCounts,setLikeCounts]=useState<Record<string,number>>({});
 const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
 const [layoutSeed]=useState(0);
  const refreshThread=async(id:string)=>{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error("Comments unavailable");const d=await r.json();setComments(d.comments||[])};
  const likeComment=async(id:string)=>{try{const r=await fetch("/api/ummah-comment-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:id})});if(!r.ok)throw Error("Sign in to like comments");if(selected)await refreshThread(selected)}catch(e){setNotice(e instanceof Error?e.message:"Unable to like comment")}};
  const postKind=(p:UmmahPost)=>{const media=p.video_url||p.image_url||p.media_url||"";if(p.video_url||p.media_type?.startsWith("video/")||/\.(mp4|webm)(\?|$)/i.test(media))return "video";if(media)return "image";if(/(?:Qur.an|سورة|آية|\\b(?:surah|ayah)\\b|✦ DAILY UMMAH)/i.test(p.body))return "verse";return "text"};
  const mediaFor=(p:UmmahPost)=>p.video_url||p.image_url||p.media_url||"";

 const lastTouch=useRef(0);
 const feedRef=useRef<HTMLDivElement|null>(null);
 const videoRefs=useRef(new Map<string,HTMLVideoElement>());
 const verseAudioRef=useRef<HTMLAudioElement|null>(null);
 const verseAudioPostRef=useRef<string|null>(null);
 const versePlayedRef=useRef(new Set<string>());
 const [playingVideo,setPlayingVideo]=useState<string|null>(null);
 const [finishedVideo,setFinishedVideo]=useState<string|null>(null);
 const [fypStart,setFypStart]=useState<string|null>(null);
 const [fypActiveIndex,setFypActiveIndex]=useState(0);
 const [fypShuffleSeed,setFypShuffleSeed]=useState(0);
 const [fypPullDistance,setFypPullDistance]=useState(0);
 const fypPullRef=useRef({startY:0,startX:0,tracking:false,armed:false});

 const [fypSearchOpen,setFypSearchOpen]=useState(false);
 const [fypSearchQuery,setFypSearchQuery]=useState("");
 const [fypSpeed,setFypSpeed]=useState(1);
 const fypSpeedRef=useRef({timer:0,startY:0,startX:0,holding:false,video:null as HTMLVideoElement|null});
 const fypReelRef=useRef<HTMLDivElement|null>(null);
 const fypVideoRefs=useRef(new Map<string,HTMLVideoElement>());
 const [viewerPost,setViewerPost]=useState<string|null>(null);
 const [viewerActionsVisible,setViewerActionsVisible]=useState(true);
 const viewerVideoRef=useRef<HTMLVideoElement|null>(null);
 const videoStartAt=useRef(0);
 const openPostViewer=(post:UmmahPost)=>{videoStartAt.current=videoRefs.current.get(post.id)?.currentTime||0;setViewerActionsVisible(true);setViewerPost(post.id);setFypStart(null);setExpandedImage(null);setSelected(null)};
 const openViewerComments=(id:string)=>{setViewerPost(null);setSelected(id);setThreadPath([]);setComments([]);setNotice("")};
 useEffect(()=>{if(!viewerPost)return;const t=window.setTimeout(()=>setViewerActionsVisible(false),3000);return()=>clearTimeout(t)},[viewerPost,viewerActionsVisible]);
 const videoPosts=posts.filter(p=>postKind(p)==="video");
 const fypOrder=useMemo(()=>{if(!fypStart)return [];const start=videoPosts.find(p=>p.id===fypStart);const others=videoPosts.filter(p=>p.id!==fypStart);if(fypShuffleSeed){const shuffled=[...videoPosts];for(let i=shuffled.length-1;i>0;i--){const j=(Math.imul((fypShuffleSeed+1)*2654435761+i*2246822519,1597334677)>>>0)%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}return shuffled;}return start?[start,...others.sort((x,y)=>x.id.localeCompare(y.id))]:[]},[posts,fypStart,fypShuffleSeed]);
 useEffect(()=>{if(!fypStart)return;const reel=fypReelRef.current;if(!reel)return;const pull=fypPullRef.current;
 const start=(event:TouchEvent)=>{pull.tracking=false;pull.armed=false;if(event.touches.length!==1||reel.scrollTop>3||fypSpeedRef.current.holding)return;const t=event.touches[0];pull.startY=t.clientY;pull.startX=t.clientX;pull.tracking=true};
 const move=(event:TouchEvent)=>{if(!pull.tracking||event.touches.length!==1)return;const t=event.touches[0];const dy=t.clientY-pull.startY;const dx=t.clientX-pull.startX;if(Math.abs(dx)>Math.max(18,Math.abs(dy))||reel.scrollTop>3){pull.tracking=false;setFypPullDistance(0);return;}if(dy>0){if(event.cancelable)event.preventDefault();const distance=Math.min(110,dy*.6);setFypPullDistance(distance);pull.armed=dy>=125}else{setFypPullDistance(0);pull.armed=false}};
 const cancel=()=>{pull.tracking=false;pull.armed=false;setFypPullDistance(0)};
 const end=()=>{const refresh=pull.tracking&&pull.armed&&reel.scrollTop<=3;pull.tracking=false;pull.armed=false;setFypPullDistance(0);if(!refresh)return;fypVideoRefs.current.forEach(v=>{v.pause();v.currentTime=0;v.playbackRate=1});setFypActiveIndex(0);reel.scrollTo({top:0,behavior:"auto"});setFypShuffleSeed(seed=>seed+1)};
 reel.addEventListener("touchstart",start,{passive:true});reel.addEventListener("touchmove",move,{passive:false});reel.addEventListener("touchend",end);reel.addEventListener("touchcancel",cancel);
 return()=>{reel.removeEventListener("touchstart",start);reel.removeEventListener("touchmove",move);reel.removeEventListener("touchend",end);reel.removeEventListener("touchcancel",cancel)};
 },[fypStart]);
 useEffect(()=>{if(!fypStart){setFypSpeed(1);return;}const reel=fypReelRef.current;if(!reel)return;
   const reset=()=>{const gesture=fypSpeedRef.current;window.clearTimeout(gesture.timer);if(gesture.video)gesture.video.playbackRate=1;gesture.holding=false;gesture.video=null;setFypSpeed(1)};
   const start=(event:TouchEvent)=>{if(event.touches.length!==1)return;reset();const video=event.target instanceof HTMLVideoElement?event.target:null;if(!video||video.paused||video!==fypVideoRefs.current.get(fypOrder[fypActiveIndex]?.id))return;const touch=event.touches[0];const gesture=fypSpeedRef.current;gesture.startY=touch.clientY;gesture.startX=touch.clientX;gesture.video=video;gesture.timer=window.setTimeout(()=>{if(gesture.video!==video)return;gesture.holding=true;video.playbackRate=2;setFypSpeed(2)},350)};
   const move=(event:TouchEvent)=>{const gesture=fypSpeedRef.current;if(!gesture.video||event.touches.length!==1)return;const touch=event.touches[0];if(!gesture.holding){if(Math.abs(touch.clientY-gesture.startY)>12||Math.abs(touch.clientX-gesture.startX)>12)reset();return;}if(event.cancelable)event.preventDefault();const distance=Math.max(0,gesture.startY-touch.clientY);const speed=distance>=160?5:distance>=75?3:2;if(gesture.video.playbackRate!==speed){gesture.video.playbackRate=speed;setFypSpeed(speed)}};
   reel.addEventListener("touchstart",start,{passive:true});reel.addEventListener("touchmove",move,{passive:false});reel.addEventListener("touchend",reset);reel.addEventListener("touchcancel",reset);
   return()=>{reset();reel.removeEventListener("touchstart",start);reel.removeEventListener("touchmove",move);reel.removeEventListener("touchend",reset);reel.removeEventListener("touchcancel",reset)};
 },[fypStart,fypActiveIndex,fypOrder]);

 const fypSearchResults=useMemo(()=>{const q=fypSearchQuery.trim().toLocaleLowerCase();if(!q)return [];return fypOrder.map((post,index)=>({post,index})).filter(({post})=>[post.body,post.author_name].some(value=>String(value||"").toLocaleLowerCase().includes(q))).slice(0,12)},[fypOrder,fypSearchQuery]);

 const [fypWarmingUp,setFypWarmingUp]=useState(false);
 useEffect(()=>{if(!fypStart){setFypWarmingUp(false);return;}setFypWarmingUp(true);const timer=window.setTimeout(()=>setFypWarmingUp(false),1000);return()=>window.clearTimeout(timer)},[fypStart]);
 useEffect(()=>{if(!fypStart){fypVideoRefs.current.forEach(video=>video.pause());setFypActiveIndex(0);return}
   const reel=fypReelRef.current;if(!reel)return;
   const sections=Array.from(reel.querySelectorAll<HTMLElement>("section[data-fyp-index]"));
   const observer=new IntersectionObserver(entries=>{
     const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
     if(visible)setFypActiveIndex(Number((visible.target as HTMLElement).dataset.fypIndex||0));
   },{root:reel,threshold:[.45,.6,.75]});
   sections.forEach(section=>observer.observe(section));
   return()=>observer.disconnect();
 },[fypStart,fypOrder.length]);
 useEffect(()=>{if(!fypStart)return;
   fypVideoRefs.current.forEach((video,id)=>{
     const index=fypOrder.findIndex(post=>post.id===id);
     const nearby=index>=fypActiveIndex-1&&index<=fypActiveIndex+3;
     video.preload=nearby?"auto":"none";
     if(index===fypActiveIndex&&!fypWarmingUp&&!document.hidden){video.muted=!fypSoundUnlocked;void video.play().catch(()=>{video.muted=true;setFypNeedsTapForSound(true);void video.play().catch(()=>{});});}
     else{video.pause();video.muted=true;}
   });
 },[fypStart,fypActiveIndex,fypOrder,fypWarmingUp,fypSoundUnlocked]);
 useEffect(()=>{if(!fypStart)return;const onVisibility=()=>{const activeVideo=fypVideoRefs.current.get(fypOrder[fypActiveIndex]?.id);if(document.hidden)fypVideoRefs.current.forEach(video=>video.pause());else if(activeVideo&&!fypWarmingUp)void activeVideo.play().catch(()=>{});};document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[fypStart,fypOrder,fypActiveIndex,fypWarmingUp]);

 useEffect(()=>{if(!active||selected||fypStart||viewerPost){videoRefs.current.forEach(v=>v.pause());return}let raf=0;const update=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const scroll=feedRef.current?.closest(".canvas-community-posts-scroll")||feedRef.current;if(!scroll)return;const bounds=scroll.getBoundingClientRect();const mid=(bounds.top+bounds.bottom)/2;let candidate:string|null=null;let distance=Infinity;videoRefs.current.forEach((video,id)=>{const rect=video.getBoundingClientRect();const center=(rect.top+rect.bottom)/2;const d=Math.abs(center-mid);if(rect.bottom>bounds.top&&rect.top<bounds.bottom&&d<distance){distance=d;candidate=id}});setPlayingVideo(candidate)})};const scroll=feedRef.current?.closest(".canvas-community-posts-scroll")||feedRef.current;scroll?.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);update();return()=>{cancelAnimationFrame(raf);scroll?.removeEventListener("scroll",update);window.removeEventListener("resize",update)}},[active,posts,selected,fypStart,viewerPost]);
 useEffect(()=>{videoRefs.current.forEach((v,id)=>{if(id===playingVideo&&active&&!selected&&!fypStart&&!viewerPost&&!document.hidden){v.muted=true;void v.play().catch(()=>{});}else v.pause()})},[playingVideo,active,selected,fypStart,viewerPost,posts]);
 useEffect(()=>{const onVisibility=()=>{if(document.hidden)videoRefs.current.forEach(v=>v.pause());else if(playingVideo&&!fypStart){const v=videoRefs.current.get(playingVideo);if(v)void v.play().catch(()=>{})}};document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[playingVideo,fypStart]);
 const autoPause=useRef(0);
 useEffect(()=>{
  if(!active||selected||expandedImage||fypStart||viewerPost||wideFeed)return;
  const feed=feedRef.current;if(!feed)return;
  let frame=0,last=0,elapsed=0,activeIndex=-1,fromScroll=0,toScroll=0,transitioning=false;
  let scroll:HTMLElement|null=feed;
  while(scroll&&!(scroll.scrollHeight>scroll.clientHeight+40&&/auto|scroll/.test(getComputedStyle(scroll).overflowY)))scroll=scroll.parentElement;
  if(!scroll)return;
  const viewport=scroll;
  const cards=()=>Array.from(feed.querySelectorAll<HTMLElement>(".community-post-card"));
  // A verse reference must be explicit; never infer a recitation from unrelated text.
  const verseAudioUrl=(body:string)=>{
   // The Add Verse tool inserts the authoritative "Qur’an 2:255" label.
   // Read that exact reference from the published post, not from a guessed verse.
   const match=body.match(/Qur[’'\u0027]?an\\s+(\\d{1,3}):(\\d{1,3})/i);
   if(!match)return null;
   const surah=Number(match[1]),ayah=Number(match[2]);
   if(surah<1||surah>114||ayah<1||ayah>286)return null;
   return `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3,"0")}${String(ayah).padStart(3,"0")}.mp3`;
  };
  const stopVerse=()=>{verseAudioRef.current?.pause();verseAudioRef.current=null;verseAudioPostRef.current=null};
  const playVerse=(postId:string)=>{
   if(verseAudioPostRef.current===postId||versePlayedRef.current.has(postId))return;
   stopVerse();
   const post=posts.find(p=>p.id===postId);
   if(!post||Array.from(videoRefs.current.values()).some(v=>!v.paused&&!v.muted))return;
   const url=verseAudioUrl(post.body);if(!url)return;
   const audio=new Audio(url);audio.volume=.7;audio.loop=false;verseAudioRef.current=audio;verseAudioPostRef.current=postId;
   audio.onended=()=>{if(verseAudioRef.current===audio){verseAudioRef.current=null;verseAudioPostRef.current=null}};
   void audio.play().then(()=>versePlayedRef.current.add(postId)).catch(()=>{if(verseAudioRef.current===audio)stopVerse()});
  };

  const clearMotion=()=>cards().forEach(card=>{card.style.removeProperty("--ummah-reading-progress");card.classList.remove("ummah-reading-main","ummah-reading-before","ummah-reading-after");card.style.removeProperty("--ummah-neighbor-drift");card.style.removeProperty("--ummah-neighbor-scale")});
  const interrupt=(event:Event)=>{const target=event.target;if(target instanceof Element&&target.closest(".hudhudSharedNav,.hudhudSharedCollapse,.hudhudSharedHudhud,.hudhud-orb,[data-hudhud],.celestial-orb,[class*=HudHud],[class*=hudhud],[id*=hudhud]"))return;stopVerse();autoPause.current=performance.now()+2000;elapsed=0;activeIndex=-1;transitioning=false;clearMotion()};
  const events=["touchstart","pointerdown","wheel","keydown"] as const;
  events.forEach(event=>window.addEventListener(event,interrupt,{passive:true}));
  const tick=(now:number)=>{
   const dt=last?Math.min(64,now-last):0;last=now;
   if(document.hidden||window.matchMedia("(prefers-reduced-motion: reduce)").matches||now<autoPause.current){frame=requestAnimationFrame(tick);return}
   const all=cards();if(all.length<2){frame=requestAnimationFrame(tick);return}
   const top=viewport.getBoundingClientRect().top;
   if(activeIndex<0){
    activeIndex=all.reduce((best,card,index)=>Math.abs(card.getBoundingClientRect().top-top)<Math.abs(all[best].getBoundingClientRect().top-top)?index:best,0);
    elapsed=0;transitioning=false;clearMotion();all[activeIndex]?.classList.add("ummah-reading-main");if(all[activeIndex])playVerse(all[activeIndex].dataset.postId||"");
   }
   const card=all[activeIndex];if(!card){activeIndex=-1;frame=requestAnimationFrame(tick);return}
   const body=card.querySelector(".ummah-post-package p")?.textContent||"";
   const isVideo=Boolean(card.querySelector("video"));
   const duration=3000;
   if(isVideo&&playingVideo&&finishedVideo!==playingVideo){frame=requestAnimationFrame(tick);return}
   elapsed+=dt;
   if(verseAudioRef.current&&!verseAudioRef.current.paused&&verseAudioPostRef.current===card.dataset.postId){elapsed=Math.min(elapsed,duration-1)}
   const readingProgress=Math.min(1,elapsed/duration);
   card.style.setProperty("--ummah-reading-progress",String(readingProgress));
   const neighborDrift=8*Math.sin(Math.PI*readingProgress);
   const before=all[activeIndex-1],after=all[activeIndex+1];
   if(before){before.classList.add("ummah-reading-before");before.style.setProperty("--ummah-neighbor-drift",neighborDrift+"px")}
   if(after){after.classList.add("ummah-reading-after");after.style.setProperty("--ummah-neighbor-drift",neighborDrift+"px")}
   // Hold the text still for the entire reading window. Only then move to the next post.
   if(elapsed>=duration&&!transitioning){
    stopVerse();
    const next=all[activeIndex+1];
    if(!next){activeIndex=-1;elapsed=0;clearMotion();autoPause.current=now+2000;frame=requestAnimationFrame(tick);return}
    transitioning=true;fromScroll=viewport.scrollTop;
    toScroll=Math.max(0,Math.min(viewport.scrollHeight-viewport.clientHeight,fromScroll+next.getBoundingClientRect().top-top));
   }
   if(transitioning){
    const t=Math.min(1,(elapsed-duration)/1200);
    const eased=t*t*t*(t*(t*6-15)+10);
    viewport.scrollTop=fromScroll+(toScroll-fromScroll)*eased;
    if(t>=1){activeIndex++;elapsed=0;transitioning=false;clearMotion();all[activeIndex]?.classList.add("ummah-reading-main")}
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);stopVerse();clearMotion();events.forEach(event=>window.removeEventListener(event,interrupt))};
 },[active,selected,expandedImage,posts.length,playingVideo,finishedVideo,fypStart,viewerPost,wideFeed]);

 useEffect(()=>{if(!active)return;let alive=true;
  const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(alive){setPosts((data.posts||[]).map((p:UmmahPost)=>{if(!p.media_url)return p;const cached=mediaUrlCache.current.get(p.id);if(cached&&Date.now()-cached.at<25*60*1000)return {...p,media_url:cached.url};mediaUrlCache.current.set(p.id,{url:p.media_url,at:Date.now()});return p}));setLikeCounts(Object.fromEntries((data.posts||[]).map((p:UmmahPost)=>[p.id,Number((p as UmmahPost & {like_count?:number}).like_count||0)])));setCommentCounts(Object.fromEntries((data.posts||[]).map((p:UmmahPost)=>[p.id,Number((p as UmmahPost & {comment_count?:number}).comment_count||0)])));setStatus(data.posts?.length?"":"No posts yet. Be the first to share.");}}catch{if(alive)setStatus("Unable to load the Ummah feed.");}};
  void load();const timer=setInterval(()=>void load(),5000);const refresh=()=>void load();window.addEventListener("1muslim:community-post-published",refresh);return()=>{alive=false;clearInterval(timer);window.removeEventListener("1muslim:community-post-published",refresh)};
 },[active]);
 const likePost=async(id:string)=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setNotice("Sign in to like posts.");return}const was=!!likes[id];setLikes(p=>({...p,[id]:!was}));setLikeCounts(p=>({...p,[id]:Math.max(0,(p[id]||0)+(was?-1:1))}));const res=was?await db.from("ummah_post_likes").delete().eq("post_id",id).eq("user_id",user.id):await db.from("ummah_post_likes").upsert({post_id:id,user_id:user.id},{onConflict:"post_id,user_id"});if(res.error){setLikes(p=>({...p,[id]:was}));setLikeCounts(p=>({...p,[id]:Math.max(0,(p[id]||0)+(was?1:-1))}));setNotice("Unable to save like.")}};
 useEffect(()=>{if(!active)return;const root=feedRef.current;if(!root)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle("ummah-in-view",entry.isIntersecting)},{root,threshold:.12,rootMargin:"0px 0px -8% 0px"});
  root.querySelectorAll(".ummah-floating-pair").forEach(el=>observer.observe(el));
  const glow=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("ummah-center-glow",entry.isIntersecting)),{root:root.closest(".canvas-community-posts-scroll"),rootMargin:"-35% 0px -35% 0px",threshold:0});root.querySelectorAll(".community-post-card").forEach(el=>glow.observe(el));return()=>{observer.disconnect();glow.disconnect()};
 },[active,posts]);
 useEffect(()=>{if(!selected)return;let alive=true;const load=async()=>{try{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(selected),{cache:"no-store"});const d=await r.json();if(alive)setComments(d.comments||[])}catch{if(alive)setNotice("Comments unavailable.")}};void load();return()=>{alive=false}},[selected]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(!selected||!draft.trim()||busy)return;setBusy(true);setNotice("");try{
  const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:selected,body:draft.trim(),parentId:threadPath[threadPath.length-1]||null})});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to comment");
  setComments(previous=>[...previous,d.comment]);setCommentCounts(previous=>({...previous,[selected]:(previous[selected]||0)+1}));setDraft("");
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to comment")}finally{setBusy(false)}};
 useEffect(()=>{
  if(!active||!wideFeed||selected||expandedImage||fypStart||viewerPost)return;
  const root=feedRef.current;
  if(!root)return;
  const lanes=Array.from(root.querySelectorAll<HTMLElement>(".ummah-dual-lane"));
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(motion.matches)return;
  const timers:ReturnType<typeof setTimeout>[]=[];
  const cleanups:Array<()=>void>=[];
  for(const lane of lanes){
    let pausedUntil=performance.now()+3000;
    let index=0;
    let moving=false;
    const cards=()=>Array.from(lane.querySelectorAll<HTMLElement>(".community-post-card"));
    const interrupt=()=>{pausedUntil=performance.now()+2000;moving=false};
    for(const name of ["wheel","touchstart","pointerdown","keydown"]){
      lane.addEventListener(name,interrupt,{passive:true});
      cleanups.push(()=>lane.removeEventListener(name,interrupt));
    }
    const advance=()=>{
      if(document.hidden||performance.now()<pausedUntil||moving)return;
      const all=cards();
      if(all.length<2)return;
      const nearest=all.reduce((best,card,i)=>Math.abs(card.offsetTop-lane.scrollTop)<Math.abs(all[best].offsetTop-lane.scrollTop)?i:best,0);
      index=(nearest+1)%all.length;
      moving=true;
      const target=index===0?0:all[index].offsetTop-all[0].offsetTop;
      const start=lane.scrollTop, distance=target-start;
      const duration=900,begin=performance.now();
      let raf=0;
      const step=(now:number)=>{
        if(performance.now()<pausedUntil||document.hidden){moving=false;return}
        const t=Math.min(1,(now-begin)/duration);
        const ease=t*t*t*(t*(t*6-15)+10);
        lane.scrollTop=start+distance*ease;
        if(t<1)raf=requestAnimationFrame(step);else moving=false;
      };
      raf=requestAnimationFrame(step);
      cleanups.push(()=>cancelAnimationFrame(raf));
    };
    const timer=setInterval(advance,3000);
    timers.push(timer);
  }
  return()=>{timers.forEach(clearInterval);cleanups.forEach(fn=>fn())};
 },[active,posts.length,selected,expandedImage,fypStart,viewerPost,wideFeed]);


 const renderFeedPost=(post:UmmahPost)=><article data-post-id={post.id} data-post-theme={postThemeClass(post.post_theme)} className={`community-post-card ummah-template ummah-template-${postKind(post)} ummah-variant-${(post.id.charCodeAt(0)+layoutSeed)%3}`} key={post.id}>
    <span className="ummah-post-theme-particles" aria-hidden="true"/>
    <header><span className="community-post-avatar">{post.avatar_url?<img src={post.avatar_url} alt="" loading="lazy"/>:(post.author_name||"M").charAt(0).toUpperCase()}</span><div><strong>{post.author_name||"Member"}</strong>{post.shahada_verified&&<span className="ummah-verified-badge" title="Shahada verified" aria-label="Shahada verified">✓</span>}<small>{new Date(post.created_at).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} · {post.author_handle||"1Muslim"}</small></div><div className="ummah-post-menu-wrap"><button type="button" className="ummah-post-more" aria-label="Post options" onClick={()=>setPostMenu(postMenu===post.id?null:post.id)}>•••</button>{postMenu===post.id&&<div className="ummah-post-menu"><button type="button" onClick={()=>{void sharePost(post.id);setPostMenu(null)}}>↗ Share post</button><button type="button" onClick={()=>{toggleBookmark(post.id);setPostMenu(null)}}>▢ {bookmarks[post.id]?"Remove saved":"Save post"}</button></div>}</div></header>
    <div className="ummah-post-package" onClick={e=>{if((e.target as HTMLElement).closest("button,a,video"))return;openPostViewer(post)}}>{postKind(post)==="verse"&&<div className="ummah-verse-ornament" aria-hidden="true">۞</div>}<span className="ummah-package-label">{postKind(post)==="verse"?"✦ QUR’AN & REFLECTION":postKind(post)==="video"?"▶ VIDEO":postKind(post)==="image"?"✧ PHOTO":"✎ REFLECTION"}</span>{mediaFor(post)&&(postKind(post)==="video"?<div className="ummah-video-frame"><video ref={el=>{if(el)videoRefs.current.set(post.id,el);else videoRefs.current.delete(post.id)}} key={post.id} src={mediaFor(post)} muted playsInline preload="auto" onClick={()=>openPostViewer(post)} onPlay={()=>setFinishedVideo(null)} onEnded={()=>{setFinishedVideo(post.id);autoPause.current=0}} className="ummah-package-media ummah-video-preview" aria-label="Post video"/><button type="button" className="ummah-video-fyp-open" aria-label="Open video in For You player" onClick={()=>setFypStart(post.id)}><span>▶</span></button></div>:<button type="button" className="ummah-media-expand" onClick={()=>openPostViewer(post)} onDoubleClick={e=>{e.preventDefault();void likePost(post.id)}} aria-label="Expand post image"><img src={mediaFor(post)} alt="Post attachment" loading="lazy" className="ummah-package-media"/></button>)}<p className="ummah-post-body">{renderPostBody(post.body.replace(/^✦ DAILY UMMAH ✦(?:\\n|\r?\n)?\s*/,""))}</p>{!mediaFor(post)&&youtubePreview(post.body)&&<a className="ummah-youtube-preview" href={youtubePreview(post.body)!.url} target="_blank" rel="noopener noreferrer" aria-label="Watch YouTube video"><img src={youtubePreview(post.body)!.thumbnail} alt="YouTube video thumbnail" loading="lazy"/><span>▶ Watch on YouTube</span></a>}</div><footer className="ummah-social-actions"><button type="button" aria-pressed={!!likes[post.id]} onClick={()=>void likePost(post.id)}>{likes[post.id]?"♥":"♡"} {likeCounts[post.id]||""}</button><button type="button" onClick={()=>{setSelected(post.id);setThreadPath([]);setComments([]);setNotice("")}}>♧ {commentCounts[post.id]||""}</button><button type="button" aria-pressed={!!bookmarks[post.id]} onClick={()=>toggleBookmark(post.id)} aria-label={bookmarks[post.id]?"Remove bookmark":"Bookmark post"}>{bookmarks[post.id]?"▣ Saved":"▢ Save"}</button><button type="button" onClick={()=>void sharePost(post.id)} aria-label="Share post">↗ Share</button></footer>
   </article>;
  return <div className="community-simple-feed">
  <div className="community-posts-list" ref={feedRef} aria-label="Community posts">
   {!wideFeed&&<div className="ummah-feed-single">{posts.map(renderFeedPost)}</div>}
   {wideFeed&&<div className="ummah-dual-lanes" aria-label="Two independent post lanes">
    <div className="ummah-dual-lane" data-lane="left" aria-label="Left posts lane">{posts.filter((_,i)=>i%2===0).map(renderFeedPost)}</div>
    <div className="ummah-dual-lane" data-lane="right" aria-label="Right posts lane">{posts.filter((_,i)=>i%2===1).map(renderFeedPost)}</div>
   </div>}
   {!posts.length?<p className="community-feed-empty">{status}</p>:null}
   {notice&&!selected&&<p role="status">{notice}</p>}
  </div>
  {viewerPost&&posts.some(p=>p.id===viewerPost)&&typeof document!=="undefined"&&createPortal(<div className="ummah-unified-viewer" role="dialog" aria-modal="true" aria-label="Open post" onClick={()=>setViewerPost(null)}><div className="ummah-unified-stage" onPointerDown={()=>setViewerActionsVisible(true)} data-post-theme={postThemeClass(posts.find(p=>p.id===viewerPost)?.post_theme)} onClick={e=>e.stopPropagation()}><button type="button" className="ummah-unified-close" onClick={()=>setViewerPost(null)} aria-label="Close post">✕</button>{(()=>{const p=posts.find(item=>item.id===viewerPost)!;return <><div className="ummah-unified-media"><span className="ummah-themed-particles" aria-hidden="true"/>{postKind(p)==="video"?<video key={p.id} ref={viewerVideoRef} onLoadedMetadata={e=>{e.currentTarget.currentTime=Math.min(videoStartAt.current,Math.max(0,e.currentTarget.duration-.1))}} src={mediaFor(p)} controls playsInline autoPlay preload="auto"/>:postKind(p)==="image"?<img src={mediaFor(p)} alt="Post photo"/>:<div className="ummah-unified-text">{renderPostBody(p.body)}</div>}</div><div className="ummah-unified-caption"><strong>{p.author_name}</strong><p className="ummah-post-body">{renderPostBody(p.body)}</p><div className={`ummah-unified-actions ${viewerActionsVisible?"is-visible":"is-idle"}`}><button type="button" onClick={()=>void likePost(p.id)}>♡ {likeCounts[p.id]||0}</button><button type="button" onClick={()=>openViewerComments(p.id)}>💬 {commentCounts[p.id]||0}</button><button type="button" onClick={()=>void sharePost(p.id)}>↗ Share</button><button type="button" onClick={()=>toggleBookmark(p.id)}>{bookmarks[p.id]?"▣ Saved":"▢ Save"}</button></div></div></>})()}</div></div>,document.body)}
  <style jsx>{`
 .fyp-pull-refresh{position:absolute;top:62px;left:50%;z-index:13;padding:8px 18px;border:1px solid #ffffff55;border-radius:24px;background:#081a19bf;backdrop-filter:blur(12px);color:#fff;font-size:13px;pointer-events:none;white-space:nowrap}
 .fyp-speed-indicator{position:absolute;z-index:11;top:15%;left:50%;transform:translateX(-50%);padding:7px 17px;border-radius:24px;background:#071d1bcc;backdrop-filter:blur(12px);color:white;font-weight:800;font-size:22px;pointer-events:none;border:1px solid #ffffff50}
 .fyp-search-shell{position:absolute;z-index:12;top:12px;left:50%;transform:translateX(-50%);width:min(340px,60vw);pointer-events:none}
 .fyp-search-toggle{display:flex;align-items:center;justify-content:center;gap:8px;margin:auto;padding:7px 18px;border:1px solid #ffffff45;border-radius:24px;background:#101b1b66;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;font-size:13px;cursor:pointer;pointer-events:auto}
 .fyp-search-panel{margin-top:8px;padding:8px;border:1px solid #ffffff45;border-radius:16px;background:#081a19d9;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);pointer-events:auto}
 .fyp-search-panel input{box-sizing:border-box;width:100%;padding:10px 12px;border-radius:10px;border:1px solid #ffffff50;background:#ffffff17;color:#fff;outline:none}
 .fyp-search-panel input::placeholder{color:#ffffffac}
 .fyp-search-results{max-height:35dvh;overflow:auto}
 .fyp-search-results button{display:flex;flex-direction:column;gap:3px;width:100%;padding:9px 8px;text-align:left;background:transparent;color:white;border:0;border-bottom:1px solid #ffffff25;cursor:pointer}
 .fyp-search-results button span{font-size:12px;opacity:.8;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:100%}
 .fyp-search-results p{padding:8px;color:#fff;font-size:13px}
 .fyp-preparing-transition{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;background:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.35)),url("/assets/decoration-day.png") center/cover no-repeat,#081a15;color:#fff;opacity:0;visibility:hidden;transform:scale(1.045);transition:opacity .32s ease,transform .4s ease,visibility 0s linear .4s;pointer-events:none}
 .fyp-preparing-transition.is-preparing{opacity:1;visibility:visible;transform:scale(1);transition:opacity .16s ease,transform .3s ease}
 
 .fyp-preparing-title{font-size:clamp(28px,7vw,46px);font-weight:800;letter-spacing:.035em;text-shadow:0 3px 20px #000b;animation:fypOrbBreathe 1s ease-in-out infinite}
 .fyp-preparing-progress{width:min(170px,45vw);height:2px;background:#ffffff30;overflow:hidden;border-radius:99px}
 .fyp-preparing-progress>span{display:block;width:100%;height:100%;transform:scaleX(0);transform-origin:left;background:linear-gradient(90deg,#42cf9c,#d8bd76);animation:fypBufferProgress 1s linear forwards}
 @keyframes fypBufferProgress{to{transform:scaleX(1)}}
 @keyframes fypOrbBreathe{50%{transform:scale(1.16);opacity:.75}}
 @media(prefers-reduced-motion:reduce){.fyp-preparing-transition,.fyp-preparing-orb,.fyp-preparing-progress>span{animation:none;transition:none}.fyp-preparing-progress>span{transform:scaleX(1)}}
 `}</style>
  {fypStart&&<div className="ummah-fyp-overlay" role="dialog" aria-modal="true" aria-label="For You videos"><button type="button" className="ummah-fyp-close" onClick={()=>setFypStart(null)}>✕ Close</button><div className="fyp-search-shell"><button type="button" className="fyp-search-toggle" aria-label="Search For You videos" aria-expanded={fypSearchOpen} onClick={()=>setFypSearchOpen(open=>!open)}>⌕ <span>Search</span></button>{fypSearchOpen&&<div className="fyp-search-panel"><input autoFocus type="search" aria-label="Search FYP videos" placeholder="Search videos or creators…" value={fypSearchQuery} onChange={e=>setFypSearchQuery(e.target.value)}/>{fypSearchQuery.trim()&&<div className="fyp-search-results">{fypSearchResults.length?fypSearchResults.map(({post,index})=><button type="button" key={post.id} onClick={()=>{setFypSearchOpen(false);setFypSearchQuery("");setFypActiveIndex(index);fypReelRef.current?.querySelector<HTMLElement>(`section[data-fyp-index="${index}"]`)?.scrollIntoView({block:"start",behavior:"smooth"})}}><strong>{post.author_name||"1Muslim"}</strong><span>{post.body?.slice(0,75)||"Video"}</span></button>):<p>No matching videos</p>}</div>}</div>}</div>{fypNeedsTapForSound&&!fypWarmingUp&&<button type="button" onClick={()=>{setFypSoundUnlocked(true);setFypNeedsTapForSound(false);const video=fypVideoRefs.current.get(fypOrder[fypActiveIndex]?.id);if(video){video.muted=false;void video.play().catch(()=>{video.muted=true;setFypNeedsTapForSound(true)})}}} style={{position:"absolute",zIndex:7,top:60,left:"50%",transform:"translateX(-50%)",borderRadius:20,padding:"9px 18px",background:"rgba(0,0,0,.65)",color:"#fff",border:"1px solid currentColor"}}>Tap to enable sound</button>}<div aria-hidden={!fypWarmingUp} role="status" aria-live="polite" className={`fyp-preparing-transition ${fypWarmingUp?"is-preparing":""}`}><span className="fyp-preparing-title">1Muslim</span><span className="fyp-preparing-progress"><span /></span></div>{fypSpeed>1&&<div className="fyp-speed-indicator" aria-live="off">{fypSpeed}×</div>}{fypPullDistance>0&&<div className="fyp-pull-refresh" style={{opacity:Math.min(1,fypPullDistance/55),transform:`translate(-50%,${Math.min(0,fypPullDistance-60)}px)`}}>{fypPullDistance>=75?"↻ Release to shuffle":"↓ Pull to shuffle"}</div>}<div className="ummah-fyp-reel" ref={fypReelRef}>{fypOrder.map((p,i)=><section key={p.id} data-fyp-index={i}><video ref={node=>{if(node)fypVideoRefs.current.set(p.id,node);else fypVideoRefs.current.delete(p.id)}} src={i>=fypActiveIndex-1&&i<=fypActiveIndex+3?mediaFor(p):undefined} controls playsInline muted={i!==fypActiveIndex||!fypSoundUnlocked} preload={i>=fypActiveIndex-1&&i<=fypActiveIndex+3?"auto":"none"} onEnded={()=>{const next=fypReelRef.current?.querySelector<HTMLElement>(`section[data-fyp-index="${i+1}"]`);next?.scrollIntoView({behavior:"smooth",block:"start"})}}/><p>{p.body}</p></section>)}</div></div>}
  {expandedImage&&<div className="ummah-image-lightbox" role="presentation" onClick={()=>setExpandedImage(null)}><button type="button" aria-label="Close expanded image" onClick={()=>setExpandedImage(null)}>✕</button><img src={expandedImage} alt="Expanded post image" onClick={e=>e.stopPropagation()}/></div>}
  {selected&&typeof document!=="undefined"&&createPortal(<div className="ummah-comments-backdrop ummah-comments-viewport" style={{top:commentViewport.top,height:commentViewport.height||"100dvh"}} role="presentation" onClick={()=>setSelected(null)}>
   <section data-post-theme={typeof document!=="undefined"?(document.documentElement.dataset.muslimTheme||"emerald"):"emerald"} className="ummah-comments-sheet ummah-comments-theme-responsive" role="dialog" aria-modal="true" aria-label="Post comments" onClick={e=>e.stopPropagation()}>
    <header><button type="button" onClick={()=>threadPath.length?setThreadPath(p=>p.slice(0,-1)):setSelected(null)} aria-label="Back one conversation level">← Back</button><strong>✦ {threadPath.length?"Replies · Level "+(threadPath.length+1):"Conversation"}</strong><button type="button" onClick={()=>setSelected(null)} aria-label="Close comments">✕</button></header>
    <div className="ummah-comment-context"><div className="ummah-comment-context-row"><span className="ummah-context-avatar">{posts.find(p=>p.id===selected)?.avatar_url?<img src={posts.find(p=>p.id===selected)?.avatar_url||""} alt=""/>:"✦"}</span><div><strong>{posts.find(p=>p.id===selected)?.author_name||"Member"} · Original post</strong><p>{(posts.find(p=>p.id===selected)?.body||"").slice(0,140)}</p></div></div>{threadPath.map((id,index)=>{const parent=comments.find(c=>c.id===id);return parent?<div className="ummah-comment-context-row" key={id}><span className="ummah-context-avatar">{parent.avatar_url?<img src={parent.avatar_url} alt=""/>:"✦"}</span><div><strong>{parent.name} · Level {index+1}</strong><p>{parent.body}</p></div></div>:null})}</div>
    <div className="ummah-comments-list">{comments.filter(c=>c.parent_id===(threadPath[threadPath.length-1]||null)).map(c=><article key={c.id} className="ummah-comment-glass"><span className="ummah-comment-author">{c.avatar_url?<img className="ummah-comment-avatar" src={c.avatar_url} alt=""/>:<span className="ummah-comment-avatar">✦</span>}<strong>{c.name}</strong></span><time dateTime={c.created_at}>{new Date(c.created_at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</time><p>{c.body}</p><div className="ummah-comment-actions"><button type="button" aria-pressed={!!c.liked} onClick={()=>void likeComment(c.id)}>{c.liked?"♥":"♡"} {c.likes||0}</button>{threadPath.length<2&&<button type="button" onClick={()=>{setThreadPath(p=>[...p,c.id]);setDraft("")}}>↳ Replies ({comments.filter(reply=>reply.parent_id===c.id).length})</button>}</div></article>)}{!comments.some(c=>c.parent_id===(threadPath[threadPath.length-1]||null))&&<p>Be the first to reply.</p>}</div>
    <style>{` .ummah-comments-sheet.ummah-comments-theme-responsive{border-color:var(--theme-edge,#54d5a3)!important;background:linear-gradient(160deg,color-mix(in srgb,var(--theme-surface,#073c30) 86%,#080e13),#0a1118)!important}.ummah-comments-sheet .ummah-comment-glass{border-color:var(--theme-edge,#54d5a3)!important;background:color-mix(in srgb,var(--theme-surface,#073c30) 70%,transparent)!important}.ummah-comment-context{max-height:28dvh;overflow-y:auto;flex-shrink:0;border-bottom:1px solid var(--theme-edge,#54d5a3);padding:8px 16px}.ummah-comment-context-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:9px}.ummah-comment-context-row>div{min-width:0;flex:1}.ummah-comment-context-row strong{font-size:13px;color:var(--theme-edge,#54d5a3)}.ummah-comment-context-row p{font-size:13px;line-height:1.4;margin:3px 0;overflow-wrap:anywhere}.ummah-context-avatar,.ummah-comment-avatar{display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;border-radius:50%;border:1px solid var(--theme-edge,#54d5a3);overflow:hidden;object-fit:cover}.ummah-context-avatar img{width:100%;height:100%;object-fit:cover}.ummah-comment-author{display:inline-flex;align-items:center;gap:8px}.ummah-comments-sheet .ummah-comments-list{min-height:0;overflow-y:auto;flex:1 1 auto} `}</style>
    <form onSubmit={e=>void send(e)}><input aria-label="Write a comment" inputMode="text" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder={threadPath.length?"Write a reply…":"Write a thoughtful comment…"}/><button type="submit" disabled={busy||!draft.trim()}>Send ↗</button></form>
    {notice&&<p role="alert">{notice}</p>}
   </section>
  </div>,document.body)}
 </div>;
}
/** Posts-only canvas: the Community Map is a separate destination, not a Posts tab. */
export function CommunityMap({active}:{active:boolean}){
 return <div className="canvas-community-map-shell canvas-community-posts-only"><div className="canvas-community-posts-scroll"><DailyPostsApp active={active}/></div></div>;
}
export default function CanvasSecondaryApp({slot,active}:{slot:number;active:boolean}){
 return <div className={slot===0?"canvas-native-app canvas-profile-mirror":"canvas-native-app"}>{slot!==0&&<header><span>0{slot+6} · 1MUSLIM</span><h2>{titles[slot]}</h2></header>}<div className="canvas-native-body">
 {slot===0?<GameLabProfileHub active={active} avatarHero={<ProfileApp active={active} heroOnly/>} profile={<ProfileApp active={active}/>} renderProfileSection={(section)=><ProfileApp active={active} section={section}/>}/>:slot===1?<RecorderApp active={active}/>:slot===2?<DailyPostsApp active={active}/>:slot===3?<HomeMessagesChooser/>:slot===4?<ElmTentAlphabet/>:<div className="canvas-community-map-panel"><strong>Community connections</strong><p>Discover Muslims and mosques through the Community Map above.</p></div>}
 </div>{slot!==0&&<footer><Link href={destinations[slot]}>Open full experience ↗</Link></footer>}</div>
}