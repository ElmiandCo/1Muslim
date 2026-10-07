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
  const [seconds,setSeconds]=useState(0);
  const lastClick=useRef<Record<string,number>>({});
  const sessionStart=useRef<number>(Date.now());
  useEffect(()=>{
    let mounted=true;
    supabase.auth.getUser().then(async({data})=>{
      if(!mounted||!data.user)return;
      setUserId(data.user.id);
      const {data:p}=await supabase.from("profiles").select("xp_total").eq("id",data.user.id).maybeSingle();
      if(mounted)setXp(p?.xp_total??0);
    });
    const onClick=(e:MouseEvent)=>{
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
    document.addEventListener("click",onClick,true);
    return()=>{mounted=false;document.removeEventListener("click",onClick,true)};
  },[supabase,userId]);
  useEffect(()=>{
    if(!userId)return;
    const timer=window.setInterval(()=>setSeconds(Math.floor((Date.now()-sessionStart.current)/1000)),1000);
    const claim=async()=>{
      const {data}=await supabase.rpc("claim_time_xp");
      const awarded=Number(data?.awarded||0);
      if(awarded){setXp(Number(data.xp_total||0));setNotice("+500 XP · 5 minutes active");window.setTimeout(()=>setNotice(null),2200);sessionStart.current=Date.now();}
    };
    const every=window.setInterval(claim,15000);
    return()=>{window.clearInterval(timer);window.clearInterval(every)};
  },[supabase,userId]);
  if(!userId)return null;
  const level=levelFor(xp),start=levelStart(level),end=levelEnd(level),progress=Math.min(100,Math.max(0,((xp-start)/(end-start))*100));
  const timeProgress=Math.min(100,(seconds%300)/3);
  return <div className="xpTracker" aria-live="polite">
    <style jsx>{`
      .xpTracker{position:fixed;right:18px;bottom:82px;z-index:90;width:220px;padding:10px 11px;border:1px solid rgba(151,187,158,.25);border-radius:16px;background:rgba(8,13,10,.88);backdrop-filter:blur(16px);box-shadow:0 14px 38px rgba(0,0,0,.28);pointer-events:none;color:#eef5ef}
      .top{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:850}.xp{color:#b7e0bd}.bar,.time{height:4px;border-radius:99px;background:#202b23;overflow:hidden;margin-top:7px}.fill{height:100%;background:linear-gradient(90deg,#8bbd94,#d8e9da);transition:width .5s ease}.time{height:2px;margin-top:5px}.time .fill{opacity:.55}.meta{display:flex;justify-content:space-between;margin-top:5px;color:#7e8c82;font-size:8px}.notice{position:absolute;right:10px;bottom:calc(100% + 7px);background:#dfeee1;color:#0b150d;border-radius:10px;padding:6px 8px;font-weight:900;font-size:10px;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.25)}
      @media(max-width:600px){.xpTracker{right:10px;bottom:72px;width:190px}.top{font-size:9px}}
    `}</style>
    {notice&&<span className="notice">{notice}</span>}
    <div className="top"><span>Level {level}</span><span className="xp">{xp.toLocaleString()} XP</span></div>
    <div className="bar"><div className="fill" style={{width:progress+"%"}}/></div>
    <div className="time"><div className="fill" style={{width:timeProgress+"%"}}/></div>
    <div className="meta"><span>{Math.max(0,end-xp).toLocaleString()} to next level</span><span>+500 / 5 min</span></div>
  </div>
}