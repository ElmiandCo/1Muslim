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
   <div style={{position:"absolute",top:48,left:0,right:"auto",flexShrink:0,zIndex:30,display:"flex",alignItems:"center",flexDirection:"column",gap:6,background:"color-mix(in srgb,var(--theme-base,#101114) 70%,transparent)",backdropFilter:"blur(12px)",borderRadius:"0 12px 12px 0",padding:"6px 3px",marginBottom:0,border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 55%,transparent)"}}>
    <button type="button" aria-label="Profile settings" title="Settings" aria-pressed={settingsOpen} onClick={()=>{setTab("My Profile");setSettingsOpen(v=>!v)}} style={{border:0,borderRadius:8,background:"transparent",color:"#f5df9c",padding:"5px 7px",fontSize:16,lineHeight:1,cursor:"pointer"}}>⚙</button>
    <div role="tablist" aria-label="Profile sections" style={{display:"flex",flexDirection:"column",alignItems:"stretch",gap:6,minWidth:0}}>
     {tabs.map(name=><button key={name} role="tab" type="button" aria-selected={tab===name&&!settingsOpen} onClick={()=>{setTab(name);setSettingsOpen(false);}} style={{minHeight:76,width:29,padding:"7px 3px",fontSize:10,writingMode:"vertical-rl",textOrientation:"mixed",border:0,borderLeft:tab===name&&!settingsOpen?"3px solid var(--theme-secondary,#e8cb83)":"3px solid transparent",background:"transparent",color:"var(--theme-foreground,#fff3d4)",fontWeight:tab===name&&!settingsOpen?700:500,cursor:"pointer"}}>{name}</button>)}
    </div>
   </div>
   <div ref={stageRef} className="profile-shared-stage profile-scroll-stage" style={{position:"absolute",top:"clamp(105px,15vh,145px)",bottom:-12,left:12,right:12,minHeight:0,display:"flex",zIndex:12}}>
   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery profile-with-shared-avatar profile-scroll-viewport" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"linear-gradient(155deg,color-mix(in srgb,var(--theme-base,#101114) 32%,transparent),rgba(12,29,51,.34) 60%,rgba(8,14,22,.42))",backdropFilter:"blur(16px)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 35%,transparent)",borderRadius:26,padding:"20px 14px 32px",scrollbarWidth:"thin",overscrollBehaviorY:"contain"}}>
    {tab==="The Umma"?<CanvasUmmaGallery active={active} embedded/>:settingsOpen&&renderProfileSection?renderProfileSection("Settings"):<div aria-label="Profile gallery layout preview" style={{width:"100%",minHeight:"100%",display:"flex",flexDirection:"column",gap:12,padding:"10px 6px 28px",boxSizing:"border-box"}}>
    <div style={{height:36,width:"48%",borderRadius:12,background:"color-mix(in srgb,var(--theme-secondary,#d8c38e) 18%,transparent)",marginBottom:8}} aria-hidden="true"/>
    {Array.from({length:14},(_,i)=><div key={i} aria-hidden="true" style={{flex:"0 0 auto",minHeight:96,borderRadius:20,border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 20%,transparent)",background:"linear-gradient(110deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 50%,rgba(255,255,255,.07))",boxShadow:"inset 0 1px 0 #ffffff12",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
      <span style={{width:54,height:54,flexShrink:0,borderRadius:"50%",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 30%,transparent)",background:"rgba(255,255,255,.07)"}}/>
      <span style={{flex:1,display:"flex",flexDirection:"column",gap:12}}><span style={{height:12,width:`${48+(i%4)*9}%`,borderRadius:9,background:"rgba(255,255,255,.13)"}}/><span style={{height:9,width:"65%",borderRadius:9,background:"rgba(255,255,255,.07)"}}/></span>
    </div>)}
   </div>}{false&&<div key={tab} className="profile-scroll-content-expanded profile-slide-synced-content" style={{display:"flex",flexDirection:"column",gap:0,minHeight:"100%",width:"100%"}}><div style={{flex:"0 0 auto",position:"relative",minWidth:0}}>{profile??<p>Sign in to see your profile.</p>}</div><footer aria-label="End of Profile section" style={{flexShrink:0,marginTop:"auto",padding:"34px 0 24px",textAlign:"center",fontSize:11,letterSpacing:".14em",opacity:.7,pointerEvents:"none"}}>— 1Muslim ©️ —</footer></div>}
   </div>

   </div>
  </div>
 </section></>
}
