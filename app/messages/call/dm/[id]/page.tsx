"use client";
import {useEffect,useState} from "react";
import {useParams,useSearchParams} from "next/navigation";
import Link from "next/link";
import GroupMeeting from "../../../../../components/GroupMeeting";
type Call={id:string;title:string;mode:string};
export default function SharedDirectCall(){
 const params=useParams<{id:string}>(),query=useSearchParams();
 const id=String(params?.id||""),linkToken=query.get("token")||"";
 const [call,setCall]=useState<Call|null>(null),[error,setError]=useState("");
 useEffect(()=>{if(!linkToken||!id){setError("A valid call link is required");return}let live=true;
  const controller=new AbortController();
  void fetch("/api/dm-call-links?token="+encodeURIComponent(linkToken),{cache:"no-store",signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Call unavailable");if(d.call?.id!==id)throw Error("Call link mismatch");return d.call as Call}).then(c=>{if(live)setCall(c)}).catch(e=>{if(live)setError(e instanceof Error?e.message:"Call unavailable")});
  return()=>{live=false;controller.abort()};
 },[id,linkToken]);
 if(call)return <GroupMeeting callId={call.id} title={call.title} mode={call.mode} linkToken={linkToken} autoJoin onLeave={()=>window.location.assign("/messages")}/>;
 return <main style={{minHeight:"60dvh",background:"#0a1316",color:"#fff",padding:32,display:"grid",placeItems:"center",textAlign:"center"}}><div><h1>1Muslim · Call</h1><p role={error?"alert":"status"}>{error||"Opening your call…"}</p>{error&&<Link href="/messages" style={{color:"#9ff0c2"}}>Return to Messenger</Link>}</div></main>;
}
