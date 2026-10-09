"use client";
import {useEffect,useRef,useState} from "react";
type SpeechResult={results:ArrayLike<{0:{transcript:string}}>;resultIndex:number};
type Recognizer={start:()=>void;stop:()=>void;onresult:((event:SpeechResult)=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null;lang:string;continuous:boolean};
export default function HudHudVoiceSpiral(){
 const [listening,setListening]=useState(false),[text,setText]=useState("Tap to speak with HudHud"),[supported,setSupported]=useState(true);
 const rec=useRef<Recognizer|null>(null);
 useEffect(()=>{const w=window as unknown as {SpeechRecognition?:new()=>Recognizer;webkitSpeechRecognition?:new()=>Recognizer};setSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>{rec.current?.stop();window.speechSynthesis?.cancel()}},[]);
 const stop=()=>{rec.current?.stop();rec.current=null;setListening(false)};
 const toggle=()=>{if(listening){stop();return}const w=window as unknown as {SpeechRecognition?:new()=>Recognizer;webkitSpeechRecognition?:new()=>Recognizer};const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C){setText("Speech recognition is not available in this browser.");return}try{const r=new C();rec.current=r;r.lang="en-US";r.continuous=false;r.onresult=e=>{const words=Array.from(e.results).map(x=>x[0]?.transcript||"").join(" ").trim();setText(words||"No words detected");if(words&&"speechSynthesis" in window){const u=new SpeechSynthesisUtterance("I heard: "+words+". HudHud AI replies are not connected yet.");u.rate=.95;window.speechSynthesis.speak(u)}};r.onend=()=>setListening(false);r.onerror=()=>{setListening(false);setText("Microphone unavailable. Check browser permission.")};r.start();setListening(true);setText("Listening…")}catch{setText("Could not start the microphone. Check permissions.")}};
 return <div className="hudhud-voice-wrap"><button className={"hudhud-voice-spiral "+(listening?"active":"")} onClick={toggle} aria-label={listening?"Stop HudHud voice listening":"Start HudHud voice listening"} aria-pressed={listening}><span className="spiral-ring ring-one"/><span className="spiral-ring ring-two"/><span className="spiral-ring ring-three"/><span className="spiral-core"><img src="/assets/hudhud-logo.PNG" alt="HudHud"/></span></button><span className="hudhud-voice-caption">{supported?text:"Voice recognition is unavailable in this browser."}</span><style jsx>{`
.hudhud-voice-wrap{position:relative;right:auto;bottom:auto;z-index:1;display:flex;align-items:center;gap:8px;max-width:min(90vw,290px);pointer-events:none}
.hudhud-voice-spiral{position:relative;flex:0 0 68px;width:68px;height:68px;border:0;border-radius:50%;background:radial-gradient(circle,#092638 10%,#0b3743bb 55%,transparent 72%);filter:drop-shadow(0 0 16px #3be9c0);pointer-events:auto;cursor:pointer}
.spiral-ring{position:absolute;inset:6px;border-radius:48% 52% 45% 55%;border:3px solid transparent;border-top-color:#77f8d5;border-right-color:#7ccfff;animation:voiceOrbit 5s linear infinite}
.ring-two{inset:12px;border-top-color:#ffe6a1;border-right-color:#b383ff;animation-duration:3.5s;animation-direction:reverse}.ring-three{inset:20px;border-top-color:#b4eaff;border-right-color:#76e7ab;animation-duration:2.4s}
.spiral-core{position:absolute;inset:0;display:grid;place-items:center}.spiral-core img{width:39px;height:39px;object-fit:contain;filter:drop-shadow(0 0 9px #67f9d7)}.active .spiral-ring{animation-duration:1.1s;box-shadow:0 0 15px #76eac888}.hudhud-voice-caption{background:#061c2bdc;color:#dffff4;border:1px solid #72e8d188;border-radius:12px;padding:7px 9px;font-size:11px;line-height:1.3;max-width:190px;overflow-wrap:anywhere}
@keyframes voiceOrbit{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.spiral-ring{animation:none}}
`}</style></div>
}
