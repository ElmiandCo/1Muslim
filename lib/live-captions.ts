"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";

export const LIVE_CAPTION_TOPIC = "1muslim.live-captions.v1";
export type LiveCaptionPacket = { version: 1; enabled: boolean; text: string; final: boolean; sequence: number };
/** Host audio is captured in short independent clips and transcribed server-side.
 * The OpenAI key never reaches the browser. Latency is typically several seconds.
 */
export function useHostLiveCaptions(room:Room|null,streamId:string|null){
 const [enabled,setEnabled]=useState(false);
 const [text,setText]=useState("");
 const [error,setError]=useState<string|null>(null);
 const active=useRef(false);
 const recorder=useRef<MediaRecorder|null>(null);
 const capture=useRef<MediaStream|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const seq=useRef(0);
 const generation=useRef(0);
 const send=useCallback(async(message:Omit<LiveCaptionPacket,"version"|"sequence">)=>{
   if(!room||room.state!=="connected")return;
   const packet:LiveCaptionPacket={version:1,sequence:++seq.current,...message};
   await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(packet)),{reliable:true,topic:LIVE_CAPTION_TOPIC});
 },[room]);
 const stop=useCallback(async()=>{
   generation.current++;active.current=false;
   if(timer.current)clearTimeout(timer.current);
   timer.current=null;
   const r=recorder.current;recorder.current=null;
   if(r&&r.state!=="inactive")r.stop();
   capture.current?.getTracks().forEach(t=>t.stop());capture.current=null;
   setEnabled(false);setText("");
   try{await send({enabled:false,text:"",final:true});}catch{}
 },[send]);
 const toggle=useCallback(async(next:boolean)=>{
   if(!next){await stop();return;}
   setError(null);
   if(!room||room.state!=="connected"||!streamId){setError("Start your live broadcast first.");return;}
   if(typeof MediaRecorder==="undefined"){setError("Audio recording is not supported in this browser.");return;}
   let stream:MediaStream;
   try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});}
   catch{setError("Allow microphone access to enable captions.");return;}
   const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t));
   if(!mime){stream.getTracks().forEach(t=>t.stop());setError("No supported audio format for captions.");return;}
   capture.current=stream;active.current=true;setEnabled(true);
   const current=++generation.current;
   const record=()=>{
     if(!active.current||generation.current!==current)return;
     const chunks:Blob[]=[];
     const r=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:32000});
     recorder.current=r;
     r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
     r.onstop=async()=>{
       if(!active.current||generation.current!==current)return;
       const audio=new Blob(chunks,{type:mime});
       if(audio.size>100){
         const body=new FormData();
         body.append("streamId",streamId);
         body.append("audio",audio,"caption."+ (mime.includes("mp4")?"mp4":"webm"));
         try{
           const response=await fetch("/api/live-captions/transcribe",{method:"POST",body,cache:"no-store"});
           if(!response.ok)throw new Error("Transcription service unavailable");
           const result=await response.json();
           const words=String(result.text||"").trim().slice(0,700);
           if(words&&active.current&&generation.current===current){
             setText(words);
             await send({enabled:true,text:words,final:true});
           }
         }catch{if(active.current)setError("Caption transcription interrupted.");}
       }
       if(active.current&&generation.current===current)record();
     };
     r.start();
     timer.current=setTimeout(()=>{if(r.state==="recording")r.stop();},3000);
   };
   try{await send({enabled:true,text:"",final:false});record();}
   catch{await stop();setError("Unable to start live captions.");}
 },[room,streamId,send,stop]);
 useEffect(()=>()=>{active.current=false;generation.current++;if(timer.current)clearTimeout(timer.current);if(recorder.current?.state==="recording")recorder.current.stop();capture.current?.getTracks().forEach(t=>t.stop());},[]);
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
