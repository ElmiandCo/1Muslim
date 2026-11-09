"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";

export const LIVE_CAPTION_TOPIC = "1muslim.live-captions.v1";
export type LiveCaptionPacket = { version: 1; enabled: boolean; text: string; final: boolean; sequence: number };
type Recognition = {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((event: {resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null;
  onerror: ((event:{error:string})=>void)|null;
  onend: (()=>void)|null;
  start:()=>void;stop:()=>void;
};
type SpeechWindow = Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};

/** Browser speech recognition is an interim adapter, NOT OpenAI transcription.
 * Works only where SpeechRecognition is available. Never expose API keys.
 * Host sends captions once to the LiveKit room; viewers receive packets.
 */
export function useHostLiveCaptions(room: Room | null, language = "en-US") {
  const [enabled,setEnabled] = useState(false);
  const [text,setText] = useState("");
  const [error,setError] = useState<string|null>(null);
  const recognition = useRef<Recognition|null>(null);
  const active = useRef(false);
  const seq = useRef(0);
  const send = useCallback(async (message:Omit<LiveCaptionPacket,"version"|"sequence">) => {
    if (!room || room.state !== "connected") return;
    const packet:LiveCaptionPacket = {version:1,sequence:++seq.current,...message};
    await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(packet)), {reliable:true,topic:LIVE_CAPTION_TOPIC});
  },[room]);
  const stop = useCallback(async()=>{
    active.current=false;
    recognition.current?.stop();
    recognition.current=null;
    setEnabled(false);setText("");
    try {await send({enabled:false,text:"",final:true});} catch {}
  },[send]);
  const toggle = useCallback(async(next:boolean)=>{
    if(!next){await stop();return;}
    setError(null);
    if(!room || room.state!=="connected"){setError("Start your live broadcast first.");return;}
    const w=window as SpeechWindow;
    const Speech=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!Speech){setError("Live captions are not supported in this browser.");return;}
    const r=new Speech();
    r.continuous=true;r.interimResults=true;r.lang=language;
    r.onresult=(event)=>{
      let transcript="";let final=true;
      for(let i=event.resultIndex;i<event.results.length;i++){
        transcript+=event.results[i][0].transcript;
        if(!event.results[i].isFinal)final=false;
      }
      transcript=transcript.trim().slice(0,700);
      if(!transcript||!active.current)return;
      setText(transcript);
      void send({enabled:true,text:transcript,final}).catch(()=>setError("Caption delivery interrupted."));
    };
    r.onerror=(e)=>{setError("Speech recognition: "+e.error);void stop();};
    r.onend=()=>{if(active.current){try{r.start();}catch{void stop();}}};
    try{r.start();recognition.current=r;active.current=true;setEnabled(true);await send({enabled:true,text:"",final:false});}
    catch{active.current=false;setError("Could not start speech recognition.");}
  },[room,language,send,stop]);
  useEffect(()=>()=>{active.current=false;recognition.current?.stop();},[]);
  return {enabled,text,error,toggle,stop};
}
export function parseLiveCaptionPacket(payload:Uint8Array,topic?:string):LiveCaptionPacket|null {
  if(topic!==LIVE_CAPTION_TOPIC || payload.byteLength>4096)return null;
  try{
    const p=JSON.parse(new TextDecoder().decode(payload));
    if(p?.version!==1||typeof p.enabled!=="boolean"||typeof p.text!=="string"||typeof p.final!=="boolean"||!Number.isSafeInteger(p.sequence))return null;
    return {version:1,enabled:p.enabled,text:p.text.slice(0,700),final:p.final,sequence:p.sequence};
  }catch{return null;}
}
