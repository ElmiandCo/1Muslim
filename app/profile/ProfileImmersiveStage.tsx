"use client";

import {useEffect,useRef,useState} from "react";
import HudHudFocusStage,{type HudHudLine,type HudHudWebResult} from "../hudhud/HudHudFocusStage";

export type ProfileSearchRequest={token:number;query:string;mode:"search"|"hudhud"};
type WebSearchItem={title:string;url:string;source:string;description?:string;thumbnailUrl?:string};
type WebSearchPayload={results?:WebSearchItem[];error?:string};
type HudHudPayload={reply?:string;presentation?:HudHudLine["presentation"];verses?:HudHudLine["verses"];images?:HudHudLine["images"];matches?:HudHudLine["matches"];error?:string};

function safeTopWebResult(data:WebSearchPayload):HudHudWebResult|undefined{
 const result=data.results?.find(item=>{
  try{const url=new URL(item.url);return (url.protocol==="https:"||url.protocol==="http:")&&!!item.title}catch{return false}
 });
 if(!result)return;
 return {title:result.title,url:result.url,source:result.source||new URL(result.url).hostname,
  description:result.description||"",
  thumbnailUrl:result.thumbnailUrl?.startsWith("https://")?result.thumbnailUrl:undefined};
}

/** The profile Home and full HudHud screen render the SAME response stage. */
export default function ProfileImmersiveStage({request}:{request:ProfileSearchRequest|null}){
 const [lines,setLines]=useState<HudHudLine[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const historyRef=useRef<HudHudLine[]>([]);
 useEffect(()=>{
  if(!request?.query.trim())return;
  const controller=new AbortController();
  const q=request.query.trim().slice(0,900);
  const previous=historyRef.current.slice(-6).map(line=>({role:line.role,content:line.content}));
  setBusy(true);setError("");
  void (async()=>{
   const isPhoto=/\b(photo|photos|picture|pictures|image|images)\b/i.test(q);
   // The web provider remains independent. No first-party or religious-domain boost.
   const webPromise=isPhoto?Promise.resolve(undefined):fetch("/api/web-search?q="+encodeURIComponent(q.slice(0,120))+"&type=web",
     {signal:controller.signal,cache:"no-store"}).then(async response=>{
       if(!response.ok)return undefined;
       return safeTopWebResult(await response.json() as WebSearchPayload);
     }).catch(()=>undefined);
   let ai:HudHudPayload|null=null,aiError="";
   try{
    const response=await fetch("/api/discover/ask",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({query:q.slice(0,90),message:q,history:previous}),
     signal:controller.signal,cache:"no-store"});
    const payload=await response.json() as HudHudPayload;
    if(!response.ok)throw Error(payload.error||"HudHud is temporarily unavailable.");
    if(!payload.reply?.trim())throw Error("HudHud did not return an answer.");
    ai=payload;
   }catch(caught){aiError=caught instanceof Error?caught.message:"HudHud is temporarily unavailable."}
   const webResult=await webPromise;
   if(controller.signal.aborted)return;
   if(!ai&&!webResult){setError(aiError||"Unable to search. Please try again.");setBusy(false);return}
   const assistant:HudHudLine={
    role:"assistant",
    content:ai?.reply?.trim()||"Here is the top independent website result for your search.",
    presentation:ai?.presentation,verses:ai?.verses,images:ai?.images,matches:ai?.matches,
    webResult:ai?.presentation?.kind==="verse"||ai?.presentation?.kind==="image"?undefined:webResult
   };
   const next=[...historyRef.current,{role:"user",content:q} as HudHudLine,assistant].slice(-36);
   historyRef.current=next;setLines(next);setBusy(false);
   if(!ai&&webResult)setError("HudHud's answer is unavailable, but this web result is ready.");
  })();
  return()=>controller.abort();
 },[request]);
 return <section className="profileHudFocusRegion" aria-label="HudHud immersive response stage">
   {!request&&!lines.length&&<div className="profileHudEmpty" aria-hidden="true"><span>Ask anything.</span><small>One question. One clear view.</small></div>}
   <HudHudFocusStage lines={lines} sessionId="profile-search" busy={busy} speakingAt={null} speechChar={0} persist/>
   {error&&<p className="profileHudError" role="alert">{error}</p>}
 </section>;
}
