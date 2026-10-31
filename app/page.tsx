"use client";
import workspaceStyles from "./workspace-presentation.module.css";
import "./canvas-fullscreen-v1.css";
import "./home-ambient-halo.css";
import "./guest-theme-reveal.css";
import CanvasSecondaryApp, {CommunityMap} from "./components/CanvasSecondaryApp";
import PostDesignStudio from "./components/PostDesignStudio";
import HomeMessagesChooser from "./components/HomeMessagesChooser";
import ElmTentAlphabet from "./components/ElmTentAlphabet";
import HomeVideoPreview from "./components/HomeVideoPreview";
import CosmicCatchGame from "./components/CosmicCatchGame";
import LiveHomePreview from "./components/LiveHomePreview";
import HomeAudioLivePlayer from "./components/HomeAudioLivePlayer";
import HomeLiveConversation from "./components/HomeLiveConversation";
import LiveGuestStudio from "../components/LiveGuestStudio";

import {useEffect,useRef,useState} from "react";
import {flushSync,createPortal} from "react-dom";
import Image from "next/image";
import {createClient} from "../utils/supabase/client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import PersonSearchCard from "./components/PersonSearchCard";
import IslamTriviaWidget from "./components/IslamTriviaWidget";
import DhikrStudio from "./widget-tools/[tool]/DhikrStudio";
import DhikrBigWidget from "./widget-tools/[tool]/DhikrBigWidget";
import CelestialOrb from "./components/CelestialOrb";
import RisingEnergyOrbs from "./components/RisingEnergyOrbs";
import ShahadaWelcomeToast from "./components/ShahadaWelcomeToast";
import PreviewGuestGate from "./components/PreviewGuestGate";
import SeamlessEntry from "./components/SeamlessEntry";
import styles from "./home-hub.module.css";
type WidgetSize="compact"|"standard"|"featured"|"expanded"|"immersive"|"studio";
type WidgetLayout={name:string;size:WidgetSize};
const guestTitles=["Live","Video Chat","Quran Lesson","Audio Rooms","AudioBooks","AudioBooksAI","HudHudAI","Community Post","Muslim News","Quran Studio","Daily Posts","Video Of The Day"];
const DEFAULT_LAYOUT:WidgetLayout[]=spacesDefault();
const HOME_SLIDES=["Live","Qur’an","Post","Messages","Elm Tent","Community Map","Profile"] as const;
function spacesDefault():WidgetLayout[]{return [{name:"Live",size:"featured"},{name:"Qur’an",size:"featured"},{name:"Videos",size:"compact"},{name:"Post",size:"featured"},{name:"Ummah",size:"compact"},{name:"Messages",size:"standard"},{name:"Elm Tent",size:"featured"},{name:"Calls",size:"standard"},{name:"Lessons",size:"standard"},{name:"Islam Trivia",size:"standard"},{name:"People",size:"standard"},{name:"Prayer Times",size:"compact"},{name:"Dhikr",size:"compact"},{name:"XP & Progress",size:"compact"},{name:"Notifications",size:"compact"}]}
type Result={id:string;kind:string;title:string;subtitle:string;href:string};
type HomeLiveFormat="desktop"|"phone"|"audio"|"games"|"qibla";
const spaces=[
 {name:"Live",arabic:"مباشر",symbol:"◉",image:"/assets/control-center/1live.PNG",href:"/streaming",cls:"live"},
 {name:"Qur’an",arabic:"القرآن",symbol:"۞",image:"/assets/HudHud-Quran.png",href:"/elm-tent/quran",cls:"quran"},
 {name:"Videos",arabic:"فيديو",symbol:"▶",image:"/assets/control-center/1videos.PNG",href:"/videos",cls:"video"},
 {name:"Ummah",arabic:"الأمة",symbol:"✧",image:"/assets/control-center/1ummah.PNG",href:"/community",cls:"ummah"},
 {name:"Post",arabic:"منشور اليوم",symbol:"✎",image:"/assets/control-center/1ummah.PNG",href:"/community",cls:"ummah"},
 {name:"Messages",arabic:"رسائل",symbol:"◌",image:"/assets/control-center/1messenger.PNG",href:"/messages",cls:"message"},
 {name:"Elm Tent",arabic:"خيمة العلم",symbol:"أ",image:"/assets/control-center/elm-tent-en.PNG",href:"/elm-tent",cls:"lesson"},
 {name:"Calls",arabic:"اتصال",symbol:"♧",image:"/assets/control-center/1calls.PNG",href:"/messages",cls:"call"},
 {name:"Lessons",arabic:"العلم",symbol:"✦",image:"/assets/control-center/elm-tent-en.PNG",href:"/elm-tent/lessons",cls:"lesson"},
 {name:"Islam Trivia",arabic:"اختبار إسلامي",symbol:"✦",image:"",href:"/elm-tent/islam-trivia",cls:"lesson"},
 {name:"People",arabic:"أصحاب",symbol:"♙",image:"/assets/control-center/1profile%20.PNG",href:"/find",cls:"people"},
 {name:"Prayer Times",arabic:"الصلاة",symbol:"☪",image:"",href:"/widget-tools/prayer",cls:"quran"},
 {name:"Dhikr",arabic:"الذكر",symbol:"۞",image:"",href:"/widget-tools/dhikr",cls:"quran"},
 {name:"XP & Progress",arabic:"التقدم",symbol:"✧",image:"",href:"/widget-tools/progress",cls:"lesson"},
 {name:"Notifications",arabic:"الإشعارات",symbol:"♧",image:"",href:"/widget-tools/notifications",cls:"message"},
 {name:"1Muslim Shop",arabic:"المتجر",symbol:"✦",image:"",href:"#",cls:"quran"},
 {name:"Quick Post",arabic:"انشر الآن",symbol:"✎",image:"",href:"#",cls:"message"}
];
export default function Home(){
 const [quickOpen,setQuickOpen]=useState(false);
 const [quickType,setQuickType]=useState<"post"|"live"|"message">("post");
 const [quickFormat,setQuickFormat]=useState<"text"|"image"|"video"|"camera"|"file">("text");
 const [quickStep,setQuickStep]=useState(0);
 const [quickText,setQuickText]=useState("");
 const [quickBusy,setQuickBusy]=useState(false);
 const [quickError,setQuickError]=useState("");
 const openQuick=()=>{setQuickType("post");setQuickFormat("text");setQuickStep(0);setQuickError("");setQuickOpen(true)};
 const quickGo=async()=>{if(quickType==="live"){window.location.assign("/streaming/go-live");return}if(quickType==="message"){window.location.assign("/messages");return}if(quickFormat!=="text"){window.location.assign("/community#ummah-compose");return}if(!quickText.trim()){setQuickError("Write something before posting.");return}setQuickBusy(true);setQuickError("");try{const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:quickText.trim()})});const data=await response.json();if(!response.ok||data.removed)throw Error(data.error||"Post was not published.");try{localStorage.setItem("1muslim:quick-post-notice",JSON.stringify({id:data.post?.id||"",text:quickText.trim().slice(0,180),at:Date.now()}))}catch{}setQuickOpen(false);window.location.assign("/")}catch(e){setQuickError(e instanceof Error?e.message:"Could not publish. Try again.")}finally{setQuickBusy(false)}};
 const [dhikrOpen,setDhikrOpen]=useState(false);
 const [shopTease,setShopTease]=useState(false);
 const shopTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const teaseShop=()=>{setShopTease(false);if(shopTimer.current)clearTimeout(shopTimer.current);requestAnimationFrame(()=>setShopTease(true));shopTimer.current=setTimeout(()=>setShopTease(false),1700)};
 useEffect(()=>()=>{if(shopTimer.current)clearTimeout(shopTimer.current)},[]);
 useEffect(()=>{try{sessionStorage.setItem("1muslim:homepage-visited-v1","yes")}catch{}},[]);
 const [homeSignedIn,setHomeSignedIn]=useState<boolean|null>(null);
 const [adminHudHud,setAdminHudHud]=useState(false);
 const [hudHudPanel,setHudHudPanel]=useState<"admin"|null>(null);
 const [hudHudDraft,setHudHudDraft]=useState("");
 const [hudHudWelcome,setHudHudWelcome]=useState(false);
 const adminSwipeArmed=useRef(false);
 const [shahadaOverlay,setShahadaOverlay]=useState(false);
 const [shahadaDismissed,setShahadaDismissed]=useState(false);
 useEffect(()=>{try{if(sessionStorage.getItem("1muslim:entry-dismissed")==="yes")setShahadaDismissed(true)}catch{}},[]);
 const closeEntry=()=>{setShahadaOverlay(false);setShahadaDismissed(true);try{sessionStorage.setItem("1muslim:entry-dismissed","yes")}catch{}};
 useEffect(()=>{if(homeSignedIn!==false||shahadaDismissed){setShahadaOverlay(false);return;}const timer=window.setTimeout(()=>setShahadaOverlay(true),5000);return()=>window.clearTimeout(timer)},[homeSignedIn,shahadaDismissed]);
 useEffect(()=>{if(homeSignedIn!==false)return;let timer:ReturnType<typeof setTimeout>;let active=true;let cycle=0;let step=0;const timings=[1250,1000,780,560,390,260,170,120,95,150,240,420,720,1100,1450,1800];const advance=()=>{if(!active)return;setGuestTitleIndex(i=>(i+1+Math.floor(Math.random()*3))%guestTitles.length);setGuestTitleTick(i=>i+1);step++;if(step>=timings.length){step=0;cycle++;setGuestTitleZoom(true);timer=setTimeout(()=>{setGuestTitleZoom(false);timer=setTimeout(advance,350)},800);return}timer=setTimeout(advance,timings[step])};timer=setTimeout(advance,timings[0]);return()=>{active=false;clearTimeout(timer);setGuestTitleZoom(false)}},[homeSignedIn]);
 const [homeNames,setHomeNames]=useState<{english:string;arabic:string}|null>(null);
 useEffect(()=>{let active=true;const db=createClient();const check=async()=>{const {data:{user}}=await db.auth.getUser();if(active){setHomeSignedIn(!!user);setAdminHudHud(user?.email?.toLowerCase()==="hudhudbyelmi@gmail.com");if(!user){setHomeNames(null);setHudHudPanel(null)}else{const meta=user.user_metadata||{};const english=String(meta.display_name||meta.full_name||meta.name||user.email?.split("@")[0]||"Member").trim();const arabic=String(meta.arabic_name||meta.name_ar||"").trim();setHomeNames({english,arabic:arabic||"اسمك بالعربية"})}}};void check();const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void check()});return()=>{active=false;subscription.unsubscribe()}},[]);
 const [upgradeVisible,setUpgradeVisible]=useState(false);
 const [guestFadeKey,setGuestFadeKey]=useState(0);
 // Guest-only intro: three visible theme changes, then settle on Sapphire Blue.
 // No profile preference is written for visitors; signing in restores their own theme.
 useEffect(()=>{
  if(homeSignedIn!==false)return;
  const root=document.documentElement;
  const palette=[
   {name:"obsidian",surface:"22,25,32",stroke:"204,164,98",accent:"75,68,54",halo:"204,164,98",base:"#0b0b0c",primary:"#e2b75e",secondary:"#ffdb8b",tint:"rgba(0,0,0,.62)",image:"carbon-fiber"},
   {name:"amethyst",surface:"86,39,82",stroke:"231,165,207",accent:"145,65,127",halo:"255,123,211",base:"#270b39",primary:"#c85cf5",secondary:"#ff9ed9",tint:"rgba(30,5,48,.43)",image:"amethyst"},
   {name:"emerald",surface:"8,75,57",stroke:"204,176,103",accent:"19,92,67",halo:"73,245,180",base:"#052b22",primary:"#22bd83",secondary:"#d9bd70",tint:"rgba(3,27,21,.3)",image:"emerald"},
   {name:"sapphire",surface:"29,64,112",stroke:"175,209,244",accent:"38,102,164",halo:"91,192,255",base:"#06182f",primary:"#398fff",secondary:"#cbdcff",tint:"rgba(2,14,39,.45)",image:"sapphire"}
  ];
  let cancelled=false;
  const timers:Array<ReturnType<typeof setTimeout>>=[];
  const later=(fn:()=>void,ms:number)=>{timers.push(setTimeout(()=>{if(!cancelled)fn()},ms))};
  const apply=(index:number)=>{
   const p=palette[index];
   root.dataset.profileBackground=p.name;
   root.dataset.muslimTheme=p.name;
   root.dataset.guestThemeTour="true";
   root.style.setProperty("--canvas-control-surface-rgb",p.surface);
   root.style.setProperty("--canvas-control-border-rgb",p.stroke);
   root.style.setProperty("--canvas-control-accent-rgb",p.accent);
   root.style.setProperty("--guest-reveal-halo-rgb",p.halo);
   root.style.setProperty("--theme-base",p.base);
   root.style.setProperty("--theme-accent",p.primary);
   root.style.setProperty("--theme-secondary",p.secondary);
   root.style.setProperty("--theme-edge",p.secondary);
   root.style.setProperty("--profile-scene-image",'url("/assets/profile-backgrounds/'+p.image+'.PNG")');
   root.style.setProperty("--profile-scene-tint",p.tint);
  };
  // Each palette change happens under the darkest part of a 2.5s cover.
  // Sequence: Obsidian → Amethyst → Emerald → Sapphire (final default).
  apply(0);
  [800,4100,7400].forEach((at,index)=>{
   later(()=>setGuestFadeKey(v=>v+1),at);
   later(()=>apply(index+1),at+1050);
  });
  later(()=>{delete root.dataset.guestThemeTour},10600);
  return()=>{
   cancelled=true;timers.forEach(clearTimeout);
   delete root.dataset.guestThemeTour;
   ["--canvas-control-surface-rgb","--canvas-control-border-rgb","--canvas-control-accent-rgb","--guest-reveal-halo-rgb","--theme-base","--theme-accent","--theme-secondary","--theme-edge","--profile-scene-image","--profile-scene-tint"].forEach(key=>root.style.removeProperty(key));
   delete root.dataset.profileBackground;delete root.dataset.muslimTheme;
   const key=localStorage.getItem("1muslim:profile-background")||"emerald";
   window.dispatchEvent(new CustomEvent("1muslim:profile-background-changed",{detail:key}));
  };
 },[homeSignedIn]);
 useEffect(()=>{if(typeof window==="undefined")return;const params=new URLSearchParams(window.location.search);if(params.get("profile")!=="background")return;const id=window.setTimeout(()=>{moveWorkspace(6);window.dispatchEvent(new Event("1muslim:open-profile-background"));},300);return()=>clearTimeout(id)},[]);

 useEffect(()=>{let show=true;try{show=localStorage.getItem("1muslim:new-themes-upgrade-dismissed-v1")!=="yes";if(show)localStorage.setItem("1muslim:new-themes-upgrade-dismissed-v1","yes")}catch{}if(!show)return;setUpgradeVisible(true);const timer=window.setTimeout(()=>setUpgradeVisible(false),8000);return()=>window.clearTimeout(timer)},[]);
 const dismissUpgrade=()=>{setUpgradeVisible(false);try{localStorage.setItem("1muslim:new-themes-upgrade-dismissed-v1","yes")}catch{}};
 const [cleanArtwork,setCleanArtwork]=useState<Record<string,string>>({});
 useEffect(()=>{let active=true;for(const widget of spaces){if(!widget.image||widget.name==="Qur’an"){setCleanArtwork(prev=>({...prev,[widget.name]:widget.image}));continue}const img=new window.Image();img.onload=()=>{try{const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return;ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const d=pixels.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];const brightness=Math.max(r,g,b);const saturation=brightness-Math.min(r,g,b);const matte=Math.max(0,Math.min(1,(brightness-10)/44));const colored=Math.max(0,Math.min(1,(saturation-5)/22));const opacity=Math.max(matte,colored*.96);d[i+3]=Math.round(d[i+3]*opacity)}ctx.putImageData(pixels,0,0);const url=canvas.toDataURL("image/png");if(active)setCleanArtwork(prev=>({...prev,[widget.name]:url}))}catch{if(active)setCleanArtwork(prev=>({...prev,[widget.name]:widget.image}))}};img.onerror=()=>{if(active)setCleanArtwork(prev=>({...prev,[widget.name]:widget.image}))};img.src=widget.image}return()=>{active=false}},[]);
 const [livePreviews,setLivePreviews]=useState<Array<{id:string;title:string;thumbnail_path:string|null;viewer_count?:number|null;host_id?:string|null;room_name?:string|null;aspect_ratio?:string|null}>>([]);
 const [liveFormat,setLiveFormat]=useState<HomeLiveFormat>("desktop");
 useEffect(()=>{
  let timeout:number|undefined;
  let stopped=false;
  const pulse=()=>{
   if(stopped)return;
   if(document.visibilityState==="visible"){
    document.querySelectorAll<HTMLElement>(".homeAmbientHalo").forEach(el=>{
     el.classList.remove("homeAmbientHaloPulse");
     void el.offsetWidth;
     el.classList.add("homeAmbientHaloPulse");
    });
   }
   timeout=window.setTimeout(pulse,6000+Math.random()*4000);
  };
  timeout=window.setTimeout(pulse,6000+Math.random()*4000);
  return()=>{stopped=true;if(timeout!==undefined)window.clearTimeout(timeout)};
 },[]);

 const navigateHomeLive=(direction:number)=>{if(livePreviews.length>1){setLiveCarouselIndex(i=>{const next=(i+direction+livePreviews.length)%livePreviews.length;setSelectedLiveId(livePreviews[next].id);return next});return}const formats:HomeLiveFormat[]=["desktop","phone","audio","games","qibla"];setLiveFormat(current=>formats[(formats.indexOf(current)+direction+formats.length)%formats.length]);setLiveCarouselIndex(0)};
 const [liveCarouselIndex,setLiveCarouselIndex]=useState(0);const [selectedLiveId,setSelectedLiveId]=useState<string|null>(null);const [recentlyEndedLive,setRecentlyEndedLive]=useState(false);const liveSeenRef=useRef(false);
 useEffect(()=>{setLiveCarouselIndex(i=>livePreviews.length?Math.min(i,livePreviews.length-1):0)},[livePreviews.length]);
 useEffect(()=>{if(selectedLiveId&&!livePreviews.some(stream=>stream.id===selectedLiveId))setSelectedLiveId(null)},[livePreviews,selectedLiveId]);
 const activeLive=livePreviews.find(stream=>stream.id===selectedLiveId)||livePreviews[liveCarouselIndex%Math.max(livePreviews.length,1)];
 const [ummahSlides,setUmmahSlides]=useState<Array<{id:string;body:string}>>([]);
 const [slideIndex,setSlideIndex]=useState(0);
 useEffect(()=>{let active=true;const db=createClient();const load=async()=>{let liveQuery=db.from("live_streams").select("id,title,thumbnail_path,viewer_count,host_id,room_name,aspect_ratio").eq("status","live").eq("visibility","public");const [live,posts]=await Promise.all([(liveFormat==="games")?Promise.resolve({data:[],error:null}):liveQuery.order("viewer_count",{ascending:false}).limit(12),db.from("ummah_feed_posts").select("id,body").order("created_at",{ascending:false}).limit(8)]);if(!active)return;if(!live.error){const next=(live.data||[]).filter((stream:any)=>liveFormat==="audio"?stream.aspect_ratio==="1:1":stream.aspect_ratio!=="1:1").slice(0,3);setLivePreviews(previous=>{if(previous.length&&next.length===0&&liveSeenRef.current)setRecentlyEndedLive(true);else if(next.length)setRecentlyEndedLive(false);if(next.length)liveSeenRef.current=true;return next;});}if(!posts.error)setUmmahSlides(posts.data||[])};void load();const channel=db.channel("homepage-live-discovery").on("postgres_changes",{event:"*",schema:"public",table:"live_streams"},()=>void load()).subscribe();const refresh=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},3000);const resume=()=>{if(document.visibilityState==="visible")void load()};document.addEventListener("visibilitychange",resume);window.addEventListener("focus",resume);return()=>{active=false;window.clearInterval(refresh);document.removeEventListener("visibilitychange",resume);window.removeEventListener("focus",resume);void db.removeChannel(channel)}},[liveFormat]);
 useEffect(()=>{if(ummahSlides.length<2)return;const timer=setInterval(()=>setSlideIndex(i=>(i+1)%ummahSlides.length),8500);return()=>clearInterval(timer)},[ummahSlides.length]);
 const [inbox,setInbox]=useState<Array<{id:string;content:string;created_at:string}>>([]);
 const [callHistory,setCallHistory]=useState<Array<{id:string;created_at:string}>>([]);
 const [lessonPreview,setLessonPreview]=useState<Array<{id:string;title:string}>>([]);
 const [workspacePage,setWorkspacePage]=useState(0);
 const [topParticleBurst,setTopParticleBurst]=useState(0);
 useEffect(()=>{
  // One 3.6s top-origin fall after each workspace swipe, delayed 2.5s.
  // Also guarantee one every 60s while staying on the same workspace.
  // Occasional extra burst is intentionally rarer than the minute cadence.
  let arrival:ReturnType<typeof setTimeout>|undefined;
  let extra:ReturnType<typeof setTimeout>|undefined;
  const trigger=()=>{if(document.visibilityState==="visible")setTopParticleBurst(v=>v+1)};
  arrival=setTimeout(trigger,2500);
  const minute=setInterval(trigger,60000);
  const scheduleExtra=()=>{extra=setTimeout(()=>{trigger();scheduleExtra()},105000+Math.random()*75000)};
  scheduleExtra();
  return()=>{clearTimeout(arrival);clearInterval(minute);clearTimeout(extra)};
 },[workspacePage]);

 const [canvasRow,setCanvasRow]=useState<0|1|2>(0);
 const [navigationHintSeen,setNavigationHintSeen]=useState(false);
 const [navPortalReady,setNavPortalReady]=useState(false);
 useEffect(()=>setNavPortalReady(true),[]);
 useEffect(()=>{
  const applyPalette=(key?:string)=>{
   const chosen=key||localStorage.getItem("1muslim:profile-background")||"emerald";
   const palette:Record<string,[string,string,string]>={
    emerald:["8,75,57","204,176,103","19,92,67"],
    "emerald-rose-gold":["83,42,45","224,157,126","113,62,70"],
    "rose-gold":["83,42,45","224,157,126","113,62,70"],
    "silver-dust":["38,48,66","195,207,223","76,91,111"],
    silver:["38,48,66","195,207,223","76,91,111"],
    "carbon-fiber":["22,25,32","164,175,187","55,64,78"]
   };
   const [surface,stroke,accent]=palette[chosen]||palette.emerald;
   document.documentElement.style.setProperty("--canvas-control-surface-rgb",surface);
   document.documentElement.style.setProperty("--canvas-control-border-rgb",stroke);
   document.documentElement.style.setProperty("--canvas-control-accent-rgb",accent);
  };
  const changed=(event:Event)=>{const key=(event as CustomEvent<string>).detail;if(key)localStorage.setItem("1muslim:profile-background",key);applyPalette(key)};
  applyPalette();
  window.addEventListener("1muslim:profile-background-changed",changed);
  window.addEventListener("1muslim:theme-changed",()=>applyPalette());
  return()=>window.removeEventListener("1muslim:profile-background-changed",changed);
 },[]);

 useEffect(()=>{try{setNavigationHintSeen(localStorage.getItem("1muslim:canvas-nav-used")==="1")}catch{}},[]);
 const navigateCanvas=(direction:"left"|"right"|"up"|"down")=>{
  try{localStorage.setItem("1muslim:canvas-nav-used","1")}catch{}
  setNavigationHintSeen(true);
  if(direction==="down"){setCanvasRow(row=>Math.max(0,row-1) as 0|1|2);return}
  if(direction==="up"){setCanvasRow(row=>Math.min(1,row+1) as 0|1|2);return}
  const next=Math.max(0,Math.min(HOME_SLIDES.length-1,workspacePage+(direction==="right"?1:-1)));
  moveWorkspace(next);
 };

 const verticalSwipeStart=useRef<{x:number;y:number}|null>(null);
 const [quranEnglishFirst,setQuranEnglishFirst]=useState(false);
 const [quranPreview,setQuranPreview]=useState<{arabic:string;translation:string;chapter:number;verse:number;globalAyah:number}|null>(null);
 const [quranAudioPlaying,setQuranAudioPlaying]=useState(false);
 const [quranAudioLoading,setQuranAudioLoading]=useState(false);
 const quranAudioRef=useRef<HTMLAudioElement|null>(null);
 const quranAudioFinished=useRef(false);
 const quranContinuous=useRef(false);
 const quranAutoPlayNext=useRef(false);
 const quranAdvancing=useRef(false);
 const quranContinuousVerseCount=useRef(0);
 const [quranParticleBurst,setQuranParticleBurst]=useState(0);
 const [quranParticleBurstVisible,setQuranParticleBurstVisible]=useState(false);
 const playQuranAudio=async()=>{if(!quranPreview)return;const audio=quranAudioRef.current;if(!audio)return;if(!audio.paused){quranContinuous.current=false;audio.pause();setQuranAudioPlaying(false);return;}quranAudioFinished.current=false;quranContinuous.current=true;quranAutoPlayNext.current=false;setQuranAudioLoading(true);try{await audio.play();setQuranAudioPlaying(true)}catch{setQuranAudioPlaying(false)}finally{setQuranAudioLoading(false)}};
 useEffect(()=>{
  quranAudioRef.current?.pause();setQuranAudioPlaying(false);
  if(!quranAutoPlayNext.current||!quranPreview)return;
  quranAutoPlayNext.current=false;
  const timer=window.setTimeout(()=>{const audio=quranAudioRef.current;if(!audio)return;audio.load();void audio.play().then(()=>{quranAudioFinished.current=false;setQuranAudioPlaying(true)}).catch(()=>{quranContinuous.current=false;setQuranAudioPlaying(false)})},40);
  return()=>window.clearTimeout(timer);
 },[quranPreview?.globalAyah]);
 useEffect(()=>{if(!quranParticleBurstVisible)return;const timer=window.setTimeout(()=>setQuranParticleBurstVisible(false),2600);return()=>window.clearTimeout(timer)},[quranParticleBurst,quranParticleBurstVisible]);
 useEffect(()=>{if(workspacePage===1)return;quranContinuous.current=false;quranAutoPlayNext.current=false;quranAudioRef.current?.pause()},[workspacePage]);
 useEffect(()=>()=>{quranAudioRef.current?.pause()},[]);



 const quranLoadSeq=useRef(0);
 const loadQuranVerse=async(chapter:number,verse:number,save=false)=>{
  const seq=++quranLoadSeq.current;
  if(chapter<1||chapter>114||verse<1||verse>286)return;
  const key=chapter+":"+verse;
  try{
   const [ar,en]=await Promise.all([fetch("https://api.alquran.cloud/v1/ayah/"+key+"/ar.alafasy"),fetch("https://api.alquran.cloud/v1/ayah/"+key+"/en.sahih")]);
   if(!ar.ok||!en.ok)return;
   const [a,b]=await Promise.all([ar.json(),en.json()]);
   if(seq!==quranLoadSeq.current||!a.data?.text||!b.data?.text)return;
   if(quranContinuous.current&&quranAutoPlayNext.current){quranContinuousVerseCount.current+=1;if(quranContinuousVerseCount.current===1){setQuranParticleBurst(k=>k+1);setQuranParticleBurstVisible(true)}}
   setQuranPreview({arabic:String(a.data.text),translation:String(b.data.text),chapter,verse,globalAyah:Number(a.data.number)});
   if(save){try{localStorage.setItem("1muslim-quran-progress",JSON.stringify({chapter,verse}))}catch{}}
  }catch{}
 };
 useEffect(()=>{
  const resume=()=>{let chapter=1,verse=1;try{const saved=JSON.parse(localStorage.getItem("1muslim-quran-progress")||"null");chapter=Number(saved?.chapter)||1;verse=Number(saved?.verse)||1}catch{}void loadQuranVerse(chapter,verse)};
  resume();window.addEventListener("focus",resume);window.addEventListener("pageshow",resume);
  return()=>{quranLoadSeq.current++;window.removeEventListener("focus",resume);window.removeEventListener("pageshow",resume)};
 },[]);
 useEffect(()=>{
  const next=(event:Event)=>{if(workspacePage!==1||quranAdvancing.current)return;
   const fromAudioEnd=(event as CustomEvent<{source?:string}>).detail?.source==="audio-ended";
   if(fromAudioEnd&&!quranContinuous.current)return;
   quranAdvancing.current=true;
   if(quranContinuous.current&&!fromAudioEnd){quranContinuous.current=false;quranAutoPlayNext.current=false;quranAudioRef.current?.pause();setQuranAudioPlaying(false);quranAdvancing.current=false;return}
   if(!fromAudioEnd&&!quranContinuous.current&&quranAudioRef.current&&!quranAudioRef.current.paused&&!quranAudioRef.current.ended){quranContinuous.current=true;quranContinuousVerseCount.current=0}
   quranAutoPlayNext.current=quranContinuous.current;
   const current=quranPreview;const chapter=current?.chapter||1,verse=current?.verse||1;
   void (async()=>{try{const response=await fetch("https://api.alquran.cloud/v1/surah/"+chapter);if(!response.ok)throw Error("Surah lookup failed");const json=await response.json();const max=Number(json.data?.numberOfAyahs);if(!max)throw Error("Missing ayah count");
    const newChapter=verse>=max?(chapter===114?1:chapter+1):chapter;const newVerse=verse>=max?1:verse+1;
    await loadQuranVerse(newChapter,newVerse,true);
   }catch{quranAutoPlayNext.current=false}finally{quranAdvancing.current=false}})();
  };
  const previous=()=>{if(workspacePage!==1||quranAdvancing.current)return;quranAdvancing.current=true;quranContinuous.current=false;quranAutoPlayNext.current=false;quranAudioRef.current?.pause();const chapter=quranPreview?.chapter||1,verse=quranPreview?.verse||1;void (async()=>{try{let targetChapter=chapter,targetVerse=verse-1;if(targetVerse<1){targetChapter=chapter===1?114:chapter-1;const response=await fetch("https://api.alquran.cloud/v1/surah/"+targetChapter);if(!response.ok)throw Error("Surah lookup failed");const data=await response.json();targetVerse=Number(data.data?.numberOfAyahs)||1}await loadQuranVerse(targetChapter,targetVerse,true)}finally{quranAdvancing.current=false}})()};
  window.addEventListener("1muslim:quran-previous-verse",previous);
  window.addEventListener("1muslim:quran-next-verse",next);
  return()=>{window.removeEventListener("1muslim:quran-next-verse",next);window.removeEventListener("1muslim:quran-previous-verse",previous)};
 },[workspacePage,quranPreview]);

 useEffect(()=>{let alive=true;const db=createClient();const load=async()=>{const {data:{user}}=await db.auth.getUser();const jobs=[db.from("lessons").select("id,title").eq("active",true).limit(3)];const [lessons]=await Promise.all(jobs);if(!alive)return;if(!lessons.error)setLessonPreview((lessons.data||[]).map(v=>({id:String(v.id),title:String(v.title||"Continue learning")})));if(!user)return;const [messages,calls]=await Promise.all([db.from("dm_messages").select("id,body,created_at").eq("sender_id",user.id).order("created_at",{ascending:false}).limit(3),db.from("dm_calls").select("id,created_at").eq("caller_id",user.id).order("created_at",{ascending:false}).limit(3)]);if(!alive)return;if(!messages.error)setInbox((messages.data||[]).map(v=>({id:String(v.id),content:String(v.body||""),created_at:String(v.created_at)})));if(!calls.error)setCallHistory((calls.data||[]).map(v=>({id:String(v.id),created_at:String(v.created_at)})))};void load();const timer=setInterval(()=>void load(),60000);return()=>{alive=false;clearInterval(timer)}},[]);
 const [sparkleKey,setSparkleKey]=useState(0);
 const [sparkling,setSparkling]=useState(false);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const sparkle=()=>{setSparkleKey(v=>v+1);setSparkling(true);if(timer)clearTimeout(timer);timer=setTimeout(()=>setSparkling(false),1150)};const toggle=()=>{const collapsed=!navCollapsedRef.current;navCollapsedRef.current=collapsed;setNavMotionStarted(true);setNavCollapsed(collapsed);window.dispatchEvent(new CustomEvent("1muslim:hudhud-nav-state",{detail:{collapsed}}));sparkle()};window.addEventListener("1muslim:hudhud-nav-toggle",toggle);window.addEventListener("1muslim:theme-changed",sparkle);return()=>{window.removeEventListener("1muslim:hudhud-nav-toggle",toggle);window.removeEventListener("1muslim:theme-changed",sparkle);if(timer)clearTimeout(timer)}},[]);

 useEffect(()=>{window.dispatchEvent(new CustomEvent("1muslim:quran-workspace-focus",{detail:{active:workspacePage===1}}));return()=>{window.dispatchEvent(new CustomEvent("1muslim:quran-workspace-focus",{detail:{active:false}}))}},[workspacePage]);

 const [quranExpanding,setQuranExpanding]=useState(false);
 const router=useRouter();
 const [singleWidget,setSingleWidget]=useState<string|null>(null);
 const [guestWelcomeDismissed,setGuestWelcomeDismissed]=useState(false);
 const [guestTitleIndex,setGuestTitleIndex]=useState(0);
 const [guestTitleTick,setGuestTitleTick]=useState(0);
 const [guestTitleZoom,setGuestTitleZoom]=useState(false);
 useEffect(()=>{try{localStorage.removeItem("1muslim-single-widget")}catch{}setSingleWidget(null)},[]);
