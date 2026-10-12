"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "../utils/supabase/client";
const EMOTES=new Set(["💚","🤲","☪️","✨","🦅","🌙"]);
const devotional=(body:string)=>{const s=body.trim().toLowerCase().replace(/[.!،؟\s]+/g," ").trim();if(/^(ameen|amin|aameen|آمين|امين|🤲)$/.test(s))return "Ameen";if(/^(alhamdulillah|alhamdulilah|alhamdu lillah|الحمد لله)$/.test(s))return "Alhamdulillah";if(/^(astaghfirullah|astagfirullah|astaghfurullah|أستغفر الله|استغفر الله)$/.test(s))return "Astaghfirullah";return null};
const isTiny=(s:string)=>Array.from(s.trim()).length<=3;
type Entry={id:string;body:string;sender_id:string;created_at:string};
type FloatEntry=Entry&{duration:number;x:number;y:number;dx:number;dy:number;scale:number;lane:number};
const LANES=7;
const place=(m:Entry,active:FloatEntry[],width:number,height:number,duration:number):FloatEntry=>{
 const n=active.length, dense=Math.min(1,n/10);
 const widthRatio=Math.min(1,Math.max(.55,width/480));
 const scale=Math.max(.47,(isTiny(m.body)?1.1:.95)*widthRatio*(1-dense*.46));
 const seed=Array.from(m.id).reduce((a,c)=>a+c.charCodeAt(0),0);
 const options=Array.from({length:LANES},(_,lane)=>{
  const x=8+(lane+.5)*(84/LANES);
  const y=55+(seed%5)*4;
  const cost=active.reduce((score,item)=>{
   const age=Math.max(0,(Date.now()-new Date(item.created_at).getTime())/1000);
   const proximity=Math.abs(item.x-x);
   return score+(proximity<20?1/(.3+proximity/10):0)+(item.lane===lane?3:0);
  },0);
  return {lane,x,y,cost};
 }).sort((a,b)=>a.cost-b.cost);
 const selected=options[0];
 const direction=seed%3-1;
 return {...m,duration,x:selected.x,y:selected.y,dx:direction*(12+seed%17),dy:-(Math.min(42,26+height/40)),scale,lane:selected.lane};
};
export default function LiveLightOverlay({streamId,host=false}:{streamId:string;host?:boolean}){
 const db=useMemo(()=>createClient(),[]);
 const [size,setSize]=useState({width:480,height:720});
 const shellRef=useRef<HTMLDivElement>(null);
 const [enabled,setEnabled]=useState(true);
 const [tts,setTts]=useState(false);
 const [hudhud,setHudhud]=useState(false);
 const [insight,setInsight]=useState("");
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
 const speak=(entry:Entry,duration:number)=>{const phrase=devotional(entry.body);if(!phrase||!ttsRef.current||!enabledRef.current||!("speechSynthesis" in window)){scheduleHide(entry.id,duration);return}
 const token=++speechToken.current;window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(phrase);
 utterance.rate=.94;utterance.volume=.65;utterance.pitch=1.03;
 const finish=()=>{if(token===speechToken.current)scheduleHide(entry.id,700)};
 utterance.onend=finish;utterance.onerror=finish;
 scheduleHide(entry.id,Math.max(duration,12000));
 window.speechSynthesis.speak(utterance);
 };
 const [lights,setLights]=useState(true);
 const [pinned,setPinned]=useState<Entry[]>([]);
 const [released,setReleased]=useState<Entry[]>([]);
 const [avatarUrls,setAvatarUrls]=useState<Record<string,string>>({});
 useEffect(()=>{const ch=db.channel("live-pin-"+streamId).on("broadcast",{event:"pin"},({payload})=>setPinned(Array.isArray(payload?.entries)?payload.entries.slice(0,3):[]);if(Array.isArray(payload?.released)&&payload.released.length){const exiting=payload.released as Entry[];setReleased(v=>[...v,...exiting]);window.setTimeout(()=>setReleased(v=>v.filter(m=>!exiting.some(e=>e.id===m.id))),1050)}).subscribe();return()=>{void db.removeChannel(ch)}},[db,streamId]);
 const publishPins=(entries:Entry[])=>{setPinned(entries);void db.channel("live-pin-"+streamId).send({type:"broadcast",event:"pin",payload:{entries}})};
 const pinComment=(m:Entry)=>{if(!host)return;const next=pinned.some(p=>p.id===m.id)?pinned.filter(p=>p.id!==m.id):pinned.length<3?[...pinned,m]:pinned;publishPins(next)};
 const bulkRelease=()=>{if(!host||!pinned.length)return;const exiting=[...pinned];publishPins([]);void db.channel("live-pin-"+streamId).send({type:"broadcast",event:"pin",payload:{entries:[],released:exiting}});setReleased(v=>[...v,...exiting]);window.setTimeout(()=>setReleased(v=>v.filter(m=>!exiting.some(e=>e.id===m.id))),1050)};
 useEffect(()=>{const ids=active.map(m=>m.sender_id).filter(id=>!Object.prototype.hasOwnProperty.call(avatarUrls,id));if(!ids.length)return;let alive=true;void db.from("profiles").select("id,avatar_url").in("id",ids).then(({data})=>{if(alive&&data)setAvatarUrls(v=>({...v,...Object.fromEntries(data.map(p=>[p.id,p.avatar_url||""]))}))});return()=>{alive=false}},[active,db,avatarUrls]);
 const [active,setActive]=useState<FloatEntry[]>([]);
 useEffect(()=>{const el=shellRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>{if(!entry)return;const {width,height}=entry.contentRect;setSize({width,height})});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{const sync=()=>{try{setLights(localStorage.getItem("1muslim-elmi-light")!=="off")}catch{setLights(true)}};sync();window.addEventListener("1muslim-elmi-light-updated",sync);return()=>window.removeEventListener("1muslim-elmi-light-updated",sync)},[]);
 useEffect(()=>{const channel=db.channel("elmi-light-overlay-"+streamId).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_chat_messages",filter:"stream_id=eq."+streamId},payload=>{const m=payload.new as Entry;const duration=8000;const displayDuration=8000;setActive(prev=>[...prev.slice(-13),place(m,prev,size.width,size.height,displayDuration)]);scheduleHide(m.id,8000)}).subscribe();return()=>{void db.removeChannel(channel)}},[db,streamId,size.width,size.height]);
 return <div ref={shellRef} className="elmi-live-shell"><div className="elmi-live-cards" aria-live="off">{enabled&&active.filter(m=>!pinned.some(p=>p.id===m.id)).map(m=><div role={host?"button":undefined} tabIndex={host?0:undefined} onClick={()=>pinComment(m)} onKeyDown={e=>{if(host&&(e.key==="Enter"||e.key===" "))pinComment(m)}} className="elmi-live-card omFloatingComment" key={m.id} style={{left:m.x+"%",top:"88%",["--float-duration" as string]:"8000ms",["--drift-x" as string]:m.dx+"px",["--drift-y" as string]:"-110vh",["--comment-scale" as string]:".95",pointerEvents:host?"auto":"none",cursor:host?"pointer":"default"}}><div className="omLiveCommentLine"><span className="omLiveCommentAvatar">{avatarUrls[m.sender_id]?<img src={avatarUrls[m.sender_id]} alt=""/>:"👤"}</span><strong>{m.body}</strong></div>{host&&<small>Tap to pin 📌</small>}</div>)}{pinned.length>0&&<div className="omLivePinnedStack">{pinned.map((m,i)=><div className="omLivePinnedComment" key={m.id} role={host?"button":undefined} onClick={()=>pinComment(m)}><span>📌 PINNED {i+1}/3 {host?"· Tap to unpin":""}</span><div className="omLiveCommentLine"><span className="omLiveCommentAvatar">{avatarUrls[m.sender_id]?<img src={avatarUrls[m.sender_id]} alt=""/>:"👤"}</span><strong>{m.body}</strong></div></div>)}{host&&<button type="button" className="omHudHudBulkRelease" onClick={bulkRelease}>🌀 HudHud · Release all</button>}</div>}{released.map(m=><div key={"released-"+m.id} className="elmi-live-card omFloatingComment omReleasedComment" style={{left:"50%",top:"20%",["--float-duration" as string]:"1000ms",["--drift-x" as string]:"0px",["--drift-y" as string]:"-22vh",["--comment-scale" as string]:"1",pointerEvents:"none"}}><div className="omLiveCommentLine"><span className="omLiveCommentAvatar">{avatarUrls[m.sender_id]?<img src={avatarUrls[m.sender_id]} alt=""/>:"👤"}</span><strong>{m.body}</strong></div></div>)}</div>{tts&&<button type="button" className="elmi-ai-toggle" onClick={()=>{setHudhud(v=>!v);setInsight("HudHud AI stream analysis requires a consented audio/video analysis service. No stream is being analyzed yet.")}} aria-label="HudHud AI stream analysis preview">{hudhud?"🦅 HudHud AI preview on":"🦅 HudHud AI preview off"}</button>}{hudhud&&tts&&<div className="elmi-ai-insight" role="status"><b>🦅 HudHud AI · Preview</b><br/>{insight||"Live stream analysis not connected. No claims or facts have been checked."}</div>}<button type="button" className="elmi-tts-toggle" onClick={()=>{const next=!tts;setTts(next);try{localStorage.setItem("1muslim-live-tts",next?"on":"off")}catch{}}} aria-label={tts?"Disable text to speech":"Enable text to speech"}>{tts?"🔊 TTS on":"🔇 TTS off"}</button><button type="button" className="elmi-live-toggle" onClick={()=>{setEnabled(v=>{if(v){speechToken.current++;if("speechSynthesis" in window)window.speechSynthesis.cancel();setActive([])}return !v})}} aria-label={enabled?"Hide live comment effects":"Show live comment effects"}>{enabled?"✨ Comments on":"○ Comments off"}</button><style jsx>{`
 .omLivePinnedStack{position:absolute;top:9%;left:50%;transform:translateX(-50%);z-index:12;width:min(88%,350px);display:grid;gap:7px;pointer-events:none}.omLivePinnedStack .omLivePinnedComment{position:relative;top:auto;left:auto;transform:none;width:100%;pointer-events:auto}.omHudHudBulkRelease{pointer-events:auto;border:1px solid #c7a7ff88;background:#251342eb;color:#fff;padding:9px 12px;border-radius:999px;font-size:12px;font-weight:800}.omReleasedComment{animation:liveFloat 1s ease-out both!important}
 .omFloatingComment{background:#10152599!important;border:1px solid #ffffff40!important;box-shadow:0 4px 18px #0004!important;backdrop-filter:blur(8px);opacity:.88;max-width:min(75%,310px)!important}
 .omLiveCommentLine{display:flex;align-items:center;gap:9px;min-width:0}.omLiveCommentAvatar{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#ffffff22;overflow:hidden;flex-shrink:0}.omLiveCommentAvatar img{width:100%;height:100%;object-fit:cover}.omLivePinnedComment{position:absolute;top:10%;left:50%;transform:translateX(-50%);z-index:10;width:min(88%,350px);padding:11px 14px;border-radius:16px;background:#171028e8;border:1px solid #e0c0ff88;box-shadow:0 0 25px #ac72ff44;pointer-events:auto}.omLivePinnedComment>span{display:block;font-size:10px;font-weight:800;color:#d9baff;margin-bottom:7px}.omLivePinnedComment strong{font-size:14px}.omFloatingComment small{font-size:9px;color:#d5c7ff}
 .elmi-live-shell{position:absolute;inset:0;pointer-events:none;z-index:4;color:#fff}.elmi-live-cards{position:absolute;inset:0;overflow:hidden;pointer-events:none}.elmi-live-card{position:absolute;max-width:min(42%,220px);width:max-content;isolation:isolate;overflow:hidden;display:grid;gap:5px;padding:10px 13px;background:linear-gradient(110deg,#061e2ce8,#142d34dd,#122c20dd);border:1px solid #7bc5d9aa;border-radius:15px;backdrop-filter:blur(12px);box-shadow:0 8px 22px #0009;animation:liveFloat var(--float-duration,5s) ease-in-out both;transform-origin:center}.elmi-live-card.tiny{width:max-content;max-width:100%;min-width:92px;text-align:center;padding:13px 19px}.elmi-live-card.tiny strong{font-size:clamp(28px,6vw,52px);line-height:1.15}.elmi-live-card.emoteSpree{animation:liveFloat var(--float-duration,5s) ease-in-out both,emoteQuake 1.6s ease-in-out 2;box-shadow:0 0 30px #59e7ff99,0 0 45px #f4d48b44}.elmi-live-card.emoteSpree .elmi-live-particles i{animation-duration:.8s}.elmi-live-card.lit{box-shadow:0 0 25px #58dfff66,inset 0 0 16px #f6d38e22;border-color:#b5f8e8}.elmi-live-card span{position:relative;z-index:2;color:#b0f4d8;font-size:9px;letter-spacing:.12em;font-weight:900}.elmi-live-card strong{position:relative;z-index:2;font-size:clamp(11px,1.5vw,15px);line-height:1.45;overflow-wrap:anywhere}.elmi-live-particles{position:absolute;inset:0}.elmi-live-particles i{position:absolute;bottom:0;width:3px;height:3px;border-radius:50%;background:#ffdb96;box-shadow:0 0 9px 3px #7ce8ff88;animation:liveSpark 1.7s ease-out infinite}.elmi-live-particles i:nth-child(3n){background:#7dffad}.elmi-live-particles i:nth-child(3n + 1){background:#7bdfff}.elmi-tts-toggle{position:absolute;right:12px;bottom:51px;pointer-events:auto;background:#0a1e2dd9;color:#d9fff1;border:1px solid #89ead488;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}.elmi-live-toggle{position:absolute;right:12px;bottom:14px;pointer-events:auto;background:#0a1e2dd9;color:#d9fff1;border:1px solid #89ead488;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}@keyframes emoteQuake{0%,100%{translate:0 0;rotate:0deg}15%{translate:-2px 1px;rotate:-.4deg}30%{translate:2px -1px;rotate:.4deg}45%{translate:-1px 2px;rotate:-.3deg}60%{translate:2px 0;rotate:.3deg}75%{translate:-1px -1px;rotate:-.2deg}90%{translate:1px 1px;rotate:.1deg}}@keyframes liveFloat{0%{opacity:0;transform:translate(-50%,22px) scale(calc(var(--comment-scale)*.85))}12%{opacity:1;transform:translate(-50%,0) scale(var(--comment-scale))}70%{opacity:1;transform:translate(calc(-50% + var(--drift-x)*.65),calc(var(--drift-y)*.65)) scale(var(--comment-scale))}90%{opacity:.75;filter:blur(0)}100%{opacity:0;transform:translate(calc(-50% + var(--drift-x)),var(--drift-y)) scale(calc(var(--comment-scale)*.9));filter:blur(5px)}}@keyframes livePop{from{opacity:0;transform:translateY(20px) scale(.96);filter:blur(3px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}@keyframes liveSpark{from{opacity:0;transform:translateY(0)}20%{opacity:1}to{opacity:0;transform:translateY(-65px)}}@media(prefers-reduced-motion:reduce){.elmi-live-card,.elmi-live-particles i{animation:none!important}}
 `}</style></div>
}