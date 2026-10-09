"use client";
import { useEffect, useRef, useState } from "react";

type Lang = "en" | "ar" | "so";
const labels: Record<Lang,string> = { en:"English", ar:"العربية", so:"Soomaali" };
const UI = {en:["Translate with HudHud","Translating…","Translation ready","Translation unavailable"],ar:["ترجم مع هدهد","جارٍ الترجمة…","اكتملت الترجمة","الترجمة غير متاحة"],so:["Ku turjun HudHud","Waa la turjumayaa…","Turjumaaddu waa diyaar","Turjumaad lama heli karo"]};
export default function HudHudTranslate() {
  const [lang,setLang]=useState<Lang>("en");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [settings,setSettings]=useState(false);
  const [chat,setChat]=useState(false);
  const [position,setPosition]=useState<{x:number;y:number}|null>(null);
  const dragging=useRef<{x:number;y:number;originX:number;originY:number}|null>(null);
  const originals=useRef(new WeakMap<Text,string>());
  const sourceNodes=useRef(new Set<Text>());
  const generation=useRef(0);
  const active=useRef<Lang>("en");
  const cache=useRef(new Map<string,string>());
  const pending=useRef(false);
  const suppress=useRef(false);
  useEffect(()=>{const stored=localStorage.getItem("1muslim-language");if(stored==="ar"||stored==="so")setLang(stored)},[]);
  useEffect(()=>{
    let observer:MutationObserver|undefined;
    const ignored=(n:Text)=>{const el=n.parentElement;return !el||!!el.closest("[data-no-translate],script,style,textarea,input,select,option,code,pre,[contenteditable='true']")};
    const collect=()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n:Node|null;while((n=walker.nextNode())){const t=n as Text;if(ignored(t)||!t.textContent?.trim())continue;if(!originals.current.has(t)){originals.current.set(t,t.textContent);sourceNodes.current.add(t)}}};
    const run=async(target:Lang)=>{
      const id=++generation.current;active.current=target;localStorage.setItem("1muslim-language",target);
      document.documentElement.lang=target;document.documentElement.dir=target==="ar"?"rtl":"ltr";
      setBusy(target!=="en");setNotice("");
      collect();
      if(target==="en"){for(const n of sourceNodes.current){if(n.isConnected){const original=originals.current.get(n);if(original!==undefined)n.textContent=original}}setBusy(false);return}
      const nodes=[...sourceNodes.current].filter(n=>n.isConnected);
      const unique=[...new Set(nodes.map(n=>originals.current.get(n)??"").filter(s=>s.trim()))];
      const missing=unique.filter(s=>!cache.current.has(target+"|"+s));
      try {
        for(let i=0;i<missing.length;i+=30){
          if(id!==generation.current)return;
          const batch=missing.slice(i,i+30);
          const res=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({texts:batch,target})});
          if(!res.ok)throw new Error("translation service unavailable");
          const data=await res.json();
          if(!Array.isArray(data.translations)||data.translations.length!==batch.length)throw new Error("invalid translation");
          batch.forEach((s,j)=>cache.current.set(target+"|"+s,String(data.translations[j])));
        }
        if(id!==generation.current)return;
        observer?.disconnect();
        suppress.current=true;
        nodes.forEach(n=>{const original=originals.current.get(n)??"";const translated=cache.current.get(target+"|"+original);if(translated!==undefined)n.textContent=translated});
        setNotice(UI[target][2]);
        suppress.current=false;
      }catch{if(id===generation.current){setNotice(UI[target][3]);setLang("en")}}
      finally{if(id===generation.current)setBusy(false);suppress.current=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true})}
    };
    const schedule=()=>{if(suppress.current||pending.current)return;pending.current=true;setTimeout(()=>{pending.current=false;if(active.current!=="en")void run(active.current);else collect()},400)};
    observer=new MutationObserver(schedule);
    void run(lang);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>{generation.current++;observer.disconnect()};
  },[lang]);
  return <div className="hudhud-translator" data-no-translate="true" aria-live="polite" style={position?{left:position.x,top:position.y,right:"auto",bottom:"auto"}:undefined}>
    <button type="button" aria-label="Drag HudHud" title="Drag to move HudHud" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.parentElement!.getBoundingClientRect();dragging.current={x:e.clientX,y:e.clientY,originX:r.left,originY:r.top}}} onPointerMove={e=>{if(!dragging.current)return;const d=dragging.current;setPosition({x:Math.max(0,Math.min(window.innerWidth-220,d.originX+e.clientX-d.x)),y:Math.max(0,Math.min(window.innerHeight-60,d.originY+e.clientY-d.y))})}} onPointerUp={()=>{dragging.current=null}} style={{touchAction:"none",cursor:"grab",border:0,background:"transparent",color:"white",fontSize:18}}>⠿</button>
    <img className={busy?"hudhud-translator-bird translating":"hudhud-translator-bird"} src="/assets/hudhud-logo.PNG" alt="HudHud" onError={e=>{e.currentTarget.style.display="none"}} />
    <label htmlFor="hudhud-language">🌐 <span>{UI[lang][0]}</span></label>
    <select id="hudhud-language" value={lang} onChange={e=>{setNotice("");setLang(e.target.value as Lang)}} aria-label="Website language">
      {(Object.keys(labels) as Lang[]).map(l=><option key={l} value={l}>{labels[l]}</option>)}
    </select>
    <button type="button" aria-label="HudHud settings" onClick={()=>{setSettings(v=>!v);setChat(false)}} style={{background:"transparent",color:"white",border:0,cursor:"pointer"}}>⚙️</button>
    <button type="button" aria-label="HudHud chat" onClick={()=>{setChat(v=>!v);setSettings(false)}} style={{background:"transparent",color:"white",border:0,cursor:"pointer"}}>💬</button>
    {settings&&<div className="hudhud-panel"><strong>HudHud Settings</strong><p>Website language: English, Somali, or Arabic</p><button type="button" onClick={()=>{setPosition(null);setSettings(false)}}>Reset position</button></div>}
    {chat&&<div className="hudhud-panel"><strong>Chat with HudHud</strong><p>AI chat is not connected yet. You can use 1Muslim messages while this is being prepared.</p><a href="/messages">Open messages →</a></div>}
    {busy&&<span className="hudhud-shine" role="status">{UI[lang][1]}</span>}
    {!busy&&notice&&<span className="hudhud-translate-status">{notice}</span>}
  </div>;
}
