"use client";

import {useEffect,useRef,useState} from "react";
import HudHudFocusStage,{type HudHudLine} from "../hudhud/HudHudFocusStage";
import {getHudHudTopWebResult} from "../lib/hudhud-top-web";

export type ProfileSearchRequest={token:number;query:string;mode:"search"|"hudhud"};
type HudHudPayload={reply?:string;presentation?:HudHudLine["presentation"];verses?:HudHudLine["verses"];images?:HudHudLine["images"];matches?:HudHudLine["matches"];error?:string};

/** The profile Home and full HudHud screen render the SAME response stage. */
export default function ProfileImmersiveStage({request,onReply,onSettled,persist=true,showEmpty=true,speaking=false,spokenChars=0}:{request:ProfileSearchRequest|null;onReply?:(answer:string)=>void;onSettled?:()=>void;persist?:boolean;showEmpty?:boolean;speaking?:boolean;spokenChars?:number}){
 const onReplyRef=useRef(onReply);onReplyRef.current=onReply;
 const onSettledRef=useRef(onSettled);onSettledRef.current=onSettled;
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
   const webPromise=isPhoto?Promise.resolve(undefined):getHudHudTopWebResult(q,controller.signal).catch(()=>undefined);
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
   if(controller.signal.aborted)return;
   if(ai){
    const assistant:HudHudLine={
     role:"assistant",content:ai.reply!.trim(),
     presentation:ai.presentation,verses:ai.verses,images:ai.images,matches:ai.matches
    };
    const next=[...historyRef.current,{role:"user",content:q} as HudHudLine,assistant].slice(-36);
    historyRef.current=next;setLines(next);setBusy(false);onReplyRef.current?.(assistant.content);onSettledRef.current?.();
    // Do not make someone wait for external website retrieval to read or hear
    // the answer. Append the independent first hit when it is available.
    if(ai.presentation?.kind!=="verse"&&ai.presentation?.kind!=="image")
     void webPromise.then(webResult=>{
      if(!webResult||controller.signal.aborted)return;
      const updated=historyRef.current.map((line,index)=>index===next.length-1&&line.role==="assistant"&&line.content===assistant.content
       ?{...line,webResult}:line);
      historyRef.current=updated;setLines(updated);
     }).catch(()=>{});
    return;
   }
   const webResult=await webPromise;
   if(controller.signal.aborted)return;
   if(!webResult){setError(aiError||"Unable to search. Please try again.");setBusy(false);onSettledRef.current?.();return}
   const assistant:HudHudLine={role:"assistant",content:"Here is the top independent website result for your search.",webResult};
   const next=[...historyRef.current,{role:"user",content:q} as HudHudLine,assistant].slice(-36);
   historyRef.current=next;setLines(next);setBusy(false);onReplyRef.current?.(assistant.content);onSettledRef.current?.();
   setError("HudHud's answer is unavailable, but this web result is ready.");
  })();
  return()=>controller.abort();
 },[request]);
 return <section className="profileHudFocusRegion" aria-label="HudHud immersive response stage">
   {showEmpty&&!request&&!lines.length&&<div className="profileHudEmpty" aria-hidden="true"><span>Ask anything.</span><small>One question. One clear view.</small></div>}
   <HudHudFocusStage lines={lines} sessionId="profile-search" busy={busy} speakingAt={speaking&&lines.length?{sessionId:"profile-search",index:lines.length-1}:null} speechChar={spokenChars} persist={persist} idleAfterMs={persist?20_000:5_000}/>
   {error&&<p className="profileHudError" role="alert">{error}</p>}
 </section>;
}
