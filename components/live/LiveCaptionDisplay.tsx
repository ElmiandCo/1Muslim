"use client";
import { useEffect,useState } from "react";
import type { Room } from "livekit-client";
import { RoomEvent } from "livekit-client";
import { parseLiveCaptionPacket } from "../../lib/live-captions";

/** Mount in the existing live stage's caption layer, for host and viewers.
 * Ensure only host identity can publish trusted caption packets in integration.
 */
export default function LiveCaptionDisplay({room,hostIdentity}:{room:Room|null;hostIdentity:string}) {
  const [caption,setCaption]=useState("");
  const [last,setLast]=useState(false);
  useEffect(()=>{
    if(!room)return;
    let latest=-1;
    let timeout:ReturnType<typeof setTimeout>|undefined;
    const receive=(data:Uint8Array,participant:any,_kind:any,topic?:string)=>{
      if(!participant || participant.identity!==hostIdentity)return;
      const packet=parseLiveCaptionPacket(data,topic);
      if(!packet || packet.sequence<=latest)return;
      latest=packet.sequence;
      if(timeout)clearTimeout(timeout);
      if(!packet.enabled){setCaption("");setLast(false);return;}
      setCaption(packet.text);setLast(packet.final);
      timeout=setTimeout(()=>{setCaption("");setLast(false);},packet.final?4500:2500);
    };
    room.on(RoomEvent.DataReceived,receive);
    return()=>{room.off(RoomEvent.DataReceived,receive);if(timeout)clearTimeout(timeout);};
  },[room,hostIdentity]);
  if(!caption)return null;
  const words=caption.split(/\s+/);
  const finalWord=words.pop()||"";
  const size=words.length===0?48:words.length<5?32:words.length<12?25:20;
  return <div aria-live="polite" style={{position:"absolute",inset:"8% 3% 10% 3%",pointerEvents:"none",display:"flex",justifyContent:"flex-end",alignItems:"flex-end",flexDirection:"column",overflow:"hidden",textAlign:"right",color:"white",textShadow:"0 2px 8px #000,0 1px 3px #000",fontWeight:750,zIndex:12}}>
    <div style={{maxWidth:"88%",fontSize:size,lineHeight:1.18,overflowWrap:"anywhere"}}>
      {words.join(" ")}{" "}
      <span style={{fontSize:words.length===0?50:size+4,display:"inline-block",transition:"opacity .4s, transform .4s"}}>{finalWord}</span>
    </div>
  </div>;
}
