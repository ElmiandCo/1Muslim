"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Recognition = {lang:string;continuous:boolean;interimResults:boolean;onresult:((e:any)=>void)|null;onerror:((e:any)=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type Verse={reference:string;arabic:string;english:string;topic:string[]};
const VERSES:Verse[]=[
 {reference:"50:16",arabic:"وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",english:"And We have already created man and know what his soul whispers to him, and We are closer to him than [his] jugular vein.",topic:["jugular","vein","close","closeness"]},
 {reference:"2:186",arabic:"وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",english:"And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.",topic:["near","close","closeness","prayer","dua"]},
 {reference:"94:5",arabic:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",english:"For indeed, with hardship [will be] ease.",topic:["hardship","ease","difficulty"]},
 {reference:"94:6",arabic:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",english:"Indeed, with hardship [will be] ease.",topic:["hardship","ease","difficulty"]},
 {reference:"39:53",arabic:"قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",english:"Say, O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah.",topic:["mercy","forgive","forgiveness","despair"]},
 {reference:"13:28",arabic:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",english:"Unquestionably, by the remembrance of Allah hearts are assured.",topic:["remembrance","dhikr","heart","peace"]}
];
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
export default function HudHudLiveVerse(){
 const [open,setOpen]=useState(false),[training,setTraining]=useState(0),[trained,setTrained]=useState(false),[active,setActive]=useState(false),[message,setMessage]=useState("Tap HudHud to set up voice activation."),[verse,setVerse]=useState<Verse|null>(null);
 const [profileKey,setProfileKey]=useState("guest"),[heard,setHeard]=useState<string[]>([]);
 const rec=useRef<Recognition|null>(null),listening=useRef(false),trainedRef=useRef(false),activeRef=useRef(false),verseRef=useRef<Verse|null>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 const [pos,setPos]=useState<{left:number;top:number}|null>(null);
 useEffect(()=>{let mounted=true;createClient().auth.getUser().then(({data})=>{if(mounted)setProfileKey(data.user?.id||"guest")}).catch(()=>{});return()=>{mounted=false}},[]);
 useEffect(()=>{const saved=localStorage.getItem("hudhud-live-wake-v1:"+profileKey);setTrained(Boolean(saved));trainedRef.current=Boolean(saved);},[profileKey]);
 useEffect(()=>{trainedRef.current=trained},[trained]);useEffect(()=>{activeRef.current=active},[active]);useEffect(()=>{verseRef.current=verse},[verse]);
 const supported=()=>Boolean((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition);
 const stop=()=>{listening.current=false;rec.current?.stop();rec.current=null};
 const handle=(text:string)=>{
  const phrase=normalize(text);
  if(!trainedRef.current){if(!phrase.includes("hud")&&!phrase.includes("hood")){setMessage("Please say HudHud clearly. Try again.");return}
   setHeard(old=>{const next=[...old,text];setTraining(next.length);if(next.length===3){localStorage.setItem("hudhud-live-wake-v1:"+profileKey,JSON.stringify({samples:next,createdAt:new Date().toISOString()}));setTrained(true);trainedRef.current=true;setMessage("HudHud is ready. Say ‘HudHud’ before each request.");}else setMessage("Great. Say HudHud "+(3-next.length)+" more time(s).");return next});return}
  if(!/\b(hud\s?hud|hood\s?hood|hudhood|hudhud)\b/.test(phrase))return;
  const cmd=phrase.replace(/.*?\b(hud\s?hud|hood\s?hood|hudhood|hudhud)\b/,"").trim();
  if(/(take it away|hide|close|dismiss|thank|thanks|deactivate)/.test(cmd)){setOpen(false);setActive(false);setMessage("Dismissed. Say HudHud to wake again.");return}
  setOpen(true);setActive(true);
  if(!cmd){setMessage("HudHud is listening. Say ‘HudHud’ followed by a verse request.");return}
  const next=/(another|next|more)/.test(cmd);
  const words=cmd.split(" ").filter(w=>w.length>3&&!["verse","quran","where","does","another","next","show","about","says","bring","what","that","this"].includes(w));
  const candidates=VERSES.filter(v=>v.topic.some(t=>words.some(w=>t.includes(w)||w.includes(t))));
  const matches=candidates.length?candidates:next&&verseRef.current?VERSES.filter(v=>v.topic.some(t=>verseRef.current!.topic.includes(t))):[];
  const result=matches.find(v=>v.reference!==verseRef.current?.reference)||matches[0];
  if(result){setVerse(result);setMessage("Verified reference · Qur’an "+result.reference+" · English excerpt (Sahih International)");}
  else {setVerse(null);setMessage("I cannot verify that verse from the Phase 1 reference set. Please check the Qur’an Studio; I won't invent a citation.");}
 };
 const begin=()=>{
  if(!supported()){setMessage("Voice recognition is unavailable in this browser. Try Safari or Chrome with microphone access.");setOpen(true);return}
  stop();listening.current=true;
  const C=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  const r:Recognition=new C();rec.current=r;r.lang="en-US";r.continuous=false;r.interimResults=false;
  r.onresult=e=>handle(String(e.results?.[0]?.[0]?.transcript||""));
  r.onerror=e=>{if(e.error!=="no-speech")setMessage("Microphone: "+e.error+". Tap HudHud to retry.");};
  r.onend=()=>{if(listening.current&&rec.current===r){window.setTimeout(()=>{if(listening.current&&rec.current===r)try{r.start()}catch{}},450)}};
  try{r.start();setMessage(trainedRef.current?"Listening for ‘HudHud’…":"Say HudHud three times to personalize activation.");setOpen(true)}catch{setMessage("Allow microphone access and tap again.");}
 };
 useEffect(()=>()=>stop(),[]);
 return <><button type="button" onClick={()=>{if(!trained){setTraining(0);setHeard([])}begin()}} style={{position:"fixed",bottom:100,right:16,zIndex:110,border:"1px solid #b9a36a",borderRadius:40,padding:"12px 16px",background:"rgba(3,24,21,.92)",color:"#e8cf85",fontWeight:700,backdropFilter:"blur(16px)"}} aria-label="Activate HudHud verse assistant">✦ HudHud {trained?"🎙":""}</button>
 {open&&<div onPointerDown={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{position:"fixed",inset:0,zIndex:109,pointerEvents:"auto",background:"rgba(0,0,0,.08)"}}>
 <section style={{position:"absolute",left:pos?.left??"8%",top:pos?.top??"22%",width:"84%",maxWidth:420,maxHeight:"65vh",overflowY:"auto",padding:20,border:"1px solid rgba(218,188,102,.5)",borderRadius:20,background:"rgba(4,31,27,.75)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",color:"#fff",boxShadow:"0 16px 45px #0009"}}>
 <header onPointerDown={e=>{const box=e.currentTarget.parentElement!.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,left:box.left,top:box.top};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current){setPos({left:Math.max(0,drag.current.left+e.clientX-drag.current.x),top:Math.max(0,drag.current.top+e.clientY-drag.current.y)})}}} onPointerUp={()=>drag.current=null} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"grab",touchAction:"none",color:"#e9d28d"}}><strong>✦ HudHud · Qur’an</strong><button type="button" onClick={()=>setOpen(false)} style={{background:"transparent",color:"white",border:0,fontSize:24}}>×</button></header>
 <p style={{fontSize:13,lineHeight:1.5,opacity:.9}}>{message}</p>
 {!trained&&<p>Pronunciation samples: {training}/3</p>}
 {verse&&<><p style={{fontSize:13,color:"#e9d28d"}}>Qur’an {verse.reference}</p><p dir="rtl" lang="ar" style={{fontSize:23,lineHeight:2,textAlign:"right"}}>{verse.arabic}</p><p style={{fontSize:15,lineHeight:1.65}}>{verse.english}</p></>}
 <small style={{opacity:.65}}>Text-only · Wake word required for each request · Phase 1 curated references</small>
 </section></div>}</>;
}
