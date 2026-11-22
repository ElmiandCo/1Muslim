"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import "./quran-recitation-studio.css";

type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number};
type Take={blob:Blob;url:string;duration:number;extension:"webm"|"m4a"|"ogg"|"mp3";mime:string};
type Mode="record"|"live";
type Visual="clean"|"starlight"|"emerald";
const BUCKET="quran-community-recitals";
const chooseMime=()=>["audio/webm;codecs=opus","audio/mp4","audio/webm","audio/ogg"].find(t=>typeof MediaRecorder!=="undefined"&&MediaRecorder.isTypeSupported(t))||"";
const format=(seconds:number)=>Math.floor(seconds/60).toString().padStart(2,"0")+":"+(seconds%60).toString().padStart(2,"0");
export default function QuranRecitationStudio({chapters,initialChapter}:{chapters:Chapter[];initialChapter:number}){
 const [open,setOpen]=useState(false);
 const [chapter,setChapter]=useState(initialChapter);
 const [mode,setMode]=useState<Mode>("record");
 const [visual,setVisual]=useState<Visual>("clean");
 const [camera,setCamera]=useState(false);
 const [consent,setConsent]=useState(false);
 const [recording,setRecording]=useState(false);
 const [seconds,setSeconds]=useState(0);
 const [take,setTake]=useState<Take|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),parts=useRef<Blob[]>([]);
 const takeUrl=useRef<string|null>(null),clock=useRef<number|null>(null),started=useRef(0),timeout=useRef<number|null>(null);
 const cleanup=useCallback(()=>{
  if(clock.current!==null)window.clearInterval(clock.current);clock.current=null;
  if(timeout.current!==null)window.clearTimeout(timeout.current);timeout.current=null;
  stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;recorder.current=null;
 },[]);
 const release=useCallback(()=>{if(takeUrl.current){URL.revokeObjectURL(takeUrl.current);takeUrl.current=null}setTake(null)},[]);
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   const detail=(event as CustomEvent<{chapter?:number;mode?:Mode}>).detail;
   const chosen=Number(detail?.chapter);
   setChapter(Number.isInteger(chosen)&&chosen>=1&&chosen<=114?chosen:initialChapter);
   setMode(detail?.mode==="live"?"live":"record");setOpen(true);setMessage("");
  };
  window.addEventListener("1muslim:quran-recitation-studio",onOpen);
  return()=>window.removeEventListener("1muslim:quran-recitation-studio",onOpen);
 },[initialChapter]);
 useEffect(()=>()=>{if(recorder.current?.state==="recording")recorder.current.stop();cleanup();if(takeUrl.current)URL.revokeObjectURL(takeUrl.current)},[cleanup]);
 useEffect(()=>{if(!open)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!recording&&!busy)setOpen(false)};
  document.addEventListener("keydown",onEscape);return()=>document.removeEventListener("keydown",onEscape);
 },[open,recording,busy]);
 const selected=chapters.find(c=>c.id===chapter);
 const chapterName=selected?.name_simple||"Surah "+chapter;
 const close=()=>{if(recording||busy)return;setOpen(false);setMessage("")};
 const begin=async()=>{
  if(busy||recording)return;setMessage("");release();setSeconds(0);
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){
   setMessage("Microphone recording is not supported in this browser.");return;
  }
  try{
   const db=createClient(),{data:{user}}=await db.auth.getUser();
   if(!user){setMessage("Sign in to save a recitation. Your microphone has not been activated.");return}
   const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
   stream.current=s;parts.current=[];
   const mime=chooseMime();
   const media=new MediaRecorder(s,mime?{mimeType:mime,audioBitsPerSecond:64000}:undefined);
   recorder.current=media;
   started.current=performance.now();
   media.ondataavailable=e=>{if(e.data.size>0)parts.current.push(e.data)};
   media.onerror=()=>{setMessage("Recording interrupted. Please try another take.");cleanup();setRecording(false)};
   media.onstop=()=>{
    const duration=Math.max(1,Math.round((performance.now()-started.current)/1000));
    const blob=new Blob(parts.current,{type:media.mimeType||"audio/webm"});
    cleanup();setRecording(false);setSeconds(duration);
    if(blob.size<10240){setMessage("This recording is too short or empty. Please make another take.");return}
    const actual=(media.mimeType||blob.type).toLowerCase();
    const extension=actual.includes("mp4")?"m4a":actual.includes("ogg")?"ogg":actual.includes("mpeg")?"mp3":"webm";
    const normalized=extension==="m4a"?"audio/mp4":extension==="ogg"?"audio/ogg":extension==="mp3"?"audio/mpeg":"audio/webm";
    const url=URL.createObjectURL(blob);takeUrl.current=url;
    setTake({blob,url,duration,extension,mime:normalized});
   };
   media.start(1000);setRecording(true);
   clock.current=window.setInterval(()=>setSeconds(Math.floor((performance.now()-started.current)/1000)),1000);
   timeout.current=window.setTimeout(()=>{if(media.state==="recording")media.stop()},30*60*1000);
  }catch(err){cleanup();setRecording(false);setMessage(err instanceof Error?err.message:"Microphone access was denied.");}
 };
 const stop=()=>{if(recorder.current?.state==="recording")recorder.current.stop()};
 const publish=async()=>{
  if(!take||busy||!consent)return;
  setBusy(true);setMessage("");
  const db=createClient(),{data:{user}}=await db.auth.getUser();
  if(!user){setBusy(false);setMessage("Please sign in to publish.");return}
  const id=crypto.randomUUID(),path=user.id+"/"+id+"."+take.extension;
  try{
   if(take.blob.size>31457280)throw Error("Keep recordings under 30 MB.");
   const uploaded=await db.storage.from(BUCKET).upload(path,take.blob,{contentType:take.mime,upsert:false,cacheControl:"3600"});
   if(uploaded.error)throw uploaded.error;
   const response=await fetch("/api/quran-recitals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,chapter,duration:take.duration,extension:take.extension}),cache:"no-store"});
   const json=await response.json();
   if(!response.ok){
     await db.storage.from(BUCKET).remove([path]);
     throw Error(json.error||"Could not publish your recitation.");
   }
   release();setConsent(false);
   setMessage("Published to the Recitation Library. "+(json.awarded>0?"+"+json.awarded.toLocaleString()+" XP earned!":json.xpPending?"Your XP is pending verification.":"You can earn up to 1,000 XP for your first qualifying chapter recitation of the day."));
   window.dispatchEvent(new CustomEvent("1muslim:quran-recital-published",{detail:{chapter,id}}));
   window.dispatchEvent(new Event("1muslim:xp-updated"));
  }catch(e){setMessage(e instanceof Error?e.message:"Could not publish right now. Your take is still here.")}
  finally{setBusy(false)}
 };
 if(!open)return null;
 const liveHref="/streaming/go-live?topic="+encodeURIComponent("Qur'an")+
  "&title="+encodeURIComponent("Reciting "+chapterName)+
  "&reciteChapter="+encodeURIComponent(String(chapter))+
  "&reciteMode="+(camera?"phone":"voice")+"&reciteVisual="+visual;
 return <div className="qrsBackdrop" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
   <section className="qrsSheet" role="dialog" aria-modal="true" aria-label="Qur’an Recitation Studio">
    <div className="qrsHandle" aria-hidden="true"/>
    <header className="qrsHeader">
      <div><span className="qrsKicker">1MUSLIM · QUR’AN STUDIO</span><h2>Recite & share</h2><p>Your voice, your chosen chapter.</p></div>
      <button type="button" className="qrsClose" onClick={close} disabled={recording||busy} aria-label="Close Recitation Studio">×</button>
    </header>
    <div className="qrsTabs" role="tablist" aria-label="Recording or live">
      <button role="tab" aria-selected={mode==="record"} className={mode==="record"?"selected":""} onClick={()=>setMode("record")} disabled={recording||busy}>◉ Record audio</button>
      <button role="tab" aria-selected={mode==="live"} className={mode==="live"?"selected":""} onClick={()=>setMode("live")} disabled={recording||busy}>● Recite Live</button>
    </div>
    <label className="qrsField">Choose a surah
      <select value={chapter} onChange={e=>{setChapter(Number(e.target.value));release();setMessage("")}} disabled={recording||busy}>
        {chapters.length?chapters.map(c=><option key={c.id} value={c.id}>{c.id}. {c.name_simple}</option>):<option value={chapter}>{chapterName}</option>}
      </select>
    </label>
    <div className={"qrsPreview qrs-"+visual} aria-label="Selected reading backdrop">
      <span>✦ 1MUSLIM RECITATIONS</span><strong lang="ar" dir="rtl">{selected?.name_arabic||"القرآن الكريم"}</strong>
      <h3>{chapterName}</h3><small>{selected?.verses_count||"—"} āyāt · {camera&&mode==="live"?"Camera on":"Voice focused"}</small>
    </div>
    {mode==="record"?<div className="qrsRecord">
      <p className="qrsExplain">Record once, listen back, then decide whether to publish. No Live room, camera, or streaming bandwidth.</p>
      <div className="qrsRecordControl">
        <span className={"qrsTimer"+(recording?" recording":"")}>{recording?"● ":""}{format(seconds)}</span>
        {!recording&&!take&&<button className="qrsMain" type="button" onClick={()=>void begin()} disabled={busy}>● Start audio recording</button>}
        {recording&&<button className="qrsMain qrsStop" type="button" onClick={stop}>■ Finish recording</button>}
        {take&&<div className="qrsTake">
          <audio controls preload="metadata" src={take.url} aria-label="Review your recorded recitation"/>
          <button type="button" onClick={()=>{release();setMessage("");setSeconds(0)}} disabled={busy}>↻ Record again</button>
        </div>}
      </div>
      {take&&<><label className="qrsConsent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
          <span>I choose to make this audio recitation public for the Ummah to hear.</span></label>
        <button className="qrsMain" onClick={()=>void publish()} type="button" disabled={busy||!consent}>{busy?"Publishing…":"Publish to Recitation Library ↗"}</button>
      </>}
      <p className="qrsFootnote">Up to <strong>1,000 XP</strong> for an eligible recording of 30+ seconds, once per chapter and at most once per day. XP rewards participation, not recitation accuracy. Audio stays on this device until you publish.</p>
    </div>:<div className="qrsLive">
      <p className="qrsExplain">Broadcast your recitation with existing 1Muslim Live. Listeners can join from anywhere, including the floating mini player, and chat respectfully.</p>
      <label className="qrsToggle"><span><b>Camera</b><small>{camera?"Camera and microphone":"Microphone only — lower bandwidth"}</small></span><input type="checkbox" checked={camera} onChange={e=>setCamera(e.target.checked)} /></label>
      <div className="qrsVisuals"><span>Reading atmosphere</span><div>
        {([["clean","Minimal"],["starlight","Starlight"],["emerald","Emerald"]] as const).map(([key,title])=><button key={key} type="button" className={visual===key?"selected":""} onClick={()=>setVisual(key)}>{title}</button>)}
      </div></div>
      <Link href={liveHref} className="qrsMain" onClick={()=>setOpen(false)}>Continue to Live Studio ↗</Link>
      <small className="qrsLiveNote">You’ll review your microphone, camera and audience settings before you actually go live. Your selected chapter and background carry over.</small>
    </div>}
    {message&&<p className="qrsMessage" role="status">{message}</p>}
    <footer className="qrsFooter"><Link href="/quran-recitals" onClick={()=>{if(!recording)setOpen(false)}}>Browse community recitations →</Link><span>Private by default · you control sharing</span></footer>
   </section>
 </div>;
}
