"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
type Motion={x:number;y:number;strength:number}|null;
export default function HudHudLiveOrb(){
 const pathname=usePathname()||"/",router=useRouter();
 const live=pathname.startsWith("/streaming");
 const onStage=pathname.startsWith("/streaming/go-live");
 const [cameraReady,setCameraReady]=useState(false);
 const [motion,setMotion]=useState<Motion>(null);
 const [enabled,setEnabled]=useState(true);
 const [target,setTarget]=useState<HTMLElement|null>(null);
 const taps=useRef<number[]>([]);
 const toggle=()=>{setEnabled(v=>{const next=!v;window.dispatchEvent(new CustomEvent("1muslim:hudhud-toggle",{detail:{enabled:next}}));return next})};
 const sections=()=>Array.from(document.querySelectorAll<HTMLElement>("main section,main article,main h2,[data-hudhud-target]")).filter(el=>{const r=el.getBoundingClientRect();return r.width>80&&r.height>20&&getComputedStyle(el).visibility!=="hidden"});
 const advance=()=>{const items=sections();if(!items.length)return;const next=items.find(el=>el.getBoundingClientRect().top>100)||items[0];next.scrollIntoView({behavior:"smooth",block:"start"});setTarget(next)};
 const selectTarget=()=>{if(!target)return false;const action=target.matches("button,a")?target:target.querySelector<HTMLElement>("a[href],button:not([disabled])");if(action){action.click();setTarget(null);return true}return false};
 const pointer=useRef<{x:number;y:number;held:boolean;timer:number|null}|null>(null);
 const scrollTimer=useRef<number|null>(null);
 const motionRef=useRef<Motion>(null);
 useEffect(()=>{if(!onStage){setCameraReady(false);return}const check=()=>{const videos=Array.from(document.querySelectorAll("video"));setCameraReady(videos.some(v=>{const stream=v.srcObject;return stream instanceof MediaStream&&stream.getVideoTracks().some(t=>t.readyState==="live"&&t.enabled)}))};check();const t=window.setInterval(check,1000);return()=>window.clearInterval(t)},[onStage]);
 const stop=()=>{if(pointer.current?.timer!==null&&pointer.current?.timer!==undefined)window.clearTimeout(pointer.current.timer);pointer.current=null;motionRef.current=null;setMotion(null);if(scrollTimer.current!==null){window.clearInterval(scrollTimer.current);scrollTimer.current=null}};
 const scroll=()=>{const m=motionRef.current;if(!m)return;const horizontal=Math.abs(m.x)>Math.abs(m.y);const candidates=Array.from(document.querySelectorAll<HTMLElement>('[data-hudhud-scroll], [role="listbox"], .carousel, [class*="carousel"], [class*="Carousel"], [class*="scroll"]')).filter(el=>{const r=el.getBoundingClientRect();return r.width>80&&r.height>40&&r.top<innerHeight&&r.bottom>0&&(horizontal?el.scrollWidth>el.clientWidth+10:el.scrollHeight>el.clientHeight+10)});const target=candidates[0];const amount=Math.max(2,Math.round(m.strength*17));const dx=horizontal?Math.sign(m.x)*amount:0,dy=horizontal?0:Math.sign(m.y)*amount;if(target)target.scrollBy({left:dx,top:dy,behavior:"instant"});else if(!horizontal)window.scrollBy({top:dy,behavior:"instant"})};
 const move=(x:number,y:number)=>{const p=pointer.current;if(!p)return;const dx=x-p.x,dy=y-p.y;if(!p.held&&Math.hypot(dx,dy)>16){p.held=true;if(p.timer!==null)window.clearTimeout(p.timer)}if(!p.held)return;const distance=Math.hypot(dx,dy);const strength=Math.min(1,distance/125);motionRef.current={x:dx,y:dy,strength};setMotion(motionRef.current);if(scrollTimer.current===null)scrollTimer.current=window.setInterval(scroll,35)};
 const activate=()=>{if(onStage){window.dispatchEvent(new Event("1muslim:hudhud-orb-start-live"));return}const now=Date.now();taps.current=[...taps.current.filter(t=>now-t<1100),now];const count=taps.current.length;if(count===1){toggle();return}if(count>=4){taps.current=[];advance();advance();return}if(count===3&&selectTarget()){taps.current=[];return}if(count===2){advance();return}if(onStage){if(cameraReady){const start=document.querySelector<HTMLButtonElement>("[data-go-live-start]");if(start&&!start.disabled){start.click();return}}return}if(live){router.push("/streaming/go-live");return}window.dispatchEvent(new CustomEvent("1muslim:hudhud-smart-orb",{detail:{action:"open"}}))};
 return <div className="hhLiveOrbWrap">
 <button type="button" className={"dockCenter hhLiveOrb "+(live?"hhLiveOrbRed ":"")+(enabled?"hhLiveOrbEnabled":"hhLiveOrbMuted")} aria-label="HudHud: tap to toggle, tap again to navigate, hold and drag to scroll" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointer.current={x:e.clientX,y:e.clientY,held:false,timer:window.setTimeout(()=>{if(pointer.current)pointer.current.held=true},450)}}} onPointerMove={e=>move(e.clientX,e.clientY)} onPointerUp={()=>{const held=pointer.current?.held;stop();if(!held)activate()}} onPointerCancel={stop} onContextMenu={e=>e.preventDefault()}>
 <img src="/assets/hudhud-logo.PNG" alt=""/><span className="dockCenterText">{live?"HudHud Live":enabled?"HudHud":"Paused"}</span>
 </button>
 {motion&&<div className="hhOrbVector" role="status" aria-label="Scroll direction and strength" style={{transform:`translateX(-50%) rotate(${Math.atan2(motion.y,motion.x)*180/Math.PI+90}deg)`,opacity:.55+motion.strength*.45}}><span style={{transform:`scale(${.7+motion.strength*.8})`}}>▲</span><i style={{height:6+motion.strength*24}}/></div>}
 <style jsx>{`.hhLiveOrbWrap{position:relative;display:flex;align-items:center;justify-content:center}.hhLiveOrb{touch-action:none;user-select:none;cursor:grab;animation:hhOrbFloat 3.8s ease-in-out infinite;transition:filter .3s ease,box-shadow .3s ease,background .3s ease}.hhLiveOrb:active{animation-play-state:paused;filter:brightness(1.3);transform:scale(.96)}.hhLiveOrbMuted{opacity:.65;filter:grayscale(.5)}@keyframes hhOrbFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}@media(prefers-reduced-motion:reduce){.hhLiveOrb{animation:none}}.hhLiveOrbRed{box-shadow:0 0 23px #ff354b99!important;border-color:#ff5269!important;background:radial-gradient(circle,#812333,#2b1025)!important}.hhLiveOrbRed img{filter:drop-shadow(0 0 8px #ff405c)}.hhOrbVector{position:absolute;left:50%;bottom:100%;z-index:10050;pointer-events:none;display:grid;justify-items:center;color:#69fbe5;filter:drop-shadow(0 0 8px #47e9dc)}.hhOrbVector span{font-size:32px;line-height:1}.hhOrbVector i{width:5px;background:linear-gradient(#65fbe5,transparent);border-radius:9px}`}</style>
 </div>
}
