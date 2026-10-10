"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
type SpeechResult={results:ArrayLike<ArrayLike<{transcript:string}>>};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:SpeechResult)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function HudHudVoiceCommands(){
 const router=useRouter(),recognition=useRef<Recognition|null>(null),[enabled,setEnabled]=useState(false),[listening,setListening]=useState(false),[feedback,setFeedback]=useState("");
 useEffect(()=>{setEnabled(localStorage.getItem("1muslim:hudhud-voice")==="on")},[]);
 useEffect(()=>{if(!enabled){recognition.current?.stop();setListening(false);return}const W=window as SpeechWindow;const Constructor=W.SpeechRecognition||W.webkitSpeechRecognition;if(!Constructor){setFeedback("Voice recognition is unavailable in this browser.");return}const rec=new Constructor();recognition.current=rec;rec.lang="en-US";rec.continuous=true;rec.interimResults=false;rec.onresult=e=>{const phrase=Array.from(e.results).map(row=>row[0]?.transcript||"").join(" ").toLowerCase();const command=phrase.includes("hudhud")?phrase.slice(phrase.lastIndexOf("hudhud")+6).trim():phrase;if(/(?:go to|open|show)(?: my)? messages/.test(command)){setFeedback("Opening messages");router.push("/messages")}else if(/(?:go to|open|show)(?: my)? (?:audio rooms|rooms)/.test(command)){setFeedback("Opening audio rooms");router.push("/audio-rooms")}else if(/(?:ready to record|start recording|let.s try again)/.test(command)){window.dispatchEvent(new Event("1muslim:quran-voice-record"));setFeedback("Starting practice recorder")}else if(command.includes("stop listening")){setEnabled(false);localStorage.setItem("1muslim:hudhud-voice","off")}};rec.onerror=()=>{setListening(false);setFeedback("Microphone or speech recognition unavailable. Tap to retry.")};rec.onend=()=>setListening(false);try{rec.start();setListening(true);setFeedback("HudHud is listening")}catch{setFeedback("Tap again to allow microphone access.")}return()=>{rec.onend=null;rec.stop();recognition.current=null}},[enabled,router]);
 return null;
}
