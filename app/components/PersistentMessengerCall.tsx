"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import ConnectCallExperience from "../../components/ConnectCallExperience";
type Context={conversationId:string;userId:string;peerName:string;peerAvatar:string|null};
export default function PersistentMessengerCall(){
 const pathname=usePathname();
 const [context,setContext]=useState<Context|null>(null);
 useEffect(()=>{
  let alive=true;let busy=false;
  const check=async()=>{
   if(busy||document.visibilityState==="hidden")return;
   busy=true;
   try{
    const {data:{user}}=await createClient().auth.getUser();
    if(!user||!alive)return;
    const response=await fetch("/api/dm-calls?inbox=1",{cache:"no-store"});
    if(!response.ok)return;
    const data=await response.json();
    const call=data.call;
    if(call?.conversation_id&&call.caller_id&&alive){
      setContext(previous=>previous?.conversationId===call.conversation_id?previous:{conversationId:call.conversation_id,userId:user.id,peerName:call.peerName||"1Muslim member",peerAvatar:call.peerAvatar||null});
    }
   }catch{}finally{busy=false}
  };
  void check();const timer=window.setInterval(()=>void check(),4000);
  const onFocus=()=>void check();window.addEventListener("focus",onFocus);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener("focus",onFocus)};
 },[]);

 useEffect(()=>{
  const listener=(event:Event)=>{const detail=(event as CustomEvent<Context|null>).detail;if(detail?.conversationId&&detail.userId)setContext(detail)};
  window.addEventListener("1muslim:call-context",listener);
  return()=>window.removeEventListener("1muslim:call-context",listener);
 },[]);
 return <div className={"persistentMessengerCall "+(pathname?.startsWith("/messages")?"onMessages":"offMessages")}>{context&&<ConnectCallExperience key={context.conversationId} conversationId={context.conversationId} userId={context.userId} peerName={context.peerName} peerAvatar={context.peerAvatar}/>}</div>;
}
