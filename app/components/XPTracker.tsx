"use client";
import {levelForXp,levelStartXp,levelEndXp} from "../lib/xpLevels";
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
const levelFor=levelForXp;
const levelStart=levelStartXp;
const levelEnd=levelEndXp;

export default function XPTracker(){
  const supabase=useMemo(()=>createClient(),[]);
  const [userId,setUserId]=useState<string|null>(null),[xp,setXp]=useState(0),[notice,setNotice]=useState<string|null>(null);
  const [activeSeconds,setActiveSeconds]=useState(0);
  const [xpVisible,setXpVisible]=useState(false);
  const levelRef=useRef<number|null>(null);
  const hideTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const showLevelUp=(nextXp:number)=>{const next=levelFor(nextXp);if(levelRef.current===null){levelRef.current=next;return;}if(next>levelRef.current){setXpVisible(true);if(hideTimer.current)clearTimeout(hideTimer.current);hideTimer.current=setTimeout(()=>setXpVisible(false),6000);}levelRef.current=next;};
  useEffect(()=>()=>{if(hideTimer.current)clearTimeout(hideTimer.current)},[]);

  useEffect(()=>{
    if(!userId)return;
    const refresh=async()=>{
      const {data}=await supabase.from("profiles").select("xp_total").eq("id",userId).maybeSingle();
      if(data){const total=Number(data.xp_total||0);showLevelUp(total);setXp(total)}
    };
    window.addEventListener("1muslim-xp-updated",refresh);
    return()=>window.removeEventListener("1muslim-xp-updated",refresh);
  },[supabase,userId]);
  const [rewardToast,setRewardToast]=useState<{id:number;amount:number}|null>(null);
  const rewardTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const currentXp=useRef<number|null>(null);
  const showReward=(amount:number)=>{
    if(amount<=0)return;
    setRewardToast({id:Date.now(),amount});
    if(rewardTimer.current)clearTimeout(rewardTimer.current);
    rewardTimer.current=setTimeout(()=>setRewardToast(null),2400);
  };
  useEffect(()=>{
    if(!userId)return;
    let alive=true;
    const sync=(total:number,animate:boolean)=>{
      if(!alive||!Number.isFinite(total))return;
      const previous=currentXp.current;
      if(animate&&previous!==null&&total>previous&&total-previous!==50)showReward(total-previous);
      currentXp.current=total;
      showLevelUp(total);setXp(total);
      window.dispatchEvent(new CustomEvent("1muslim:xp-balance",{detail:{xp_total:total}}));
    };
    const onAward=(event:Event)=>{
      const detail=(event as CustomEvent<{xp_total:number;xp_awarded:number}>).detail;
      if(!detail||!Number.isFinite(Number(detail.xp_total)))return;
      const total=Number(detail.xp_total),previous=currentXp.current;
      if(previous===null||total>previous){const amount=Number(detail.xp_awarded)||Math.max(0,total-(previous??total));if(amount!==50)showReward(amount);sync(total,false)}
    };
    const channel=supabase.channel("xp-profile-"+userId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"profiles",filter:"id=eq."+userId},payload=>{
        const total=Number((payload.new as {xp_total?:number}).xp_total);
        sync(total,true);
      }).subscribe();
    window.addEventListener("1muslim:xp-awarded",onAward);
    const refresh=()=>{if(document.visibilityState==="visible")void supabase.from("profiles").select("xp_total").eq("id",userId).maybeSingle().then(({data})=>{if(data)sync(Number(data.xp_total||0),false)})};
    document.addEventListener("visibilitychange",refresh);
    return()=>{alive=false;void supabase.removeChannel(channel);window.removeEventListener("1muslim:xp-awarded",onAward);document.removeEventListener("visibilitychange",refresh);if(rewardTimer.current)clearTimeout(rewardTimer.current)};
  },[supabase,userId]);
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
      if(mounted){const total=Number(p?.xp_total??0);setXp(total);currentXp.current=total;levelRef.current=levelFor(total);}
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
        if(awarded>0){showLevelUp(Number(data.xp_total||0));setXp(Number(data.xp_total||0));setNotice("+"+awarded+" XP");window.setTimeout(()=>setNotice(null),1800);}
      });
    };

    const events=["mousemove","pointerdown","keydown","touchstart","scroll","wheel"];
    events.forEach(name=>window.addEventListener(name,markActivity,{passive:true}));
    document.addEventListener("click",onClick,true);
    return()=>{mounted=false;events.forEach(name=>window.removeEventListener(name,markActivity));document.removeEventListener("click",onClick,true)};
  },[supabase,userId]);

  useEffect(()=>{
    if(!userId)return;
    let alive=true;
    const award=(total:number,amount:number,silent:boolean)=>{
      if(!alive||amount<=0)return;
      const previous=currentXp.current;
      currentXp.current=total;
      showLevelUp(total);setXp(total);
      if(!silent)showReward(amount);
      window.dispatchEvent(new CustomEvent("1muslim:xp-balance",{detail:{xp_total:total}}));
    };
    // Claim daily reward on reconnect and when the app returns to the foreground.
    const daily=async()=>{
      if(document.visibilityState!=="visible")return;
      const {data,error}=await supabase.rpc("claim_daily_presence_xp");
      if(error)return;
      const row=Array.isArray(data)?data[0]:data;
      if(row?.awarded)award(Number(row.xp_total),Number(row.awarded),false);
    };
    void daily();
    const mediaIsPlaying=()=>Array.from(document.querySelectorAll<HTMLMediaElement>("video,audio")).some(media=>!media.paused&&!media.ended&&media.readyState>=2);
    let pending=false;
    const timer=window.setInterval(async()=>{
      const active=document.visibilityState==="visible"&&(mediaIsPlaying()||Date.now()-lastActivity.current<60_000);
      if(!active||pending)return;
      activeRef.current=Math.min(60,activeRef.current+15);
      setActiveSeconds(activeRef.current);
      if(activeRef.current<60)return;
      pending=true;
      try{
        const {data,error}=await supabase.rpc("claim_active_minute_xp");
        if(!error){
          const row=Array.isArray(data)?data[0]:data;
          if(row?.awarded)award(Number(row.xp_total),Number(row.awarded),true);
        }
      }finally{
        activeRef.current=0;setActiveSeconds(0);pending=false;
      }
    },15000);
    const onVisible=()=>{if(document.visibilityState==="visible"){lastActivity.current=Date.now();activeRef.current=0;setActiveSeconds(0);void daily()}else{activeRef.current=0;setActiveSeconds(0)}};
    document.addEventListener("visibilitychange",onVisible);
    return()=>{alive=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible)};
  },[supabase,userId]);

  if(!userId)return null;
  const level=levelFor(xp),start=levelStart(level),end=levelEnd(level),progress=Math.min(100,Math.max(0,((xp-start)/(end-start))*100));
  const timeProgress=Math.min(100,activeSeconds/0.6);
  return <>{rewardToast&&<div key={rewardToast.id} role="status" aria-live="polite" style={{position:"fixed",top:"18%",left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"12px 24px",borderRadius:24,background:"var(--theme-primary, #147c5b)",color:"#fff",fontWeight:900,fontSize:20,boxShadow:"0 10px 35px #0005",pointerEvents:"none",animation:"xpRewardPop .4s ease-out"}}>✨ +{rewardToast.amount.toLocaleString()} XP<style>{`@keyframes xpRewardPop{from{opacity:0;translate:0 14px;scale:.8}to{opacity:1;translate:0 0;scale:1}}@media(prefers-reduced-motion:reduce){.xpRewardPop{animation:none}}`}</style></div>}{xpVisible&&<><div className="xpSpotlight" aria-hidden="true"/><div ref={trackerRef} className="xpTracker" aria-live="polite" style={position?{left:position.x,top:position.y,right:"auto",bottom:"auto"}:undefined} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} title="Drag to move XP tracker">
    <style jsx>{`
      .xpSpotlight{position:fixed;inset:0;z-index:89;pointer-events:none;background:rgba(0,0,0,.28);animation:xpDimIn .5s ease-out both}\n      @keyframes xpDimIn{from{opacity:0}to{opacity:1}}\n      @keyframes xpReveal{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}\n      .xpTracker{animation:xpReveal .55s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 0 0 1px rgba(190,240,206,.18),0 0 32px rgba(137,230,173,.25),0 14px 38px rgba(0,0,0,.28)!important}\n      @media(prefers-reduced-motion:reduce){.xpSpotlight,.xpTracker{animation:none!important}}\n      .xpTracker{position:fixed;right:18px;bottom:82px;z-index:90;width:220px;padding:10px 11px;border:1px solid rgba(151,187,158,.25);border-radius:16px;background:rgba(8,13,10,.88);backdrop-filter:blur(16px);box-shadow:0 14px 38px rgba(0,0,0,.28);pointer-events:auto;cursor:grab;touch-action:none;user-select:none;color:#eef5ef}
      .xpTracker:active{cursor:grabbing}.top{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:850}.xp{color:#b7e0bd}.bar,.time{height:4px;border-radius:99px;background:#202b23;overflow:hidden;margin-top:7px}.fill{height:100%;background:linear-gradient(90deg,#8bbd94,#d8e9da);transition:width .5s ease}.time{height:2px;margin-top:5px}.time .fill{opacity:.55}.meta{display:flex;justify-content:space-between;margin-top:5px;color:#7e8c82;font-size:8px}.notice{position:absolute;right:10px;bottom:calc(100% + 7px);background:#dfeee1;color:#0b150d;border-radius:10px;padding:6px 8px;font-weight:900;font-size:10px;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.25)}
      @media(max-width:600px){.xpTracker{right:10px;bottom:72px;width:190px}.top{font-size:9px}}
    `}</style>
    {notice&&<span className="notice">{notice}</span>}
    <div className="top"><span>Level {level}</span><span className="xp">{xp.toLocaleString()} XP</span></div>
    <div className="bar"><div className="fill" style={{width:progress+"%"}}/></div>
    <div className="time"><div className="fill" style={{width:timeProgress+"%"}}/></div>
    <div className="meta"><span>{level===10?"Maximum level":Math.max(0,end-xp).toLocaleString()+" to next level"}</span><span>+50 / active minute</span></div>
  </div></>}</>
}
