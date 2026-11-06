"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../../utils/supabase/client";

type Comment={id:string;body:string;at_seconds:number};
type Floating=Comment&{born:number;until:number;lane:"screen"|"canvas";pinned:boolean};
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
   setFloating(current=>[...current.filter(c=>c.until>now),...due.map((c,i)=>({...c,born:now+i*240,until:now+8000+i*240,lane:i%2===0?"canvas" as const:"screen" as const,pinned:false}))].slice(-5));
 },[seconds,playing,videoKey,entries]);
 useEffect(()=>{const timer=window.setInterval(()=>setFloating(items=>items.filter(c=>c.until>Date.now())),300);return()=>window.clearInterval(timer)},[]);
 const pin=(id:string)=>setFloating(items=>items.map(item=>item.id===id&&!item.pinned?{...item,pinned:true,until:item.until+5000}:item));
 if(!ready||!videoKey||bounds.w<=0||bounds.h<=0)return null;
 return createPortal(<div className="elmi-timed-layers" aria-label="Timed video comments">
   {floating.map((comment,i)=><button key={comment.id} type="button" onClick={()=>pin(comment.id)} className={"elmi-timed-comment "+(comment.lane==="canvas"?"is-canvas":"is-screen")+(comment.pinned?" is-pinned":"")} style={{left:comment.lane==="canvas"?bounds.x+bounds.w*(.15+(i%3)*.11):Math.max(16,window.innerWidth*.16+(i%3)*28),bottom:comment.lane==="canvas"?Math.max(30,window.innerHeight-bounds.y-bounds.h+20):16,animationDuration:comment.pinned?"13s":"8s",animationDelay:(i%3)*160+"ms"}} title={comment.pinned?"Pinned for 5 extra seconds":"Tap to pin for 5 extra seconds"}><span className="elmi-timed-time">{Math.floor(comment.at_seconds/60)}:{String(comment.at_seconds%60).padStart(2,"0")}{comment.pinned?" · 📌":""}</span><span>{comment.body}</span></button>)}
   <style>{`
    .elmi-timed-layers{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden}
    .elmi-timed-comment{position:absolute;display:flex;flex-direction:column;gap:3px;max-width:min(340px,65vw);padding:7px 12px;text-align:left;color:white;font-size:clamp(12px,1.3vw,14px);font-weight:600;line-height:1.35;border:1px solid color-mix(in srgb,var(--theme-primary,#a6dce0) 32%,transparent);border-radius:13px;background:rgba(10,18,26,.24);backdrop-filter:blur(5px);text-shadow:0 1px 5px #000;box-shadow:0 5px 18px #0003;pointer-events:auto;cursor:pointer;animation:elmi-layer-float 8s ease-in-out both;will-change:transform,opacity}
    .elmi-timed-comment.is-screen{z-index:2}.elmi-timed-comment.is-canvas{z-index:1}
    .elmi-timed-comment.is-pinned{border-color:color-mix(in srgb,var(--theme-primary,#a6dce0) 65%,transparent)}
    .elmi-timed-time{font-size:10px;font-weight:700;opacity:.85}
    @keyframes elmi-layer-float{0%{opacity:0;transform:translateY(34px) rotate(-1deg)}18%{opacity:.96;transform:translateY(2px) rotate(.5deg)}45%,68%{opacity:.97;transform:translateY(-16px) rotate(0)}100%{opacity:0;transform:translateY(-95px) rotate(1deg)}}
    @media(prefers-reduced-motion:reduce){.elmi-timed-comment{animation:none;opacity:1}}
   `}</style>
 </div>,document.body);
}
