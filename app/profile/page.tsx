"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import ProfileAvatar, { ACCESSORIES, AVATAR_TIERS, tierForXp } from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";
import ProfileContentSections from "../components/ProfileContentSections";
import FeaturedBadge from "../components/FeaturedBadge";
import PublicBadgeSelector from "../components/PublicBadgeSelector";
import HudHudTenFriends from "../components/HudHudTenFriends";

type Profile = {
  id: string; display_name: string; username: string | null; first_name: string | null; last_name: string | null;
  city: string | null; state: string | null; country: string | null; gender: string | null; bio: string | null;
  xp_total: number; avatar_gender: string; avatar_package: string; avatar_config: Record<string, unknown>;
  profile_background: string; profile_accent: string; community: string | null;
  display_name_changed_at: string | null; username_changed_at: string | null; shahada_verified_at: string | null; shahada_audio_path: string | null; shahada_language: "ar" | "en" | null;
};

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function cooldownRemaining(changedAt: string | null) {
  if (!changedAt) return null;
  const remaining = new Date(changedAt).getTime() + THREE_DAYS - Date.now();
  if (remaining <= 0) return null;
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h remaining` : `${hours}h remaining`;
}

const AVATAR_CHOICES=[
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
const BACKGROUND_CHOICES=[
  {id:"emerald-night",accent:"emerald",label:"Emerald Night"},
  {id:"gold-dusk",accent:"gold",label:"Gold Dusk"},
  {id:"water-blue",accent:"blue",label:"Water Blue"},
  {id:"violet-sky",accent:"violet",label:"Violet Sky"},
  {id:"rose-garden",accent:"rose",label:"Rose Garden"},
  {id:"slate-stone",accent:"slate",label:"Slate Stone"}
] as const;




function ProfileOrbitStudio({profile,onEdit,ashab,editing=false,editorTab="profile"}:{profile:Profile;onEdit:()=>void;ashab:Profile[];editing?:boolean;editorTab?:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const [profileNight,setProfileNight]=useState(true);
 useEffect(()=>{try{setProfileNight(localStorage.getItem("1muslim-profile-appearance")!=="day")}catch{}},[]);
 const changeProfileMode=(night:boolean)=>{setProfileNight(night);try{localStorage.setItem("1muslim-profile-appearance",night?"night":"day")}catch{}};
 const velocity=useRef([0.0013,-0.0011,-0.0008,0.00062]);
 const savePulse=useRef(0);
 const angle=useRef([0,0,0,0]);
 const drag=useRef<{x:number;y:number;t:number}|null>(null);
 const [aiOpen,setAiOpen]=useState(false);
 const [aiEnabled,setAiEnabled]=useState(false);
 const [friendQuery,setFriendQuery]=useState("");
 const [selectedFriend,setSelectedFriend]=useState<Profile|null>(null);
 const [switching,setSwitching]=useState(false);
 const [switchDirection,setSwitchDirection]=useState<"next"|"back">("next");
 const switchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const viewFriend=(friend:Profile|null)=>{setSwitchDirection(friend?"next":"back");setSwitching(true);if(switchTimer.current)clearTimeout(switchTimer.current);switchTimer.current=setTimeout(()=>{setSelectedFriend(friend);setSwitching(false);try{if(friend)sessionStorage.setItem("oneMuslimProfileVisitedFriend",friend.id);else sessionStorage.removeItem("oneMuslimProfileVisitedFriend")}catch{}},450)};
 useEffect(()=>()=>{if(switchTimer.current)clearTimeout(switchTimer.current)},[]);
 useEffect(()=>{try{const id=sessionStorage.getItem("oneMuslimProfileVisitedFriend");const match=ashab.find(p=>p.id===id);if(match)setSelectedFriend(match)}catch{}},[ashab]);
 const [section,setSection]=useState<"overview"|"friends"|"analytics">("overview");
 const [aiInput,setAiInput]=useState("");
 const [aiReply,setAiReply]=useState("");
 const [aiBusy,setAiBusy]=useState(false);
 const [aiError,setAiError]=useState("");
 const askHudHud=async()=>{
  if(!aiInput.trim()||aiBusy)return;
  setAiBusy(true);setAiError("");
  try{
   const db=createClient();
   const {data:{session}}=await db.auth.getSession();
   if(!session)throw new Error("Sign in to use HudHud AI.");
   const response=await fetch("/api/hudhud-premium",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({message:aiInput.trim()})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"HudHud AI is unavailable.");
   setAiReply(String(result.reply||""));
  }catch(e){setAiError(e instanceof Error?e.message:"Something went wrong.")}finally{setAiBusy(false)}
 };
 useEffect(()=>{const onSaved=()=>{savePulse.current=performance.now()};window.addEventListener("1muslim:profile-saved",onSaved);return()=>window.removeEventListener("1muslim:profile-saved",onSaved)},[]);
 const [created,setCreated]=useState<string|null>(null);
 const [hours,setHours]=useState<Record<string,number>>({});
 useEffect(()=>{
  let live=true;
  const db=createClient();
  void db.auth.getUser().then(({data})=>{if(live){setCreated(data.user?.created_at||null);setAiEnabled((data.user?.email||"").toLowerCase()==="hudhudbyelmi@gmail.com")}});
  return()=>{live=false};
 },[]);
 useEffect(()=>{
  const key="oneMuslimProfilePageTimeV1";
  const read=():Record<string,number>=>{try{return JSON.parse(localStorage.getItem(key)||"{}") as Record<string,number>}catch{return {}}};
  let previous=Date.now();
  const tick=()=>{
   const now=Date.now(),elapsed=Math.min(60000,now-previous);previous=now;
   if(document.visibilityState!=="visible")return;
   const pathname=window.location.pathname;
   const page=pathname.startsWith("/deepwatch")?"DeepWatch":pathname.startsWith("/quran")?"Qur'an":pathname.startsWith("/qibla")?"Qibla":pathname.startsWith("/profile")?"Profile":pathname==="/"?"Home":"Other";
   const data=read();data[page]=(data[page]||0)+elapsed;
   try{localStorage.setItem(key,JSON.stringify(data))}catch{}
   setHours(data);
  };
  setHours(read());
  const interval=window.setInterval(tick,15000);
  const visibility=()=>{previous=Date.now()};
  document.addEventListener("visibilitychange",visibility);
  return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",visibility)};
 },[]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  const ctx=element.getContext("2d");if(!ctx)return;
  let frame=0,raf=0;
  const render=()=>{
   const width=element.clientWidth,height=element.clientHeight;
   const dpr=Math.min(window.devicePixelRatio||1,2);
   if(element.width!==Math.round(width*dpr)||element.height!==Math.round(height*dpr)){element.width=Math.round(width*dpr);element.height=Math.round(height*dpr)}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   const cx=width/2,cy=height/2,scale=Math.min(width,height);
   const now=performance.now(),reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   const elapsed=(now-savePulse.current)/1000;
   const celebration=elapsed>=0&&elapsed<1.9&&!reduced?Math.sin(Math.PI*elapsed/1.9):0;
   for(let ring=0;ring<4;ring++){
    const count=[300,240,200,260][ring];
    const t=now*.001;
    const thinking=ring===1&&!reduced?Math.sin(t*.43)*.65+Math.sin(t*.19)*.35:0;
    const breathing=ring===1&&!reduced?Math.sin(t*.75)*.012:0;
    const radius=scale*([.285,.355,.414,.475][ring]+breathing+celebration*.012);
    const spin=angle.current[ring];
    const tilt=ring===3&&!reduced?Math.sin(t*.23)*.19:0;
    const ellipse=ring===3?.92:.81;
    for(let i=0;i<count;i++){
     const theta=i*Math.PI*2/count+spin;
     const wobble=Math.sin(theta*3+ring+t*.18)*scale*(ring===3?.004:.011);
     const orbital=theta+(ring===3&&!reduced?Math.sin(t*.17+i*.08)*.025:0);
     const rx=Math.cos(orbital)*(radius+wobble);
     const ry=Math.sin(orbital)*(radius+wobble)*ellipse;
     const x=cx+rx*Math.cos(tilt)-ry*Math.sin(tilt),y=cy+rx*Math.sin(tilt)+ry*Math.cos(tilt);
     const size=(i%23===0?2.2:i%9===0?1.5:.72)*(ring===1?1.05:ring===3?.88:ring===0?1:.85)*(1+celebration*.6);
     ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);
     ctx.fillStyle=["rgba(185,221,248,.85)","rgba(195,177,255,.86)","rgba(236,205,145,.72)","rgba(211,233,252,.78)"][ring];ctx.fill();
    }
    if(!drag.current&&!reduced){
     const base=ring===1?-.00135:velocity.current[ring];
     const motion=ring===1?base+thinking*.0025:ring===3?base*(1+.65*Math.sin(t*.31)):base;
     angle.current[ring]+=motion*(1+celebration*6);
    }
   }
   frame++;raf=requestAnimationFrame(render);
  };
  raf=requestAnimationFrame(render);
  return()=>cancelAnimationFrame(raf);
 },[]);
 const shown=selectedFriend||profile;
 const showAvatar=true;
 const coverUrl=typeof shown.avatar_config?.profileCoverUrl==="string"?shown.avatar_config.profileCoverUrl:null;
 const avatar=typeof shown.avatar_config?.selectedAvatarUrl==="string"?shown.avatar_config.selectedAvatarUrl:shown.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
 return <section className={"profileOrbitMagazine"+(profileNight?" profileOrbitNight":" profileOrbitDay")}>
  <div className="profileCoverBanner" style={coverUrl?{backgroundImage:`url("${coverUrl}")`}:undefined} aria-label="Profile cover photograph"><span className="profileCoverBadge">1M · MEMBER PROFILE</span></div>
  <div className="profileOrbitMasthead"><span>1M / THE MEMBER EDITION</span><span>PROFILE STUDIO · {new Date().getFullYear()}</span></div>
  <div className="profileAppearanceControls" role="group" aria-label="Profile appearance"><span>APPEARANCE</span><button type="button" aria-pressed={profileNight} onClick={()=>changeProfileMode(true)}>☾ Night</button><button type="button" aria-pressed={!profileNight} onClick={()=>changeProfileMode(false)}>☀ Day</button></div>
  <h2>YOUR PROFILE <em>COMMAND CENTER</em></h2>
  <div className={"profileOrbitStage"+(switching?" profileOrbitSwitching "+switchDirection:"")} onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,t:performance.now()};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(!d)return;const delta=e.clientX-d.x;const elapsed=Math.max(8,performance.now()-d.t);const relativeY=(e.clientY-e.currentTarget.getBoundingClientRect().top)/e.currentTarget.clientHeight;const ring=relativeY<.3?0:relativeY<.53?1:relativeY<.74?2:3;angle.current[ring]+=delta*.009;velocity.current[ring]=Math.max(-.045,Math.min(.045,delta/elapsed*.009));drag.current={x:e.clientX,y:e.clientY,t:performance.now()}}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} aria-label="Interactive 1,000 orbs across four rings. Drag to change rotation.">
   <canvas ref={canvas} aria-hidden="true"/>
   <div className={"profileOrbitAvatar"+(!showAvatar?" profileOrbitBird":"")}>{showAvatar?<img key={shown.id+avatar} src={avatar} alt="Your profile avatar"/>:<img src="/assets/hudhud-logo.PNG" alt="HudHud bird companion" />}</div><div className="profileOrbitTransitionVeil" aria-hidden="true">✦</div>
   
   <span className="profileOrbitHint">↔ DRAG TO ROTATE · 1,000 PROFILE ORBS · 4 LIVING RINGS</span>
  </div>
  {!selectedFriend&&!aiEnabled&&}
  {false&&!selectedFriend&&aiOpen&&aiEnabled&&<section className="profileAiPanel" aria-label="HudHud AI"><h3>✦ HudHud AI · Premium</h3><p>Ask about 1Muslim, learning resources, or Qur'an study. Premium access is verified on the server.</p><textarea aria-label="Message HudHud AI" value={aiInput} onChange={e=>setAiInput(e.target.value)} maxLength={1200} placeholder="Ask HudHud…"/><button type="button" disabled={aiBusy||!aiInput.trim()} onClick={()=>void askHudHud()}>{aiBusy?"Thinking…":"Ask HudHud"}</button>{aiError&&<p role="alert">{aiError}</p>}{aiReply&&<div role="status" className="profileAiReply">{aiReply}</div>}</section>}
  <div className="profileOrbitIdentity"><span>1M · MEMBER PROFILE</span><h3>{shown.display_name||"Member"}</h3><p className="profileIdentityHandle">@{shown.username||"member"} <span>·</span> {shown.xp_total.toLocaleString()} XP</p><p className="profileIdentityBio">{shown.bio||"Your story starts here. Add your biography in Profile Settings."}</p>{selectedFriend?<button type="button" onClick={()=>viewFriend(null)}>← Back to my profile</button>:<button type="button" onClick={onEdit}>⚙ Manage profile settings →</button>}</div>
  <nav className="profileStudioNav" aria-label="Profile studio sections">{(["overview","friends","analytics"] as const).map(item=><button type="button" key={item} aria-pressed={section===item} onClick={()=>setSection(item)}>{item==="overview"?"✦ Studio":item==="friends"?"◈ Friends":"▥ Analytics"}</button>)}</nav>
  {section==="friends"&&<section className="profileFriendsStudio"><h3>FRIENDS · {ashab.length}</h3><input aria-label="Search friends" placeholder="Search friends…" value={friendQuery} onChange={e=>setFriendQuery(e.target.value)}/><div>{ashab.filter(p=>[p.display_name,p.username].some(v=>String(v||"").toLowerCase().includes(friendQuery.toLowerCase()))).map(p=><button type="button" key={p.id} onClick={()=>{viewFriend(p);setSection("overview")}}>{p.display_name||p.username||"Member"} <span>View profile →</span></button>)}</div><p>Friend details are shown without private account analytics or editing controls.</p></section>}
  {section==="analytics"&&!selectedFriend&&<section className="profileOrbitAnalytics"><h3>YOUR ACTIVITY <em>IN NUMBERS</em></h3><div className="profileOrbitMetrics"><div><small>ACCOUNT CREATED</small><strong>{created?new Date(created).toLocaleDateString():"Loading…"}</strong></div><div><small>THIS DEVICE · TRACKED TIME</small><strong>{(Object.values(hours).reduce((a,b)=>a+b,0)/3600000).toFixed(2)} hrs</strong></div><div><small>EXPERIENCE</small><strong>{profile.xp_total.toLocaleString()} XP</strong></div></div><h4>Time by page</h4><div className="profileOrbitPageTimes">{["Home","DeepWatch","Qur'an","Qibla","Live","Profile","Other"].map(page=><div key={page}><span>{page}</span><strong>{((hours[page]||0)/3600000).toFixed(2)} h</strong></div>)}</div><p>Activity is measured from this device after tracking begins. Previous sessions and other devices are not included.</p></section>}
  <style jsx>{`.profileAppearanceControls{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:12px 20px}.profileAppearanceControls span{font-size:10px;letter-spacing:.13em;margin-right:auto}.profileAppearanceControls button{border:1px solid currentColor;border-radius:20px;background:transparent;color:inherit;padding:7px 13px;cursor:pointer;opacity:.6}.profileAppearanceControls button[aria-pressed="true"]{opacity:1;background:#58677944}.profileOrbitNight{background:#080b11!important;color:#eef1f7!important;border-color:#29303d!important}.profileOrbitNight .profileOrbitIdentity,.profileOrbitNight .profileFriendsStudio,.profileOrbitNight .profileOrbitAnalytics,.profileOrbitNight .profileAiPanel{background:#111824!important;color:#eef1f7!important;border-color:#303a4c!important}.profileOrbitNight .profileOrbitMetrics>div{background:#1b2533!important;border-color:#303a4c!important;color:#eef1f7!important}.profileOrbitNight .profileOrbitMasthead,.profileOrbitNight .profileOrbitHint,.profileOrbitNight .profileIdentityBio,.profileOrbitNight .profileOrbitAnalytics p{color:#b5c3d6!important}.profileOrbitNight .profileStudioNav button{color:#e7edf7!important}.profileOrbitNight .profileOrbitStage{background:radial-gradient(ellipse at center,#162338 0%,#0a101c 57%,#05080f 100%)!important}.profileIdentityHandle{font-size:14px;letter-spacing:.02em;color:#607180}.profileIdentityHandle span{opacity:.45;margin:0 5px}.profileIdentityBio{max-width:660px;line-height:1.6}.profileOrbitMagazine{background:#f5f3ef;color:#172027;border:1px solid #d6d2ca;border-radius:22px;overflow:hidden;margin:12px auto 28px;max-width:1040px;box-shadow:0 20px 70px #0005}.profileOrbitBird{border-color:#c8e7ff;box-shadow:0 0 26px #94cbff55,0 0 65px #6b9bd633;animation:profileBirdFloat 4.8s ease-in-out infinite}.profileOrbitBird img{object-fit:contain!important;animation:profileBirdGlow 5s ease-in-out infinite}@keyframes profileBirdFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}@keyframes profileBirdGlow{0%,100%{filter:drop-shadow(0 0 3px #dcecff)}50%{filter:drop-shadow(0 0 15px #90d8ff)}}@media(prefers-reduced-motion:reduce){.profileOrbitBird,.profileOrbitBird img{animation:none}}.profileOrbitTransitionVeil{position:absolute;inset:21%;border-radius:50%;display:grid;place-items:center;color:#dcefff;font-size:70px;opacity:0;pointer-events:none;background:radial-gradient(circle,#d6eafa 0%,#7095b7 22%,transparent 70%);z-index:3}.profileOrbitSwitching .profileOrbitTransitionVeil{animation:profileOrbCover .9s ease-in-out both}.profileOrbitSwitching .profileOrbitAvatar{animation:profilePlayerSlide .85s cubic-bezier(.22,.9,.32,1.2) both}.profileOrbitSwitching.back .profileOrbitAvatar{animation-direction:reverse}@keyframes profileOrbCover{0%{opacity:0;transform:scale(.35) rotate(0)}40%{opacity:.95;transform:scale(1.1) rotate(100deg)}100%{opacity:0;transform:scale(.4) rotate(220deg)}}@keyframes profilePlayerSlide{0%{opacity:.2;transform:translateX(90px) scale(.85)}55%{opacity:.65;transform:translateX(-14px) scale(1.04)}100%{opacity:1;transform:translateX(0) scale(1)}}@media(prefers-reduced-motion:reduce){.profileOrbitSwitching .profileOrbitTransitionVeil,.profileOrbitSwitching .profileOrbitAvatar{animation:none}}.profileAiComingSoon{text-align:center;padding:10px 15px 20px;font-size:13px;letter-spacing:.02em}.profileAiComingSoon span{display:inline-block;margin-left:8px;border-radius:15px;background:#dce5f0;padding:6px 10px;font-size:10px}.profileStudioNav{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:14px}.profileStudioNav button{border:1px solid #bfc7d2;border-radius:22px;padding:12px 18px;background:#e4e9f2;color:#17202b;cursor:pointer}.profileStudioNav button[aria-pressed=true]{background:#20344d;color:#fff}.profileFriendsStudio{padding:22px;background:#fff}.profileFriendsStudio input{width:100%;padding:14px;border:1px solid #ccc;border-radius:12px;box-sizing:border-box}.profileFriendsStudio>div{display:grid;gap:10px;margin-top:15px}.profileFriendsStudio>div button{display:flex;justify-content:space-between;border:1px solid #ddd;border-radius:12px;padding:14px;background:#f6f7f9;color:#17202b}.profilePremiumOrb{position:absolute;z-index:4;right:21%;top:24%;width:55px;height:55px;border-radius:50%;border:2px solid #c2e9ff;background:radial-gradient(circle at 30% 25%,#d9f5ff,#4177ba 50%,#102040);color:white;box-shadow:0 0 28px #8ecfff;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:23px;cursor:pointer;touch-action:manipulation}.profilePremiumOrb small{font-size:9px;letter-spacing:.1em}.profileAiPanel{background:#121c2a;color:#f5f7ff;margin:0 20px 20px;border-radius:18px;padding:22px;display:grid;gap:12px}.profileAiPanel h3{margin:0}.profileAiPanel p{font-size:13px;opacity:.8}.profileAiPanel textarea{min-height:90px;border-radius:10px;padding:12px;background:#f5f7ff;color:#14202d}.profileAiPanel button{border:0;border-radius:24px;background:#b6dcff;color:#122034;padding:12px;font-weight:700}.profileAiReply{white-space:pre-wrap;line-height:1.5}.profileOrbitMasthead{display:flex;justify-content:space-between;gap:10px;padding:17px 22px;border-bottom:1px solid #c5bfb5;font-size:10px;letter-spacing:.14em;font-weight:800}.profileOrbitMagazine>h2{text-align:center;font-family:Georgia,serif;font-size:clamp(28px,6vw,65px);letter-spacing:-.06em;margin:24px 14px 0;line-height:1}.profileOrbitMagazine em{font-weight:400}.profileOrbitStage{position:relative;width:min(100%,640px);aspect-ratio:1;margin:0 auto;touch-action:none;cursor:grab;user-select:none}.profileOrbitStage:active{cursor:grabbing}.profileOrbitStage canvas{width:100%;height:100%;display:block;background:radial-gradient(ellipse at center,#0c2639 0%,#08111b 57%,#050b12 80%);border-radius:50%}.profileOrbitAvatar{position:absolute;inset:34%;border-radius:50%;overflow:hidden;border:2px solid #bcdff0;box-shadow:0 0 36px #72c9f866;background:#101d2b;pointer-events:none}.profileOrbitAvatar img{width:100%;height:100%;object-fit:cover}.profileOrbitHint{position:absolute;bottom:10%;left:0;right:0;text-align:center;color:#d8d9e1;font-size:10px;letter-spacing:.13em;pointer-events:none}.profileOrbitIdentity{text-align:center;padding:0 20px 30px}.profileOrbitIdentity>span{font-size:10px;letter-spacing:.18em}.profileOrbitIdentity h3{font:normal clamp(35px,7vw,70px) Georgia,serif;margin:6px}.profileOrbitIdentity p{max-width:580px;margin:8px auto;color:#53606b}.profileOrbitIdentity button{margin-top:15px;background:#17202b;color:#fff;border:0;border-radius:30px;padding:14px 22px;cursor:pointer}.profileOrbitAnalytics{background:#fff;padding:25px clamp(16px,5vw,50px);border-top:1px solid #ddd}.profileOrbitAnalytics h3{font:normal clamp(26px,5vw,45px) Georgia,serif;margin:0 0 22px}.profileOrbitMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.profileOrbitMetrics>div{background:#f3f1ed;border:1px solid #e0dcd4;border-radius:12px;padding:15px;display:grid;gap:8px}.profileOrbitMetrics small{font-size:9px;letter-spacing:.1em}.profileOrbitMetrics strong{font-size:clamp(15px,3vw,25px)}.profileOrbitPageTimes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.profileOrbitPageTimes>div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #ddd;padding:9px 0}.profileOrbitAnalytics>p{color:#69747c;font-size:12px;margin-top:20px}@media(max-width:500px){.profileOrbitMetrics{grid-template-columns:1fr}.profileOrbitMasthead{font-size:8px}}`}</style>
 </section>;
}

function ProfileOverview({profile,tier,ashab,postCount,postText,setPostText,posting,publishFirstPost,onEdit}:{profile:Profile;tier:any;ashab:Profile[];postCount:number;postText:string;setPostText:(v:string)=>void;posting:boolean;publishFirstPost:()=>void;onEdit:()=>void}){
  return <section className="profileOverview">
    <ProfileOrbitStudio profile={profile} onEdit={onEdit} ashab={ashab}/>

    <div className="profileLegacyOverview" hidden>
    <header className={"profileOverviewHero header-"+profile.profile_accent}>
      <div className="profileOverviewCover"><div className="backPagesBrand">1Muslim</div><div className="profileOverviewActions"><button type="button" className="profileSignOut" aria-label="Sign out" onClick={()=>window.dispatchEvent(new Event("1muslim:profile-signout"))}>↪</button><Link href="/find" className="ghost">⌕ Discover</Link><button className="primary" onClick={onEdit}>✎ Edit</button></div></div>
      <div className="profileOverviewBody">
        <div className="profileOverviewMain"><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p className="profileHandle">@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p><p className="profileBio">{profile.bio||"Your profile is your space. Add a short bio so the community can get to know you."}</p>
          <FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at}/><Link href="/arabic-badges" className="ghost" style={{display:"inline-flex",marginTop:10}}>🔤 Arabic Badge Program →</Link><div className="profileChips">{profile.city&&<span>📍 {profile.city}{profile.state?", "+profile.state:""}</span>}<span>⭐ {profile.xp_total.toLocaleString()} XP</span>{profile.shahada_verified_at&&<span>✓ Shahadah verified</span>}</div>
        </div></div>
      <div className="profileOverviewStats"><div><b>{postCount}</b><span>Posts</span></div><div><b>{profile.xp_total.toLocaleString()}</b><span>XP</span></div><div><b>{profile.community?"1":"0"}</b><span>Community</span></div></div>
    </header>
    </div>
    <section className="profileOverviewSection"><div className="sectionHeading"><div><span className="eyebrow">YOUR VOICE</span><h2>Your posts</h2><p>{postCount?"Your latest reflections and community posts.":"Your profile is ready for its first post."}</p></div></div>
      {!postCount&&<div className="firstPostCard"><span className="eyebrow">FIRST POST</span><h3>Say something to the community ✨</h3><p>Share a thought, reminder, lesson, or something useful.</p><div className="firstPostComposer"><textarea value={postText} maxLength={500} onChange={e=>setPostText(e.target.value)} placeholder="What would you like to share?"/><div><small>{postText.length}/500</small><button className="primary" onClick={publishFirstPost} disabled={!postText.trim()||posting}>{posting?"Posting…":"Post"}</button></div></div></div>}
      <ProfileContentSections userId={profile.id}/>
    </section>
    <style jsx>{`.backPagesBrand{position:absolute;top:18px;left:0;right:0;text-align:center;font-size:25px;font-weight:800;letter-spacing:-.04em;color:var(--gold);pointer-events:none}.profileOverviewActions{top:76px!important;left:18px!important;right:18px!important;justify-content:center!important}.profileOverviewActions button,.profileOverviewActions a{border-radius:999px!important;min-height:40px!important;padding:9px 16px!important;font-size:12px!important;font-weight:650!important;box-shadow:none!important;background:color-mix(in srgb,var(--panel) 80%,transparent)!important;border:1px solid var(--line)!important;color:var(--text)!important;transition:transform .2s ease,background .2s ease!important}.profileOverviewActions button:active,.profileOverviewActions a:active{transform:scale(.97)}.profileOverviewActions .ghost{display:inline-flex!important;align-items:center!important}.profileSignOut{min-width:44px!important}.profileOverviewCover{height:150px!important;background:linear-gradient(135deg,var(--panel2),var(--panel))!important}@media(max-width:700px){.profileOverviewActions{gap:8px!important}.profileOverviewActions button,.profileOverviewActions a{padding:9px 13px!important}.backPagesBrand{font-size:23px}}`}</style><style jsx>{`.profileOverview{max-width:1120px;margin:0 auto;padding:24px 18px 80px}.profileOverviewHero{overflow:hidden;border:1px solid var(--line);border-radius:28px;background:var(--panel);box-shadow:var(--shadow)}.profileOverviewCover{height:185px;position:relative;background:linear-gradient(135deg,#102218,#0b130e)}.profileOverviewCover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(214,231,184,.18),transparent 30%)}.profileOverviewActions{position:absolute;right:18px;top:18px;z-index:2;display:flex;gap:8px}.profileOverviewActions button,.profileOverviewActions a{backdrop-filter:blur(12px)}.profileSignOut{background:linear-gradient(120deg,#123b57,#142339)!important;border:1px solid #80e6ff!important;color:#fff!important;box-shadow:0 0 16px #65caff55;font-weight:800;cursor:pointer}.profileOverviewBody{padding:0 30px 10px;position:relative}.profileOverviewAvatar{margin-top:-76px;position:relative;z-index:3;width:150px}.profileOverviewMain{margin-top:15px}.profileOverviewMain h1{font-size:44px;letter-spacing:-.06em;margin:6px 0 2px}.profileHandle{color:var(--muted);font-size:12px;margin:0}.profileBio{max-width:680px;color:#aab5ae;line-height:1.65;font-size:14px;margin:14px 0 0}.profileChips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.profileChips span{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 10px;color:var(--muted);font-size:10px;font-weight:800}.profileOverviewStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 30px 28px}.profileOverviewStats>div{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:14px}.profileOverviewStats b{display:block;font-size:23px}.profileOverviewStats span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:3px}.profileOverviewSection{margin-top:18px;border:1px solid var(--line);background:var(--panel);border-radius:24px;padding:24px}.sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.sectionHeading h2{margin:6px 0 2px;font-size:24px;letter-spacing:-.04em}.sectionHeading p{margin:0;color:var(--muted);font-size:11px}.carouselHint{color:#6f7d75;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.ashabCarousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;scrollbar-width:none}.ashabCarousel::-webkit-scrollbar{display:none}.ashabCard{flex:0 0 175px;scroll-snap-align:start;text-align:left;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:18px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;transition:.18s}.ashabCard:hover{transform:translateY(-2px);border-color:#52664f}.ashabCard strong{font-size:13px;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ashabCard small{font-size:10px;color:var(--muted)}.ashabCard em{font-style:normal;font-size:8px;font-weight:900;letter-spacing:.12em;color:var(--gold);margin-top:4px}.ashabEmpty{min-width:100%;box-sizing:border-box;border:1px dashed #354239;border-radius:18px;padding:20px;display:flex;align-items:center;gap:14px}.ashabEmptyIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#1a241b;color:var(--gold)}.ashabEmpty h3{margin:0 0 4px;font-size:15px}.ashabEmpty p{margin:0;color:var(--muted);font-size:11px}.ashabEmpty .ghost{margin-left:auto;white-space:nowrap}.firstPostCard{border:1px solid #344237;background:linear-gradient(145deg,#101912,#0b110d);border-radius:20px;padding:20px}.firstPostCard h3{margin:6px 0 3px;font-size:20px}.firstPostCard p{margin:0;color:var(--muted);font-size:11px}.firstPostComposer{margin-top:16px}.firstPostComposer textarea{width:100%;min-height:100px;box-sizing:border-box;border:1px solid var(--line);background:#080d09;color:var(--text);border-radius:14px;padding:12px;resize:vertical}.firstPostComposer>div{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.firstPostComposer small{color:var(--muted);font-size:9px}@media(max-width:700px){.profileOverview{padding:12px 12px 70px}.profileOverviewCover{height:150px}.profileOverviewBody{padding:0 18px 8px}.profileOverviewAvatar{width:120px;margin-top:-60px}.profileOverviewMain h1{font-size:34px}.profileOverviewActions .ghost{display:none}.profileOverviewActions button{padding:9px 12px}.profileOverviewStats{padding:16px 18px 20px}.profileOverviewSection{padding:18px}.ashabCard{flex-basis:160px}.ashabEmpty{display:grid}.ashabEmpty .ghost{margin:0;width:100%;text-align:center}}`}</style>
  </section>
}

