"use client";
import { useEffect, useRef, useState } from "react";

const builtIn:Record<string,string>={
 "Watch. Learn. Reflect. Together.":"شاهد. تعلّم. تأمّل. معًا.",
 "Watch. Learn. Reflect.":"شاهد. تعلّم. تأمّل.",
 "Live Now":"مباشر الآن",
 "Watch Muslims who are live":"شاهد المسلمين الذين يبثون مباشرة",
 "Welcome":"مرحبًا",
 "Home":"الرئيسية",
 "Learn":"تعلّم",
 "Rewards":"المكافآت",
 "Messages":"الرسائل",
 "Go Live":"ابدأ البث المباشر",
 "Community":"المجتمع",
 "Stories":"القصص",
 "Start where you are.":"ابدأ من حيث أنت."
};
export default function HudHudSelectionTranslate(){
 const [selection,setSelection]=useState<{text:string,x:number,y:number}|null>(null);
 const [translated,setTranslated]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const lastRequest=useRef(0);
 useEffect(()=>{
  const update=()=>{
   const sel=window.getSelection();
   const text=sel?.toString().trim()||"";
   const anchor=sel?.anchorNode;
   const el=anchor?.nodeType===Node.ELEMENT_NODE?anchor as Element:anchor?.parentElement;
   if(!text||text.length>1200||!el||el.closest("[data-no-translate],input,textarea,select,[contenteditable],script,style")){setSelection(null);return}
   const range=sel?.rangeCount?sel.getRangeAt(0):null;
   const rect=range?.getBoundingClientRect();
   if(!rect||!rect.width){setSelection(null);return}
   setSelection({text,x:Math.min(window.innerWidth-170,Math.max(12,rect.left+rect.width/2-65)),y:Math.max(10,rect.top-52)});
   setTranslated(null);setError("");
  };
  document.addEventListener("mouseup",update);
  document.addEventListener("keyup",update);
  document.addEventListener("touchend",update);
  return()=>{document.removeEventListener("mouseup",update);document.removeEventListener("keyup",update);document.removeEventListener("touchend",update)};
 },[]);
 const translate=async()=>{
  if(!selection)return;
  const request=++lastRequest.current;
  setLoading(true);setError("");setTranslated(null);
  const text=selection.text;
  if(builtIn[text]){setTimeout(()=>{if(request===lastRequest.current){setTranslated(builtIn[text]);setLoading(false)}},650);return}
  try{
   const res=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({texts:[text],target:"ar"})});
   if(!res.ok)throw Error("unavailable");
   const data=await res.json();
   if(request===lastRequest.current)setTranslated(String(data.translations?.[0]||""));
  }catch{if(request===lastRequest.current)setError("Translation service is not configured for this text yet.")}
  finally{if(request===lastRequest.current)setLoading(false)}
 };
 if(!selection)return null;
 return <div data-no-translate="true" className="hudhud-selection-popup" style={{left:selection.x,top:selection.y}}>
  <button type="button" className="hudhud-selection-trigger" onMouseDown={e=>e.preventDefault()} onClick={translate} disabled={loading}>🐦 ✨ {loading?"Translating…":"Translate with HudHud"}</button>
  {(loading||translated||error)&&<div className={"hudhud-selection-result"+(loading?" hudhud-selection-loading":"")} role="status">
   {loading?<span>✨ HudHud is translating…</span>:translated?<><div lang="ar" dir="rtl">{translated}</div><button type="button" onClick={()=>{setTranslated(null);setSelection(null);window.getSelection()?.removeAllRanges()}}>Show original ✕</button></>:<span>{error}</span>}
  </div>}
 </div>;
}
