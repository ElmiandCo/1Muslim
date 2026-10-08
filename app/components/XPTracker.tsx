"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const classify=(el:Element|null)=>{
  const node=el?.closest("button,a,[role='button']");
  if(!node)return null;
  const text=((node.textContent||"")+" "+(node.getAttribute("aria-label")||"")).toLowerCase();
  const href=(node.getAttribute("href")||"").toLowerCase();
  if(text.includes("live")||href.includes("/streaming")) return "open_live";
  if(text.includes("course")||href.includes("/learn")) return "open_course";
  if(text.includes("qur")) return "open_quran";
  if(text.includes("prayer")||text.includes("salah")) return "open_prayer";
  if(text.includes("story")) return "create_story";
  if(text.includes("post")) return "create_post";
  if(text.includes("comment")) return "comment";
  if(text.includes("share")) return "share";
  if(text.includes("follow")) return "follow";
  if(text.includes("find")||href.includes("/find")) return "open_find";
  if(href.includes("/profile")) return "open_profile";
  return "general";
};
const levelFor=(xp:number)=>Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/100))+1);
const levelStart=(level:number)=>(level-1)*(level-1)*100;
const levelEnd=(level:number)=>level*level*100;

export default function XPTracker(){
  const supabase=useMemo(()=>createClient(),[]);
  const [userId,setUserId]=useState<string|null>(null),[xp,setXp]=useState(0),[notice,setNotice]=useState<string|null>(null);
  const [activeSeconds,setActiveSeconds]=useState(0);
  const lastClick=useRef<Record<string,number>>({});
  const activeRef=useRef(0);
  const lastActivity=useRef(Date.now());

  const [position,setPosition]=useState<{x:number;y:number}|null>(null);
  const drag=useRef<{id:number;startX:number;startY:number;originX:number;originY:number;w:number;h:number}|null>(null);
  const trackerRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    try{const saved=localStorage.getItem("1muslim-xp-position");if(saved){const p=JSON.parse(saved);if(Number.isFinite(p.x)&&Number.isFinite(p.y))setPosition({x:p.x,y:p.y});}}catch{}
  },[]);
  useEffect(()=>{
    const clamp=()=>setPosition(prev=>{
      if(!prev)return prev;
      const w=trackerRef.current?.offsetWidth||220,h=trackerRef.current?.offsetHeight||80;
      return {x:Math.max(8,Math.min(prev.x,window.innerWidth-w-8)),y:Math.max(8,Math.min(prev.y,window.innerHeight-h-8))};
    });
    window.addEventListener("resize",clamp);
    return()=>window.removeEventListener("resize",clamp);
  },[]);
  const startDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const rect=trackerRef.current?.getBoundingClientRect();if(!rect)return;
    drag.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,originX:rect.left,originY:rect.top,w:rect.width,h:rect.height};
    e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();
  };
  const moveDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    const d=drag.current;if(!d||d.id!==e.pointerId)return;
    setPosition({x:Math.max(8,Math.min(d.originX+e.clientX-d.startX,window.innerWidth-d.w-8)),y:Math.max(8,Math.min(d.originY+e.clientY-d.startY,window.innerHeight-d.h-8))});
  };
  const endDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(drag.current?.id!==e.pointerId)return;
    drag.current=null;
    setPosition(prev=>{if(prev)try{localStorage.setItem("1muslim-xp-position",JSON.stringify(prev));}catch{}return prev;});
  };
  const idleTimeout=60_000;
  const storageKey=useRef("1muslim-xp-active-seconds");

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getUser().then(async({data})=>{
      if(!mounted||!data.user)return;
      setUserId(data.user.id);
      storageKey.current="1muslim-xp-active-seconds:"+data.user.id;
      const saved=Number(sessionStorage.getItem(storageKey.current)||0);
      activeRef.current=Math.min(299,Number.isFinite(saved)?saved:0);
      setActiveSeconds(activeRef.current);
      const {data:p}=await supabase.from("profiles").select("xp_total").eq("id",data.user.id).maybeSingle();
      if(mounted)setXp(p?.xp_total??0);
    });

    const markActivity=()=>{lastActivity.current=Date.now();};
    const onClick=(e:MouseEvent)=>{
      markActivity();
      if(!userId)return;
      const key=classify(e.target as Element);
      if(!key)return;
      const now=Date.now(), previous=lastClick.current[key]||0;
      if(now-previous<120000)return;
      lastClick.current[key]=now;
      void supabase.rpc("award_xp",{p_action_key:key,p_page_key:window.location.pathname}).then(({data})=>{
        const awarded=Number(data?.awarded||0);
        if(awarded>0){setXp(Number(data.xp_total||0));setNotice("+"+awarded+" XP");window.setTimeout(()=>setNotice(null),1800);}
      });
    };

    const events=["mousemove","pointerdown","keydown","touchstart","scroll","wheel"];
    events.forEach(name=>window.addEventListener(name,markActivity,{passive:true}));
    document.addEventListener("click",onClick,true);
    return()=>{mounted=false;events.forEach(name=>window.removeEventListener(name,markActivity));document.removeEventListener("click",onClick,true)};
  },[supabase,userId]);

  useEffect(()=>{
    if(!userId)return;
    const mediaIsPlaying=()=>Array.from(document.querySelectorAll<HTMLMediaElement>("video,audio")).some((media)=>!media.paused&&!media.ended&&media.readyState>=2);
    const timer=window.setInterval(async()=>{
      const visible=document.visibilityState==="visible";
      const activelyWatching=mediaIsPlaying();
      const recentlyActive=Date.now()-lastActivity.current<idleTimeout;
      const isActive=visible&&(activelyWatching||recentlyActive);
      if(!isActive)return;

      activeRef.current=Math.min(300,activeRef.current+15);
      sessionStorage.setItem(storageKey.current,String(activeRef.current));
      setActiveSeconds(activeRef.current);

      if(activeRef.current>=300){
        const {data}=await supabase.rpc("claim_time_xp");
        const awarded=Number(data?.awarded||0);
        if(awarded){
          setXp(Number(data.xp_total||0));
          setNotice("+500 XP · 5 minutes active");
          window.setTimeout(()=>setNotice(null),2200);
          activeRef.current=0;
          sessionStorage.setItem(storageKey.current,"0");
          setActiveSeconds(0);
        }
      }
    },15000);
    return()=>window.clearInterval(timer);
  },[supabase,userId]);

  if(!userId)return null;
  const level=levelFor(xp),start=levelStart(level),end=levelEnd(level),progress=Math.min(100,Math.max(0,((xp-start)/(end-start))*100));
  const timeProgress=Math.min(100,activeSeconds/3);
  return <div ref={trackerRef} className="xpTracker" aria-live="polite" style={position?{left:position.x,top:position.y,right:"auto",bottom:"auto"}:undefined} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} title="Drag to move XP tracker">
    <style jsx>{`
      .xpTracker{position:fixed;right:18px;bottom:82px;z-index:90;width:220px;padding:10px 11px;border:1px solid rgba(151,187,158,.25);border-radius:16px;background:rgba(8,13,10,.88);backdrop-filter:blur(16px);box-shadow:0 14px 38px rgba(0,0,0,.28);pointer-events:auto;cursor:grab;touch-action:none;user-select:none;color:#eef5ef}
      .xpTracker:active{cursor:grabbing}.top{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:850}.xp{color:#b7e0bd}.bar,.time{height:4px;border-radius:99px;background:#202b23;overflow:hidden;margin-top:7px}.fill{height:100%;background:linear-gradient(90deg,#8bbd94,#d8e9da);transition:width .5s ease}.time{height:2px;margin-top:5px}.time .fill{opacity:.55}.meta{display:flex;justify-content:space-between;margin-top:5px;color:#7e8c82;font-size:8px}.notice{position:absolute;right:10px;bottom:calc(100% + 7px);background:#dfeee1;color:#0b150d;border-radius:10px;padding:6px 8px;font-weight:900;font-size:10px;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.25)}
      @media(max-width:600px){.xpTracker{right:10px;bottom:72px;width:190px}.top{font-size:9px}}
    `}</style>
    {notice&&<span className="notice">{notice}</span>}
    <div className="top"><span>Level {level}</span><span className="xp">{xp.toLocaleString()} XP</span></div>
    <div className="bar"><div className="fill" style={{width:progress+"%"}}/></div>
    <div className="time"><div className="fill" style={{width:timeProgress+"%"}}/></div>
    <div className="meta"><span>{Math.max(0,end-xp).toLocaleString()} to next level</span><span>+500 / 5 min active</span></div>
  </div>
}
