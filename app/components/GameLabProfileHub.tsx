"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {createPortal} from "react-dom";
import Link from "next/link";
import {CanvasUmmaGallery} from "./CanvasUmmaGallery";

const tabs=["The Umma","My Profile"] as const;
type Tab=typeof tabs[number];
export default function GameLabProfileHub({active,profile,avatarHero,renderProfileSection}:{active:boolean;profile?:ReactNode;avatarHero?:ReactNode;renderProfileSection?:(section:"Avatars"|"Background"|"Badges"|"Settings")=>ReactNode}){
 const [tab,setTab]=useState<Tab>("My Profile"); const [settingsOpen,setSettingsOpen]=useState(false);
 const mirrorRef=useRef<HTMLDivElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const workspaceRef=useRef<HTMLElement>(null);
 const [heroPosition,setHeroPosition]=useState<{top:number;left:number}|null>(null);
 useEffect(()=>{
  if(!active){setHeroPosition(null);return;}
  let frame=0;
  let lastTop=Number.NaN,lastLeft=Number.NaN;
  // HudHud moves the navigation using transforms, which ResizeObserver cannot detect.
  // Follow the actual rendered workspace rect each frame, including during fullscreen morphs.
  const track=()=>{
   const rect=workspaceRef.current?.getBoundingClientRect();
   if(rect&&rect.width>0&&rect.height>0){
    const top=Math.round(rect.top);
    const left=Math.round(rect.left+rect.width/2);
    if(top!==lastTop||left!==lastLeft){
     lastTop=top;lastLeft=left;setHeroPosition({top,left});
    }
   }
   frame=requestAnimationFrame(track);
  };
  frame=requestAnimationFrame(track);
  return ()=>cancelAnimationFrame(frame);
 },[active]);
 return <>{active&&heroPosition&&typeof document!=="undefined"&&createPortal(<div className="profile-shared-avatar-overlay profile-shared-avatar-portal" style={{top:heroPosition.top,left:heroPosition.left}}><div key={tab} className="profile-avatar-tab-motion">{avatarHero}</div></div>,document.body)}<section ref={workspaceRef} aria-label="Profile workspace" style={{height:"100%",maxHeight:"100%",minHeight:0,width:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",color:"#f7f0da",background:"transparent",overflow:"visible",position:"relative"}}>
  <div style={{flex:"1 1 auto",height:"100%",minHeight:0,width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"visible",background:"color-mix(in srgb,var(--theme-base,#101114) 26%,transparent)",backdropFilter:"blur(20px)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 42%,transparent)",borderRadius:28,padding:"12px 10px 14px",boxShadow:"inset 0 1px 0 #ffffff25,0 16px 48px #0007"}}>
   <div style={{position:"absolute",top:48,left:0,right:"auto",display:"none",flexShrink:0,zIndex:30,alignItems:"center",flexDirection:"column",gap:6,background:"color-mix(in srgb,var(--theme-base,#101114) 70%,transparent)",backdropFilter:"blur(12px)",borderRadius:"0 12px 12px 0",padding:"6px 3px",marginBottom:0,border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 55%,transparent)"}}>
    <button type="button" aria-label="Profile settings" title="Settings" aria-pressed={settingsOpen} onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:0,borderRadius:8,background:"transparent",color:"#f5df9c",padding:"5px 7px",fontSize:16,lineHeight:1,cursor:"pointer"}}>⚙</button>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",flexDirection:"column",alignItems:"stretch",gap:6,minWidth:0}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name&&!settingsOpen} onClick={()=>{setTab(name);setSettingsOpen(false);}} style={{minHeight:76,width:29,padding:"7px 3px",fontSize:10,writingMode:"vertical-rl",textOrientation:"mixed",border:0,borderLeft:tab===name&&!settingsOpen?"3px solid var(--theme-secondary,#e8cb83)":"3px solid transparent",background:"transparent",color:"var(--theme-foreground,#fff3d4)",fontWeight:tab===name&&!settingsOpen?700:500,cursor:"pointer"}}>{name}</button>)}
    </div>
   </div>
   <div ref={stageRef} className="profile-shared-stage profile-scroll-stage" style={{position:"absolute",top:"clamp(165px,25vh,220px)",bottom:0,left:0,right:0,minHeight:0,display:"flex",zIndex:999}}>
   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery profile-with-shared-avatar profile-scroll-viewport" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"color-mix(in srgb,var(--theme-base,#101114) 22%,transparent)",backdropFilter:"blur(16px)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 30%,transparent)",borderRadius:24,padding:0,scrollbarWidth:"thin",overscrollBehaviorY:"contain"}}>
    <div className="profile-construction" role="status" aria-label="Profile editor under construction">
      <div className="profile-construction-rope profile-construction-rope-top" aria-hidden="true"/>
      <div className="profile-construction-copy">
        <span className="profile-construction-kicker">1MUSLIM · COMING SOON</span>
        <h2>UNDER CONSTRUCTION</h2>
        <p>1Muslim Profile Editor</p>
        <strong>Studio 1.1</strong>
      </div>
      <div className="profile-construction-rope profile-construction-rope-bottom" aria-hidden="true"/>
    </div>
    {false&&<div key={tab} className="profile-scroll-content-expanded profile-slide-synced-content" style={{display:"flex",flexDirection:"column",gap:0,minHeight:"100%",width:"100%"}}><div style={{flex:"0 0 auto",position:"relative",minWidth:0}}>{profile??<p>Sign in to see your profile.</p>}</div><footer aria-label="End of Profile section" style={{flexShrink:0,marginTop:"auto",padding:"34px 0 24px",textAlign:"center",fontSize:11,letterSpacing:".14em",opacity:.7,pointerEvents:"none"}}>— 1Muslim ©️ —</footer></div>}
   </div>

   </div>
  </div>
 </section><style jsx>{`.profile-construction{width:100%;min-height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:24px 12px;text-align:center;color:var(--theme-foreground,#fff);animation:constructionEnter .65s cubic-bezier(.2,.8,.2,1) both}.profile-construction-copy{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;max-width:100%}.profile-construction-kicker{font-size:10px;letter-spacing:.22em;opacity:.75}.profile-construction h2{font-size:clamp(20px,5vw,36px);letter-spacing:.08em;line-height:1.2;margin:0;font-weight:850}.profile-construction p{font-size:clamp(14px,3vw,19px);margin:0}.profile-construction strong{font-size:12px;letter-spacing:.18em;color:var(--theme-secondary,#d8c38e)}.profile-construction-rope{height:7px;width:110%;flex-shrink:0;background:repeating-linear-gradient(110deg,rgba(255,196,64,.85) 0 20px,rgba(20,20,20,.85) 20px 40px);box-shadow:0 2px 10px #0005;transform:rotate(-4deg)}.profile-construction-rope-bottom{transform:rotate(4deg)}@keyframes constructionEnter{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.profile-construction{animation:none}}`}</style></>
}
