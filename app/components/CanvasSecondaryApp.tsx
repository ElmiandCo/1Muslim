"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import GameLabProfileHub from "./GameLabProfileHub";
import ProfileVideos from "./ProfileVideos";
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
 const [profile,setProfile]=useState<Profile|null>(null);const [earnedBadges,setEarnedBadges]=useState<string[]>([]);const [status,setStatus]=useState("Loading your profile…");const [editingAvatar,setEditingAvatar]=useState(false);const [savingAvatar,setSavingAvatar]=useState(false);const [selectedAvatar,setSelectedAvatar]=useState<string|null>(null);const [selectedBackground,setSelectedBackground]=useState<string|null>(null);const [savingBackground,setSavingBackground]=useState(false);const [editNotice,setEditNotice]=useState("");const [tab,setTab]=useState<"avatar"|"background"|"badges"|"videos">("avatar");
 useEffect(()=>{if(!active)return;const open=()=>{setSlide("profile");setTab("background")};window.addEventListener("1muslim:open-profile-background",open);if(new URLSearchParams(window.location.search).get("profile")==="background")open();return()=>window.removeEventListener("1muslim:open-profile-background",open)},[active]);
 useEffect(()=>{setTab(section==="Background"?"background":section==="Badges"?"badges":"avatar");if(section==="Settings")setSlide("settings");else setSlide("profile")},[section]);useEffect(()=>{if(!active)return;try{if(sessionStorage.getItem("1muslim:post-success-destination")==="videos"){sessionStorage.removeItem("1muslim:post-success-destination");setTab("videos");setSlide("profile")}}catch{}},[active]);const [usernameDraft,setUsernameDraft]=useState("");const [savingUsername,setSavingUsername]=useState(false);const [namePopupOpen,setNamePopupOpen]=useState(false);const namePopupRef=useRef<HTMLDivElement|null>(null);const [bioDraft,setBioDraft]=useState("");const [savingBio,setSavingBio]=useState(false);const [bioEditing,setBioEditing]=useState(false);const [slide,setSlide]=useState<"profile"|"ranks"|"settings">("profile");const [rankCountry,setRankCountry]=useState("All");const [rankGender,setRankGender]=useState("All");const [rankings,setRankings]=useState<Array<{id:string;display_name:string|null;username:string|null;xp_total:number|null;country:string|null;gender:string|null}>>([]);const [rankStatus,setRankStatus]=useState("Select Ranks to load the leaderboard.");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();(async()=>{
  const {data:{user}}=await db.auth.getUser();if(!alive)return;
  if(!user){setStatus("Sign in to see your profile.");return}
  const {data,error}=await db.from("profiles").select("id,display_name,username,xp_total,bio,shahada_verified_at,gender,avatar_gender,avatar_package,avatar_config,profile_accent").eq("id",user.id).maybeSingle();
  if(!alive)return;if(error){setStatus("Profile is unavailable right now.");return}
  setProfile(data);setUsernameDraft(data?.username||"");setBioDraft((data?.bio||"").slice(0,35));setStatus(data?"":"Complete your profile to begin.");const badges=await db.from("member_badges").select("badge_key").eq("user_id",user.id);if(alive)setEarnedBadges((badges.data??[]).map(row=>row.badge_key));
 })();return()=>{alive=false}},[active]);
 const chooseAvatar=async(url:string)=>{
  if(!profile?.id||savingAvatar)return;
  const silver=url.includes("silver-avatar");
  if(silver&&(profile.xp_total??0)<5000){setEditNotice("Silver unlocks at 5,000 XP.");return;}
  setSavingAvatar(true);setEditNotice("");
  const db=createClient();const {data:{user}}=await db.auth.getUser();
  if(!user||user.id!==profile.id){setEditNotice("Sign in to customize your profile.");setSavingAvatar(false);return;}
  const config={...(profile.avatar_config??{}),selectedAvatarUrl:url};
  const {error}=await db.from("profiles").update({avatar_config:config}).eq("id",user.id);
  if(error)setEditNotice(error.message);else{setProfile(p=>p?{...p,avatar_config:config}:p);setEditNotice("✓ Avatar saved");setSelectedAvatar(null);try{const audio=new Audio("/audio/hudhud-welcome.mp3");audio.volume=.65;void audio.play().catch(()=>{});}catch{}}
  setSavingAvatar(false);
 };
 useEffect(()=>{const sync=(event:Event)=>{const detail=(event as CustomEvent<{id:string;username:string}>).detail;if(detail?.id)setProfile(p=>p?.id===detail.id?{...p,username:detail.username}:p)};window.addEventListener("1muslim:profile-identity-updated",sync);return()=>window.removeEventListener("1muslim:profile-identity-updated",sync)},[]);
 const saveUsername=async()=>{if(!profile?.id||savingUsername)return;const username=usernameDraft.trim().replace(/^@/,"");if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)){setEditNotice("Username needs 3–30 letters, numbers, or underscores.");return;}setSavingUsername(true);const db=createClient();const {data,error}=await db.from("profiles").update({username}).eq("id",profile.id).select("username").single();if(error||data?.username!==username){setEditNotice("Username save failed. Please try again.");}else{setProfile(p=>p?{...p,username:data.username}:p);setUsernameDraft(data.username);window.dispatchEvent(new CustomEvent("1muslim:profile-identity-updated",{detail:{id:profile.id,username:data.username}}));setEditNotice("✓ Username saved to your account");}setSavingUsername(false);};
 useEffect(()=>{if(!namePopupOpen)return;const close=(e:PointerEvent)=>{if(namePopupRef.current&&!namePopupRef.current.contains(e.target as Node)){setUsernameDraft(profile?.username||"");setNamePopupOpen(false)}};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setUsernameDraft(profile?.username||"");setNamePopupOpen(false)}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape)}},[namePopupOpen,profile?.username]);
 const backgrounds=[
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
   if(key==="obsidian"||key==="titanium"){localStorage.setItem("1muslim-theme-mode","night");localStorage.setItem("1muslim-theme","dark");document.documentElement.classList.remove("light");window.dispatchEvent(new Event("1muslim:theme-changed"));}
  }
  setSavingBackground(false);
 };
 const avatars=[
{name:"Default",url:"/assets/avatars/default-male.jpg",xp:0,gender:"male",category:"Basic"},
{name:"Default",url:"/assets/avatars/Default-women.png",xp:0,gender:"female",category:"Basic"},
...(["Silver","Gold","Water","Cosmic"] as const).flatMap(name=>(["male","female"] as const).map(gender=>({name,url:`/assets/avatars/${name.toLowerCase()}-avatar-${gender}.${name==="Silver"?"jpg":"PNG"}`,xp:5000,gender,category:["Silver","Gold","Water"].includes(name)?"Elemental":"Elite"}))),
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
 if(heroOnly)return profile?<div className="profile-shared-avatar-hero"><div className="canvas-native-avatar profile-glass-avatar" aria-label="Your selected avatar" style={{display:"flex",justifyContent:"center",alignItems:"center",margin:"0 auto",width:"100%",maxWidth:164,minHeight:154,padding:"18px 4px 17px",position:"relative",isolation:"isolate",overflow:"hidden",border:"1px solid rgba(244,212,142,.18)",boxShadow:"0 12px 34px rgba(0,0,0,.16),inset 0 0 28px rgba(255,255,255,.04)",borderRadius:28,background:"transparent",backdropFilter:"blur(5px)"}}><div className="profile-avatar-portrait"><ProfileAvatar name={profile.username||profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="md"/></div><strong className="profile-avatar-xp" style={{position:"absolute",bottom:5,left:8,right:8,textAlign:"center",fontSize:13,color:"#e6c77e",textShadow:"0 1px 5px #082c25"}}>✦ {(profile.xp_total||0).toLocaleString()} XP</strong></div></div>:null;
 return <div className="canvas-native-profile" {...profileParallax} style={{touchAction:"auto",overscrollBehaviorY:"contain",position:"relative",isolation:"isolate",overflowY:"auto",overflowX:"hidden",height:"100%",minHeight:0,maxHeight:"100%",WebkitOverflowScrolling:"touch",background:"transparent",border:"none",borderRadius:0,padding:"12px 12px 38px",backdropFilter:"none"}}>
 {backgroundImageReady&&<div key={currentBackground} className="profile-theme-scene" aria-hidden="true" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55)),url("${backgroundUrl(currentBackground)}")`,opacity:.5,filter:"blur(9px)",transform:"scale(1.045)",maskImage:"radial-gradient(ellipse 82% 76% at 50% 50%,black 46%,transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 82% 76% at 50% 50%,black 46%,transparent 100%)",pointerEvents:"none"}}/>}
 {false&&backgroundImageReady&&<div aria-hidden="true" style={{position:"absolute",inset:-24,zIndex:-2,pointerEvents:"none",backgroundImage:`linear-gradient(180deg,rgba(3,20,18,.48),rgba(3,20,18,.74)),url("${backgroundUrl(currentBackground)}")`,backgroundSize:"cover",backgroundPosition:"center",transform:`translate3d(${parallaxOffset.x}px,${parallaxOffset.y}px,0) scale(1.035)`,transition:"transform .65s cubic-bezier(.22,1,.36,1)",willChange:"transform"}}/>}
 {false&&backgroundImageReady&&<div aria-hidden="true" className="profile-background-particles" style={{position:"absolute",inset:0,zIndex:-1,pointerEvents:"none",opacity:.55,backgroundImage:"radial-gradient(circle,rgba(255,255,255,.75) 1px,transparent 2px),radial-gradient(circle,rgba(240,209,148,.6) 1px,transparent 2px)",backgroundSize:"93px 137px,151px 113px",backgroundPosition:`${parallaxOffset.x*.4}px ${parallaxOffset.y*.4}px,${-parallaxOffset.x*.3}px ${-parallaxOffset.y*.3}px`,transition:"background-position .8s cubic-bezier(.22,1,.36,1)"}}/>}
 {slide==="ranks"?<section aria-label="XP leaderboard" style={panelStyle}><h3 style={{margin:"0 0 8px"}}>✦ Community Ranks</h3><p style={{fontSize:12,opacity:.8}}>Top 100 XP profiles · filters</p><div style={{display:"flex",gap:8,marginBottom:12}}><select aria-label="Filter country" value={rankCountry} onChange={e=>setRankCountry(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option>{countries.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Filter gender" value={rankGender} onChange={e=>setRankGender(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option><option value="male">Male</option><option value="female">Female</option></select></div><div data-ranks-scroll style={{maxHeight:350,overflowY:"auto",overscrollBehaviorY:"contain",touchAction:"pan-y",display:"grid",gap:6}}>{filteredRanks.length?filteredRanks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:"rgba(255,255,255,.045)",borderRadius:12}}><strong style={{minWidth:27,color:"#e6c77e"}}>#{rankings.indexOf(p)+1}</strong><span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.display_name||p.username||"Member"}</span><strong style={{fontSize:12}}>{(p.xp_total||0).toLocaleString()} XP</strong></div>):<p role="status">{rankings.length?"No matching profiles.":rankStatus}</p>}</div></section>:slide==="settings"?<section aria-label="Profile settings" style={{display:"grid",gap:10,textAlign:"left"}}>{[{title:"Account & identity",items:[["Edit profile","/profile"],["Avatar & background","/profile#avatar"],["Account connections","/profile#connections"]]},{title:"Privacy & safety",items:[["Privacy and account controls","/profile"],["Safety and reporting","/profile"]]},{title:"Notifications & preferences",items:[["Notification preferences","/profile"],["Display preferences","/profile"]]},{title:"Community",items:[["Badges & rewards","/profile#badges"],["Social connections","/profile#connections"]]}].map(group=><div key={group.title} style={panelStyle}><h4 style={{margin:"0 0 5px",color:"#e6c77e",fontSize:12}}>{group.title}</h4>{group.items.map(([label,href])=><Link key={label} href={href} style={{display:"flex",justifyContent:"space-between",padding:"9px 2px",borderBottom:"1px solid rgba(255,255,255,.08)",fontSize:13}}>{label}<span aria-hidden="true">›</span></Link>)}</div>)}</section>:profile?<><section className="profile-glass-identity profile-identity-compact" aria-label="Edit profile identity" style={{width:"calc(100% - 8px)",maxWidth:"none",margin:"4px auto 4px",padding:"3px 10px",borderRadius:17,background:"rgba(9,45,41,.22)",border:"1px solid rgba(226,203,145,.19)",backdropFilter:"blur(14px)",boxShadow:"inset 0 1px 0 rgba(255,255,255,.04)"}}>
<form onSubmit={e=>{e.preventDefault();void saveUsername()}} style={{display:"flex",alignItems:"center",gap:8,minHeight:35,borderBottom:"1px solid rgba(226,203,145,.13)"}}><label htmlFor="profile-inline-username" style={{fontSize:11,color:"#e6c77e",flex:"0 0 68px"}}>Username</label><input id="profile-inline-username" aria-label="Username" maxLength={30} readOnly={!namePopupOpen} value={namePopupOpen?usernameDraft:(profile.username||profile.display_name||"")} onChange={e=>setUsernameDraft(e.target.value)} style={{flex:1,minWidth:0,padding:"7px 0",fontSize:16,color:"#f6f2e6",background:"transparent",border:0,outline:"none",textOverflow:"ellipsis"}}/><button type="button" onClick={()=>{if(namePopupOpen){setUsernameDraft(profile.username||"");setNamePopupOpen(false)}else setNamePopupOpen(true)}} aria-label={namePopupOpen?"Cancel username editing":"Edit username"} style={{flex:"0 0 30px",width:30,height:30,borderRadius:"50%",border:"1px solid rgba(230,199,126,.18)",background:"rgba(255,255,255,.04)",color:"#e6c77e",fontSize:14}}>{namePopupOpen?"×":"✎"}</button>{namePopupOpen&&<button type="submit" disabled={savingUsername||!usernameDraft.trim()} aria-label="Save username" style={{flex:"0 0 30px",width:30,height:30,borderRadius:"50%",border:"1px solid rgba(230,199,126,.3)",background:"rgba(255,255,255,.055)",color:"#e6c77e",fontSize:16}}>{savingUsername?"…":"✓"}</button>}</form>
<form onSubmit={e=>{e.preventDefault();void saveBio()}} style={{display:"flex",alignItems:"center",gap:8,minHeight:35}}><label htmlFor="profile-inline-bio" style={{fontSize:11,color:"#e6c77e",flex:"0 0 68px"}}>Bio</label><input id="profile-inline-bio" aria-label="Your bio, maximum 35 characters" maxLength={35} readOnly={!bioEditing} value={bioDraft} onChange={e=>setBioDraft(e.target.value)} placeholder="Add a short bio…" style={{flex:1,minWidth:0,padding:"7px 0",fontSize:16,color:"#f6f2e6",background:"transparent",border:0,outline:"none",textOverflow:"ellipsis"}}/><button type="button" onClick={()=>{if(bioEditing){setBioDraft(profile.bio||"");setBioEditing(false)}else setBioEditing(true)}} aria-label={bioEditing?"Cancel bio editing":"Edit bio"} title={bioEditing?"Cancel":"Edit bio"} style={{flex:"0 0 30px",width:30,height:30,borderRadius:"50%",border:"1px solid rgba(230,199,126,.18)",background:"rgba(255,255,255,.04)",color:"#e6c77e",fontSize:14,cursor:"pointer"}}>{bioEditing?"×":"✎"}</button>{bioEditing&&<button type="submit" disabled={savingBio||bioDraft.trim()===(profile.bio||"")} aria-label="Save bio" title="Save bio" style={{flex:"0 0 30px",width:30,height:30,borderRadius:"50%",border:"1px solid rgba(230,199,126,.3)",background:"rgba(255,255,255,.055)",color:"#e6c77e",cursor:"pointer",fontSize:16,opacity:savingBio||bioDraft.trim()===(profile.bio||"")?.4:1}}>{savingBio?"…":"✓"}</button>}</form></section><div className="profile-glass-tabs profile-tabs-compact" role="tablist" aria-label="Profile customization" >{(["avatar","background","badges","videos"] as const).map(t=><button key={t} type="button" role="tab" aria-selected={tab===t} onClick={e=>{const scrollContainers:HTMLElement[]=[];let node=e.currentTarget.parentElement;while(node){if(node.scrollHeight>node.clientHeight+2&&getComputedStyle(node).overflowY!=="visible")scrollContainers.push(node);node=node.parentElement}const offsets=scrollContainers.map(el=>el.scrollTop);setTab(t);requestAnimationFrame(()=>requestAnimationFrame(()=>scrollContainers.forEach((el,i)=>{el.scrollTop=offsets[i]})))}} aria-label={t==="avatar"?"Avatar":t==="background"?"Background":t==="badges"?"Badges":"Videos"} className="profile-icon-tab"><span aria-hidden="true">{({avatar:"♙",background:"▧",badges:"♢",videos:"▤"} as const)[t]}</span></button>)}</div>{tab==="avatar"&&<div role="tabpanel" style={{display:"grid",gap:6,alignContent:"start",minHeight:"min(240px,36dvh)"}}><UnifiedAvatarCarousel avatars={visibleAvatars} xpTotal={profile.xp_total??0} selectedAvatar={selectedAvatar} savingAvatar={savingAvatar} onSelect={url=>{if(selectedAvatar===url){void chooseAvatar(url)}else{setSelectedAvatar(url);setEditNotice("Tap again to save this avatar");}}}/></div>}{tab==="background"&&<div role="tabpanel" aria-label="Profile background themes" style={{display:"grid",gap:10,justifyItems:"center",minHeight:"min(240px,36dvh)",alignContent:"start"}}>
 <div className="profile-glass-gallery" data-profile-horizontal-gallery="true" role="region" aria-label="Background themes, swipe to browse all options" tabIndex={0} style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:"minmax(104px,31%)",overflowX:"auto",overflowY:"hidden",scrollSnapType:"none",touchAction:"auto",overscrollBehaviorX:"contain",WebkitOverflowScrolling:"touch",justifyContent:"start",gap:9,width:"100%",minWidth:0,boxSizing:"border-box",padding:"5px 0 12px"}}>{backgrounds.map(b=><button className="profile-glass-theme-card" key={b.key} type="button" aria-pressed={currentBackground===b.key} disabled={savingBackground} onClick={()=>{if(selectedBackground===b.key)void saveBackground(b.key);else{setSelectedBackground(b.key);setEditNotice("Tap again to save "+b.name);}}} style={{width:"100%",minWidth:0,border:(selectedBackground||currentBackground)===b.key?"2px solid #f5d47a":"1px solid rgba(221,190,116,.6)",borderRadius:16,padding:7,background:"rgba(2,28,24,.6)",color:"#f5e8c8",display:"grid",gap:6,justifyItems:"center"}}><span style={{width:"100%",height:70,borderRadius:12,background:`${b.swatch} center / cover`,backgroundImage:`linear-gradient(180deg,transparent,rgba(0,0,0,.2)),url("${backgroundUrl(b.key)}")`,display:"block"}}/><small style={{fontWeight:700}}>{b.name}</small>{currentBackground===b.key&&<small>✓ Saved</small>}{(b.key==="obsidian"||b.key==="titanium")&&<small>🌙 Night mode</small>}</button>)}{productSlots.map((name,i)=><div key={"background-slot-"+i} style={{width:"100%",minWidth:0,scrollSnapAlign:"none",border:"1px solid rgba(221,190,116,.48)",borderRadius:16,padding:7,background:"rgba(2,28,24,.6)",display:"grid",gap:6,justifyItems:"center"}}><span style={{width:"100%",height:70,borderRadius:12,background:"linear-gradient(135deg,#165a50,#102c37)",display:"grid",placeItems:"center",color:"#e6c77e",fontSize:25}}>✦</span><small style={{fontSize:9,lineHeight:1.1,textAlign:"center",overflowWrap:"anywhere"}}>{name}</small><small style={{fontSize:8,lineHeight:1}}>Art soon</small></div>)}</div>
 </div>}{tab==="videos"&&<div role="tabpanel" aria-label="My Videos" style={{minHeight:"min(240px,36dvh)"}}><ProfileVideos/></div>}{tab==="badges"&&<div role="tabpanel" style={{display:"grid",gap:10,minHeight:"min(240px,36dvh)",alignContent:"start"}}><div data-profile-horizontal-gallery="true" role="region" aria-label="Badges, swipe to browse all options" tabIndex={0} style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:"minmax(110px,35%)",overflowX:"auto",overflowY:"hidden",scrollSnapType:"none",touchAction:"auto",overscrollBehaviorX:"contain",WebkitOverflowScrolling:"touch",gap:9,width:"100%",minWidth:0,boxSizing:"border-box",padding:"5px 12px 12px"}}>{badgeOptions.map(b=>{const earned=earnedBadges.includes(b.key)||(b.key==="shahada"&&Boolean(profile.shahada_verified_at));return <div key={b.key} style={{minWidth:0,scrollSnapAlign:"none",padding:"8px 5px",borderRadius:16,border:"1px solid rgba(221,190,116,.48)",background:"linear-gradient(150deg,rgba(20,75,60,.75),rgba(3,27,25,.65))",display:"grid",justifyItems:"center",gap:6,textAlign:"center",opacity:earned?1:.6}}><img src={b.image} alt={b.name} loading="lazy" style={{width:57,height:57,objectFit:"contain",filter:earned?"drop-shadow(0 2px 7px rgba(229,188,100,.4))":"grayscale(1)"}}/><strong style={{fontSize:11}}>{b.name}</strong><small style={{fontSize:10}}>{earned?"Earned":"🔒 Locked"}</small></div>})}{previewBadges.map(b=><div key={b.key} style={{minWidth:0,scrollSnapAlign:"none",padding:"8px 5px",borderRadius:16,border:"1px solid rgba(221,190,116,.48)",background:"rgba(20,75,60,.55)",display:"grid",justifyItems:"center",gap:6,textAlign:"center"}}><span aria-hidden="true" style={{width:57,height:57,display:"grid",placeItems:"center",fontSize:28,color:"#e6c77e"}}>✦</span><strong style={{fontSize:11}}>{b.name}</strong><small style={{fontSize:10}}>Preview · Art soon</small></div>)}</div><small style={{color:"#d8c89c"}}>Earned badges are managed in your public profile · up to 3 visible.</small></div>}{["avatar","background","badges","videos"].includes(tab)&&<div aria-hidden="true" style={{height:30,minHeight:30,flexShrink:0}} />}{editNotice&&<small role="status">{editNotice}</small>}</>:<p role="status">{status}</p>}</div>
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
type UmmahPost={id:string;body:string;created_at:string;author_name:string;author_handle:string;author_id?:string;avatar_url?:string|null};
const postThemes=["emerald","gold","makkah","midnight","garden","purple"] as const;
const backgroundForPost=(id:string)=>{let hash=2166136261;for(let i=0;i<id.length;i++)hash=Math.imul(hash^id.charCodeAt(i),16777619);return `/post-backgrounds/${postThemes[(hash>>>0)%postThemes.length]}.svg`};
type UmmahComment={id:string;post_id:string;name:string;body:string;created_at:string};
function DailyPostsApp({active}:{active:boolean}){
 const [posts,setPosts]=useState<UmmahPost[]>([]); const [searchPosts,setSearchPosts]=useState("");
 const [status,setStatus]=useState("Loading Ummah posts…");
 const [selected,setSelected]=useState<string|null>(null);
 const [comments,setComments]=useState<UmmahComment[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [likes,setLikes]=useState<Record<string,boolean>>({});
 const [paused,setPaused]=useState(false);
 const lastTouch=useRef(0);
 const feedRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!active)return;let alive=true;
  const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(alive){setPosts(data.posts||[]);setStatus(data.posts?.length?"":"No posts yet. Be the first to share.");}}catch{if(alive)setStatus("Unable to load the Ummah feed.");}};
  void load();const timer=setInterval(()=>void load(),5000);const refresh=()=>void load();window.addEventListener("1muslim:community-post-published",refresh);return()=>{alive=false;clearInterval(timer);window.removeEventListener("1muslim:community-post-published",refresh)};
 },[active]);
 const likePost=async(id:string)=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setNotice("Sign in to like posts.");return}const was=!!likes[id];setLikes(p=>({...p,[id]:!was}));const res=was?await db.from("ummah_post_likes").delete().eq("post_id",id).eq("user_id",user.id):await db.from("ummah_post_likes").upsert({post_id:id,user_id:user.id},{onConflict:"post_id,user_id"});if(res.error){setLikes(p=>({...p,[id]:was}));setNotice("Unable to save like.")}};
 useEffect(()=>{if(!active)return;const root=feedRef.current;if(!root)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle("ummah-in-view",entry.isIntersecting)},{root,threshold:.12,rootMargin:"0px 0px -8% 0px"});
  root.querySelectorAll(".ummah-floating-pair").forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 },[active,posts]);
 useEffect(()=>{if(!selected)return;let alive=true;const load=async()=>{try{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(selected),{cache:"no-store"});const d=await r.json();if(alive)setComments(d.comments||[])}catch{if(alive)setNotice("Comments unavailable.")}};void load();return()=>{alive=false}},[selected]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(!selected||!draft.trim()||busy)return;setBusy(true);setNotice("");try{
  const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:selected,body:draft.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to comment");
  setComments(previous=>[...previous,d.comment]);setDraft("");
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to comment")}finally{setBusy(false)}};
 return <div className="community-simple-feed"><div className="community-feed-search"><input aria-label="Search community posts" placeholder="Search posts or members…" value={searchPosts} onChange={e=>setSearchPosts(e.target.value)}/><span>⌕</span></div>
  <div className="community-posts-list" aria-label="Community posts">
   {posts.filter(post=>(post.body+" "+post.author_name+" "+post.author_handle).toLowerCase().includes(searchPosts.toLowerCase())).map(post=><article className="community-post-card" key={post.id}>
    <header><span className="community-post-avatar">{post.avatar_url?<img src={post.avatar_url} alt="" loading="lazy"/>:(post.author_name||"M").charAt(0).toUpperCase()}</span><div><strong>{post.author_name||"Member"}</strong><small>{post.author_handle||"1Muslim member"} · {new Date(post.created_at).toLocaleDateString()}</small></div></header>
    <p>{post.body}</p><footer><button type="button" aria-pressed={!!likes[post.id]} onClick={()=>void likePost(post.id)}>{likes[post.id]?"♥ Liked":"♡ Like"}</button><button type="button" onClick={()=>{setSelected(post.id);setComments([]);setNotice("")}}>♧ Comment</button></footer>
   </article>)}
   {!posts.length?<p className="community-feed-empty">{status}</p>:!posts.some(post=>(post.body+" "+post.author_name+" "+post.author_handle).toLowerCase().includes(searchPosts.toLowerCase()))?<p className="community-feed-empty">No matching posts.</p>:null}
   {notice&&!selected&&<p role="status">{notice}</p>}
  </div>
  {selected&&<div className="ummah-comments-backdrop" role="presentation" onClick={()=>setSelected(null)}>
   <section className="ummah-comments-sheet" role="dialog" aria-modal="true" aria-label="Post comments" onClick={e=>e.stopPropagation()}>
    <header><strong>✦ Conversation</strong><button type="button" onClick={()=>setSelected(null)} aria-label="Close comments">✕</button></header>
    <p className="ummah-comment-post-preview">{posts.find(p=>p.id===selected)?.body}</p>
    <div className="ummah-comments-list">{comments.length?comments.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.body}</p></article>):<p>Be the first to comment.</p>}</div>
    <form onSubmit={e=>void send(e)}><input aria-label="Write a comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder="Write a thoughtful comment…"/><button type="submit" disabled={busy||!draft.trim()}>Send ↗</button></form>
    {notice&&<p role="alert">{notice}</p>}
   </section>
  </div>}
 </div>;
}
export function CommunityMap({active}:{active:boolean}){
 const [tab,setTab]=useState<"map"|"posts">("posts");
 const [zoom,setZoom]=useState(0);
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 const [following,setFollowing]=useState<string[]>([]);
 const places=[
  {id:"mosque",kind:"Mosque",name:"Mosque Finder",city:"Search your city",phone:"Add a verified listing",schedule:"Prayer schedules are set by each mosque",image:"🕌",detail:"Find a local masjid or prayer space once its verified listing is available."},
  {id:"community",kind:"Community",name:"Local Communities",city:"Your area",phone:"Community contact shown on verified listings",schedule:"Events and circles appear here",image:"✦",detail:"Follow local circles for events, study groups, and announcements."}
 ];
 useEffect(()=>{try{setFollowing(JSON.parse(localStorage.getItem("1muslim:community-follows")||"[]"))}catch{}},[]);
 const visible=places.filter(place=>(place.name+place.kind+place.city).toLowerCase().includes(search.trim().toLowerCase()));
 const choose=(id:string)=>setSelected(id);
 const toggleFollow=(id:string)=>setFollowing(current=>{const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];try{localStorage.setItem("1muslim:community-follows",JSON.stringify(next))}catch{}return next});
 
 const bounds=[[-125,24,-66,50],[-111,29,-79,47],[-104,32,-85,45],[-99,35,-90,43],[-96,37,-92,41]] as const;
 const bbox=bounds[zoom];
 const url="https://www.openstreetmap.org/export/embed.html?bbox="+encodeURIComponent(bbox.join(","))+"&layer=mapnik";
 return <div className="canvas-community-map-shell" data-community-view={tab}>
  <div className="canvas-community-tabs" role="tablist" aria-label="Community views"><button type="button" role="tab" aria-selected={tab==="posts"} onClick={()=>setTab("posts")}>Community Posts</button><button type="button" role="tab" aria-selected={tab==="map"} onClick={()=>setTab("map")}>🌎 Community Map</button></div>
  {tab==="posts"?<div className="canvas-community-posts-scroll"><DailyPostsApp active={active}/></div>:<div className="canvas-community-map-panel">
   <div className="canvas-community-map-heading"><strong>Mosque Finder & Local Communities</strong><span>Explore verified local places and community hubs</span></div>
   <form className="canvas-community-map-search" onSubmit={e=>e.preventDefault()}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mosque or community" aria-label="Search mosques and communities"/><button type="submit">Search</button></form>
   <div className="canvas-community-map-frame"><iframe title="Interactive map of the United States" loading="lazy" src={url} referrerPolicy="no-referrer-when-downgrade" allowFullScreen={false}/><div className="canvas-community-map-places" aria-label="Mosque and community results">{visible.map(place=><button type="button" key={place.id} onClick={()=>choose(place.id)} className={selected===place.id?"isSelected":""}><span>{place.image}</span><strong>{place.name}</strong><small>{place.kind}</small></button>)}</div>{selected&&(()=>{const place=places.find(item=>item.id===selected)!;return <article className="canvas-community-place-card" aria-label={place.name+" details"}><button type="button" onClick={()=>setSelected(null)} aria-label="Close place details">×</button><div className="canvas-community-place-image" aria-hidden="true">{place.image}</div><span>{place.kind.toUpperCase()}</span><h3>{place.name}</h3><p>{place.detail}</p><dl><div><dt>Phone</dt><dd>{place.phone}</dd></div><div><dt>Schedule</dt><dd>{place.schedule}</dd></div></dl><button type="button" className="canvas-community-follow" onClick={()=>toggleFollow(place.id)}>{following.includes(place.id)?"✓ Following":"Follow"}</button></article>})()}<div className="canvas-community-map-zoom"><button type="button" onClick={()=>setZoom(v=>Math.min(4,v+1))} disabled={zoom===4} aria-label="Zoom in">+</button><button type="button" onClick={()=>setZoom(v=>Math.max(0,v-1))} disabled={zoom===0} aria-label="Zoom out">−</button><button type="button" onClick={()=>setZoom(0)} aria-label="Reset map to United States">⌂</button></div></div>
   <p className="canvas-community-map-caption">Tap a Mosque or Community card for its image, phone, schedule, and Follow action. Verified local listings will replace these directory placeholders as they are added.</p>
  </div>}
 </div>;
}
export default function CanvasSecondaryApp({slot,active}:{slot:number;active:boolean}){
 return <div className={slot===0?"canvas-native-app canvas-profile-mirror":"canvas-native-app"}>{slot!==0&&<header><span>0{slot+6} · 1MUSLIM</span><h2>{titles[slot]}</h2></header>}<div className="canvas-native-body">
 {slot===0?<GameLabProfileHub active={active} avatarHero={<ProfileApp active={active} heroOnly/>} profile={<ProfileApp active={active}/>} renderProfileSection={(section)=><ProfileApp active={active} section={section}/>}/>:slot===1?<RecorderApp active={active}/>:slot===2?<DailyPostsApp active={active}/>:slot===3?<HomeMessagesChooser/>:slot===4?<ElmTentAlphabet/>:<div className="canvas-community-map-panel"><strong>Community connections</strong><p>Discover Muslims and mosques through the Community Map above.</p></div>}
 </div>{slot!==0&&<footer><Link href={destinations[slot]}>Open full experience ↗</Link></footer>}</div>
}
