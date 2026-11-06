"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../../utils/supabase/client";

type Comment={id:string;body:string;at_seconds:number};
type Floating=Comment&{born:number;until:number;lane:"screen"|"canvas";pinned:boolean;pausedUntil:number};
type Bounds={x:number;y:number;w:number;h:number};
export default function ElmiTimedCommentsLayer({videoKey,seconds,playing,bounds}:{videoKey:string;seconds:number;playing:boolean;bounds:Bounds}){
 const [entries,setEntries]=useState<Comment[]>([]);
 const [floating,setFloating]=useState<Floating[]>([]);
 const seen=useRef(new Set<string>());
 const previous=useRef(-1);
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 useEffect(()=>{
   let live=true;seen.current.clear();previous.current=-1;setEntries([]);setFloating([]);
   if(!videoKey)return;
   const db=createClient();
   const load=async()=>{const {data,error}=await db.from("featured_video_timed_comments").select("id,body,at_seconds").eq("video_key",videoKey).order("at_seconds",{ascending:true}).limit(500);if(live&&!error)setEntries((data||[]) as Comment[])};
   void load();const timer=window.setInterval(()=>void load(),15000);
   return()=>{live=false;window.clearInterval(timer)};
 },[videoKey]);
 useEffect(()=>{
   if(!playing||!videoKey)return;
   if(previous.current>=0&&(seconds<previous.current-2||seconds>previous.current+4)){seen.current.clear();setFloating([])}
   previous.current=seconds;
   const due=entries.filter(c=>Math.abs(c.at_seconds-seconds)<=1&&!seen.current.has(c.id)).slice(0,4);
   if(!due.length)return;
   const now=Date.now();due.forEach(c=>seen.current.add(c.id));
   setFloating(current=>[...current.filter(c=>c.until>now),...due.map((c,i)=>({...c,born:now+i*240,until:now+8000+i*240,lane:i%2===0?"canvas" as const:"screen" as const,pinned:false,pausedUntil:0}))].slice(-5));
 },[seconds,playing,videoKey,entries]);
 useEffect(()=>{const timer=window.setInterval(()=>setFloating(items=>items.filter(c=>c.until>Date.now())),300);return()=>window.clearInterval(timer)},[]);
 const pin=(id:string)=>setFloating(items=>items.map(item=>item.id===id&&!item.pinned?{...item,pinned:true,pausedUntil:Date.now()+5000,until:item.until+5000}:item));
 if(!ready||!videoKey||bounds.w<=0||bounds.h<=0)return null;
 // One DOM node and one continuous animation per comment. No reparenting or remounting at crossover.
 // Canvas-to-screen depth is represented by a single viewport portal; its path crosses
 // the carousel boundary without any position or opacity discontinuity.
 return createPortal(<div className="elmi-timed-layers" aria-label="Timed video comments">
   {floating.map((comment,i)=>{
     const canvasStart=comment.lane==="canvas";
     const startX=canvasStart?bounds.x+bounds.w*(.2+(i%3)*.09):Math.max(16,window.innerWidth*.17+(i%3)*28);
     const startY=canvasStart?bounds.y+bounds.h*.48:window.innerHeight-36;
     const endY=Math.max(-85,bounds.y-115);
     const distance=Math.max(120,startY-endY);
     const paused=comment.pausedUntil>Date.now();
     return <button key={comment.id} type="button" onClick={()=>pin(comment.id)}
       className={"elmi-timed-comment"+(canvasStart?" is-handoff":" is-screen")+(comment.pinned?" is-pinned":"")}
       style={{left:startX,top:startY,"--elmi-travel":-distance+"px",animationPlayState:paused?"paused":"running",animationDelay:(i%3)*160+"ms"} as React.CSSProperties}
       title={comment.pinned?"Pinned for 5 extra seconds":"Tap to pin for 5 extra seconds"}>
       <span className="elmi-timed-time">{Math.floor(comment.at_seconds/60)}:{String(comment.at_seconds%60).padStart(2,"0")}{comment.pinned?" · 📌":""}</span><span>{comment.body}</span>
     </button>
   })}
   <style>{`
    .elmi-timed-layers{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;isolation:isolate}
    .elmi-timed-comment{position:absolute;display:flex;flex-direction:column;gap:3px;max-width:min(340px,65vw);padding:7px 12px;text-align:left;color:white;font-size:clamp(12px,1.3vw,14px);font-weight:600;line-height:1.35;border:1px solid color-mix(in srgb,var(--theme-primary,#a6dce0) 32%,transparent);border-radius:13px;background:rgba(10,18,26,.24);backdrop-filter:blur(5px);text-shadow:0 1px 5px #000;box-shadow:0 5px 18px #0003;pointer-events:auto;cursor:pointer;animation:elmi-layer-handoff 8s cubic-bezier(.38,.12,.4,.94) both;will-change:transform,opacity;z-index:2}
    .elmi-timed-comment.is-handoff{z-index:2}.elmi-timed-comment.is-screen{z-index:3}
    .elmi-timed-comment.is-pinned{border-color:color-mix(in srgb,var(--theme-primary,#a6dce0) 65%,transparent)}
    .elmi-timed-time{font-size:10px;font-weight:700;opacity:.85}
    @keyframes elmi-layer-handoff{
      0%{opacity:0;transform:translate3d(0,25px,0) scale(.88) rotate(-.8deg)}
      12%{opacity:.92;transform:translate3d(0,calc(var(--elmi-travel)*.10),0) scale(.94) rotate(.3deg)}
      36%{opacity:.97;transform:translate3d(0,calc(var(--elmi-travel)*.34),0) scale(1) rotate(-.3deg)}
      52%{opacity:.97;transform:translate3d(0,calc(var(--elmi-travel)*.53),0) scale(1.035) rotate(.2deg)}
      78%{opacity:.92;transform:translate3d(0,calc(var(--elmi-travel)*.82),0) scale(1.06) rotate(-.2deg)}
      100%{opacity:0;transform:translate3d(0,var(--elmi-travel),0) scale(1.09) rotate(0)}
    }
    @media(prefers-reduced-motion:reduce){.elmi-timed-comment{animation:none;opacity:1}}
   `}</style>
 </div>,document.body);
}
