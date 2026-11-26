"use client";
import {useEffect,useMemo,useState} from "react";

const ACCESS="1muslim:hudhud-full-access";
const ALOUD="1muslim:hudhud-read-aloud";
const VOICE="1muslim:hudhud-voice-uri";
const RATE="1muslim:hudhud-speech-rate";
const REMEMBER="1muslim:hudhud-remember-navigation";
const MEMORY="1muslim:hudhud-device-navigation";
type Props={
 fullAccess:boolean;onFullAccess:(enabled:boolean)=>void;
 readAloud:boolean;onReadAloud:(enabled:boolean)=>void;
 stillOrb:boolean;onStillOrb:(enabled:boolean)=>void;
 onClose:()=>void;
};
function Switch({checked,onChange,label,description}:{checked:boolean;onChange:(enabled:boolean)=>void;label:string;description:string}){
 return <label className="hudSettingRow"><span className="hudSettingCopy"><strong>{label}</strong><small>{description}</small></span>
  <input className="hudSettingSwitch" type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} aria-label={label}/></label>;
}
export default function HudHudSettingsPanel({fullAccess,onFullAccess,readAloud,onReadAloud,stillOrb,onStillOrb,onClose}:Props){
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
 const [voiceURI,setVoiceURI]=useState("");
 const [rate,setRate]=useState(1);
 const [remember,setRemember]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  try{setVoiceURI(localStorage.getItem(VOICE)||"");setRemember(localStorage.getItem(REMEMBER)==="on");const value=Number(localStorage.getItem(RATE)||1);if(Number.isFinite(value))setRate(Math.max(.8,Math.min(1.25,value)))}catch{}
  const synth=window.speechSynthesis;if(!synth)return;
  const read=()=>setVoices(synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith("en")));
  read();synth.addEventListener("voiceschanged",read);
  return()=>synth.removeEventListener("voiceschanged",read);
 },[]);
 const voiceItems=useMemo(()=>[...voices].sort((a,b)=>Number(b.localService)-Number(a.localService)||a.name.localeCompare(b.name)),[voices]);
 const update=(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}window.dispatchEvent(new Event("1muslim:hudhud-agent-preferences"));};
 const preview=()=>{
  if(!("speechSynthesis" in window)){setNotice("This browser does not offer spoken playback.");return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance("Assalamu alaikum. I am HudHud, your 1Muslim companion.");
  const chosen=window.speechSynthesis.getVoices().find(v=>v.voiceURI===voiceURI);
  if(chosen)utterance.voice=chosen;utterance.lang=chosen?.lang||"en-US";utterance.rate=rate;
  window.speechSynthesis.speak(utterance);setNotice("Playing a short voice preview.");
 };
 return <div className="hudSettings" role="dialog" aria-label="HudHud preferences" aria-modal="false">
   <div className="hudSettingsHeading"><span className="hudSettingsMark" aria-hidden="true">◈</span><div><span className="hudSettingsEyebrow">PERSONAL INTELLIGENCE</span><h2>HudHud settings</h2></div>
    <button type="button" className="hudSettingsDismiss" aria-label="Close HudHud settings" onClick={onClose}>×</button></div>
   <section className="hudSettingGroup" aria-label="Voice agent settings">
     <div className="hudSettingGroupHeader"><strong>Assistant control</strong><span>OPTIONAL</span></div>
     <Switch label="HudHud Full Access" checked={fullAccess} onChange={onFullAccess}
       description="Navigate and control supported pages using your voice."/>
     {fullAccess&&<p className="hudAccessHint"><span className="hudLiveDot"/> Enabled · A smaller HudHud orb follows you. Use it to pause or turn off the microphone.</p>}
     <div className="hudAccessExplanation"><strong>Designed for hands-free access</strong><span>Say “open Qur’an”, “scroll down”, “select Videos tab”, or “what page am I on?”. Deleting a post requires a second confirmation and server ownership checks. Your browser may pause continuous listening, especially on iPhone.</span></div>
   </section>
   <section className="hudSettingGroup" aria-label="Voice playback settings">
     <div className="hudSettingGroupHeader"><strong>Speech & expression</strong><span>VOICE</span></div>
     <Switch label="Speak replies aloud" description="Only when HudHud is asked to answer." checked={readAloud}
      onChange={onReadAloud}/>
     <div className="hudSettingField"><label htmlFor="hudVoiceChoice">Preferred voice</label><select id="hudVoiceChoice" value={voiceURI}
       onChange={e=>{setVoiceURI(e.target.value);update(VOICE,e.target.value)}}>
       <option value="">Best available on this device</option>
       {voiceItems.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}{voice.localService?" · local":""}</option>)}
      </select></div>
     <div className="hudSettingField"><div className="hudRateLine"><label htmlFor="hudVoiceRate">Speaking pace</label><output htmlFor="hudVoiceRate">{rate.toFixed(2)}×</output></div>
      <input id="hudVoiceRate" type="range" min=".8" max="1.25" step=".05" value={rate}
       onChange={e=>{const v=Number(e.target.value);setRate(v);update(RATE,String(v))}}/></div>
     <button className="hudVoicePreview" type="button" onClick={preview}>▷ <span>Hear voice preview</span></button>
   </section>
   <section className="hudSettingGroup" aria-label="Personalization settings">
     <div className="hudSettingGroupHeader"><strong>Experience</strong><span>ON THIS DEVICE</span></div>
     <Switch label="Reduce orb motion" checked={stillOrb} onChange={onStillOrb} description="Preserve clarity with calmer animation."/>
     <Switch label="Remember my navigation" checked={remember} description="Learn my most visited pages. Never save conversations."
      onChange={enabled=>{setRemember(enabled);update(REMEMBER,enabled?"on":"off");if(!enabled)try{localStorage.removeItem(MEMORY)}catch{}}}/>
     <button className="hudEraseMemory" type="button" onClick={()=>{try{localStorage.removeItem(MEMORY)}catch{}setNotice("Learned navigation cleared from this device.")}}>Clear learned navigation ↗</button>
   </section>
   <div className="hudSettingsFooter"><p><strong>Privacy first.</strong> Full Access is off by default. Microphone use starts only after you enable or resume it; speech recognition may be processed by your browser provider. Listening stops when the tab is hidden. HudHud does not read password or payment fields.</p>
    {notice&&<p className="hudSettingsNotice" role="status">{notice}</p>}
    <button type="button" className="hudSettingsClose" onClick={onClose}>Done</button></div>
  </div>;
}
