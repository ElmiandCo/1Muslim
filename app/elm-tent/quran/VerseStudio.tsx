"use client";
import { useEffect, useState } from "react";

type Message={role:"hudhud"|"you";text:string};
const prompts=[
 {label:"What does this verse say?",kind:"meaning"},
 {label:"How can I reflect on it?",kind:"reflect"},
 {label:"Help me study this ayah",kind:"study"},
 {label:"Share this verse",kind:"share"}
] as const;
const strip=(s:string)=>s.replace(/<[^>]*>/g,"").replace(/&[^;]+;/g," ").trim();
export default function VerseStudio({verse}:{verse:string}){
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [translation,setTranslation]=useState("");
 const [error,setError]=useState("");
 const [messages,setMessages]=useState<Message[]>([]);
 const [reflection,setReflection]=useState("");
 const [saved,setSaved]=useState(false);
 useEffect(()=>{
  setOpen(false);setTranslation("");setError("");setSaved(false);
  setMessages([{role:"hudhud",text:`Assalamu alaikum! 🦅 I'm HudHud. Let's explore Qur'an ${verse} together. Choose a question below.`}]);
  try{setReflection(localStorage.getItem("1muslim-hudhud-reflection:"+verse)||"")}catch{setReflection("")}
  let active=true;
  const parts=verse.split(":").map(Number);
  if(parts.length!==2||parts.some(n=>!Number.isInteger(n)||n<1)){setError("Invalid verse reference");return}
  setLoading(true);
  fetch(`https://api.quran.com/api/v4/verses/by_key/${encodeURIComponent(verse)}?translations=131&language=en`)
   .then(r=>{if(!r.ok)throw Error("Translation unavailable");return r.json()})
   .then(d=>{if(active)setTranslation(strip(d.verse?.translations?.[0]?.text||""))})
   .catch(()=>{if(active)setError("Translation unavailable right now. You can still reflect on this ayah.")})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[verse]);
 const ask=(kind:string,label:string)=>{
  let answer="";
  if(kind==="meaning")answer=translation?`Qur'an ${verse} — translation: “${translation}”\n\nRead the Arabic and compare a trusted tafsir for detailed interpretation.`:loading?"I'm loading the verse translation. Please try again shortly.":error||"The translation is not available.";
  else if(kind==="reflect")answer="What does this ayah teach you about Allah, yourself, or your actions? Write one takeaway below. For interpretation, consult a reliable tafsir rather than relying on a quick summary.";
  else if(kind==="study")answer=`A simple study journey for ${verse}: ① Read the Arabic carefully. ② Read a translation. ③ Consult a trusted tafsir and its context. ④ Record one lesson and one question. ⑤ Revisit tomorrow.`;
  else answer="Use the Share verse button below to copy a link to this ayah.";
  setMessages(old=>[...old,{role:"you",text:label},{role:"hudhud",text:answer}]);
 };
 const save=()=>{
  try{localStorage.setItem("1muslim-hudhud-reflection:"+verse,reflection);setSaved(true);window.dispatchEvent(new CustomEvent("1muslim:action-success"))}
  catch{setSaved(false);setError("Could not save this reflection on your device.")}
 };
 const share=async()=>{
  const url=window.location.origin+"/elm-tent/quran?verse="+encodeURIComponent(verse);
  try{await navigator.clipboard.writeText(`Qur'an ${verse}\n${translation}\n${url}`);setMessages(old=>[...old,{role:"hudhud",text:"Verse reference copied! ✓"}]);window.dispatchEvent(new CustomEvent("1muslim:action-success"))}
  catch{setError("Could not copy. Please use your browser's share feature.")}
 };
 return <div className="hh-verse">
  <div style={{display:"flex",alignItems:"center",gap:8}}><button type="button" title="Toggle HudHud Vision" aria-label={`Toggle HudHud Vision for ${verse}`} onClick={()=>window.dispatchEvent(new Event("1muslim:hudhud-vision-toggle"))} style={{flex:"0 0 42px",width:42,height:42,borderRadius:"50%",border:"1px solid #6b6dd7",background:"radial-gradient(circle,#34426e,#14172f)",boxShadow:"0 0 13px #6f8cff66",cursor:"pointer",display:"grid",placeItems:"center"}}><img src="/assets/hudhud-logo.PNG" alt="" style={{width:28,height:28,objectFit:"contain"}}/></button><button className="hh-verse-toggle" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
   <img src="/assets/hudhud-logo.PNG" alt="" /><span><strong>Chat with HudHud about {verse}</strong><small>Understand · Reflect · Remember</small></span><b>{open?"−":"+"}</b>
  </button>
  </div>{open&&<section className="hh-verse-panel" aria-label={`HudHud verse ${verse} chat`}>
   <div className="hh-verse-header"><span>🦅 HUDHUD · QUR'AN STUDIO</span><strong>Let's explore ayah {verse}</strong></div>
   <div className="hh-verse-messages" aria-live="polite">{messages.map((m,i)=><div key={i} className={m.role==="you"?"hh-verse-message user":"hh-verse-message bird"}>{m.role==="hudhud"&&<span>✨ HudHud</span>}<p>{m.text}</p></div>)}</div>
   <div className="hh-verse-prompts">{prompts.map(p=><button key={p.kind} type="button" onClick={()=>ask(p.kind,p.label)}>{p.label}</button>)}</div>
   <label className="hh-verse-reflect">📝 My reflection<textarea rows={3} value={reflection} onChange={e=>{setReflection(e.target.value);setSaved(false)}} placeholder="What did this verse teach you?"/></label>
   <div className="hh-verse-actions"><button type="button" onClick={save}>Save reflection</button><button type="button" onClick={()=>void share()}>Share verse ↗</button>{saved&&<span role="status">Saved ✓</span>}</div>
   {error&&<p className="hh-verse-error" role="status">{error}</p>}
   <small className="hh-verse-note">HudHud provides guided study prompts, not live AI answers or authoritative tafsir. The Arabic Qur'an text is never modified.</small>
  </section>}
  <style jsx>{`
   .hh-verse{margin:18px 0;color:#e9f5ff}.hh-verse-toggle{display:flex;align-items:center;gap:13px;width:100%;text-align:left;padding:14px 17px;border:1px solid #76d7ff88;border-radius:18px;background:linear-gradient(110deg,#09243e,#153759,#142042);color:#fff;cursor:pointer;box-shadow:0 0 20px #62bfff22;transition:box-shadow .25s,transform .25s}.hh-verse-toggle:hover{box-shadow:0 0 24px #71cfff77;transform:translateY(-2px)}.hh-verse-toggle img{width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 0 10px #9ddfff)}.hh-verse-toggle span{flex:1;display:grid;gap:4px}.hh-verse-toggle small{color:#b9d9ed}.hh-verse-toggle b{font-size:23px}
   .hh-verse-panel{margin-top:10px;padding:17px;border:1px solid #75c7ff55;border-radius:20px;background:linear-gradient(155deg,#09182e,#112947);box-shadow:0 12px 36px #0005;animation:hhVerseOpen .4s ease}.hh-verse-header{display:grid;gap:5px;padding:5px 5px 15px}.hh-verse-header span{font-size:11px;letter-spacing:2px;color:#9ae3ff}.hh-verse-header strong{font-size:19px}.hh-verse-messages{display:grid;gap:10px;max-height:310px;overflow:auto;padding:5px}.hh-verse-message{padding:12px 15px;border-radius:16px;background:#17395d;white-space:pre-wrap;line-height:1.5}.hh-verse-message.user{background:#215d67;margin-left:12%}.hh-verse-message.bird{margin-right:9%}.hh-verse-message span{font-size:12px;color:#9ce4ff}.hh-verse-message p{margin:6px 0 0}.hh-verse-prompts{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.hh-verse-prompts button,.hh-verse-actions button{padding:10px 12px;border:1px solid #76c8e888;border-radius:12px;background:#174667;color:#fff;cursor:pointer}.hh-verse-prompts button:hover,.hh-verse-actions button:hover{background:#236b94}.hh-verse-reflect{display:grid;gap:9px;font-weight:600}.hh-verse-reflect textarea{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid #6cb7d877;padding:12px;background:#081b31;color:#fff;font:inherit}.hh-verse-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:13px 0}.hh-verse-actions span{color:#8effd5}.hh-verse-error{color:#ffd5ae}.hh-verse-note{color:#bdd1e4;line-height:1.5}@keyframes hhVerseOpen{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.hh-verse-panel{animation:none}.hh-verse-toggle{transition:none}}
  `}</style>
 </div>;
}