export default function ProfilePage() {
  const router=useRouter();
  const [signingOut,setSigningOut]=useState(false);
  const [isHudHudAdmin,setIsHudHudAdmin]=useState(false);
  const [uploadingAvatar,setUploadingAvatar]=useState(false);
  const signOut=async()=>{
    if(signingOut)return;
    setSigningOut(true);
    const {error}=await createClient().auth.signOut();
    if(error){setMessage("Sign out failed: "+error.message);setSigningOut(false);return;}
    try{sessionStorage.setItem("1muslim-hudhud-farewell","1")}catch{}
    window.dispatchEvent(new CustomEvent("1muslim:farewell"));
    window.setTimeout(()=>{router.replace("/");router.refresh()},1400);
  };
  const [profile,setProfile]=useState<Profile|null>(null);
  const [editing,setEditing]=useState(false);
  const [ashab,setAshab]=useState<Profile[]>([]);
  const [postCount,setPostCount]=useState(0);
  const [postText,setPostText]=useState("");
  const [posting,setPosting]=useState(false);
  const [tab,setTab]=useState<"profile"|"avatar"|"header"|"live"|"shahada"|"badges">("profile");
  useEffect(()=>{const openBadges=()=>{if(new URLSearchParams(window.location.search).get("tab")==="badges"||window.location.hash==="#profile-badges"){setEditing(true);setTab("badges");window.setTimeout(()=>document.getElementById("profile-badges")?.scrollIntoView({behavior:"smooth",block:"start"}),250)}};openBadges();window.addEventListener("hashchange",openBadges);return()=>window.removeEventListener("hashchange",openBadges)},[]);
  const [avatarTransition,setAvatarTransition]=useState<"unlock"|"change"|null>(null); const [avatarSaving,setAvatarSaving]=useState(false); const [saving,setSaving]=useState(false); const [colorSaving,setColorSaving]=useState(false); const [message,setMessage]=useState(""); const [authRequired,setAuthRequired]=useState(false);
  const [liveConnectors,setLiveConnectors]=useState<Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>>({});
  const [vaultUrl,setVaultUrl]=useState("");
  const providers=["tiktok","youtube","twitch"] as const;

  useEffect(()=>{window.addEventListener("1muslim:profile-signout",signOut);return()=>window.removeEventListener("1muslim:profile-signout",signOut)},[signingOut]);
  useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setAuthRequired(true);return;}setIsHudHudAdmin((user.email||"").toLowerCase()==="hudhudbyelmi@gmail.com");const {data}=await s.from("profiles").select("*").eq("id",user.id).single();if(data)setProfile(data as Profile);
    const [profilePosts,communityPosts]=await Promise.all([s.from("posts").select("id").eq("user_id",user.id),s.from("community_posts").select("id").eq("author_id",user.id)]);setPostCount((profilePosts.data?.length??0)+(communityPosts.data?.length??0));
    const {data:friendships}=await s.from("ashab_friendships").select("requester_id,addressee_id").eq("status","accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ashabIds=(friendships??[]).map((row:any)=>row.requester_id===user.id?row.addressee_id:row.requester_id).filter(Boolean);
    if(ashabIds.length){const {data:ashabRows}=await s.from("profiles").select("*").in("id",ashabIds);setAshab((ashabRows??[]) as Profile[]);}
    const {data:connectors}=await s.from("live_connectors").select("provider,handle,channel_url,enabled,is_live,live_title").eq("user_id",user.id);
    const map:Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>={};
    for(const row of (connectors??[])) map[row.provider]={handle:row.handle??"",channel_url:row.channel_url??"",enabled:!!row.enabled,is_live:!!row.is_live,live_title:row.live_title??""};
    setLiveConnectors(map);})()},[]);

  useEffect(()=>{if(tab!=="shahada"||!profile?.shahada_audio_path)return;let active=true;(async()=>{const s=createClient();const {data}=await s.storage.from("shahada-safe-vault").createSignedUrl(profile.shahada_audio_path!,600);if(active&&data?.signedUrl)setVaultUrl(data.signedUrl)})();return()=>{active=false}},[tab,profile?.shahada_audio_path]);

  const uploadAdminAvatar=async(file:File|undefined)=>{
    if(!file||!profile||!isHudHudAdmin)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("Use a PNG, JPEG or WebP avatar.");return}
    if(file.size>3*1024*1024){setMessage("Avatar must be under 3 MB.");return}
    setUploadingAvatar(true);setMessage("");
    const s=createClient();
    const {data:{user}}=await s.auth.getUser();
    if(!user||user.id!==profile.id||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com"){setUploadingAvatar(false);setMessage("Admin authentication required.");return}
    const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    const path=`hudhud-admin/${user.id}/avatar-${Date.now()}.${extension}`;
    const {error:uploadError}=await s.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setUploadingAvatar(false);setMessage("Avatar upload failed: "+uploadError.message);return}
    const url=s.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const avatar_config={...(profile.avatar_config||{}),adminAvatarUrl:url};
    const {error:saveError}=await s.from("profiles").update({avatar_config}).eq("id",user.id);
    setUploadingAvatar(false);
    if(saveError){setMessage("Avatar uploaded but could not be saved: "+saveError.message);return}
    update({avatar_config});setMessage("HudHud admin avatar saved.");
  };
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
     const path=`profile-covers/${user.id}/cover-${Date.now()}.jpg`;
     const {error:uploadError}=await client.storage.from("avatars").upload(path,blob,{contentType:"image/jpeg",upsert:false});if(uploadError)throw uploadError;
     const url=client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
     const avatar_config={...(profile.avatar_config||{}),profileCoverUrl:url};
     const {error:saveError}=await client.from("profiles").update({avatar_config}).eq("id",user.id);if(saveError)throw saveError;
     update({avatar_config});setCoverFile(null);setCoverPreview(null);setMessage("Cover image saved to your profile.");
    }finally{URL.revokeObjectURL(src)}
   }catch(e){setMessage(e instanceof Error?e.message:"Could not upload cover image.")}finally{setCoverUploading(false)}
  };
  const tier=useMemo(()=>tierForXp(profile?.xp_total??0),[profile?.xp_total]);
  const update=(patch:Partial<Profile>)=>setProfile(p=>p?{...p,...patch}:p);
  const chooseBackground=async(choice:(typeof BACKGROUND_CHOICES)[number])=>{
    if(!profile||colorSaving||choice.id===profile.profile_background)return;
    const previous={profile_accent:profile.profile_accent,profile_background:profile.profile_background};
    update({profile_accent:choice.accent,profile_background:choice.id});
    setColorSaving(true);setMessage("");
    const {error}=await createClient().from("profiles").update({profile_accent:choice.accent,profile_background:choice.id}).eq("id",profile.id);
    setColorSaving(false);
    if(error){update(previous);setMessage("Could not save background: "+error.message);}
    else setMessage("Background saved automatically.");
  };
  const displayCooldown=cooldownRemaining(profile?.display_name_changed_at??null);
  const usernameCooldown=cooldownRemaining(profile?.username_changed_at??null);

  const save=async()=>{
    if(!profile)return;
    setSaving(true);setMessage("");
    const s=createClient();
    const original=await s.from("profiles").select("display_name,username").eq("id",profile.id).single();
    const displayChanged=original.data && profile.display_name!==original.data.display_name;
    const usernameChanged=original.data && profile.username!==original.data.username;
    const handle=(profile.username??"").trim().replace(/^@+/,"").toLowerCase();
    if(usernameChanged && handle && !/^[a-z0-9_.]{3,30}$/.test(handle)){
      setSaving(false);setMessage("Member handle must be 3–30 characters using letters, numbers, underscores, or periods.");return;
    }
    const config={...(profile.avatar_config??{}),gender:profile.avatar_gender,package:profile.avatar_package,accessories:Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories:[]};
    const {data,error}=await s.from("profiles").update({display_name:profile.display_name.trim(),username:handle||null,first_name:profile.first_name,last_name:profile.last_name,city:profile.city,state:profile.state,country:profile.country,gender:profile.gender,bio:profile.bio,avatar_gender:profile.avatar_gender,avatar_package:profile.avatar_package,avatar_config:config,profile_background:profile.profile_background,profile_accent:profile.profile_accent}).eq("id",profile.id).select("display_name,username,display_name_changed_at,username_changed_at").single();
    setSaving(false);
    if(error){setMessage(error.message);return;}
    update({display_name:data?.display_name??profile.display_name,username:data?.username??null,display_name_changed_at:data?.display_name_changed_at??profile.display_name_changed_at,username_changed_at:data?.username_changed_at??profile.username_changed_at});
    setMessage(displayChanged||usernameChanged?"Profile identity updated.":"Profile saved.");
    window.dispatchEvent(new Event("1muslim:profile-saved"));
    setEditing(false);
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

  if(authRequired)return <main><section className="profileEmpty"><h1>Build your profile.</h1><p>Sign in to customize your OneMuslim identity.</p><Link href="/auth" className="primary">Sign in</Link></section></main>;
  if(!profile)return <main><section className="profileEmpty"><p>Loading your profile…</p></section></main>;

  const publishFirstPost=async()=>{const body=postText.trim();if(!body||posting)return;setPosting(true);const s=createClient();const {error}=await s.from("posts").insert({user_id:profile.id,body});if(error){setMessage(error.message);setPosting(false);return;}setPostText("");setPostCount(x=>x+1);setPosting(false);};

  return <main className="profilePage profileCommandPage">{!editing?<ProfileOverview profile={profile} tier={tier} ashab={ashab} postCount={postCount} postText={postText} setPostText={setPostText} posting={posting} publishFirstPost={publishFirstPost} onEdit={()=>setEditing(true)}/>:<div className="profileShell">
    <ProfileOrbitStudio profile={profile} onEdit={()=>setEditing(false)} ashab={ashab} editing editorTab={tab}/>
    <header className={`profileHero header-${profile.profile_accent}`}><div className="profileHeroTop"><div><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p>@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p></div></div><div className="profileHeroActions"><Link href="/find" className="ghost">Find People</Link><button className="primary" onClick={save} disabled={saving||colorSaving}>{saving?"Saving…":"Save & close"}</button></div></header>
    <div className="profileEditorToolbar"><button className="ghost" onClick={()=>setEditing(false)}>← Close editor</button><span>PROFILE COMMAND · SETTINGS</span></div><div style={{padding:"12px 0"}}><FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at} editable/></div><div className="profileTabs" aria-label="Profile editor sections">{(["profile","avatar","header","live","shahada","badges"] as const).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x==="profile"?"Identity":x==="avatar"?"Avatar & Crop":x==="header"?"Appearance":x==="live"?"Connections":x==="badges"?"Ranks":"Verification"}</button>)}</div>

    {tab==="badges"&&<section id="profile-badges" style={{scrollMarginTop:100}}><PublicBadgeSelector userId={profile.id} verifiedAt={profile.shahada_verified_at}/></section>}
    {tab==="profile"&&<section className="profileEditor"><div className="editorIntro"><span className="eyebrow">PERSONAL DETAILS</span><h2>Tell people who you are.</h2><p>Your profile is yours. Keep only the information you want to share.</p></div><div className="formGrid">
      <label>Display name<input value={profile.display_name??""} disabled={!!displayCooldown} onChange={e=>update({display_name:e.target.value})}/><small className="fieldNote">{displayCooldown?`You can change your display name again in ${displayCooldown}.`:"You can change this once every 3 days."}</small></label><label>@ Member handle<input value={profile.username?`@${profile.username}`:""} placeholder="@member" disabled={!!usernameCooldown} onChange={e=>update({username:e.target.value.replace(/^@+/,"")})}/><small className="fieldNote">{usernameCooldown?`You can change your handle again in ${usernameCooldown}.`:"You can change this once every 3 days."}</small></label><label>First name<input value={profile.first_name??""} onChange={e=>update({first_name:e.target.value})}/></label><label>Last name<input value={profile.last_name??""} onChange={e=>update({last_name:e.target.value})}/></label>
      <label>Gender<input value={profile.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : "Not selected"} disabled /><small className="fieldNote">Gender is selected once during onboarding and cannot be changed.</small></label>
      <label>City<input value={profile.city??""} onChange={e=>update({city:e.target.value})}/></label><label>State<input value={profile.state??""} onChange={e=>update({state:e.target.value})}/></label><label>Country<input value={profile.country??""} onChange={e=>update({country:e.target.value})}/></label>
      <label className="wide">Bio <small>{(profile.bio??"").length}/35</small><textarea value={profile.bio??""} maxLength={35} rows={2} onChange={e=>update({bio:e.target.value})}/></label>
    </div>{message&&<div className="saveMessage">{message}</div>}</section>}

    {tab==="live"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">SOCIAL CONNECTIONS</span><h2>Connect your world.</h2><p>Replace manual social handles with real account connections. Tap a glowing card to open the connector. Your Elmi Light adds a little magic to every tap.</p></div>
      <div className="socialConnectGrid">
       {(["tiktok","youtube","twitch"] as const).map(provider=>{const label=provider==="tiktok"?"TikTok":provider==="youtube"?"YouTube":"Twitch";const available=provider==="tiktok";return <article className="socialConnectCard" key={provider}>
        <div className="socialParticleField" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:(i*29%91+4)+"%",top:(i*37%76+8)+"%",animationDelay:(i*.16)+"s"}}/>)}</div>
        <div className="socialConnectTop"><span className="eyebrow">{label.toUpperCase()}</span><span className="socialConnectStatus">{available?"SANDBOX":"COMING SOON"}</span></div>
        <div className="socialConnectIcon" aria-hidden="true">{provider==="tiktok"?"♪":provider==="youtube"?"▶":"◈"}</div>
        <h3>{label}</h3><p>{available?"Open the 1Muslim TikTok connection experience. Authorization is still being prepared in sandbox.":"Account authorization will appear here when this connector is ready."}</p>
        {available?<Link href="/tiktok" className="socialConnectAction" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:action-success"))}><span className="socialActionSpark">✦</span> Connect <span aria-hidden="true">↗</span></Link>:<button type="button" className="socialConnectAction" disabled>✦ Connect · Soon</button>}
       </article>})}
      </div>
      <p className="socialConnectNote">Connections only show as verified after platform authorization succeeds. These cards do not manually mark an account live.</p>
      <style jsx>{`
      .socialConnectGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}.socialConnectCard{position:relative;isolation:isolate;overflow:hidden;min-width:0;border:1px solid #68d6c455;border-radius:22px;padding:22px;background:radial-gradient(circle at 50% 20%,#1d3e4c,#0a151c 75%);box-shadow:0 12px 40px #0004}.socialConnectTop{display:flex;justify-content:space-between;gap:10px;position:relative;z-index:1}.socialConnectStatus{font-size:9px;letter-spacing:.12em;color:#a8f4d8}.socialConnectIcon{position:relative;z-index:1;display:grid;place-items:center;width:66px;height:66px;margin:28px auto 12px;border:1px solid #91eddd88;border-radius:21px;background:#142b35;color:#c6fff0;font-size:35px;box-shadow:0 0 25px #5ddcc333}.socialConnectCard h3{position:relative;text-align:center;font-size:21px;margin:0 0 10px}.socialConnectCard p{position:relative;min-height:75px;text-align:center;color:#b9d4d2;font-size:12px;line-height:1.7}.socialConnectAction{position:relative;z-index:1;display:flex;justify-content:center;align-items:center;gap:11px;width:100%;box-sizing:border-box;padding:15px;border:1px solid #8cf9d6;border-radius:999px;background:linear-gradient(100deg,#155457,#14516a);color:#fff;text-decoration:none;font-weight:900;letter-spacing:.03em;cursor:pointer;box-shadow:0 0 16px #55d7cd55;transition:transform .25s,box-shadow .25s}.socialConnectAction:hover{transform:translateY(-3px);box-shadow:0 0 30px #74fff088}.socialConnectAction:disabled{opacity:.45;cursor:not-allowed}.socialActionSpark{font-size:22px;color:#fff5b9;animation:socialPulse 2s ease-in-out infinite}.socialParticleField{position:absolute;inset:0;pointer-events:none}.socialParticleField i{position:absolute;width:3px;height:18px;border-radius:100%;background:linear-gradient(transparent,#85f7ef,#fff1b2,transparent);box-shadow:0 0 9px #74fff0;animation:socialFall 3s ease-in-out infinite}.socialConnectNote{margin-top:18px;color:#a8bcb9;font-size:12px;line-height:1.6}@keyframes socialFall{0%,100%{opacity:0;transform:translateY(-12px)}40%{opacity:.8}85%{opacity:0;transform:translateY(35px)}}@keyframes socialPulse{50%{filter:drop-shadow(0 0 12px #fff1b2);transform:scale(1.18)}}@media(max-width:850px){.socialConnectGrid{grid-template-columns:1fr}.socialConnectCard p{min-height:0}}@media(prefers-reduced-motion:reduce){.socialParticleField i,.socialActionSpark{animation:none}}
      `}</style>
    </section>}
    {tab==="shahada"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">PRIVATE SAFE VAULT</span><h2>Your Shahada verification.</h2><p>Your original voice recording is private. Only your authenticated account can request a short-lived playback link. Your public profile never exposes the recording.</p></div>
      <div className="shahadaVaultCard">
        <div><span className="eyebrow">STATUS</span><h3>{profile.shahada_verified_at?"✓ SHAHADA VERIFIED":"Not verified"}</h3><p>{profile.shahada_language==="ar"?"Arabic":"English"} · {profile.shahada_verified_at?new Date(profile.shahada_verified_at).toLocaleDateString():"—"}</p></div>
        {profile.shahada_audio_path&&vaultUrl?<audio controls preload="metadata" src={vaultUrl}/>:
          <span className="muted">No private recording available.</span>}
      </div>
      <style jsx>{`.shahadaVaultCard{border:1px solid var(--line);background:var(--panel2);border-radius:18px;padding:18px;display:grid;gap:16px}.shahadaVaultCard h3{margin:6px 0;font-size:18px;color:#d6e7b8}.shahadaVaultCard p{margin:0;color:#7d8a82;font-size:11px}.shahadaVaultCard audio{width:100%}`}</style>
    </section>}
    {tab==="avatar"&&<section className="avatarEditor">{isHudHudAdmin&&<div style={{gridColumn:"1 / -1",padding:20,border:"1px solid #77e7ef",borderRadius:18,background:"#102b36",marginBottom:18}}><strong>✦ HudHud Admin · Custom Avatar Upload</strong><p className="muted">Admin-only avatar upload. PNG, JPG or WebP, up to 3 MB.</p><input aria-label="Upload HudHud admin avatar" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingAvatar} onChange={e=>{void uploadAdminAvatar(e.target.files?.[0]);e.target.value=""}}/>{uploadingAvatar&&<p>Uploading avatar…</p>}{message&&<p role="status">{message}</p>}</div>}<div className={`avatarTransitionStage ${avatarTransition==="unlock"?"avatarUnlock":avatarTransition==="change"?"avatarSwap":""}`}><div className="avatarPreview"><strong>{tier.icon} {tier.name}</strong><span>{tier.quality}</span><small>{profile.xp_total.toLocaleString()} XP</small></div>{avatarTransition==="unlock"&&<div className="silverBadgeReveal" role="status" aria-label="Premium avatar unlocked"><div className="silverBadgeHalo"/><div className="silverBadgeArt">✦</div><div className="silverBadgeTitle">AVATAR UNLOCKED</div><div className="silverBadgeSub">Your new chapter begins</div></div>}</div><div style={{gridColumn:"1 / -1",padding:"16px",border:"1px solid #b9a06a77",borderRadius:16,background:"linear-gradient(135deg,#153c30,#111e1a)",marginBottom:14}}><span className="eyebrow">YOUR AVATAR · SAVED TO YOUR PROFILE</span><h2 style={{margin:"8px 0"}}>Choose your look</h2><p className="muted">Official 1Muslim avatars unlock with XP and save immediately to your profile.</p><div className="avatarChoiceGrid">{AVATAR_CHOICES.filter(choice=>!["/assets/avatars/emerald-royalty-female.PNG","/assets/avatars/violet-sentinel-female.PNG"].includes(choice.url)||["female","woman"].includes(String(profile.avatar_gender||profile.gender||"").toLowerCase())).map(choice=>{const locked=profile.xp_total<choice.xp;const chosen=profile.avatar_config?.selectedAvatarUrl===choice.url;return <button type="button" key={choice.url} onClick={()=>void selectAvatar(choice.url)} disabled={avatarSaving||locked} className={`avatarChoice ${chosen?"selected":""} ${locked?"locked":""}`}><img src={choice.url} alt=""/><span>{choice.label}</span><small>{locked?`🔒 ${choice.xp.toLocaleString()} XP`:chosen?"Equipped ✓":"Equip"}</small></button>})}</div><p role="status" className="muted">{message}</p></div><div><span className="eyebrow">5 XP TIERS</span><h2>Earn your look.</h2><p className="muted">Accessories are saved when you choose Save & close.</p><div className="tierGrid">{AVATAR_TIERS.map(t=><div className={`tierCard ${profile.xp_total>=t.minXp?"unlocked":"locked"}`} key={t.key}><b>{t.icon} {t.name}</b><span>{t.minXp.toLocaleString()} XP</span><small>{profile.xp_total>=t.minXp?t.quality:"Locked"}</small></div>)}</div><div className="accessoryGrid">{ACCESSORIES.map(item=>{const required=AVATAR_TIERS.find(x=>x.key===item.tier)!.minXp;const unlocked=profile.xp_total>=required;const selected=Array.isArray(profile.avatar_config?.accessories)&&profile.avatar_config.accessories.map(String).includes(item.id);return <button key={item.id} disabled={!unlocked} className={`accessoryCard ${selected?"selected":""} ${!unlocked?"locked":""}`} onClick={()=>toggleAccessory(item.id)}><span>{unlocked?item.icon:"🔒"}</span><b>{item.name}</b><small>{unlocked?"Tap to equip":`${required.toLocaleString()} XP`}</small></button>})}</div></div></section>}

    <style>{`@keyframes avatarUnlockGlow{0%{transform:scale(.94)}35%{transform:scale(1.065)}100%{transform:scale(1)}}@keyframes avatarSwapFade{0%{opacity:.35;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}@keyframes avatarUnlockLabel{0%{opacity:0;transform:translateY(12px)}25%,75%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}.avatarTransitionStage{position:relative}.avatarUnlock .avatarPreview{animation:avatarUnlockGlow 2.5s ease-in-out both}.avatarSwap .avatarPreview{animation:avatarSwapFade .75s ease-out both}.silverBadgeReveal{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;pointer-events:none;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at center,#0b332dd9 0%,#071a18ed 74%);animation:silverReveal 2.55s ease-in-out both}.silverBadgeHalo{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,#e7d3a04d,transparent 70%);filter:blur(15px);animation:silverHalo 2.5s ease-in-out both}.silverBadgeArt{position:relative;width:min(48%,150px);height:auto;object-fit:contain;filter:drop-shadow(0 6px 22px #b5e6d07a);animation:silverBadgeEnter 2.5s cubic-bezier(.2,.75,.25,1) both}.silverBadgeTitle{position:relative;color:#f2e3b5;font-size:clamp(12px,2.5vw,18px);font-weight:800;letter-spacing:.13em;text-shadow:0 2px 18px #d9c27c99}.silverBadgeSub{position:relative;color:#c1dacb;font-size:11px;letter-spacing:.04em}@keyframes silverReveal{0%{opacity:0}14%,73%{opacity:1}100%{opacity:0}}@keyframes silverHalo{0%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(1.6)}}@keyframes silverBadgeEnter{0%{opacity:0;transform:translateY(18px) scale(.7) rotate(-7deg)}30%,75%{opacity:1;transform:translateY(0) scale(1) rotate(0)}100%{opacity:0;transform:translateY(-8px) scale(1.06)}}@media(prefers-reduced-motion:reduce){.avatarUnlock .avatarPreview,.avatarSwap .avatarPreview,.silverBadgeReveal,.silverBadgeHalo,.silverBadgeArt{animation:none}}`}</style>
    {tab==="header"&&<section className="headerEditor"><span className="eyebrow">PROFILE BACKGROUND</span><h2>Choose your profile atmosphere.</h2><div className="profileCoverUploader"><h3>Cover photograph</h3><p>Upload a banner like the one on a professional social profile. Preview and crop it before saving.</p><input aria-label="Upload profile cover image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){setMessage("Choose a JPG, PNG or WebP under 8 MB.");return}setCoverFile(file);setCoverPreview(URL.createObjectURL(file));setCoverZoom(1);setCoverPosition(50);e.target.value=""}}/>{coverPreview&&<><div className="profileCoverCrop" style={{backgroundImage:`url("${coverPreview}")`,backgroundSize:`auto ${coverZoom*100}%`,backgroundPosition:`center ${coverPosition}%`}}/><label>Zoom <input type="range" min="1" max="2.5" step=".05" value={coverZoom} onChange={e=>setCoverZoom(Number(e.target.value))}/></label><label>Vertical position <input type="range" min="0" max="100" value={coverPosition} onChange={e=>setCoverPosition(Number(e.target.value))}/></label><button type="button" disabled={coverUploading} onClick={()=>void uploadProfileCover()}>{coverUploading?"Uploading…":"Crop & save cover"}</button></>}</div><p className="muted">Your background is saved immediately and appears on your public profile header.</p><div className="colorGrid">{BACKGROUND_CHOICES.map(choice=><button key={choice.id} className={profile.profile_background===choice.id?"selected":""} onClick={()=>void chooseBackground(choice)} disabled={colorSaving} aria-pressed={profile.profile_background===choice.id}><span className={`swatch ${choice.accent}`}></span><b>{choice.label}</b></button>)}</div><div className={`headerDemo header-${profile.profile_accent}`}><strong>{profile.display_name}</strong><span>{profile.profile_background||"Classic"} background preview</span></div><p role="status" className="muted">{colorSaving?"Saving background…":message}</p></section>}
    <ProfileContentSections userId={profile.id}/>
  </div>}<style>{`body:has(.profilePage){overflow-y:auto!important}.profilePage .muslimMobileDock,body:has(.profilePage) .muslimMobileDock{display:none!important}.profilePage{min-height:100dvh;overflow-x:hidden;overflow-y:visible!important}.profileShell{max-width:1100px;margin:0 auto;padding-bottom:110px!important;overflow:visible!important}.profileTabs{display:flex!important;gap:8px!important;overflow-x:auto!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:8px 4px 15px!important}.profileTabs::-webkit-scrollbar{display:none}.profileTabs button{flex:0 0 auto!important;scroll-snap-align:start;min-height:43px!important;border-radius:999px!important;padding:10px 16px!important;font-size:13px!important;letter-spacing:.01em!important;white-space:nowrap!important;transition:background .2s ease,border-color .2s ease!important}.profileTabs button.active{box-shadow:0 3px 16px rgba(19,110,79,.2)}.profileEditor textarea{min-height:70px!important;resize:vertical}.profileHero{padding-top:160px!important}.profileOverviewBody{padding-top:150px!important}.avatarPreview{min-height:100px!important;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:45px 20px 16px!important;overflow:visible!important}.avatarTransitionStage{overflow:visible!important}@media(max-width:640px){.profileShell{padding-left:12px!important;padding-right:12px!important}.profileTabs{position:sticky;top:0;z-index:20;backdrop-filter:blur(18px);background:rgba(9,33,29,.9);border-radius:16px}}`}</style><style>{`
.profileCommandPage{background:#f3f7fc!important;color:#213954}
.profileCoverBanner{height:clamp(155px,27vw,270px);background:linear-gradient(120deg,#c7d9ed,#eef5fc 55%,#8baed0);background-position:center;background-size:cover;border-radius:22px 22px 0 0;position:relative;overflow:hidden}
.profileCoverBadge{position:absolute;bottom:12px;left:15px;background:#0b274e99;color:white;padding:7px 12px;border-radius:30px;font-size:10px;letter-spacing:.14em}
.profileCoverUploader{background:#f6f9fe;color:#244467;border:1px solid #d3e0ee;padding:18px;border-radius:18px;margin:15px 0;display:grid;gap:12px}
.profileCoverUploader h3,.profileCoverUploader p{margin:0}.profileCoverUploader input[type=file]{max-width:100%}.profileCoverUploader label{display:grid;gap:5px}.profileCoverUploader button{background:#24548a;color:white;padding:12px;border-radius:12px;border:0;font-weight:700}
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
`}</style></main>;
}