const workspaceRef=useRef<HTMLDivElement>(null);const workspaceAreaRef=useRef<HTMLDivElement>(null);const swipeOrigin=useRef<{x:number;y:number}|null>(null);const upwardSwipeArmed=useRef(false);
  const upwardSwipeArmedAt=useRef(0);
  const workspaceSettled=useRef(0);
  const workspaceRaf=useRef<number|null>(null);
  const sceneIdleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const sceneMotion=useRef({x:0,y:0});
  const sceneScrollPositions=useRef(new WeakMap<HTMLElement,{x:number;y:number}>());
  const moveScene=(dx:number,dy:number)=>{
    if(typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const root=workspaceRef.current;
    if(!root)return;
    const x=Math.max(-18,Math.min(18,sceneMotion.current.x-dx*.12));
    const y=Math.max(-18,Math.min(18,sceneMotion.current.y-dy*.12));
    sceneMotion.current={x,y};
    root.style.setProperty("--profile-scene-x",x.toFixed(2)+"px");
    root.style.setProperty("--profile-scene-y",y.toFixed(2)+"px");
    root.style.setProperty("--profile-scene-zoom","1.075");
    if(sceneIdleTimer.current)clearTimeout(sceneIdleTimer.current);
    sceneIdleTimer.current=setTimeout(()=>{
      sceneMotion.current={x:0,y:0};
      root.style.setProperty("--profile-scene-x","0px");
      root.style.setProperty("--profile-scene-y","0px");
      root.style.setProperty("--profile-scene-zoom","1.035");
    },5000);
  };
  useEffect(()=>()=>{if(sceneIdleTimer.current)clearTimeout(sceneIdleTimer.current)},[]);
  const onSceneScrollCapture=(e:React.UIEvent<HTMLDivElement>)=>{
    const target=e.target as HTMLElement;
    if(!target||target===workspaceRef.current)return;
    const previous=sceneScrollPositions.current.get(target);
    const next={x:target.scrollLeft,y:target.scrollTop};
    sceneScrollPositions.current.set(target,next);
    if(previous)moveScene(next.x-previous.x,next.y-previous.y);
  };

  useEffect(()=>{
    try {
      const saved=Number(sessionStorage.getItem("1muslim:workspace-index")||"0");
      const index=Math.max(0,Math.min(HOME_SLIDES.length-1,Math.round(saved)));
      workspaceSettled.current=index;
      setWorkspacePage(index);
      requestAnimationFrame(()=>workspaceRef.current?.scrollTo({left:index*(workspaceRef.current?.clientWidth||0),behavior:"instant"}));
    }catch{}
    return ()=>{if(workspaceRaf.current!==null)cancelAnimationFrame(workspaceRaf.current)};
  },[]);

 // A one-time, partial carousel nudge teaches newly signed-in members to swipe.
 // It never changes the selected page and yields immediately to real touch input.
 useEffect(()=>{
   if(homeSignedIn!==true)return;
   const key="1muslim:swipe-hint-seen-v1";
   try{if(localStorage.getItem(key)==="1")return}catch{}
   const viewport=workspaceRef.current;
   if(!viewport)return;
   let cancelled=false;
   let raf=0;
   let timer=0;
   const stop=()=>{cancelled=true;cancelAnimationFrame(raf);clearTimeout(timer)};
   const play=()=>{
     if(cancelled||viewport.scrollLeft>2||document.visibilityState!=="visible")return;
     const distance=Math.min(78,viewport.clientWidth*.17);
     const duration=1050;
     const start=performance.now();
     const ease=(t:number)=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
     const tick=(now:number)=>{
       if(cancelled)return;
       const t=Math.min(1,(now-start)/duration);
       const offset=distance*Math.sin(Math.PI*ease(t));
       viewport.scrollLeft=offset;
       if(t<1)raf=requestAnimationFrame(tick);
       else{viewport.scrollLeft=0;try{localStorage.setItem(key,"1")}catch{}}
     };
     raf=requestAnimationFrame(tick);
   };
   const interrupt=()=>{stop();viewport.scrollTo({left:0,behavior:"instant"})};
   viewport.addEventListener("pointerdown",interrupt,{once:true});
   viewport.addEventListener("touchstart",interrupt,{once:true});
   viewport.addEventListener("wheel",interrupt,{once:true});
   timer=window.setTimeout(play,1250);
   return ()=>{stop();viewport.removeEventListener("pointerdown",interrupt);viewport.removeEventListener("touchstart",interrupt);viewport.removeEventListener("wheel",interrupt)};
 },[homeSignedIn]);
 const moveWorkspace=(page:number)=>{const next=Math.max(0,Math.min(HOME_SLIDES.length-1,page));workspaceRef.current?.scrollTo({left:next*workspaceRef.current.clientWidth,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});setWorkspacePage(next);try{sessionStorage.setItem("1muslim:workspace-index",String(next))}catch{}};
 const fullscreenSnapshot=useRef<{navCollapsed:boolean;navMotionStarted:boolean;workspacePage:number;scrollLeft:number;canvasExpanded:boolean;light:boolean}|null>(null);
 const toggleCanvasFullscreen=()=>{
   if(!canvasFullscreen){
     fullscreenSnapshot.current={navCollapsed:navCollapsedRef.current,navMotionStarted,workspacePage,scrollLeft:workspaceRef.current?.scrollLeft??0,canvasExpanded,light};
     setCanvasFullscreen(true);
     return;
   }
   const snapshot=fullscreenSnapshot.current;
   setCanvasFullscreen(false);
   if(snapshot){
     navCollapsedRef.current=snapshot.navCollapsed;
     setNavCollapsed(snapshot.navCollapsed);
     setNavMotionStarted(snapshot.navMotionStarted);
     setCanvasExpanded(snapshot.canvasExpanded);
     setWorkspacePage(snapshot.workspacePage);
     // Do not remount the Canvas, HudHud, or persistent players.
     // Restore the original carousel coordinate after the viewport resizes.
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       const viewport=workspaceRef.current;
       if(viewport)viewport.scrollTo({left:snapshot.workspacePage*viewport.clientWidth,behavior:"instant"});
     }));
     window.dispatchEvent(new CustomEvent("1muslim:hudhud-nav-state",{detail:{collapsed:snapshot.navCollapsed}}));
   }
   fullscreenSnapshot.current=null;
 };
 const [replacementPending,setReplacementPending]=useState(false);const [editWidgets,setEditWidgets]=useState(false);const [galleryOpen,setGalleryOpen]=useState(false);const [navCollapsed,setNavCollapsed]=useState(false);const [canvasExpanded,setCanvasExpanded]=useState(false);const [canvasFullscreen,setCanvasFullscreen]=useState(false);
 // Capture touches globally: nested Profile components can consume touch events before the carousel.
 useEffect(()=>{
   if(!adminHudHud||!navCollapsed||canvasFullscreen||canvasRow!==1||workspacePage!==0)return;
   let start:{x:number;y:number}|null=null;
   const down=(e:TouchEvent)=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY}};
   const up=(e:TouchEvent)=>{if(!start)return;const end=e.changedTouches[0];if(!end){start=null;return}const dx=end.clientX-start.x,dy=end.clientY-start.y;start=null;if(dx< -65&&Math.abs(dx)>Math.abs(dy)*1.25){setHudHudPanel("admin");workspaceRef.current?.scrollTo({left:0,behavior:"instant"})}};
   document.addEventListener("touchstart",down,{capture:true,passive:true});
   document.addEventListener("touchend",up,{capture:true,passive:true});
   return()=>{document.removeEventListener("touchstart",down,true);document.removeEventListener("touchend",up,true)};
 },[adminHudHud,navCollapsed,canvasFullscreen,canvasRow,workspacePage]);
 useEffect(()=>{if(canvasFullscreen||!navCollapsed||canvasRow!==1||workspacePage!==0)setHudHudPanel(null)},[canvasFullscreen,navCollapsed,canvasRow,workspacePage]);
 useEffect(()=>{if(hudHudPanel!=="admin")return;setHudHudWelcome(true);const timer=window.setTimeout(()=>setHudHudWelcome(false),3000);return()=>window.clearTimeout(timer)},[hudHudPanel]); const orbNavAnchor=useRef<HTMLSpanElement>(null);
 const [orbPinned,setOrbPinned]=useState(false);
 const [orbPosition,setOrbPosition]=useState<{left:number;top:number}|null>(null);
 const orbDrag=useRef<{id:number;x:number;y:number;left:number;top:number;moved:boolean}|null>(null);
 const orbSuppressClick=useRef(false);
 useEffect(()=>{
  const defaultPosition=()=>({left:Math.max(8,window.innerWidth-63),top:Math.max(68,Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-top"))||0)+76});
  const update=()=>{
   if(orbDrag.current)return;
   try{
    const saved=localStorage.getItem("1muslim-day-night-orb-position");
    if(saved){const p=JSON.parse(saved);if(Number.isFinite(p.left)&&Number.isFinite(p.top)){setOrbPosition({left:Math.max(8,Math.min(p.left,window.innerWidth-58)),top:Math.max(8,Math.min(p.top,window.innerHeight-58))});return;}}
   }catch{}
   setOrbPosition(defaultPosition());
  };
  update();window.addEventListener("resize",update);
  return()=>window.removeEventListener("resize",update);
 },[]);
 const moveOrb=(e:React.PointerEvent<HTMLDivElement>)=>{
  const d=orbDrag.current;if(!d||d.id!==e.pointerId)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(Math.hypot(dx,dy)>7)d.moved=true;
  if(d.moved)setOrbPosition({left:Math.max(8,Math.min(d.left+dx,window.innerWidth-58)),top:Math.max(8,Math.min(d.top+dy,window.innerHeight-58))});
 };
 const stopOrb=(e:React.PointerEvent<HTMLDivElement>)=>{
  const d=orbDrag.current;if(!d||d.id!==e.pointerId)return;
  if(d.moved){
   const p={left:Math.max(8,Math.min(d.left+e.clientX-d.x,window.innerWidth-58)),top:Math.max(8,Math.min(d.top+e.clientY-d.y,window.innerHeight-58))};
   setOrbPosition(p);try{localStorage.setItem("1muslim-day-night-orb-position",JSON.stringify(p));}catch{}
   orbSuppressClick.current=true;
   window.setTimeout(()=>{orbSuppressClick.current=false},350);
  }
  orbDrag.current=null;
 };
 const [globeOpen,setGlobeOpen]=useState(false);
 const [globeLanguage,setGlobeLanguage]=useState("en");
 const [globePosition,setGlobePosition]=useState<{left:number;top:number}|null>(null);
 const globeDrag=useRef<{id:number;x:number;y:number;left:number;top:number;moved:boolean}|null>(null);
 const globeMoved=useRef(false);
 useEffect(()=>{
  try{const saved=localStorage.getItem("1muslim-language-globe-position");if(saved){const p=JSON.parse(saved);if(Number.isFinite(p.left)&&Number.isFinite(p.top))setGlobePosition({left:Math.min(Math.max(8,p.left),innerWidth-58),top:Math.min(Math.max(8,p.top),innerHeight-58)});}}
  catch{}
  const lang=localStorage.getItem("1muslim-language")||document.documentElement.lang||"en";setGlobeLanguage(lang);
 },[]);
 const moveGlobe=(e:React.PointerEvent<HTMLDivElement>)=>{
  const d=globeDrag.current;if(!d||d.id!==e.pointerId)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(Math.hypot(dx,dy)>6)d.moved=true;
  if(d.moved)setGlobePosition({left:Math.min(Math.max(8,d.left+dx),innerWidth-58),top:Math.min(Math.max(8,d.top+dy),innerHeight-58)});
 };
 const stopGlobe=(e:React.PointerEvent<HTMLDivElement>)=>{
  const d=globeDrag.current;if(!d||d.id!==e.pointerId)return;
  globeMoved.current=d.moved;
  if(d.moved){const pos={left:Math.min(Math.max(8,d.left+e.clientX-d.x),innerWidth-58),top:Math.min(Math.max(8,d.top+e.clientY-d.y),innerHeight-58)};setGlobePosition(pos);localStorage.setItem("1muslim-language-globe-position",JSON.stringify(pos));}
  globeDrag.current=null;
 };
const navCollapsedRef=useRef(false);
 // Guests begin with HudHud docked and the navigation collapsed. A subsequent
 // HudHud tap still toggles the menu normally; auth changes reset this default.
 useEffect(()=>{
  if(homeSignedIn!==false)return;
  navCollapsedRef.current=true;
  setNavCollapsed(true);
  setNavMotionStarted(true);
  window.dispatchEvent(new CustomEvent("1muslim:hudhud-nav-state",{detail:{collapsed:true}}));
 },[homeSignedIn]);const [navMotionStarted,setNavMotionStarted]=useState(false);const [hiddenWidgets,setHiddenWidgets]=useState<string[]>(()=>spaces.filter(w=>w.name!=="Live"&&w.name!=="Qur’an").map(w=>w.name));const [widgetLimitNotice,setWidgetLimitNotice]=useState("");const [quranResume,setQuranResume]=useState("1:1");const [widgetLayout,setWidgetLayout]=useState<WidgetLayout[]>(DEFAULT_LAYOUT);const [dragged,setDragged]=useState<string|null>(null);const [layoutPreview,setLayoutPreview]=useState<WidgetLayout[]|null>(null);const layoutPreviewRef=useRef<WidgetLayout[]|null>(null);const magneticGesture=useRef<{x:number;y:number;name:string;pointerId:number}|null>(null);const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const holdStart=useRef<{x:number;y:number}|null>(null);const activeDrag=useRef<{pointerId:number;name:string}|null>(null);const dragHover=useRef<string|null>(null);const magneticOrigin=useRef<WidgetLayout[]|null>(null);const [magneticZone,setMagneticZone]=useState<string|null>(null);const magneticLast=useRef(0);const magneticPointer=useRef<{element:HTMLElement;startX:number;startY:number;lastX:number;lastY:number;vx:number;vy:number;time:number}|null>(null);const magneticFrame=useRef<number|null>(null);const [motionMode,setMotionMode]=useState<"cinematic"|"balanced"|"minimal">("balanced");const undoStack=useRef<WidgetLayout[][]>([]);const [layoutSettled,setLayoutSettled]=useState(true);const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{try{const saved=localStorage.getItem("1muslim-widget-motion");if(saved==="cinematic"||saved==="balanced"||saved==="minimal")setMotionMode(saved)}catch{}const motion=(e:Event)=>{const mode=(e as CustomEvent<{mode:string}>).detail?.mode;if(mode==="cinematic"||mode==="balanced"||mode==="minimal")setMotionMode(mode)};const arrange=()=>setEditWidgets(v=>!v);const undo=()=>{const previous=undoStack.current.pop();if(previous)setWidgetLayout(previous)};const reset=()=>{undoStack.current.push(widgetLayout);setWidgetLayout(DEFAULT_LAYOUT)};window.addEventListener("1muslim:widget-motion",motion);window.addEventListener("1muslim:widgets-arrange",arrange);window.addEventListener("1muslim:widgets-undo",undo);window.addEventListener("1muslim:widgets-reset",reset);return()=>{window.removeEventListener("1muslim:widget-motion",motion);window.removeEventListener("1muslim:widgets-arrange",arrange);window.removeEventListener("1muslim:widgets-undo",undo);window.removeEventListener("1muslim:widgets-reset",reset)}},[widgetLayout]);
 const clearHold=()=>{if(holdTimer.current)clearTimeout(holdTimer.current);holdTimer.current=null};
 // Once per signed-in tab: let the entry visuals settle, then descend one Canvas row.
 useEffect(()=>{
   if(homeSignedIn!==true||!layoutSettled||canvasRow!==0)return;
   const key="1muslim:post-login-auto-down-v1";
   try{if(sessionStorage.getItem(key)==="1")return}catch{}
   let cancelled=false;let timer:ReturnType<typeof setTimeout>|undefined;
   const cancel=()=>{cancelled=true;if(timer)clearTimeout(timer)};
   const onInteraction=()=>cancel();
   for(const event of ["pointerdown","touchstart","wheel","keydown"] as const)window.addEventListener(event,onInteraction,{once:true,passive:true});
   const settle=()=>{
     if(cancelled||document.visibilityState!=="visible")return;
     const active=document.getAnimations().some(animation=>animation.playState==="running"&&((animation.effect as KeyframeEffect|null)?.target instanceof Element)&&Boolean(((animation.effect as KeyframeEffect).target as Element).closest(".canvas-cinematic-entry, .canvas-vertical-portal, .profileAvatar")));
     if(active){timer=setTimeout(settle,250);return}
     timer=setTimeout(()=>{
       if(cancelled||document.visibilityState!=="visible")return;
       try{sessionStorage.setItem(key,"1")}catch{}
       setCanvasRow(0);
     },2500);
   };
   timer=setTimeout(settle,350);
   return()=>{cancel();for(const event of ["pointerdown","touchstart","wheel","keydown"] as const)window.removeEventListener(event,onInteraction)};
 },[homeSignedIn,layoutSettled,canvasRow]);
 const transitionLayout=(fn:()=>void)=>{setLayoutSettled(false);if(settleTimer.current)clearTimeout(settleTimer.current);settleTimer.current=setTimeout(()=>setLayoutSettled(true),650);const d=document as Document & {startViewTransition?:(fn:()=>void)=>unknown};if(d.startViewTransition&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)d.startViewTransition(()=>flushSync(fn));else fn()};
 // Magnetic layout: stable first-fit packing, preserving user order and avoiding collisions.
 const packNearby=(items:WidgetLayout[],_changed:string):WidgetLayout[]=>{
  const columns=typeof window!=="undefined"&&window.innerWidth<=700?2:4;
  const width=(size:WidgetSize)=>size==="compact"?1:size==="studio"?columns:size==="expanded"||size==="immersive"?Math.min(3,columns):2;
  const height=(size:WidgetSize)=>size==="featured"||size==="immersive"||size==="studio"?2:1;
  const cells=new Set<string>();const placed:{item:WidgetLayout;row:number;col:number}[]=[];
  const fits=(row:number,col:number,w:number,h:number)=>col+w<=columns&&Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>!cells.has((row+y)+":"+(col+x)))).every(a=>a.every(Boolean));
  // Previous grid order remains authoritative; a resize displaces only widgets that cannot fit.
  for(const item of items){const w=width(item.size),h=height(item.size);let found=false;
   for(let row=0;row<items.length*3&&!found;row++)for(let col=0;col<=columns-w;col++){if(!fits(row,col,w,h))continue;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)cells.add((row+y)+":"+(col+x));
    placed.push({item,row,col});found=true;break;
   }
  }
  // Preserve the user's saved ordering; CSS grid uses the same stable first-fit algorithm.
  return placed.map(p=>p.item);
 };
 const featureWidget=(name:string)=>transitionLayout(()=>{
  setHiddenWidgets(prev=>prev.filter(n=>n!==name));
  setWidgetLayout(items=>packNearby(items.map(item=>({...item,size:item.name===name?"featured":item.size==="featured"?"standard":item.size==="compact"?"compact":"standard"})),name));
 });
 const changeSize=(name:string)=>transitionLayout(()=>setWidgetLayout(items=>packNearby(items.map(item=>item.name===name?{...item,size:item.size==="compact"?"standard":item.size==="standard"?"featured":"standard"}:item),name)));
 const reorder=(from:string,to:string)=>{undoStack.current.push(widgetLayout);if(undoStack.current.length>10)undoStack.current.shift();transitionLayout(()=>setWidgetLayout(items=>{const copy=[...items];const a=copy.findIndex(x=>x.name===from),b=copy.findIndex(x=>x.name===to);if(a<0||b<0||a===b)return items;copy.splice(b,0,copy.splice(a,1)[0]);return packNearby(copy,from)}))};
 const keyboardMove=(name:string,delta:number)=>{const i=widgetLayout.findIndex(x=>x.name===name);const next=widgetLayout[Math.max(0,Math.min(widgetLayout.length-1,i+delta))];if(next&&next.name!==name)reorder(name,next.name)};
 const previewMove=(from:string,to:string)=>{if(!from||!to||from===to||dragHover.current===to)return;dragHover.current=to;setMagneticZone(to);const origin=magneticOrigin.current||widgetLayout;const copy=[...origin];const a=copy.findIndex(x=>x.name===from),b=copy.findIndex(x=>x.name===to);if(a<0||b<0)return;copy.splice(b,0,copy.splice(a,1)[0]);const next=packNearby(copy,from);layoutPreviewRef.current=next;setLayoutPreview(next)};
 const liftMagnetic=(element:HTMLElement,x:number,y:number)=>{if(magneticFrame.current!==null)cancelAnimationFrame(magneticFrame.current);magneticPointer.current={element,startX:x,startY:y,lastX:x,lastY:y,vx:0,vy:0,time:performance.now()};element.classList.add("hh-magnetic-lift");element.style.setProperty("--hh-drag-x","0px");element.style.setProperty("--hh-drag-y","0px")};
 const moveMagnetic=(x:number,y:number)=>{const p=magneticPointer.current;if(!p)return;const now=performance.now(),dt=Math.max(8,now-p.time);p.vx=Math.max(-22,Math.min(22,(x-p.lastX)*16.667/dt));p.vy=Math.max(-22,Math.min(22,(y-p.lastY)*16.667/dt));p.lastX=x;p.lastY=y;p.time=now;if(magneticFrame.current!==null)return;const animate=()=>{const a=magneticPointer.current;if(!a){magneticFrame.current=null;return}const grid=document.querySelector("[data-magnetic-grid]")?.getBoundingClientRect();let dx=(a.lastX-a.startX)*.94,dy=(a.lastY-a.startY)*.94;if(grid){const box=a.element.getBoundingClientRect();const margin=36;const left=box.left+dx,right=box.right+dx,top=box.top+dy,bottom=box.bottom+dy;if(left<grid.left-margin)dx+=(grid.left-margin-left)*.23;if(right>grid.right+margin)dx-=(right-grid.right-margin)*.23;if(top<grid.top-margin)dy+=(grid.top-margin-top)*.23;if(bottom>grid.bottom+margin)dy-=(bottom-grid.bottom-margin)*.23}const el=a.element;const currentX=Number(el.dataset.hhX||0),currentY=Number(el.dataset.hhY||0);const nextX=currentX+(dx-currentX)*.3,nextY=currentY+(dy-currentY)*.3;el.dataset.hhX=String(nextX);el.dataset.hhY=String(nextY);el.style.setProperty("--hh-drag-x",nextX+"px");el.style.setProperty("--hh-drag-y",nextY+"px");if(Math.abs(dx-nextX)+Math.abs(dy-nextY)>.5)magneticFrame.current=requestAnimationFrame(animate);else magneticFrame.current=null};magneticFrame.current=requestAnimationFrame(animate)};
 const settleMagnetic=(valid:boolean)=>{const p=magneticPointer.current;magneticPointer.current=null;if(!p)return;if(magneticFrame.current!==null){cancelAnimationFrame(magneticFrame.current);magneticFrame.current=null}const el=p.element;const x=(p.lastX-p.startX)*.94,y=(p.lastY-p.startY)*.94;el.style.removeProperty("--hh-drag-x");el.style.removeProperty("--hh-drag-y");delete el.dataset.hhX;delete el.dataset.hhY;el.classList.remove("hh-magnetic-lift");if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;el.animate([{transform:`translate3d(${x}px,${y}px,0) scale(1.035)`,offset:0},{transform:`translate3d(${-x*.055}px,${-y*.055}px,0) scale(.993)`,offset:valid?.58:.74},{transform:"translate3d(0,0,0) scale(1)",offset:1}],{duration:valid?1100:2000,easing:"cubic-bezier(.16,.8,.18,1)",composite:"replace"})};
 const cancelMagnetic=()=>{settleMagnetic(false);layoutPreviewRef.current=null;setLayoutPreview(null);magneticGesture.current=null;magneticOrigin.current=null;dragHover.current=null;setMagneticZone(null);activeDrag.current=null;setDragged(null)};
 const finishMagnetic=(x:number,y:number)=>{const grid=document.querySelector("[data-magnetic-grid]");const rect=grid?.getBoundingClientRect();const valid=!!rect&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;if(!valid){cancelMagnetic();return}settleMagnetic(true);const committed=layoutPreviewRef.current;if(committed){undoStack.current.push(magneticOrigin.current||widgetLayout);if(undoStack.current.length>10)undoStack.current.shift();transitionLayout(()=>setWidgetLayout(committed))}layoutPreviewRef.current=null;setLayoutPreview(null);magneticGesture.current=null;magneticOrigin.current=null;dragHover.current=null;setMagneticZone(null);activeDrag.current=null;setDragged(null)};
 const [layoutLoaded,setLayoutLoaded]=useState(false);const [layoutUser,setLayoutUser]=useState<string|null>(null);const [syncReady,setSyncReady]=useState(false);const [personal,setPersonal]=useState<{Messages?:number;Calls?:number;Quran?:string}>({});const [selected,setSelected]=useState<string|null>(null);const [counts,setCounts]=useState<Record<string,number>>({});
 const [myXp,setMyXp]=useState<number|null>(null);const [query,setQuery]=useState("");const [results,setResults]=useState<Result[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState(false);const [light,setLight]=useState(false);
 // New canonical four-slide homepage: ignore previous personal rearrangements and reset local preferences once.
 useEffect(()=>{try{localStorage.removeItem("1muslim-widget-layout-v1");localStorage.removeItem("1muslim-hidden-widgets-v1");localStorage.removeItem("1muslim-single-widget")}catch{}setWidgetLayout(DEFAULT_LAYOUT);setHiddenWidgets(spaces.filter(w=>!HOME_SLIDES.includes(w.name as typeof HOME_SLIDES[number])).map(w=>w.name));setLayoutLoaded(true);setSyncReady(true)},[]);
 useEffect(()=>{setLight(document.documentElement.classList.contains("light"));const db=createClient();let active=true;void Promise.all([db.from("live_streams").select("id",{count:"exact",head:true}).eq("status","live"),db.from("ummah_feed_posts").select("id",{count:"exact",head:true}),db.from("lessons").select("id",{count:"exact",head:true}).eq("active",true)]).then(([live,posts,lessons])=>{if(active)setCounts({...(live.error?{}:{Live:live.count??0}),...(posts.error?{}:{Ummah:posts.count??0}),...(lessons.error?{}:{Lessons:lessons.count??0})})});void db.auth.getUser().then(async({data:{user}})=>{if(!user)return;const {data}=await db.from("profiles").select("xp_total").eq("id",user.id).maybeSingle();if(active&&typeof data?.xp_total==="number")setMyXp(data.xp_total)});return()=>{active=false}},[]);
 useEffect(()=>{if(query.trim().length<2){setResults([]);setLoading(false);setError(false);return}const ac=new AbortController();const timer=setTimeout(async()=>{setLoading(true);try{const r=await fetch("/api/hub-search?q="+encodeURIComponent(query.trim()),{signal:ac.signal});if(!r.ok)throw Error("Search unavailable");const data=await r.json();setResults(data.results||[]);setError((data.partialErrors||[]).length>0)}catch{if(!ac.signal.aborted){setResults([]);setError(true)}}finally{if(!ac.signal.aborted)setLoading(false)}},300);return()=>{clearTimeout(timer);ac.abort()}},[query]);
 useEffect(()=>{let alive=true;const db=createClient();void db.auth.getUser().then(async({data:{user}})=>{if(!user||!alive)return;void db.from("dm_calls").select("id,caller_id,callee_id").or("caller_id.eq."+user.id+",callee_id.eq."+user.id).limit(200).then(({data,error})=>{if(alive&&!error&&data)setPersonal(v=>({...v,Calls:data.length}))});const {data:threads}=await db.from("dm_participants").select("conversation_id,last_read_at").eq("user_id",user.id).limit(100);if(!alive||!threads)return;const ids=threads.map(t=>t.conversation_id);if(ids.length){const {data:messages}=await db.from("dm_messages").select("conversation_id,sender_id,created_at").in("conversation_id",ids).order("created_at",{ascending:false}).limit(500);if(alive&&messages){const reads=new Map(threads.map(t=>[t.conversation_id,t.last_read_at]));const unread=messages.filter(m=>m.sender_id!==user.id&&(!reads.get(m.conversation_id)||new Date(m.created_at).getTime()>new Date(reads.get(m.conversation_id)!).getTime())).length;setPersonal(v=>({...v,Messages:unread}))}}else setPersonal(v=>({...v,Messages:0}));});try{const progress=JSON.parse(localStorage.getItem("1muslim-quran-progress")||"null");if(progress&&Number.isInteger(progress.chapter)&&progress.chapter>=1&&progress.chapter<=114)setPersonal(v=>({...v,Quran:"Continue Surah "+progress.chapter+(progress.verse?" · Ayah "+progress.verse:"")}))}catch{}return()=>{alive=false}},[]);
 const applyTheme=(next:boolean)=>{setLight(next);document.documentElement.classList.toggle("light",next);localStorage.setItem("1muslim-theme",next?"light":"dark");window.dispatchEvent(new Event("1muslim:theme-changed"))};
 const selectTheme=(mode:"day"|"night"|"auto")=>{localStorage.setItem("1muslim-theme-mode",mode);applyTheme(mode==="auto"?window.matchMedia("(prefers-color-scheme: light)").matches:mode==="day")};
 const changeTheme=()=>selectTheme(light?"night":"day");
 useEffect(()=>{const stored=localStorage.getItem("1muslim-theme-mode");const mode=stored==="auto"||stored==="day"||stored==="night"?stored:(document.documentElement.classList.contains("light")?"day":"night");if(mode==="auto"){applyTheme(window.matchMedia("(prefers-color-scheme: light)").matches)}const syncFromSettings=()=>{const next=localStorage.getItem("1muslim-theme-mode");if(next==="day"||next==="night"||next==="auto")applyTheme(next==="auto"?window.matchMedia("(prefers-color-scheme: light)").matches:next==="day")};window.addEventListener("1muslim:appearance-updated",syncFromSettings);const media=window.matchMedia("(prefers-color-scheme: light)");const onChange=()=>{if(localStorage.getItem("1muslim-theme-mode")==="auto")applyTheme(media.matches)};media.addEventListener("change",onChange);return()=>{media.removeEventListener("change",onChange);window.removeEventListener("1muslim:appearance-updated",syncFromSettings)}},[]);

 const searching=query.trim().length>=2;
 const toggleWidget=(name:string)=>{if(name==="1Muslim Shop"){teaseShop();return}const removing=!hiddenWidgets.includes(name);setWidgetLimitNotice("");transitionLayout(()=>setHiddenWidgets(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name]));if(!removing){setWidgetLayout(items=>items.map(item=>item.name===name?{...item,size:"compact"}:item));setReplacementPending(false)}};
 const previewWidget=(name:string)=>{setHiddenWidgets(v=>v.filter(x=>x!==name));setWidgetLayout(items=>items.map(item=>item.name===name?{...item,size:"featured"}:item));setSingleWidget(null);setReplacementPending(false);setGalleryOpen(false);window.setTimeout(()=>moveWorkspace(1),100)};

 const featuredName=(widgetLayout.find(item=>item.size==="featured"&&!hiddenWidgets.includes(item.name))||widgetLayout.find(item=>!hiddenWidgets.includes(item.name)))?.name||"Live";
 const notificationContext=featuredName==="Qur’an"
  ?(quranPreview?"Reading Surah "+quranPreview.chapter+", verse "+quranPreview.verse:"Qur’an progress and reading streak")
  :featuredName==="People"||featuredName==="XP & Progress"?"Profile badges and avatar unlocks"
  :featuredName==="Ummah"||featuredName==="Videos"?"Comments on your posts and activity"
  :featuredName==="Live"?"New viewers, comments and live activity"
  :featuredName==="Messages"?(personal.Messages!==undefined?personal.Messages+" unread conversations":"Unread conversations")
  :featuredName==="Lessons"?"Lessons completed and XP earned"
  :featuredName+" activity";
 const hudhudSuggestion = !homeSignedIn ? "Sign in to save your personal arrangement." : (personal.Quran ? "Continue your Qur’an reading where you left off." : (counts.Live||0)>0 ? "A live gathering is happening now." : (personal.Messages||0)>0 ? "You have unread conversations waiting." : "Try a Qur’an session or explore today’s lessons.");
 const optimizeWidgets=()=>transitionLayout(()=>setWidgetLayout(items=>items.map(item=>hiddenWidgets.includes(item.name)?item:{...item,size:items.length-hiddenWidgets.length<=2?"studio":items.length-hiddenWidgets.length<=3?"immersive":items.length-hiddenWidgets.length<=5?"featured":"standard"})));
 useEffect(()=>{
   const area=workspaceAreaRef.current;
   if(!area)return;
   let frame=0;
   let lastHeight=0;
   const measure=()=>{
     cancelAnimationFrame(frame);
     frame=requestAnimationFrame(()=>{
       const viewport=window.visualViewport;
       const viewportBottom=(viewport?.offsetTop??0)+(viewport?.height??window.innerHeight);
       const top=area.getBoundingClientRect().top;
       const keyboardOpen=!!viewport&&window.innerHeight-viewport.height>160;
       const bottomReserve=window.innerWidth<=700?Math.max(18,keyboardOpen?16:76):28;
       const available=Math.max(280,Math.floor(viewportBottom-top-bottomReserve));
       if(Math.abs(available-lastHeight)>2){
         area.style.setProperty("--workspace-fit-height",available+"px");
         lastHeight=available;
       }
       area.dataset.keyboardOpen=keyboardOpen?"true":"false";
     });
   };
   measure();
   // Observe only the header/intro: observing the entire body would create a
   // feedback loop as the canvas grows to its newly measured height.
   const observer=new ResizeObserver(measure);
   const header=area.closest("main")?.querySelector("header");
   if(header)observer.observe(header);
   const intro=area.previousElementSibling;
   if(intro)observer.observe(intro);
   window.addEventListener("resize",measure);
   window.addEventListener("orientationchange",measure);
   window.visualViewport?.addEventListener("resize",measure);
   window.visualViewport?.addEventListener("scroll",measure);
   const timers=[150,350,700,1000].map(ms=>window.setTimeout(measure,ms));
   return ()=>{cancelAnimationFrame(frame);timers.forEach(clearTimeout);observer.disconnect();window.removeEventListener("resize",measure);window.removeEventListener("orientationchange",measure);window.visualViewport?.removeEventListener("resize",measure);window.visualViewport?.removeEventListener("scroll",measure)};
 },[navCollapsed,navMotionStarted,guestWelcomeDismissed]);

 const profileSwipeStart=useRef<{target:HTMLElement;scrollAtTop:boolean;y:number}|null>(null);
 // Capture vertical navigation across the entire visible Canvas, including the
 // bottom edge outside the horizontal workspace scroller.
 useEffect(()=>{
  let start:{x:number;y:number;target:HTMLElement;atTop:boolean}|null=null;
  let fired=false;
  const down=(e:TouchEvent)=>{
   if(e.touches.length!==1||editWidgets){start=null;return}
   const target=e.target as HTMLElement;
   if(target.closest('[data-profile-mirror-scroll][aria-label="My Profile"]')){start=null;return}
   if(!target.closest("main[data-canvas-fullscreen]")){start=null;return}
   const scroller=target.closest(".canvas-native-profile,[data-ranks-scroll],[data-gallery-scroll]") as HTMLElement|null;
   start={x:e.touches[0].clientX,y:e.touches[0].clientY,target,atTop:!scroller||scroller.scrollTop<=2};
   fired=false;
  };
  const move=(e:TouchEvent)=>{
   if(!start||fired||e.touches.length!==1)return;
   const t=e.touches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
   if(Math.abs(dy)<68||Math.abs(dy)<Math.abs(dx)*1.5)return;
   // When the gallery's own scroll reaches its top, an intentional extra pull
   // returns to the upper Profile canvas. Normal scrolling remains native.
   const gallery=start.target.closest(".canvas-native-profile,.canvas-umma-vertical-gallery") as HTMLElement|null;
   if(gallery&&canvasRow===1&&workspacePage===0&&dy>=115&&start.atTop){
    const scrollable=start.target.closest(".canvas-native-profile") as HTMLElement|null;
    if((scrollable?.scrollTop??0)<=2&&!start.target.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true]")){
     fired=true;if(e.cancelable)e.preventDefault();setCanvasRow(0);return;
    }
   }
   if(start.target.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true],[data-live-video-region],.canvas-native-profile,.canvas-umma-vertical-gallery"))return;
   if((canvasRow===0||canvasRow===1)&&dy< -68&&start.atTop&&!start.target.closest("[data-ranks-scroll],[data-gallery-scroll]")){fired=true;if(e.cancelable)e.preventDefault();setCanvasRow(row=>Math.min(1,row+1) as 0|1|2);}
   else if((canvasRow===1)&&dy>120&&start.atTop){
    const nested=start.target.closest("[data-ranks-scroll],[data-gallery-scroll]");
    const profile=start.target.closest(".canvas-native-profile") as HTMLElement|null;
    if(!nested&&(!profile||profile.scrollTop<=2)){
     fired=true;if(e.cancelable)e.preventDefault();setCanvasRow(row=>Math.max(0,row-1) as 0|1|2);
    }
   }
  };
  const end=()=>{start=null;fired=false};
  document.addEventListener("touchstart",down,{capture:true,passive:true});
  document.addEventListener("touchmove",move,{capture:true,passive:false});
  document.addEventListener("touchend",end,{capture:true,passive:true});
  document.addEventListener("touchcancel",end,{capture:true,passive:true});
  return()=>{document.removeEventListener("touchstart",down,true);document.removeEventListener("touchmove",move,true);document.removeEventListener("touchend",end,true);document.removeEventListener("touchcancel",end,true)};
 },[canvasRow,workspacePage,editWidgets]);

 return <main data-canvas-fullscreen={canvasFullscreen?"true":"false"} data-widget-motion={motionMode} className={[styles.control,light?styles.day:"",navMotionStarted?(navCollapsed?styles.navMotionCollapsed:styles.navMotionExpanded):""].join(" ")}><div className="canvas-cinematic-entry" aria-hidden="true"/><RisingEnergyOrbs tone="green" density="ambient"/><ShahadaWelcomeToast /><div className={styles.pattern} aria-hidden="true"/><div className={styles.islamicDecoration} aria-hidden="true"><span className={styles.decorationNight}/><span className={styles.decorationDay}/></div><header className={[styles.controlHeader,navCollapsed?styles.controlHeaderCollapsed:""].join(" ")}><div className={styles.brand}><span className="canvas-header-theme-orb"><CelestialOrb light={light} onToggle={changeTheme}/></span><Link href="/welcome/original" className="canvas-header-brand-link"><strong>1MUSLIM</strong><small>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</small></Link></div><div className={styles.headerActions}><Link href="/profile" aria-label="Profile">◉</Link></div><form className={styles.searchDock} onSubmit={e=>e.preventDefault()} role="search"><span className={styles.orb} aria-hidden="true"><Image src="/assets/hudhud-logo.PNG" width={40} height={40} alt=""/></span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search 1Muslim (local search; HudHud integrations open in HudHud HQ)" placeholder="Search 1Muslim · verses, people, live…"/>{query?<button type="button" onClick={()=>setQuery("")}>✕</button>:<button type="button" aria-label="Open For You video swiping" title="For You" onClick={()=>window.dispatchEvent(new Event("1muslim:open-for-you"))}>▶</button>}</form></header><div className={styles.intro}><div className={styles.introGreeting}><span className={styles.eyebrow}>{homeSignedIn&&homeNames?<><span>{homeNames.english}</span><span className={styles.introNameDivider}> · </span><span lang="ar" dir="rtl" className={styles.introArabicName}>{homeNames.arabic}</span></>:null}</span><h1 className={styles.greetingWithOrb}/></div><div className={styles.introActionDock}><button type="button" className={`${styles.introLiveButton} ${homeSignedIn ? "homeAuthSignOut" : "homeAuthSignIn"}`} onClick={async()=>{if(homeSignedIn){const {error}=await createClient().auth.signOut();if(error){window.alert("Unable to sign out. Please try again.");return}setHomeSignedIn(false);window.location.reload()}else{setShahadaOverlay(true)}}} aria-label={homeSignedIn?"Sign Out":"Sign In"}><span className={styles.liveDockDot} aria-hidden="true"/>{homeSignedIn?"Sign Out":"Sign In"}</button><Link href="/streaming/go-live" className={`${styles.introLiveButton} ${homeSignedIn ? "homeGoLiveSignedIn" : ""}`} aria-label="Go Live"><span className={styles.liveDockDot} aria-hidden="true"/> Go Live</Link></div></div><div className={`${workspaceStyles.guestBannerSlot} ${homeSignedIn===false&&!guestWelcomeDismissed?workspaceStyles.guestBannerOpen:""}`} aria-hidden={homeSignedIn!==false||guestWelcomeDismissed}><aside className={styles.guestWelcome} role="status"><div><small>✦ 1MUSLIM · WELCOME</small><strong>Explore freely. Join when ready.</strong></div><button type="button" onClick={()=>{setShahadaOverlay(true);setGuestWelcomeDismissed(true)}}>Sign in →</button><button type="button" className={workspaceStyles.guestBannerClose} onClick={()=>setGuestWelcomeDismissed(true)} aria-label="Close welcome message">×</button></aside></div>{homeSignedIn===false&&guestFadeKey>0&&<div key={guestFadeKey} className="guestThemeReveal" aria-hidden="true"><div className="guestThemeRevealDim"/><div className="guestThemeRevealHalo"/></div>}{homeSignedIn===false&&<style>{`@keyframes guestBlackFade2500{0%{opacity:0;transform:scale(1)}42%{opacity:.92;transform:scale(1.018)}60%{opacity:.92;transform:scale(1.025)}100%{opacity:0;transform:scale(1.045)}}@media(prefers-reduced-motion:reduce){@keyframes guestBlackFade2500{0%,100%{opacity:0}50%{opacity:.3}}}`}</style>}{homeSignedIn===false&&<style>{`@keyframes guestThemeAmbient{0%,100%{transform:scale(1.015) rotate(-.15deg)}50%{transform:scale(1.045) rotate(.18deg)}} .${styles.surfaceArtwork}{animation:guestThemeAmbient 16s ease-in-out infinite alternate;transform-origin:center center;transition:filter 3.2s ease,background-color 3.2s ease} @media(prefers-reduced-motion:reduce){.${styles.surfaceArtwork}{animation:none!important}}`}</style>}{upgradeVisible&&<aside className={styles.upgradeNotice} role="status" aria-label="1Muslim calling upgrade announcement"><span className={styles.upgradeSparkle} aria-hidden="true">✦</span><div className={styles.upgradeCopy}><span className={styles.upgradeKicker}>1MUSLIM · NEW THEMES</span><strong>New Themes. Your 1Muslim, your style.</strong><p>Explore six beautiful color themes and personalize your background.</p></div><Link href="/?profile=background" className={styles.upgradeTry} onClick={dismissUpgrade}>Explore Themes <span aria-hidden="true">↗</span></Link><button type="button" className={styles.upgradeDismiss} onClick={dismissUpgrade} aria-label="Dismiss upgrade announcement">×</button></aside>}<section className={[styles.surface,styles.decoratedSurface,sparkling?styles.surfaceSparkling:""].join(" ")} aria-label="1Muslim Control Center"><div className={styles.surfaceArtwork} aria-hidden="true"/>{sparkling&&<div key={sparkleKey} className={styles.surfaceSparkle} aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>}{searching?<><div className={styles.searchHeading}><strong>Discover · {loading?"Searching…":results.length+" results"}</strong><button type="button" onClick={()=>setQuery("")}>✕ Clear</button></div><div className={styles.searchViewport}>{results.map(r=>r.kind==="Person"?<PersonSearchCard key={r.kind+r.id} person={r}/>:<Link key={r.kind+r.id} href={r.href} className={styles.match}><span className={styles.matchSymbol}>{r.kind==="Qur’an"?"۞":r.kind==="Live"?"◉":r.kind==="Lesson"?"✦":"✧"}</span><span><b>{r.kind}</b><strong>{r.title}</strong><small>{r.subtitle}</small></span><span>↗</span></Link>)}{!loading&&results.length===0&&<p className={styles.noResults}>No matching content yet. Try another phrase or name.</p>}{error&&<small>Some search sources are unavailable.</small>}</div></>:<div ref={workspaceAreaRef} data-single-widget={singleWidget?"true":"false"} data-canvas-expanded={canvasExpanded?"true":"false"} className={`${styles.widgetArea} ${workspaceStyles.fillArea}`}>{HOME_SLIDES[workspacePage]!=="Live"&&<div className={workspaceStyles.canvasHeaderTitle} aria-live="polite"><strong>{HOME_SLIDES[workspacePage]==="Messages"?"CONNECT WITH THE UMMAH":HOME_SLIDES[workspacePage].toUpperCase()}</strong><span lang="ar" dir="rtl">{spaces.find(space=>space.name===HOME_SLIDES[workspacePage])?.arabic||""}</span></div>}{quranExpanding&&<div className={workspaceStyles.studioPortal} aria-label="Opening Qur’an Studio" role="status"><div className={workspaceStyles.studioPortalBackdrop}/><div className={workspaceStyles.studioPortalContent}><span lang="ar" dir="rtl">القرآن الكريم</span><strong>QUR’AN STUDIO</strong><small>Opening your reading space</small></div></div>}<div className={styles.topParticleBurst} key={"top-particles-"+workspacePage+"-"+topParticleBurst} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:(6+(i*43)%89)+"%",animationDelay:(i*.13)+"s",animationDuration:(3.2+(i%4)*.2)+"s"}}/>)}</div><div ref={workspaceRef} className={`${styles.workspaceScroller} ${workspaceStyles.viewport}`} onScrollCapture={onSceneScrollCapture} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Customizable dashboard workspaces" onKeyDown={e=>{if(editWidgets||e.target!==e.currentTarget)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();moveWorkspace(workspacePage+(e.key==="ArrowRight"?1:-1))}else if(e.key==="Home"){e.preventDefault();moveWorkspace(0)}else if(e.key==="End"){e.preventDefault();moveWorkspace(HOME_SLIDES.length-1)}}} onScroll={e=>{const el=e.currentTarget;if(workspaceRaf.current!==null)return;workspaceRaf.current=requestAnimationFrame(()=>{workspaceRaf.current=null;const width=Math.max(1,el.clientWidth);const progress=el.scrollLeft/width;if(adminSwipeArmed.current||hudHudPanel==="admin"){if(el.scrollLeft!==0)el.scrollLeft=0;return}const page=Math.min(HOME_SLIDES.length-1,Math.max(0,Math.round(progress)));setWorkspacePage(prev=>{if(prev!==page)setCanvasRow(0);return prev===page?prev:page});el.style.setProperty("--workspace-swipe-progress",String(progress));moveScene((progress-(Number(el.dataset.sceneProgress||progress)))*width,0);el.dataset.sceneProgress=String(progress);el.querySelectorAll<HTMLElement>("[data-workspace-page]").forEach((slide,index)=>slide.style.setProperty("--scene-offset",`${Math.max(-1,Math.min(1,progress-index))*-7}px`));if(Math.abs(progress-page)<.035&&workspaceSettled.current!==page){workspaceSettled.current=page;try{sessionStorage.setItem("1muslim:workspace-index",String(page))}catch{};if(typeof navigator!=="undefined"&&"vibrate" in navigator)navigator.vibrate(7)}})}} onTouchStart={e=>{if(editWidgets)return;const startTarget=e.target as HTMLElement;const scrollRegion=startTarget.closest(".canvas-native-profile,[data-ranks-scroll],[data-gallery-scroll]") as HTMLElement|null;const scrollAtTop=!scrollRegion||scrollRegion.scrollTop<=2;profileSwipeStart.current={target:startTarget,scrollAtTop,y:e.touches[0].clientY};adminSwipeArmed.current=adminHudHud&&canvasRow===1&&workspacePage===0&&navCollapsed&&!canvasFullscreen;swipeOrigin.current={x:e.touches[0].clientX,y:e.touches[0].clientY};verticalSwipeStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchMove={e=>{
 const gesture=verticalSwipeStart.current;
 const touch=e.touches[0];
 if(gesture&&touch&&!editWidgets){
  const dx=touch.clientX-gesture.x,dy=touch.clientY-gesture.y;
  const origin=profileSwipeStart.current?.target;
  const blocked=Boolean(origin?.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true],[data-live-video-region],.canvas-native-profile,.canvas-umma-vertical-gallery"));
  if(!blocked&&Math.abs(dy)>Math.abs(dx)*1.35){
   if((canvasRow===0||canvasRow===1)&&dy< -52&&profileSwipeStart.current?.scrollAtTop&&!origin?.closest("[data-ranks-scroll],[data-gallery-scroll]")){
    if(e.cancelable)e.preventDefault();
    setCanvasRow(row=>Math.min(1,row+1) as 0|1|2);verticalSwipeStart.current=null;profileSwipeStart.current=null;swipeOrigin.current=null;
    return;
   }
   if((canvasRow===1)&&dy>105&&origin?.closest(".canvas-vertical-secondary")&&profileSwipeStart.current?.scrollAtTop){
    const nested=origin.closest("[data-ranks-scroll],[data-gallery-scroll]");
    const profileScroll=origin.closest(".canvas-native-profile") as HTMLElement|null;
    if(!nested&&(!profileScroll||profileScroll.scrollTop<=2)){
     if(e.cancelable)e.preventDefault();
     setCanvasRow(row=>Math.max(0,row-1) as 0|1|2);verticalSwipeStart.current=null;profileSwipeStart.current=null;swipeOrigin.current=null;
     return;
    }
   }
  }
 }
 if(!swipeOrigin.current)return;if(adminSwipeArmed.current){const t=e.touches[0];const dx=t.clientX-swipeOrigin.current.x,dy=t.clientY-swipeOrigin.current.y;if(dx < -12&&Math.abs(dx)>Math.abs(dy)*1.2){if(e.cancelable)e.preventDefault();return}}const dx=e.touches[0].clientX-swipeOrigin.current.x,dy=e.touches[0].clientY-swipeOrigin.current.y;if(Math.abs(dy)>Math.abs(dx)+10)swipeOrigin.current=null}} onTouchEnd={e=>{const start=verticalSwipeStart.current;const end=e.changedTouches[0];if(start&&end&&!editWidgets){const dx=end.clientX-start.x,dy=end.clientY-start.y;if(Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy)*1.5&&canvasRow===1&&workspacePage===0&&navCollapsed&&!canvasFullscreen){if(adminHudHud&&dx<0){setHudHudPanel("admin");workspaceRef.current?.scrollTo({left:0,behavior:"instant"});}}else if(Math.abs(dy)>60&&Math.abs(dy)>Math.abs(dx)*1.25){
 const origin=profileSwipeStart.current?.target??(e.target as HTMLElement);
 const interactive=Boolean(origin.closest("button,a,input,textarea,select,[role=dialog],[contenteditable=true],.canvas-native-profile,.canvas-umma-vertical-gallery"));
 const inVideo=Boolean(origin.closest("[data-live-video-region]"));
 if(!interactive&&!inVideo){
  if((canvasRow===0||canvasRow===1)&&dy< -60&&profileSwipeStart.current?.scrollAtTop&&!origin.closest("[data-ranks-scroll],[data-gallery-scroll]")){setCanvasRow(row=>Math.min(1,row+1) as 0|1|2);}
  else if((canvasRow===1)&&dy>95){
   // A new upward gesture at the top of the Profile returns Home.
   // Gestures beginning within a scrolling content region remain local.
   const inProfile=origin.closest(".canvas-vertical-secondary");
   const scrollRegion=origin.closest("[data-ranks-scroll],[data-gallery-scroll],.canvas-native-profile");
   if(inProfile&&profileSwipeStart.current?.scrollAtTop&&!scrollRegion?.matches("[data-ranks-scroll],[data-gallery-scroll]"))setCanvasRow(row=>Math.max(0,row-1) as 0|1|2);
  }
 }
}}verticalSwipeStart.current=null;profileSwipeStart.current=null;swipeOrigin.current=null;adminSwipeArmed.current=false}}><nav aria-label="Main carousel navigation" style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",flexShrink:0}}>{HOME_SLIDES.map((label,index)=><button key={label} type="button" aria-current={workspacePage===index?"page":undefined} onClick={()=>moveWorkspace(index)} style={{flex:"0 0 auto",borderRadius:16,padding:"9px 15px",color:"#fff5d8",border:workspacePage===index?"1px solid rgba(247,210,119,.8)":"1px solid rgba(247,210,119,.24)",background:workspacePage===index?"rgba(13,107,82,.8)":"rgba(6,39,37,.42)"}}>{label}</button>)}</nav><div className={`${styles.workspaceTrack} ${workspaceStyles.track}`}>{HOME_SLIDES.map((_,page)=><section key={page} data-workspace-page={page} className={`${styles.workspacePage} ${workspaceStyles.slide}`} data-canvas-active={workspacePage===page?"true":"false"} aria-label={`${HOME_SLIDES[page]} workspace`} aria-roledescription="slide"><div className={workspaceStyles.scene} aria-hidden="true"><div className="homeAmbientHalo" /><div className={workspaceStyles.night}/><div className={workspaceStyles.day}/><div className={workspaceStyles.canvasParticles}>{Array.from({length:16},(_,i)=><span key={i} style={{["--spark-x" as string]:((i*43+page*17+9)%96)+"%",["--spark-y" as string]:((i*61+page*11+7)%94)+"%",["--spark-size" as string]:(2+(i%3))+"px",["--spark-delay" as string]:"-"+((i*7+page*3)%23)+"s",["--spark-duration" as string]:(13+(i*5)%17)+"s"}}/>)}</div></div>{page===5&&<div className="community-direct-surface"><CommunityMap active={workspacePage===page}/></div>}<div className="canvas-vertical-portal" data-row={0}><div className="canvas-vertical-main">{page===6&&<div style={{height:"100%",minHeight:0,overflowY:"auto",overscrollBehavior:"contain"}}><CanvasSecondaryApp slot={0} active={workspacePage===6}/></div>}{page!==0&&page!==5&&page!==6&&<div data-magnetic-grid="true" className={[styles.controlGrid,styles.customGrid,workspaceStyles.content,editWidgets?styles.editGrid:"",singleWidget&&page===0?styles.singleWidgetGrid:""].join(" ")}>{((layoutPreview||widgetLayout).filter(item=>item.name===HOME_SLIDES[page]).length?(layoutPreview||widgetLayout).filter(item=>item.name===HOME_SLIDES[page]):(HOME_SLIDES[page]&&spaces.some(space=>space.name===HOME_SLIDES[page])?[{name:HOME_SLIDES[page],size:"featured" as const}]:[])).map((item,i)=>{const w=spaces.find(x=>x.name===item.name)!;const metric=w.name==="Notifications"?notificationContext:w.name==="Live"?(counts.Live===undefined?"See live streams":counts.Live+" live now"):w.name==="Ummah"?(counts.Ummah===undefined?"Explore community posts":counts.Ummah+" community posts"):w.name==="Lessons"?(counts.Lessons===undefined?"Browse learning paths":counts.Lessons+" active lessons"):w.name==="People"?(myXp===null?"Discover members":myXp.toLocaleString()+" XP · Your journey"):w.name==="Qur’an"?(personal.Quran||"Continue reading & listening"):w.name==="Videos"?"Watch community videos":w.name==="Messages"?(personal.Messages===undefined?"Open your conversations":personal.Messages+" unread messages"):(personal.Calls===undefined?"Voice & video calling":personal.Calls+" calls in your history");return <div key={w.name} data-widget={w.name} data-featured={item.size==="featured"?"true":"false"} draggable={false} onDragStart={e=>{setDragged(w.name);dragHover.current=null;e.dataTransfer.setData("text/plain",w.name);e.dataTransfer.effectAllowed="move"}} onDragOver={e=>{if(editWidgets){e.preventDefault();e.dataTransfer.dropEffect="move"}}} onDragEnter={e=>{if(editWidgets){e.preventDefault();previewMove(dragged||e.dataTransfer.getData("text/plain"),w.name)}}} onDrop={e=>{e.preventDefault();const from=e.dataTransfer.getData("text/plain")||dragged;if(from&&dragHover.current!==w.name)reorder(from,w.name);dragHover.current=null;setDragged(null)}} onDragEnd={()=>{dragHover.current=null;setDragged(null)}} onPointerDown={e=>{if(editWidgets||e.target instanceof Element&&e.target.closest("button,input,textarea,select"))return;const gestureElement=e.currentTarget as HTMLElement;holdStart.current={x:e.clientX,y:e.clientY};magneticGesture.current={x:e.clientX,y:e.clientY,name:w.name,pointerId:e.pointerId};clearHold();holdTimer.current=setTimeout(()=>{if(!magneticGesture.current)return;setEditWidgets(true);magneticOrigin.current=widgetLayout;setDragged(w.name);activeDrag.current={pointerId:e.pointerId,name:w.name};setMagneticZone(w.name);const el=gestureElement;const start=holdStart.current;if(el&&start)liftMagnetic(el,start.x,start.y)},420)}} onPointerMove={e=>{if(holdStart.current){const dx=e.clientX-holdStart.current.x,dy=e.clientY-holdStart.current.y;if(!activeDrag.current&&dy< -14&&Math.abs(dy)>Math.abs(dx)*1.4&&editWidgets){clearHold();magneticOrigin.current=widgetLayout;setDragged(w.name);activeDrag.current={pointerId:e.pointerId,name:w.name};liftMagnetic(e.currentTarget as HTMLElement,holdStart.current.x,holdStart.current.y)}else if(Math.hypot(dx,dy)>12)clearHold()}if(activeDrag.current?.pointerId===e.pointerId){if(e.cancelable)e.preventDefault();moveMagnetic(e.clientX,e.clientY);const grid=document.querySelector("[data-magnetic-grid]")?.getBoundingClientRect();const inside=!!grid&&e.clientX>=grid.left&&e.clientX<=grid.right&&e.clientY>=grid.top&&e.clientY<=grid.bottom;const target=inside?document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-widget]")?.getAttribute("data-widget"):null;if(!inside)setMagneticZone(null);if(target&&target!==activeDrag.current.name&&performance.now()-magneticLast.current>120){magneticLast.current=performance.now();previewMove(activeDrag.current.name,target)}}}} onPointerUp={e=>{clearHold();holdStart.current=null;magneticGesture.current=null;if(activeDrag.current?.pointerId===e.pointerId)finishMagnetic(e.clientX,e.clientY)}} onPointerCancel={()=>{clearHold();holdStart.current=null;magneticGesture.current=null;cancelMagnetic()}} style={{viewTransitionName:"widget-"+w.cls}} className={[styles.widgetSlot,styles["size"+item.size],dragged===w.name?styles.draggedWidget:"",magneticZone===w.name?"hh-magnetic-target":""].join(" ")}>{w.name==="Videos"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas,workspaceStyles.videoPlayerCard].join(" ")}><HomeVideoPreview/></div>:w.name==="Elm Tent"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas,workspaceStyles.elmTentCard].join(" ")}><ElmTentAlphabet/></div>:w.name==="Messages"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas,workspaceStyles.messagesChoiceCard].join(" ")}><HomeMessagesChooser/></div>:w.name==="Qur’an"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas,workspaceStyles.quranVerseWidget].join(" ")}><div className={workspaceStyles.quranVerseHeader}><strong>QUR’AN STUDIO</strong><span lang="ar" dir="rtl">القرآن الكريم</span></div><div className={workspaceStyles.quranParticleField} aria-hidden="true">{Array.from({length:18},(_,i)=><span key={i} style={{["--p-x" as string]:((i*37+13)%97)+"%",["--p-y" as string]:((i*53+7)%91)+"%",["--p-delay" as string]:"-"+((i*7)%19)+"s",["--p-duration" as string]:(12+(i*3)%14)+"s",["--p-size" as string]:(2+i%3)+"px"}}/>)}</div>{quranParticleBurstVisible&&<div key={quranParticleBurst} className={workspaceStyles.quranParticleBurst} aria-hidden="true">{Array.from({length:52},(_,i)=><span key={i} style={{["--burst-x" as string]:((i*67+19)%100)+"%",["--burst-y" as string]:((i*43+11)%100)+"%",["--burst-dx" as string]:(((i*29)%160)-80)+"px",["--burst-dy" as string]:(-40-(i*17)%160)+"px",["--burst-delay" as string]:((i*7)%30)*.025+"s"}}/>)}</div>}<div className={workspaceStyles.quranVerseArticle} aria-live="polite">{quranPreview?<> <div className="quranLanguageToggle" role="group" aria-label="Quran verse language order"><span className={!quranEnglishFirst?"active":""}>عربي</span><button type="button" role="switch" aria-checked={quranEnglishFirst} aria-label="Show English first" onClick={()=>setQuranEnglishFirst(v=>!v)}><span className="quranLanguageKnob"/></button><span className={quranEnglishFirst?"active":""}>ENG</span></div><div className="quranHomeControlRow"><div className="quranControlCell"><button type="button" className={workspaceStyles.quranHudHudPositionToggle} onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:quran-previous-verse"))} aria-label="Go back one Quran verse" title="Previous verse"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button></div><div className="quranControlCell"><button type="button" className={workspaceStyles.quranInlinePlay} disabled={quranAudioLoading} onClick={()=>void playQuranAudio()} aria-label={quranAudioPlaying?"Pause Quran recitation":"Play Quran recitation"} title={quranAudioPlaying?"Pause recitation":"Play recitation"}>{quranAudioLoading?<span className={workspaceStyles.quranInlineSpinner} aria-hidden="true"/>:<span aria-hidden="true">{quranAudioPlaying?"Ⅱ":"▶"}</span>}</button></div><div className="quranHomeSelectors"><details key={"chapter-"+quranPreview.chapter}><summary>Surah {quranPreview.chapter} ⌄</summary><div className="quranHomeOptions">{Array.from({length:114},(_,i)=>i+1).map(n=><button type="button" key={n} onClick={e=>{quranContinuous.current=false;quranAutoPlayNext.current=false;quranAudioRef.current?.pause();void loadQuranVerse(n,1,true);e.currentTarget.closest("details")?.removeAttribute("open")}}>Surah {n}</button>)}</div></details><details key={"ayah-"+quranPreview.chapter+"-"+quranPreview.verse}><summary>Ayah {quranPreview.verse} ⌄</summary><div className="quranHomeOptions">{Array.from({length:[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6][quranPreview.chapter-1]},(_,i)=>i+1).map(n=><button type="button" key={n} onClick={e=>{quranContinuous.current=false;quranAutoPlayNext.current=false;quranAudioRef.current?.pause();void loadQuranVerse(quranPreview.chapter,n,true);e.currentTarget.closest("details")?.removeAttribute("open")}}>Ayah {n}</button>)}</div></details></div></div><style>{`.quranHomeControlRow{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;width:100%!important;max-width:520px!important;margin:0 auto 12px!important;align-items:center!important}.quranControlCell{display:flex;align-items:center;justify-content:center;min-width:0}.quranControlCell>button{position:relative!important;inset:auto!important;transform:none!important;margin:0!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;padding:0!important}.quranHomeControlRow>.quranHomeSelectors{display:contents!important}.quranHomeControlRow>.quranHomeSelectors>details{min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important}.quranHomeControlRow>.quranHomeSelectors>details>summary{width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:9px 2px!important;font-size:clamp(10px,2.7vw,13px)!important;min-height:42px!important;white-space:nowrap!important;text-align:center!important;overflow:hidden!important;text-overflow:ellipsis!important}.quranHomeControlRow>.quranHomeSelectors>details:first-child{grid-column:3!important}.quranHomeControlRow>.quranHomeSelectors>details:last-child{grid-column:4!important}`}</style><style>{`.quranHomeSelectors{display:contents}.quranHomeControlRow .quranHomeSelectors details{min-width:0!important;max-width:none!important;width:100%;position:relative}.quranHomeControlRow .quranHomeSelectors details:first-child{grid-column:3}.quranHomeControlRow .quranHomeSelectors details:last-child{grid-column:4}.quranHomeControlRow .quranHomeSelectors summary{box-sizing:border-box;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;padding:11px 3px!important;font-size:clamp(11px,2.7vw,14px)!important;min-height:44px}.quranHomeControlRow .quranHomeOptions{min-width:100%;width:max-content;max-width:180px}@media(max-width:360px){.quranHomeControlRow{grid-template-columns:40px 40px minmax(0,1fr) minmax(0,1fr);gap:4px}.quranHomeControlRow>.quranHudHudPositionToggle,.quranHomePlayTop button{width:40px!important;height:44px!important;min-width:40px!important}}.quranHomeSelectors details{position:relative;min-width:105px;max-width:45%}.quranHomeSelectors summary{cursor:pointer;list-style:none;min-height:44px;padding:11px 15px;border-radius:22px;background:#10382c88;border:1px solid #dbbc7988;color:#f5e3b6;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-size:14px}.quranHomeSelectors summary::-webkit-details-marker{display:none}.quranHomeOptions{position:absolute;top:calc(100% + 4px);left:0;min-width:125px;max-height:240px;overflow-y:auto;border:1px solid #d6b97899;border-radius:14px;background:#0a302be8;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:5px;box-shadow:0 12px 30px #0007;animation:quranHomeReveal .2s ease-out}.quranHomeOptions button{display:block;width:100%;min-height:44px;background:transparent;border:0;color:#fff;text-align:left;border-radius:8px;padding:9px;font-size:14px}.quranHomeOptions button:hover,.quranHomeOptions button:focus-visible{background:#c8a96755}@keyframes quranHomeReveal{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.quranHomeOptions{animation:none}}`}</style><div key={quranEnglishFirst?"english-first":"arabic-first"} className="quranLanguageContent">{quranEnglishFirst?<><p className={workspaceStyles.quranVerseTranslation} style={{fontSize:quranPreview.translation.length<150?"clamp(17px,4vw,25px)":"clamp(15px,3.3vw,21px)",lineHeight:1.75,maxWidth:"100%",textWrap:"pretty"}}>{quranPreview.translation}</p><p lang="ar" dir="rtl" className={workspaceStyles.quranVerseArabic} style={{fontSize:quranPreview.arabic.length<65?"clamp(40px,9vw,76px)":quranPreview.arabic.length<160?"clamp(34px,7.5vw,60px)":"clamp(27px,5.8vw,46px)",lineHeight:quranPreview.arabic.length<65?1.9:1.85,maxWidth:"100%",textWrap:"pretty"}}>{quranPreview.arabic}</p></>:<><p lang="ar" dir="rtl" className={workspaceStyles.quranVerseArabic} style={{fontSize:quranPreview.arabic.length<65?"clamp(40px,9vw,76px)":quranPreview.arabic.length<160?"clamp(34px,7.5vw,60px)":"clamp(27px,5.8vw,46px)",lineHeight:quranPreview.arabic.length<65?1.9:1.85,maxWidth:"100%",textWrap:"pretty"}}>{quranPreview.arabic}</p><p className={workspaceStyles.quranVerseTranslation} style={{fontSize:quranPreview.translation.length<150?"clamp(17px,4vw,25px)":"clamp(15px,3.3vw,21px)",lineHeight:1.75,maxWidth:"100%",textWrap:"pretty"}}>{quranPreview.translation}</p></>}</div></>:<p className={workspaceStyles.quranVerseLoading}>Your reading journey awaits · Open the studio to begin.</p>}</div><audio ref={quranAudioRef} preload="none" src={quranPreview?"https://cdn.islamic.network/quran/audio/128/ar.alafasy/"+quranPreview.globalAyah+".mp3":undefined} onEnded={()=>{quranAudioFinished.current=true;setQuranAudioPlaying(false);if(quranContinuous.current)window.dispatchEvent(new CustomEvent("1muslim:quran-next-verse",{detail:{source:"audio-ended"}}))}} onPause={()=>setQuranAudioPlaying(false)} onPlay={()=>setQuranAudioPlaying(true)}/></div>:w.name==="Post"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas,workspaceStyles.postStudioCard].join(" ")}><div className={workspaceStyles.postStudioHeader}><strong>✦ POST STUDIO</strong><span lang="ar" dir="rtl">منشور اليوم</span></div><div className={workspaceStyles.postStudioBody}><PostDesignStudio/></div><Link className={workspaceStyles.postStudioFeedLink} href="/community">Explore Ummah posts ↗</Link></div>:editWidgets?<div className={styles.widgetEditControls}><button type="button" aria-label={"Move "+w.name+"; use arrow keys to rearrange"} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowUp"||e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();keyboardMove(w.name,e.key==="ArrowLeft"||e.key==="ArrowUp"?-1:1)}}} onPointerDown={e=>{e.stopPropagation();magneticOrigin.current=widgetLayout;setMagneticZone(w.name);setDragged(w.name);activeDrag.current={pointerId:e.pointerId,name:w.name};const el=e.currentTarget.closest("[data-widget]") as HTMLElement|null;if(el)liftMagnetic(el,e.clientX,e.clientY);e.currentTarget.closest("[data-widget]")?.setPointerCapture(e.pointerId)}} onPointerUp={e=>{e.stopPropagation();finishMagnetic(e.clientX,e.clientY)}}>⠿</button><button type="button" onClick={()=>item.size==="featured"?changeSize(w.name):featureWidget(w.name)} aria-label={"Change "+w.name+" widget mode: Small, Standard, Preview"}>{item.size==="compact"?"▣ Small":item.size==="standard"?"▤ Standard":"▥ Preview"}</button><button type="button" aria-label={"Remove "+w.name+" from dashboard"} onClick={()=>toggleWidget(w.name)}>−</button></div>:null}{!editWidgets&&["Qur’an","Videos","Messages","Post","Elm Tent"].includes(w.name)?null:w.name==="Islam Trivia"&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas].join(" ")} style={{overflow:"hidden",padding:0}}><IslamTriviaWidget/></div>:w.name==="Dhikr"&&(item.size==="studio"||item.size==="immersive")&&!editWidgets?<div className={[styles.widget,styles[w.cls],styles.widgetCanvas].join(" ")} style={{overflow:"hidden"}}><DhikrBigWidget openStudio={()=>setDhikrOpen(true)}/></div>:<Link href={editWidgets?"#":w.name==="Dhikr"?"#":w.name==="Qur’an"?"/elm-tent/quran?verse="+encodeURIComponent(quranResume):w.href} onClick={e=>{if(w.name==="Qur’an"&&!editWidgets){e.preventDefault();setQuranExpanding(true);try{sessionStorage.setItem("1muslim:quran-enter","1")}catch{};const target="/elm-tent/quran?verse="+encodeURIComponent(quranResume);window.setTimeout(()=>router.push(target),window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:540);return;}if(editWidgets||w.name==="Dhikr"||w.name==="1Muslim Shop"||w.name==="Quick Post"){e.preventDefault();if(!editWidgets&&w.name==="Dhikr")setDhikrOpen(true);if(!editWidgets&&w.name==="1Muslim Shop")teaseShop();if(!editWidgets&&w.name==="Quick Post")openQuick()}}} data-widget={w.name} className={[styles.widget,styles[w.cls],styles.widgetCanvas,w.name==="Qur’an"?styles.quranWindow:"",editWidgets?styles.widgetEditing:""].join(" ")}><span className={styles.widgetCrown}><strong>{homeSignedIn===false&&w.name==="Live"?<span key={guestTitleTick} className={[styles.guestWidgetTitle,guestTitleZoom?styles.guestWidgetTitleZoom:""].join(" ")}>{guestTitles[guestTitleIndex]}</span>:w.name}</strong><small lang="ar" dir="rtl" className={styles.widgetArabicGold}>{w.arabic}</small></span><span className={styles.widgetTop}><span className={styles.widgetVisual}>{w.name==="Live"&&item.size!=="compact"?<span className="homeLivePlayerPlaceholder" aria-hidden="true"/> :w.name==="Ummah"&&ummahSlides.length?<span className={styles.ummahSlide} key={ummahSlides[slideIndex%ummahSlides.length].id}><span className={styles.ummahQuote}>❝</span><span>{ummahSlides[slideIndex%ummahSlides.length].body}</span><small>UMMAH · DAILY POSTS</small></span>:w.image?<Image src={cleanArtwork[w.name]||w.image} alt="" width={160} height={160} unoptimized className={styles.widgetArtwork} />:<span className={styles.widgetNewSymbol}>{w.symbol}</span>}</span><span className={styles.widgetArabic}>{w.arabic}</span></span>{item.size!=="compact"&&<span className={styles.widgetSmartPreview}>{w.name==="Qur’an"?(<span className={workspaceStyles.quranStudioPreview}><span className={workspaceStyles.quranStudioEyebrow}>✦ QUR’AN STUDIO · READING DESK</span><span className={workspaceStyles.quranStudioMeta}><span>SURAH <b>{quranPreview?.chapter||1}</b></span><span>AYAH <b>{quranPreview?.verse||1}</b></span><span>STUDY <b>۞</b></span></span><b className={workspaceStyles.quranStudioArabic} lang="ar" dir="rtl">{quranPreview?.arabic||"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}</b><span className={workspaceStyles.quranStudioTranslation}>{quranPreview?.translation||"In the name of Allah, the Entirely Merciful, the Especially Merciful."}</span><span className={workspaceStyles.quranStudioEnter}>۞ ENTER STUDIO <span aria-hidden="true">↗</span></span></span>):w.name==="Messages"?(inbox.length?<>{inbox.slice(0,item.size==="featured"?3:item.size==="expanded"?2:1).map(m=><span key={m.id} className={styles.smartRow}>✉ {m.content||"New message"}</span>)}<em>Open inbox →</em></>:<span className={styles.widgetQuietHint}>Tap card to open messages</span>):w.name==="Calls"?(callHistory.length?<><span>☎ {callHistory.length} recent calls</span><em>Call history →</em></>:<em>☎ Start a voice or video call →</em>):w.name==="Lessons"?(lessonPreview.length?<><b>{lessonPreview[0].title}</b>{(item.size==="featured"||item.size==="expanded")&&lessonPreview.slice(1).map(v=><span key={v.id} className={styles.smartRow}>✦ {v.title}</span>)}<em>Continue learning →</em></>:<em>✦ Explore lessons →</em>):w.name==="Dhikr"?<><span>📿 Your daily remembrance</span><em>Tap to count · Create your own duʿā →</em></>:w.name==="Prayer Times"?<em>☪ Prayer schedule →</em>:w.name==="XP & Progress"?<em>✧ View your journey →</em>:w.name==="Notifications"?<><em>✦ {notificationContext}</em><small>Connected to {featuredName}</small></>:w.name==="People"?<><span>✧ Find your Ashab</span>{(item.size==="featured"||item.size==="expanded")&&<small>Discover profiles · badges · connections</small>}<em>Discover people →</em></>:w.name==="Videos"?<><span>▶ Explore community videos</span>{(item.size==="featured"||item.size==="expanded")&&<small>Watch · react · continue watching</small>}<em>Watch now →</em></>:w.name==="Ummah"?<em>{item.size==="featured"?"Read · like · comment on today's posts →":"View daily posts →"}</em>:w.name==="Live"&&livePreviews.length?<em>◉ Watch live now →</em>:null}</span>}<span className={styles.widgetDetails}><span className={styles.widgetHeading}><strong className={styles.widgetName}>{homeSignedIn===false&&w.name==="Live"?<span key={"detail-"+guestTitleTick} className={styles.guestWidgetTitle}>{guestTitles[guestTitleIndex]}</span>:w.name}</strong>{(item.size==="featured"||item.size==="expanded")&&<span className={styles.widgetPill}>{w.name==="Live"?(livePreviews.length?"● LIVE":"◌ OFFLINE"):w.name==="Qur’an"?"READ":w.name==="Messages"?"INBOX":"EXPLORE"}</span>}</span>{w.name!=="Live"&&<small className={styles.widgetMetric}>{metric}</small>}</span>{(item.size==="featured"||item.size==="expanded")&&<span className={styles.widgetFeatureDetail}>{w.name==="Live"?(livePreviews.length?"Watch live broadcasts · Join the conversation":"No streams right now · Start a live") :w.name==="Qur’an"?"Your journey through the Qur’an":w.name==="Messages"?"Stay connected with your Ashab":w.name==="People"?"Build your community":"Explore your 1Muslim experience"} ↗</span>}</Link>}</div>})}</div>}{page===0&&<div className="oneMuslimLiveStage" data-live-format={liveFormat} data-live-stage-version="games-controls-unblocked-v4" data-live-mount-proof="rendered" style={{position:"absolute",inset:0,zIndex:2147483000,display:"grid",gridTemplateRows:(liveFormat==="games"||liveFormat==="qibla")?"minmax(0,1fr)":"minmax(0,1fr) minmax(108px,26%)",width:"100%",height:"100%",minHeight:0,overflow:"hidden",padding:8,boxSizing:"border-box",isolation:"isolate",visibility:"visible",opacity:1,pointerEvents:"auto"}} aria-label="1Muslim Live player and conversation">
 <div className="oneMuslimLiveTop" style={{minHeight:0,display:"flex",flexDirection:"column",gap:8}}>
 <nav aria-label="Live format" style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:5,flexShrink:0}}>{(["desktop","phone","audio","games","qibla"] as HomeLiveFormat[]).map(format=><button key={format} type="button" aria-pressed={liveFormat===format} onClick={()=>{setLiveFormat(format)}} style={{border:"1px solid rgba(220,190,105,.38)",borderRadius:12,padding:"10px 2px",minHeight:44,color:"#f7edcf",background:liveFormat===format?"rgba(18,111,78,.82)":"rgba(5,25,22,.52)",fontSize:12,cursor:"pointer"}}>{format==="desktop"?"🖥️ Desktop":format==="phone"?"📱 Phone":format==="audio"?"🎙️ Audio" :format==="games"?"🎮 Games":"📰 Qibla"}</button>)}</nav>
 <div className="oneMuslimLiveVideo" style={{minHeight:0,flex:1,display:"grid",placeItems:"center",alignContent:"start",overflow:"hidden"}} aria-label={liveFormat==="games"?"Cosmic Catch game":liveFormat+" live player"}>
 {liveFormat==="qibla"?<section aria-label="The Qibla newsletter" style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:20,color:"#f6e6c6"}}><span style={{fontSize:42}}>📰</span><h2 style={{margin:0}}>The Qibla</h2><p style={{margin:0,maxWidth:320}}>Your 1Muslim community newsletter. Stories, reflections, and updates.</p><p style={{fontSize:12,opacity:.8}}>Newsletter editions coming soon.</p></section>:liveFormat==="games"?<CosmicCatchGame/>:liveFormat==="audio"&&livePreviews.length?<HomeAudioLivePlayer key={activeLive.id} roomName={activeLive.room_name||activeLive.id} hostId={activeLive.host_id}/>:livePreviews.length?<div style={{width:"100%",maxWidth:liveFormat==="phone"?"420px":"1400px",maxHeight:"100%",height:liveFormat==="phone"?"100%":"auto",aspectRatio:liveFormat==="phone"?"9 / 16":"16 / 9",alignSelf:"start",justifySelf:"center",clipPath:liveFormat==="phone"?"inset(0 round 22px)":"inset(0 round 14px)",position:"relative",overflow:"hidden",borderRadius:liveFormat==="phone"?22:14,boxShadow:liveFormat==="phone"?"0 16px 40px rgba(0,0,0,.28)":"0 8px 24px rgba(0,0,0,.16)",transition:"max-width 480ms cubic-bezier(.22,1,.36,1), border-radius 480ms ease, box-shadow 480ms ease",willChange:"max-width"}}><LiveHomePreview key={activeLive.id} roomName={activeLive.room_name||activeLive.id}/><a href={`/streaming/live/${activeLive.id}`} style={{position:"absolute",right:12,bottom:12,color:"white",background:"rgba(0,0,0,.7)",padding:8,borderRadius:8}}>Open live ↗</a></div>:<div role="status" style={{textAlign:"center",color:"#f2e4b9",padding:24}}><div style={{fontSize:42}}>{liveFormat==="audio"?"🎙️":liveFormat==="phone"?"📱":"🖥️"}</div><p>{liveFormat==="audio"?"No audio-only streams available":`No ${liveFormat} broadcasts live right now`}</p><a href="/streaming/go-live" style={{color:"#e8ce83"}}>Start a Live ↗</a></div>}
 </div>{livePreviews.length>1&&liveFormat!=="games"&&liveFormat!=="qibla"&&<div style={{display:"flex",justifyContent:"space-between"}}><button type="button" onClick={()=>setLiveCarouselIndex(i=>(i-1+livePreviews.length)%livePreviews.length)}>← Previous</button><button type="button" onClick={()=>setLiveCarouselIndex(i=>(i+1)%livePreviews.length)}>Next →</button></div>}
 </div>
 {liveFormat!=="games"&&liveFormat!=="qibla"&&<div className="oneMuslimLiveBottom" style={{minHeight:0,overflow:"auto"}}>{livePreviews.length>0&&activeLive?.host_id&&<details className="homeLiveGuestRequest" style={{position:"relative",zIndex:25,margin:"4px 8px",color:"#fff"}}>
  <summary style={{cursor:"pointer",listStyle:"none",padding:"8px 12px",borderRadius:14,background:"rgba(8,53,40,.85)",border:"1px solid rgba(205,231,191,.45)",fontSize:12,fontWeight:800}}>🎙️ Request to Join Live</summary>
  <div style={{maxHeight:"50dvh",overflowY:"auto",borderRadius:14,background:"#061b15",padding:6,marginTop:5}}>
    <LiveGuestStudio streamId={activeLive.id} roomName={activeLive.room_name||`1muslim-live-${activeLive.id}`} hostId={activeLive.host_id}/>
  </div>
</details>}<HomeLiveConversation live={livePreviews.length>0} streamId={activeLive?.id} onFormatChange={setLiveFormat}/></div>}
 </div>}</div></div></section>)}</div>{hudHudPanel&&canvasRow===1&&workspacePage===0&&navCollapsed&&!canvasFullscreen&&<div role="dialog" aria-modal="true" aria-label={hudHudPanel==="admin"?"HudHud Admin":"Extra workspace"} style={{position:"fixed",inset:0,zIndex:2147483001,background:"rgba(3,17,17,.96)",backdropFilter:"blur(18px)",border:"1px solid rgba(208,177,99,.38)",borderRadius:22,display:"flex",flexDirection:"column",padding:18,color:"#f4e9d1"}}><button type="button" onClick={()=>setHudHudPanel(null)} aria-label="Close panel" style={{alignSelf:"flex-end",background:"transparent",color:"#e7c979",border:"1px solid #e7c97966",borderRadius:14,padding:"7px 12px"}}>✕ Close</button>{<><h2 style={{textAlign:"center",color:"#e7c979",margin:"6px 0"}}>✦ HudHud Admin</h2><p aria-live="polite" style={{textAlign:"center",opacity:hudHudWelcome?1:0,transition:"opacity 1s ease",minHeight:25}}>Welcome Admin {homeNames?.english||"Admin"}</p><div style={{flex:1}}/><form onSubmit={e=>e.preventDefault()} style={{display:"flex",gap:8}}><input aria-label="Message HudHud" placeholder="Message HudHud…" value={hudHudDraft} onChange={e=>setHudHudDraft(e.target.value)} style={{flex:1,minWidth:0,borderRadius:16,padding:13,background:"#103c35",border:"1px solid #d7b96966",color:"white"}}/><button type="submit" disabled title="Chat connection not yet configured" style={{borderRadius:14,padding:"10px 15px",background:"#d7b969",color:"#163229",opacity:.5}}>Send</button></form><small style={{textAlign:"center",opacity:.65,marginTop:8}}>HudHud chat connection coming soon</small></>}</div>}</div>{typeof document!=="undefined"&&createPortal(<div className="canvas-language-globe" style={globePosition?{left:globePosition.left,top:globePosition.top}:undefined} onPointerDown={e=>{if((e.target as HTMLElement).closest(".canvas-language-menu"))return;const r=e.currentTarget.getBoundingClientRect();globeDrag.current={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={moveGlobe} onPointerUp={stopGlobe} onPointerCancel={()=>{globeDrag.current=null}}><button type="button" className="canvas-language-globe-button" aria-label="Language settings; drag to move" aria-expanded={globeOpen} onClick={()=>{if(globeMoved.current){globeMoved.current=false;return}setGlobeOpen(v=>!v)}}>🌐</button>{globeOpen&&<div className="canvas-language-menu"><strong>Language · اللغة</strong>{[{code:"en",name:"English"},{code:"ar",name:"العربية"},{code:"so",name:"Soomaali"}].map(l=><button type="button" key={l.code} aria-pressed={globeLanguage===l.code} onClick={()=>{setGlobeLanguage(l.code);localStorage.setItem("1muslim-language",l.code);document.documentElement.lang=l.code;setGlobeOpen(false)}}>{l.name}{globeLanguage===l.code?" ✓":""}</button>)}<small>Language preference saved. Full translations are not yet available.</small></div>}</div>,document.body)}</div>}</section>{dhikrOpen&&<div className={styles.dhikrOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDhikrOpen(false)}}><section role="dialog" aria-modal="true" aria-label="Dhikr Studio" className={styles.dhikrModal}><div className={styles.dhikrModalHeader}><span>✦ 1MUSLIM · DHIKR STUDIO</span><button type="button" onClick={()=>setDhikrOpen(false)} aria-label="Close Dhikr Studio">✕</button></div><div className={styles.dhikrModalBody}><DhikrStudio/></div></section></div>}{quickOpen&&<div className={styles.quickBackdrop} onPointerDown={e=>{if(e.target===e.currentTarget)setQuickOpen(false)}}><section className={styles.quickSheet} role="dialog" aria-modal="true" aria-label="Quick Post"><header><strong>✎ Quick Post</strong><span>{quickStep+1} / 3</span><button type="button" onClick={()=>setQuickOpen(false)} aria-label="Close">✕</button></header>{quickStep===0?<><small>WHAT WOULD YOU LIKE TO DO?</small><div className={styles.quickChoices}>{(["post","live","message"] as const).map(t=><button type="button" key={t} className={quickType===t?styles.quickChosen:""} onClick={()=>setQuickType(t)}>{t==="post"?"✎ Post":t==="live"?"◉ Live":"✉ Message"}</button>)}</div></>:quickStep===1?<><small>CHOOSE YOUR FORMAT</small><div className={styles.quickChoices}>{(["text","image","video","camera","file"] as const).map(f=><button type="button" key={f} className={quickFormat===f?styles.quickChosen:""} onClick={()=>setQuickFormat(f)}>{f==="text"?"✎ Text":f==="image"?"▧ Image":f==="video"?"▶ Video":f==="camera"?"◎ Camera on":"▤ File"}</button>)}</div><p className={styles.quickHint}>{quickType==="post"&&quickFormat!=="text"?"Media opens the Ummah composer to finish safely.":quickType==="live"?"Live opens the camera studio.":quickType==="message"?"Messages opens your conversations.":""}</p></>:<><small>READY TO GO?</small>{quickType==="post"&&quickFormat==="text"?<textarea autoFocus placeholder="What would you like to share with the Ummah?" value={quickText} onChange={e=>setQuickText(e.target.value)} maxLength={5000}/>:<p className={styles.quickHint}>Continue to {quickType==="live"?"Go Live":quickType==="message"?"Messenger":"Ummah"} to finish your {quickFormat} {quickType}.</p>}</>}{quickError&&<p role="alert" className={styles.quickError}>{quickError}</p>}<footer><button type="button" onClick={()=>quickStep?setQuickStep(n=>n-1):setQuickOpen(false)}>← Back</button><button type="button" disabled={quickBusy} onClick={()=>quickStep<2?setQuickStep(n=>n+1):void quickGo()}>{quickBusy?"Publishing…":quickStep<2?"Next →":"Go ✓"}</button></footer></section></div>}{shopTease&&<div className={styles.shopTease} role="status" aria-live="polite"><span className={styles.shopTeaseNo}>No 😄</span><strong>1Muslim Shop</strong><small>Coming soon ✨</small></div>}{galleryOpen&&<div className={styles.galleryBackdrop} onPointerDown={e=>{if(e.target===e.currentTarget)setGalleryOpen(false)}}><section className={styles.gallerySheet} role="dialog" aria-modal="true" aria-label="Widget gallery"><div className={styles.galleryHandle}/><div className={styles.galleryHead}><div><small>PERSONALIZE YOUR HOME</small><h2>{replacementPending?"Choose your replacement":"Your Widget Store"}</h2><p>{replacementPending?"Your space is ready · select a glowing + Add card.":"Choose your canvases, turn them on or off, and reorder them here."}</p></div><button type="button" onClick={()=>setGalleryOpen(false)} aria-label="Close widget store">← Back to canvases</button></div><div className={styles.galleryActions}><span>{spaces.length-hiddenWidgets.length} active · choose compact or preview</span><button type="button" onClick={optimizeWidgets}>✧ Optimize sizes</button></div>{widgetLimitNotice&&<p role="status" style={{fontSize:11,color:"#e6c98b",padding:"4px 10px"}}>{widgetLimitNotice}</p>}<div className={styles.galleryItems}>{spaces.map(w=><article key={w.name} className={[styles.galleryItem,replacementPending&&hiddenWidgets.includes(w.name)?styles.galleryCandidate:""].join(" ")}><span className={styles.galleryIcon}>{w.image?<Image src={w.image} alt="" width={34} height={34} unoptimized/>:w.symbol}</span><div><strong>{w.name}</strong><small>{w.arabic} · {w.name==="Qur’an"?"Read & listen":w.name==="Messages"?"Your conversations":w.name==="Live"?"Watch live":w.name==="Videos"?"Watch videos":w.name==="Ummah"?"Daily community":w.name==="Calls"?"Voice & video":w.name==="Lessons"?"Learn":w.name==="Islam Trivia"?"Test your knowledge":w.name==="Prayer Times"?"Prayer schedule":w.name==="Dhikr"?"Daily remembrance":w.name==="XP & Progress"?"Your achievements":w.name==="Notifications"?"Activity updates":w.name==="1Muslim Shop"?"Coming soon":w.name==="Quick Post"?"Post · Live · Message":"Discover members"}</small></div><button type="button" aria-label={(hiddenWidgets.includes(w.name)?"Turn on ":"Turn off ")+w.name} aria-pressed={!hiddenWidgets.includes(w.name)} className={hiddenWidgets.includes(w.name)?styles.galleryAdd:styles.galleryAdded} onClick={()=>w.name==="1Muslim Shop"?teaseShop():toggleWidget(w.name)}>{w.name==="1Muslim Shop"?"Soon ✦":hiddenWidgets.includes(w.name)?"○ Off":"● On"}</button><button type="button" aria-label={"Move "+w.name+" earlier"} disabled={widgetLayout.findIndex(x=>x.name===w.name)<=0} onClick={()=>keyboardMove(w.name,-1)}>↑</button><button type="button" aria-label={"Move "+w.name+" later"} disabled={widgetLayout.findIndex(x=>x.name===w.name)>=widgetLayout.length-1} onClick={()=>keyboardMove(w.name,1)}>↓</button><button type="button" className={styles.galleryPreviewButton} onClick={()=>previewWidget(w.name)} disabled={w.name==="1Muslim Shop"} aria-label={"Show "+w.name+" in large preview on second pane"}>↗ Preview</button></article>)}</div><div className={styles.galleryFooter}><button type="button" onClick={()=>{setGalleryOpen(false);setEditWidgets(true)}}>Advanced layout</button><button type="button" onClick={()=>setGalleryOpen(false)}>Done ✓</button></div></section></div>}{shahadaOverlay&&<SeamlessEntry onClose={closeEntry}/>}<style jsx global>{`main[data-widget-motion]{isolation:isolate}main[data-widget-motion]>.risingEnergyField{position:fixed!important;inset:0!important;z-index:0!important}main[data-widget-motion]>.risingEnergyField~*{position:relative}main[data-widget-motion] .risingEnergyField{pointer-events:none}`}</style><style>{`.canvas-edge-chevron-nav{position:fixed;inset:0;z-index:2147481900;pointer-events:none}.canvas-edge-chevron{position:absolute;pointer-events:auto;display:grid;place-items:center;width:56px;height:42px;border:1px solid rgba(223,246,230,.25);border-radius:28px;background:rgba(7,42,39,.24);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:rgba(244,255,249,.8);font-size:30px;line-height:1;box-shadow:0 4px 18px rgba(0,0,0,.12);transition:background .25s,opacity .25s}.canvas-edge-chevron:active{background:rgba(25,112,86,.65)}.canvas-edge-chevron-down{bottom:calc(22px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%)}.canvas-edge-chevron[aria-hidden="true"]{opacity:0;pointer-events:none}@media(prefers-reduced-motion:reduce){.canvas-edge-chevron{transition:none}}`}</style></main>;
}
