"use client";
import {useEffect,useState} from "react";
import {createClient} from "../utils/supabase/client";

/** Advisory only: viewer-side failures never end the host's room. */
export default function LiveHostHealthWarning({streamId}:{streamId:string}){
 const [warning,setWarning]=useState<{count:number;reference:string}|null>(null);
 useEffect(()=>{
  if(!streamId)return;
  const db=createClient();
  const incidents=new Map<string,number>();
  const channel=db.channel("live-health:"+streamId);
  channel.on("broadcast",{event:"viewer-error"},({payload})=>{
   const reference=typeof payload?.reference==="string"?payload.reference.slice(0,80):"";
   if(!reference)return;
   const now=Date.now();
   incidents.set(reference,now);
   for(const [id,time] of incidents)if(now-time>60000)incidents.delete(id);
   // Avoid alarming the host for a single viewer/device issue.
   if(incidents.size>=3)setWarning({count:incidents.size,reference});
  }).subscribe();
  const cleanup=window.setInterval(()=>{const now=Date.now();for(const [id,time] of incidents)if(now-time>60000)incidents.delete(id);if(incidents.size<3)setWarning(null)},10000);
  return()=>{window.clearInterval(cleanup);void db.removeChannel(channel)};
 },[streamId]);
 if(!warning)return null;
 return <aside role="status" aria-live="polite" style={{position:"fixed",top:"calc(env(safe-area-inset-top) + 65px)",left:"50%",transform:"translateX(-50%)",zIndex:1100,width:"min(92vw,390px)",padding:"12px 16px",borderRadius:16,background:"rgba(45,28,10,.92)",border:"1px solid #f4c66d",color:"#fff",boxShadow:"0 10px 35px #0008",backdropFilter:"blur(14px)"}}>
  <strong>‼️ Some viewers are having trouble watching</strong>
  <p style={{fontSize:12,margin:"7px 0"}}>Multiple viewer errors were detected. Your broadcast has not been stopped. Check your connection if viewers continue reporting problems.</p>
  <small style={{opacity:.7}}>1Muslim Error Reference # {warning.reference}</small>
  <button type="button" onClick={()=>setWarning(null)} aria-label="Dismiss Live warning" style={{float:"right",background:"transparent",border:0,color:"#fff",fontSize:18}}>×</button>
 </aside>;
}
