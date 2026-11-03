"use client";
import {useRef,useState} from "react";
type Props={src?:string;duration:number;audio:boolean};
export default function ReplayThumbnail({src,duration,audio}:Props){
 const video=useRef<HTMLVideoElement>(null);
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);
 const start=Math.min(8,Math.max(0,duration-0.5));
 const end=Math.min(10,Math.max(start+0.25,duration));
 const seek=()=>{const el=video.current;if(!el)return;try{el.currentTime=Math.min(start,Math.max(0,(el.duration||duration)-0.1))}catch{}};
 const play=()=>{const el=video.current;if(!el||!src)return;seek();void el.play().catch(()=>{})};
 const pause=()=>{const el=video.current;if(!el)return;el.pause();seek()};
 return <div className="liveThumb replayPreview" onPointerEnter={play} onPointerLeave={pause} onFocus={play} onBlur={pause}>
 {src&&!audio&&!failed&&<video ref={video} src={src} muted playsInline preload="metadata" aria-hidden="true" onLoadedMetadata={seek} onSeeked={()=>setReady(true)} onError={()=>setFailed(true)} onTimeUpdate={()=>{const el=video.current;if(el&&el.currentTime>=end)el.currentTime=start}} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:ready?1:0,transition:"opacity .25s"}}/>}
 {(!ready||audio||failed)&&<span className="liveThumbMark">{audio?"♫":"▶"}</span>}
 <span className="liveNow">REPLAY</span><span className="replayPlay" aria-hidden="true">▶</span>
 <style jsx>{`.replayPreview{overflow:hidden;position:relative;background:linear-gradient(145deg,#13221b,#070b08)}.replayPreview video{position:absolute;inset:0}.replayPreview .replayPlay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:26px;color:#e2f7d2;text-shadow:0 2px 12px #000b;pointer-events:none}.replayPreview .liveNow{z-index:2}.replayPreview .liveThumbMark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}@media(prefers-reduced-motion:reduce){.replayPreview video{transition:none}}`}</style>
 </div>
}