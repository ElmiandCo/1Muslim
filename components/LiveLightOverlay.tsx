"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "../utils/supabase/client";
const EMOTES=new Set(["💚","🤲","☪️","✨","🦅","🌙"]);
const isTiny=(s:string)=>Array.from(s.trim()).length<=3;
type Entry={id:string;body:string;sender_id:string;created_at:string};
export default function LiveLightOverlay({streamId}:{streamId:string}){
 const db=useMemo(()=>createClient(),[]);
 const [messages,setMessages]=useState<Entry[]>([]);
 const [enabled,setEnabled]=useState(true);
 const [tts,setTts]=useState(false);
 const ttsRef=useRef(false);
 const enabledRef=useRef(true);
 const timers=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map());
 const speechToken=useRef(0);
 useEffect(()=>{try{setTts(localStorage.getItem("1muslim-live-tts")==="on")}catch{}},[]);
 useEffect(()=>{ttsRef.current=tts;if(!tts&&"speechSynthesis" in window){speechToken.current++;window.speechSynthesis.cancel()}},[tts]);
 useEffect(()=>{enabledRef.current=enabled},[enabled]);
 useEffect(()=>()=>{speechToken.current++;timers.current.forEach(clearTimeout);timers.current.clear();if("speechSynthesis" in window)window.speechSynthesis.cancel()},[]);
 const hide=(id:string)=>{const existing=timers.current.get(id);if(existing)clearTimeout(existing);timers.current.delete(id);setActive(prev=>prev.filter(x=>x.id!==id))};
 const scheduleHide=(id:string,ms:number)=>{const existing=timers.current.get(id);if(existing)clearTimeout(existing);timers.current.set(id,setTimeout(()=>hide(id),ms))};
 const speak=(entry:Entry,duration:number)=>{if(!ttsRef.current||!enabledRef.current||!("speechSynthesis" in window)){scheduleHide(entry.id,duration);return}
 const token=++speechToken.current;window.speechSynthesis.cancel();
 const words=({"💚":"Love","🤲":"Ameen","☪️":"Islam","✨":"Beautiful","🦅":"HudHud","🌙":"Masha Allah"} as Record<string,string>);
 const utterance=new SpeechSynthesisUtterance(words[entry.body]||entry.body);
 utterance.rate=.94;utterance.volume=.65;utterance.pitch=1.03;
 const finish=()=>{if(token===speechToken.current)scheduleHide(entry.id,700)};
 utterance.onend=finish;utterance.onerror=finish;
 scheduleHide(entry.id,Math.max(duration,12000));
 window.speechSynthesis.speak(utterance);
 };
 const [lights,setLights]=useState(true);
 const [active,setActive]=useState<(Entry&{duration:number})[]>([]);
 useEffect(()=>{const sync=()=>{try{setLights(localStorage.getItem("1muslim-elmi-light")!=="off")}catch{setLights(true)}};sync();window.addEventListener("1muslim-elmi-light-updated",sync);return()=>window.removeEventListener("1muslim-elmi-light-updated",sync)},[]);
 useEffect(()=>{let alive=true;void db.from("live_chat_messages").select("id,body,sender_id,created_at").eq("stream_id",streamId).order("created_at",{ascending:false}).limit(80).then(({data})=>{if(alive)setMessages((data||[]).reverse())});const channel=db.channel("elmi-light-overlay-"+streamId).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_chat_messages",filter:"stream_id=eq."+streamId},payload=>{const m=payload.new as Entry;setMessages(prev=>prev.some(x=>x.id===m.id)?prev:[...prev.slice(-79),m]);const duration=EMOTES.has(m.body)?5100:Math.min(8000,Math.max(2600,2300+Array.from(m.body).length*115));setActive(prev=>[...prev.slice(-2),{...m,duration:ttsRef.current&&enabledRef.current?12000:duration}]);speak(m,duration)}).subscribe();return()=>{alive=false;void db.removeChannel(channel)}},[db,streamId]);
 return <div className="elmi-live-shell"><div className="elmi-live-cards" aria-live="off">{enabled&&active.map(m=><div className={"elmi-live-card "+(lights?"lit ":"")+(isTiny(m.body)?"tiny ":"")+(EMOTES.has(m.body)&&lights?"emoteSpree":"")} key={m.id} style={{["--float-duration" as string]:m.duration+"ms"}}>{lights&&<div className="elmi-live-particles" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{left:(i*37%100)+"%",animationDelay:(i*110)+"ms"}}/>)}</div>}<span>✦ LIVE · COMMUNITY</span><strong>{m.body}</strong></div>)}</div><button type="button" className="elmi-tts-toggle" onClick={()=>{const next=!tts;setTts(next);try{localStorage.setItem("1muslim-live-tts",next?"on":"off")}catch{}}} aria-label={tts?"Disable text to speech":"Enable text to speech"}>{tts?"🔊 TTS on":"🔇 TTS off"}</button><button type="button" className="elmi-live-toggle" onClick={()=>{setEnabled(v=>{if(v){speechToken.current++;if("speechSynthesis" in window)window.speechSynthesis.cancel();setActive([])}return !v})}} aria-label={enabled?"Hide live comment effects":"Show live comment effects"}>{enabled?"✨ Comments on":"○ Comments off"}</button><style jsx>{`
 .elmi-live-shell{position:absolute;inset:0;pointer-events:none;z-index:4;color:#fff}.elmi-live-cards{position:absolute;left:12px;bottom:64px;width:min(76%,420px);display:grid;gap:8px}.elmi-live-card{position:relative;isolation:isolate;overflow:hidden;display:grid;gap:5px;padding:10px 13px;background:linear-gradient(110deg,#061e2ce8,#142d34dd,#122c20dd);border:1px solid #7bc5d9aa;border-radius:15px;backdrop-filter:blur(12px);box-shadow:0 8px 22px #0009;animation:liveFloat var(--float-duration,5s) ease-in-out both}.elmi-live-card.tiny{width:max-content;max-width:100%;min-width:92px;text-align:center;padding:13px 19px}.elmi-live-card.tiny strong{font-size:clamp(28px,6vw,52px);line-height:1.15}.elmi-live-card.emoteSpree{animation:liveFloat var(--float-duration,5s) ease-in-out both,emoteQuake 1.6s ease-in-out 2;box-shadow:0 0 30px #59e7ff99,0 0 45px #f4d48b44}.elmi-live-card.emoteSpree .elmi-live-particles i{animation-duration:.8s}.elmi-live-card.lit{box-shadow:0 0 25px #58dfff66,inset 0 0 16px #f6d38e22;border-color:#b5f8e8}.elmi-live-card span{position:relative;z-index:2;color:#b0f4d8;font-size:9px;letter-spacing:.12em;font-weight:900}.elmi-live-card strong{position:relative;z-index:2;font-size:clamp(11px,1.5vw,15px);line-height:1.45;overflow-wrap:anywhere}.elmi-live-particles{position:absolute;inset:0}.elmi-live-particles i{position:absolute;bottom:0;width:3px;height:3px;border-radius:50%;background:#ffdb96;box-shadow:0 0 9px 3px #7ce8ff88;animation:liveSpark 1.7s ease-out infinite}.elmi-live-particles i:nth-child(3n){background:#7dffad}.elmi-live-particles i:nth-child(3n + 1){background:#7bdfff}.elmi-tts-toggle{position:absolute;right:12px;bottom:51px;pointer-events:auto;background:#0a1e2dd9;color:#d9fff1;border:1px solid #89ead488;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}.elmi-live-toggle{position:absolute;right:12px;bottom:14px;pointer-events:auto;background:#0a1e2dd9;color:#d9fff1;border:1px solid #89ead488;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}@keyframes emoteQuake{0%,100%{translate:0 0;rotate:0deg}15%{translate:-2px 1px;rotate:-.4deg}30%{translate:2px -1px;rotate:.4deg}45%{translate:-1px 2px;rotate:-.3deg}60%{translate:2px 0;rotate:.3deg}75%{translate:-1px -1px;rotate:-.2deg}90%{translate:1px 1px;rotate:.1deg}}@keyframes liveFloat{0%{opacity:0;transform:translateY(22px)}12%{opacity:1;transform:translateY(0)}70%{opacity:1;transform:translateY(-7px)}90%{opacity:.85;filter:blur(0)}100%{opacity:0;transform:translateY(-28px);filter:blur(5px)}}@keyframes livePop{from{opacity:0;transform:translateY(20px) scale(.96);filter:blur(3px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}@keyframes liveSpark{from{opacity:0;transform:translateY(0)}20%{opacity:1}to{opacity:0;transform:translateY(-65px)}}@media(prefers-reduced-motion:reduce){.elmi-live-card,.elmi-live-particles i{animation:none!important}}
 `}</style></div>
}