"use client";
import {useEffect,useState} from "react";
import TimedVideoPlayer from "./TimedVideoPlayer";
type Mini={videoId:string;at:number;origin:string;scrollY:number};
const KEY="1muslim-daily-video-mini-state";
export default function PersistentDailyVideo(){
 const [mini,setMini]=useState<Mini|null>(null);
 const [collapsed,setCollapsed]=useState(false);
 const [pipNotice,setPipNotice]=useState("");
 const openPiP=async()=>{setPipNotice("");const iframe=document.querySelector('aside[aria-label="Floating Video of the Day"] iframe') as HTMLIFrameElement|null;if(iframe){setPipNotice("For YouTube videos, use the player’s Picture-in-Picture option if available. Browser restrictions prevent 1Muslim from forcing it.");return}const video=document.querySelector('aside[aria-label="Floating Video of the Day"] video') as HTMLVideoElement|null;if(!video||!document.pictureInPictureEnabled){setPipNotice("Picture-in-Picture is unavailable for this video or browser.");return}try{await video.requestPictureInPicture()}catch{setPipNotice("Your browser blocked Picture-in-Picture.")}};
 useEffect(()=>{
  const restore=()=>{try{if(sessionStorage.getItem("1muslim-daily-mini")==="1"){const saved=sessionStorage.getItem(KEY);if(saved)setMini(JSON.parse(saved) as Mini)}}catch{}};
  restore();
  const minimize=(event:Event)=>{const e=event as CustomEvent<{videoId:string;at:number}>;if(!e.detail?.videoId)return;
   const next={videoId:e.detail.videoId,at:e.detail.at,origin:window.location.pathname+window.location.search,scrollY:window.scrollY};
   sessionStorage.setItem(KEY,JSON.stringify(next));sessionStorage.setItem("1muslim-daily-mini","1");setMini(next);setCollapsed(false);
  };
  window.addEventListener("1muslim-daily-video-minimize",minimize);
  const expand=()=>{const saved=sessionStorage.getItem(KEY);let target=mini;try{if(saved)target=JSON.parse(saved) as Mini}catch{};if(!target)return;
   sessionStorage.setItem("1muslim-daily-video-resume",String(target.at));
   sessionStorage.removeItem(KEY);sessionStorage.removeItem("1muslim-daily-mini");setMini(null);window.dispatchEvent(new Event("1muslim-daily-video-state"));
   if(window.location.pathname!==target.origin.split("?")[0])window.location.assign(target.origin+"#daily-video");else{window.requestAnimationFrame(()=>{document.querySelector('[aria-label="Video of the Day"]')?.scrollIntoView({behavior:"smooth",block:"center"});if(window.location.pathname==="/video-of-the-day")window.scrollTo({top:target.scrollY,behavior:"smooth"})})}
  };
  window.addEventListener("1muslim-daily-video-expand",expand);
  return()=>{window.removeEventListener("1muslim-daily-video-minimize",minimize);window.removeEventListener("1muslim-daily-video-expand",expand)};
 },[mini]);
 const close=()=>{sessionStorage.removeItem(KEY);sessionStorage.removeItem("1muslim-daily-mini");setMini(null);window.dispatchEvent(new Event("1muslim-daily-video-state"))};
 if(!mini)return null;
 return <aside aria-label="Floating Video of the Day" style={{position:"fixed",bottom:"calc(82px + env(safe-area-inset-bottom, 0px))",right:12,zIndex:1050,width:"min(340px,calc(100vw - 24px))",maxHeight:"min(75dvh,650px)",background:"linear-gradient(145deg,#0d281e,#081611)",border:"1px solid #65dba877",borderRadius:20,boxShadow:"0 20px 70px #000c,0 0 20px #32d48620",overflow:"hidden",color:"#e9fff2",animation:"dailyMiniEnter .35s ease-out"}}>
 <header style={{display:"flex",alignItems:"center",gap:7,padding:"10px 12px",background:"#102e23",borderBottom:"1px solid #ffffff18"}}>
 <strong style={{fontSize:12,flex:1}}>✦ Video of the Day · Watching together</strong>
 <button onClick={()=>void openPiP()} aria-label="Try floating video outside browser" title="Picture-in-Picture" style={buttonStyle}>▣</button>
 <button onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?"Show video":"Hide video details"} style={buttonStyle}>{collapsed?"▢":"−"}</button>
 <button onClick={()=>window.dispatchEvent(new Event("1muslim-daily-video-expand"))} aria-label="Expand video back to its page" style={buttonStyle}>⤢</button>
 <button onClick={close} aria-label="Close floating video" style={buttonStyle}>×</button>
 </header>
 {pipNotice&&<p role="status" style={{padding:"5px 12px",fontSize:11,color:"#b5e9d0",margin:0}}>{pipNotice}</p>}
 <div style={{overflowY:"auto",maxHeight:"min(67dvh,580px)",padding:collapsed?0:9}}>
 {collapsed?<button type="button" onClick={()=>setCollapsed(false)} style={{...buttonStyle,padding:12,width:"100%"}}>▶ Show video and comments</button>:<TimedVideoPlayer videoId={mini.videoId} title="Video of the Day" startSeconds={mini.at}/>}
 </div>
 <style>{`@keyframes dailyMiniEnter{from{opacity:0;transform:translateY(22px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){aside[aria-label="Floating Video of the Day"]{animation:none!important}}`}</style>
 </aside>;
}
const buttonStyle:React.CSSProperties={border:"1px solid #ffffff24",background:"#ffffff0a",color:"#d8fbe5",borderRadius:9,padding:"4px 9px",cursor:"pointer",fontSize:17};
