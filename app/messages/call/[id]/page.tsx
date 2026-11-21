"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import GroupMeeting from "../../../../components/GroupMeeting";
type Meeting={id:string;title:string;mode:string};
export default function DirectCallLinkPage(){
 const params=useParams<{id:string}>();
 const id=String(params?.id||"");
 const [meeting,setMeeting]=useState<Meeting|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{if(!/^[a-f0-9-]{36}$/i.test(id)){setError("Invalid call link");return}
  let alive=true;const controller=new AbortController();
  void fetch("/api/dm-group-calls/token?callId="+encodeURIComponent(id),{signal:controller.signal,cache:"no-store"}).then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error||"Call unavailable");return result.call as Meeting}).then(call=>{if(alive)setMeeting(call)}).catch(e=>{if(alive)setError(e instanceof Error?e.message:"Call unavailable")});
  return()=>{alive=false;controller.abort()};
 },[id]);
 if(meeting)return <GroupMeeting callId={meeting.id} title={meeting.title||"1Muslim Call"} mode={meeting.mode==="audio"?"audio":"video"} autoJoin onLeave={()=>{window.location.assign("/messages/public")}}/>;
 return <main style={{minHeight:"55dvh",display:"grid",placeItems:"center",padding:24,background:"#0b1416",color:"#fff",textAlign:"center"}}><div><h1>1Muslim · Call</h1><p role={error?"alert":"status"}>{error||"Opening your call…"}</p>{error&&<Link href="/messages/public" style={{color:"#a2e7c4"}}>Browse calls →</Link>}</div></main>;
}
