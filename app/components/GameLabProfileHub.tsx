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
 const [savePulse,setSavePulse]=useState(false);
 const saveAndReturn=()=>{const focused=document.activeElement;if(focused instanceof HTMLElement)focused.blur();window.dispatchEvent(new CustomEvent("1muslim:profile-save-request"));setSavePulse(true);mirrorRef.current?.scrollTo({top:0,behavior:"smooth"});window.setTimeout(()=>setSavePulse(false),1100);};
 const stageRef=useRef<HTMLDivElement>(null);
 const workspaceRef=useRef<HTMLElement>(null);
 const [heroPosition,setHeroPosition]=useState<{top:number;left:number;width:number;height:number}|null>(null);
 useEffect(()=>{
  if(!active){setHeroPosition(null);return;}
  let frame=0;
  let lastTop=Number.NaN,lastLeft=Number.NaN,lastWidth=Number.NaN,lastHeight=Number.NaN;
  // HudHud moves the navigation using transforms, which ResizeObserver cannot detect.
  // Follow the actual rendered workspace rect each frame, including during fullscreen morphs.
  const track=()=>{
   const rect=workspaceRef.current?.getBoundingClientRect();
   if(rect&&rect.width>0&&rect.height>0){
    const top=Math.round(rect.top);
    const left=Math.round(rect.left+rect.width/2);
    const width=Math.round(rect.width),height=Math.round(rect.height);
    if(top!==lastTop||left!==lastLeft||width!==lastWidth||height!==lastHeight){
     lastTop=top;lastLeft=left;lastWidth=width;lastHeight=height;setHeroPosition({top,left,width,height});
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
   <div ref={stageRef} className="profile-shared-stage profile-scroll-stage" style={{position:"absolute",top:"clamp(165px,25vh,220px)",bottom:0,left:0,right:0,minHeight:0,display:"flex",zIndex:999}}>   <div ref={mirrorRef} role="tabpanel" aria-label={tab} className="canvas-umma-vertical-gallery profile-with-shared-avatar profile-scroll-viewport" data-profile-mirror-scroll style={{flex:"1 1 auto",height:"100%",minHeight:0,maxHeight:"100%",width:"100%",boxSizing:"border-box",overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",WebkitOverflowScrolling:"touch",background:"color-mix(in srgb,var(--theme-base,#101114) 22%,transparent)",backdropFilter:"blur(16px)",border:"1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 30%,transparent)",borderRadius:24,padding:0,scrollbarWidth:"thin",overscrollBehaviorY:"contain"}}>
    {<div key={tab} className="profile-scroll-content-expanded profile-slide-synced-content" style={{display:"flex",flexDirection:"column",gap:0,minHeight:"100%",width:"100%"}}><div style={{flex:"0 0 auto",position:"relative",minWidth:0}}>{profile??<p>Sign in to see your profile.</p>}</div><footer aria-label="End of Profile section" style={{flexShrink:0,marginTop:"auto",padding:"34px 0 24px",textAlign:"center",fontSize:11,letterSpacing:".14em",opacity:.7,pointerEvents:"none"}}>— 1Muslim ©️ —</footer></div>}
   </div>
   <button type="button" className={"profile-mirror-save"+(savePulse?" profile-mirror-save-pulse":"")} onClick={saveAndReturn} aria-label="Save profile changes and return to top">Save</button>
   </div>
  </div>
 </section><style jsx>{`.profile-mirror-save{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:1001;width:min(72%,290px);min-height:30px;padding:5px 18px;border-radius:999px;border:1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 58%,transparent);color:var(--theme-foreground,#fff);background:color-mix(in srgb,var(--theme-base,#101114) 23%,transparent);backdrop-filter:blur(24px) saturate(145%);-webkit-backdrop-filter:blur(24px) saturate(145%);box-shadow:0 0 14px color-mix(in srgb,var(--theme-secondary,#d8c38e) 35%,transparent),inset 0 1px 0 #ffffff44;font-size:12px;font-weight:650;letter-spacing:.1em;cursor:pointer;transition:background .35s,border-color .35s,box-shadow .35s}.profile-mirror-save-pulse{box-shadow:0 0 28px var(--theme-secondary,#d8c38e),inset 0 1px 0 #ffffff66}.profile-scroll-viewport{padding-bottom:54px!important}`.profile-construction{width:100%;min-height:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:clamp(16px,5vw,36px);text-align:center;color:var(--theme-foreground,#fff);animation:constructionEnter .65s cubic-bezier(.2,.8,.2,1) both}.profile-construction-copy{width:min(100%,440px);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:clamp(24px,6vw,42px) 18px;border:1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 48%,transparent);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.025) 45%,rgba(0,0,0,.16));backdrop-filter:blur(22px) saturate(145%);-webkit-backdrop-filter:blur(22px) saturate(145%);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 18px 50px rgba(0,0,0,.22)}.profile-construction-symbol{font-size:30px;color:var(--theme-secondary,#d8c38e)}.profile-construction h2{font-size:clamp(22px,5vw,34px);letter-spacing:.01em;line-height:1.2;margin:0;font-weight:750}.profile-construction p{font-size:clamp(15px,3.5vw,19px);margin:0;line-height:1.5}.profile-construction strong{color:var(--theme-secondary,#d8c38e);font-weight:750}.profile-construction-return{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 24px;margin-top:8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--theme-secondary,#d8c38e) 55%,transparent);background:rgba(255,255,255,.055);font-size:17px;font-weight:650;box-shadow:inset 0 1px 0 #ffffff20}@keyframes constructionEnter{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.profile-construction{animation:none}}`}</style></>
}
