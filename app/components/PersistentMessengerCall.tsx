"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import ConnectCallExperience from "../../components/ConnectCallExperience";
type Context={conversationId:string;userId:string;peerName:string;peerAvatar:string|null};
export default function PersistentMessengerCall(){
 const pathname=usePathname();
 const [context,setContext]=useState<Context|null>(null);
 useEffect(()=>{
  const listener=(event:Event)=>{const detail=(event as CustomEvent<Context|null>).detail;if(detail?.conversationId&&detail.userId)setContext(detail)};
  window.addEventListener("1muslim:call-context",listener);
  return()=>window.removeEventListener("1muslim:call-context",listener);
 },[]);
 return <div className={"persistentMessengerCall "+(pathname?.startsWith("/messages")?"onMessages":"offMessages")}>{context&&<ConnectCallExperience key={context.conversationId} conversationId={context.conversationId} userId={context.userId} peerName={context.peerName} peerAvatar={context.peerAvatar}/>}</div>;
}
