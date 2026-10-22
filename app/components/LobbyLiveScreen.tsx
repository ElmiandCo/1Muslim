"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import LiveHomePreview from "./LiveHomePreview";
type Live={id:string;title:string|null;room_name:string|null};
export default function LobbyLiveScreen(){
 const [live,setLive]=useState<Live|null>(null);
 const [checking,setChecking]=useState(true);
 useEffect(()=>{
  const db=createClient();let active=true;
  const refresh=async()=>{
   const result=await db.from("live_streams").select("id,title,room_name")
    .eq("status","live").eq("visibility","public")
    .gte("last_heartbeat_at",new Date(Date.now()-45000).toISOString()).limit(1);
   if(active&&!result.error){setLive(result.data?.[0]||null);setChecking(false)}
  };
  void refresh();const timer=setInterval(()=>void refresh(),8000);
  return()=>{active=false;clearInterval(timer)};
 },[]);
 return <div style={{width:"100%",aspectRatio:"16/9",background:"rgba(0,44,40,.45)",color:"white"}}>
  {live?<LiveHomePreview roomName={live.room_name||live.id}/>:checking?"Checking for Live…":"Loading — Waiting for the Next 1Muslim Live"}
 </div>;
}
