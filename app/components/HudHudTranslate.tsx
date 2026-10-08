"use client";
import { useEffect, useRef, useState } from "react";

type Lang = "en" | "ar" | "so";
const labels: Record<Lang,string> = { en:"English", ar:"العربية", so:"Soomaali" };
const UI = {en:["Translate with HudHud","Translating…","Translation ready","Translation unavailable"],ar:["ترجم مع هدهد","جارٍ الترجمة…","اكتملت الترجمة","الترجمة غير متاحة"],so:["Ku turjun HudHud","Waa la turjumayaa…","Turjumaaddu waa diyaar","Turjumaad lama heli karo"]};
export default function HudHudTranslate() {
  const [lang,setLang]=useState<Lang>("en");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const originals=useRef(new WeakMap<Text,string>());
  const sourceNodes=useRef(new Set<Text>());
  const generation=useRef(0);
  const active=useRef<Lang>("en");
  const cache=useRef(new Map<string,string>());
  const pending=useRef(false);
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
        nodes.forEach(n=>{const original=originals.current.get(n)??"";const translated=cache.current.get(target+"|"+original);if(translated!==undefined)n.textContent=translated});
        setNotice(UI[target][2]);
      }catch{if(id===generation.current){setNotice(UI[target][3]);setLang("en")}}
      finally{if(id===generation.current)setBusy(false);observer?.observe(document.body,{subtree:true,childList:true,characterData:true})}
    };
    const schedule=()=>{if(pending.current)return;pending.current=true;setTimeout(()=>{pending.current=false;if(active.current!=="en")void run(active.current);else collect()},400)};
    observer=new MutationObserver(schedule);
    void run(lang);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>{generation.current++;observer.disconnect()};
  },[lang]);
  return <div className="hudhud-translator" data-no-translate="true" aria-live="polite">
    <img className={busy?"hudhud-translator-bird translating":"hudhud-translator-bird"} src="/assets/hudhud-logo.PNG" alt="HudHud" onError={e=>{e.currentTarget.style.display="none"}} />
    <label htmlFor="hudhud-language">🌐 <span>{UI[lang][0]}</span></label>
    <select id="hudhud-language" value={lang} onChange={e=>setLang(e.target.value as Lang)} disabled={busy} aria-label="Website language">
      {(Object.keys(labels) as Lang[]).map(l=><option key={l} value={l}>{labels[l]}</option>)}
    </select>
    {busy&&<span className="hudhud-shine" role="status">{UI[lang][1]}</span>}
    {!busy&&notice&&<span className="hudhud-translate-status">{notice}</span>}
  </div>;
}
