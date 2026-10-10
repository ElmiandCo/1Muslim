"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

type Target={text:string;tag:string;href:string|null;rect:{x:number;y:number};context:string};
type Note={id:string;text:string;explanation:string;translation?:string;url:string;createdAt:string};
const KEY="1muslim-hudhud-tactical-vision";
const NOTES="1muslim-hudhud-vision-notes-v1";
const ignore="[data-hudhud-vision],script,style,input,textarea,select,[contenteditable='true'],[aria-hidden='true']";
const routes:Record<string,{label:string;href:string}>={
 live:{label:"Explore live streams",href:"/streaming"},quran:{label:"Open Qur'an",href:"/elm-tent/quran"},
 learn:{label:"Explore lessons",href:"/learn"},lesson:{label:"Explore lessons",href:"/learn"},
 sahaba:{label:"Learn about the Companions",href:"/as-sahaba"},
 ashab:{label:"Learn about the Companions",href:"/as-sahaba"},
 arabic:{label:"Practice Arabic",href:"/arabic-badges"},
 message:{label:"Open messages",href:"/messages"},profile:{label:"Open profile",href:"/profile"}
};
function targetFromPoint(x:number,y:number):Target|null{
 const nodes=document.elementsFromPoint(x,y);
 const raw=nodes.find(el=>!el.closest("[data-hudhud-vision]")&&!el.matches(ignore));
 if(!raw)return null;
 const el=raw.closest("a,button,h1,h2,h3,h4,p,li,article,[data-vision-context],[role='button']")||raw;
 if(el.closest("[data-hudhud-vision]"))return null;
 const content=(el.getAttribute("aria-label")||el.textContent||el.getAttribute("alt")||"").replace(/\s+/g," ").trim().slice(0,650);
 const parent=(el.closest("section,article,main")||el.parentElement);
 const context=(parent?.querySelector("h1,h2,h3")?.textContent||"").replace(/\s+/g," ").trim().slice(0,140);
 const text=content||context||el.tagName.toLowerCase();
 const rect=el.getBoundingClientRect();
 const link=el.closest("a")?.getAttribute("href")||el.querySelector("a")?.getAttribute("href")||null;
 return {text,tag:el.tagName.toLowerCase(),href:link?.startsWith("/")?link:null,rect:{x:rect.left+rect.width/2,y:rect.top+rect.height/2},context};
}
function explanation(t:Target):string{
 const label=t.text.toLowerCase();
 if(/بسم الله|bismillah/.test(label))return "Bismillah means ‘In the name of Allah.’ It is said before many everyday activities as a remembrance of Allah. Explore its Arabic pronunciation and usage in the learning materials.";
 if(/أصحاب|ashab|sahaba|صحابة/.test(label))return "Aṣḥāb means companions. In this community it may describe connections between members; aṣ-Ṣaḥābah specifically refers to the Companions of Prophet Muhammad ﷺ. Explore their biographies to learn the distinction.";
 if(/xp|level|points/.test(label))return "This shows your learning progress. XP is earned through eligible activities and helps you unlock levels and achievements. Check the activity requirements before assuming a reward is available.";
 if(/live|stream/.test(label))return "Live features let members broadcast or watch in real time. The relevant page shows available streams, scheduling options, and any permission requirements.";
 if(/qur.?an|surah|ayah|verse/.test(label))return "This area relates to the Qur'an. Open its linked source to check the Arabic wording, translation and tafsir; a short UI explanation is not a substitute for a verified reference.";
 if(/translate|arabic|عربي/.test(label))return "This area supports language learning or translation. Use Translate to convert the selected text, and compare translations with the original wording.";
 if(t.tag==="button")return "This is an interactive control labeled “"+t.text+"”. Select it to perform the action described. Its placement makes this action available in the current section"+(t.context?" (“"+t.context+"”).":"." );
 if(t.href)return "This link leads to “"+t.text+"”. It is here to help you navigate from the current page"+(t.context?" under “"+t.context+"”.":".")+" Follow it to explore the full content.";
 return "You selected “"+t.text+"”"+(t.context?" in the “"+t.context+"” section":"")+". This content provides context for the current page. Use the nearby actions or linked page for details; HudHud can translate this text or save it to your notes.";
}
function related(t:Target){if(t.href)return {label:"Open selected link",href:t.href};const s=(t.text+" "+t.context).toLowerCase();for(const [key,v] of Object.entries(routes))if(s.includes(key))return v;return null}
export default function HudHudTacticalVision(){
 const pathname=usePathname()||"/";
 const [enabled,setEnabled]=useState(true),[open,setOpen]=useState(false);
 const [pos,setPos]=useState({x:16,y:180});
 const [point,setPoint]=useState<{x:number;y:number}|null>(null);
 const [target,setTarget]=useState<Target|null>(null);
 const [dragging,setDragging]=useState(false),[mode,setMode]=useState<"explain"|"translate"|"notes">("explain");
 const [translation,setTranslation]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [notes,setNotes]=useState<Note[]>([]);
 const drag=useRef<{kind:"panel"|"target";x:number;y:number;px:number;py:number}|null>(null);
 const latest=useRef(0);
 const inspect=useCallback((x:number,y:number)=>{const t=targetFromPoint(x,y);if(t){setTarget(t);setPoint({x,y});setTranslation("");setMessage("");setMode("explain")}},[]);
 useEffect(()=>{try{setEnabled(localStorage.getItem(KEY)!=="off");setNotes(JSON.parse(localStorage.getItem(NOTES)||"[]"))}catch{}},[]);
 useEffect(()=>{const sync=()=>setEnabled(localStorage.getItem(KEY)!=="off");window.addEventListener("1muslim:hudhud-vision-changed",sync);return()=>window.removeEventListener("1muslim:hudhud-vision-changed",sync)},[]);
 useEffect(()=>{setOpen(false);setTarget(null);setPoint(null);const timer=setTimeout(()=>setOpen(true),1500);return()=>clearTimeout(timer)},[pathname]);
 useEffect(()=>{if(!enabled||!open||target)return;const timer=setTimeout(()=>{const el=Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,a,button")).find(e=>!e.closest("[data-hudhud-vision]")&&e.getBoundingClientRect().top>110&&e.getBoundingClientRect().top<innerHeight*.7&&e.textContent?.trim());if(el){const r=el.getBoundingClientRect();inspect(r.left+r.width/2,r.top+r.height/2)}},500);return()=>clearTimeout(timer)},[enabled,open,pathname,target,inspect]);
 const start=(e:React.PointerEvent<HTMLElement>,kind:"panel"|"target")=>{e.preventDefault();e.stopPropagation();drag.current={kind,x:e.clientX,y:e.clientY,px:pos.x,py:pos.y};if(kind==="target"){setDragging(true);setPoint({x:e.clientX,y:e.clientY})}e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLElement>)=>{const d=drag.current;if(!d)return;e.preventDefault();if(d.kind==="target"){setPoint({x:e.clientX,y:e.clientY});return}setPos({x:Math.max(8,Math.min(innerWidth-300,d.px+e.clientX-d.x)),y:Math.max(70,Math.min(innerHeight-160,d.py+e.clientY-d.y))})};
 const end=(e:React.PointerEvent<HTMLElement>)=>{if(drag.current?.kind==="target"){inspect(e.clientX,e.clientY);setDragging(false)}drag.current=null};
 const translate=async()=>{if(!target)return;setBusy(true);setMessage("");const id=++latest.current;try{const res=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({texts:[target.text],target:/[\u0600-\u06ff]/.test(target.text)?"en":"ar"})});if(!res.ok)throw Error();const data=await res.json();if(id===latest.current)setTranslation(String(data.translations?.[0]||"No translation returned."))}catch{setMessage("Translation is unavailable right now.")}finally{setBusy(false)}};
 const save=()=>{if(!target)return;const n:Note={id:crypto.randomUUID(),text:target.text,explanation:explanation(target),translation:translation||undefined,url:location.pathname+location.search,createdAt:new Date().toISOString()};const updated=[n,...notes].slice(0,150);setNotes(updated);try{localStorage.setItem(NOTES,JSON.stringify(updated));setMessage("Saved on this device in My Vision Notes.")}catch{setMessage("Could not save note on this device.")}};
 if(!enabled||!open)return null;
 const action=target?related(target):null;
 const px=point?.x??target?.rect.x??innerWidth/2,py=point?.y??target?.rect.y??innerHeight/2;
 return <div data-hudhud-vision="true">
 <svg aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:9300,overflow:"visible"}}>
 <path d={`M${px} ${py} Q${(px+pos.x+25)/2} ${py-38} ${pos.x+25} ${pos.y+35}`} stroke="#8af5ca" strokeWidth="2" strokeDasharray="6 6" fill="none"/>
 </svg>
 <div role="slider" aria-label="Drag HudHud target to inspect any element" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50} tabIndex={0} onKeyDown={e=>{const step=24;if(e.key.startsWith("Arrow")){e.preventDefault();const x=px+(e.key==="ArrowRight"?step:e.key==="ArrowLeft"?-step:0),y=py+(e.key==="ArrowDown"?step:e.key==="ArrowUp"?-step:0);inspect(x,y)}}} onPointerDown={e=>start(e,"target")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} style={{position:"fixed",left:px-19,top:py-19,width:38,height:38,zIndex:9302,borderRadius:"50%",border:"2px solid #9dffda",background:dragging?"#64ffbc55":"#06382d55",boxShadow:"0 0 18px #63ffc899",touchAction:"none",cursor:"grab",display:"grid",placeItems:"center",color:"#baffdf"}}>⌖</div>
 <section aria-label="HudHud contextual guidance" style={{position:"fixed",left:pos.x,top:pos.y,width:"min(300px,calc(100vw - 20px))",maxHeight:"min(58dvh,480px)",overflowY:"auto",zIndex:9301,borderRadius:20,padding:15,background:"linear-gradient(130deg,rgba(9,47,36,.94),rgba(13,40,46,.95))",backdropFilter:"blur(12px)",border:"1px solid #8beac2",boxShadow:"0 12px 45px #0009,0 0 20px #66eeb022",color:"#f3fff9"}}>
 <header style={{display:"flex",alignItems:"center",gap:9}}><button aria-label="Move HudHud Vision panel" title="Drag panel" onPointerDown={e=>start(e,"panel")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} style={{touchAction:"none",cursor:"grab",padding:9,background:"#376d5a",color:"white",border:"1px solid #8beac2",borderRadius:10}}>⠿</button><strong style={{flex:1}}>✦ HudHud · Vision</strong><button aria-label="Close Vision" onClick={()=>setOpen(false)} style={{border:0,borderRadius:20,padding:"6px 12px"}}>×</button></header>
 <div style={{display:"flex",gap:6,marginTop:12}}>{(["explain","translate","notes"] as const).map(m=><button key={m} onClick={()=>setMode(m)} aria-pressed={mode===m} style={{flex:1,border:"1px solid #8beac277",borderRadius:9,padding:"8px 4px",background:mode===m?"#67d7ab":"#173e38",color:mode===m?"#08231b":"white",fontSize:12,textTransform:"capitalize"}}>{m}</button>)}</div>
 {target?<><p style={{fontSize:12,color:"#b6e8d2",overflowWrap:"anywhere"}}><b>Target:</b> {target.text.slice(0,130)}</p>
 {mode==="explain"&&<><p style={{fontSize:13,lineHeight:1.65}}>{explanation(target)}</p>{action&&<Link href={action.href} style={{color:"#9ef6cd",fontWeight:700}}>{action.label} →</Link>}</>}
 {mode==="translate"&&<><button disabled={busy} onClick={translate} style={{padding:9,borderRadius:9,background:"#8cf5ce",color:"#08271d"}}>{busy?"Translating…":"Translate selected text"}</button>{translation&&<p dir="auto" style={{lineHeight:1.7}}>{translation}</p>}</>}
 {mode==="notes"&&<><button onClick={save} style={{padding:9,borderRadius:9,background:"#8cf5ce",color:"#08271d"}}>＋ Save target as note</button><p style={{fontSize:12}}>Saved locally on this device. Account synchronization will require a notes database.</p>{notes.slice(0,5).map(n=><div key={n.id} style={{borderTop:"1px solid #7bd6aa55",padding:"8px 0",fontSize:12}}><b>{n.text.slice(0,70)}</b><div><Link href={n.url} style={{color:"#9ef6cd"}}>Return to page →</Link></div></div>)}</>}
 <div style={{display:"flex",gap:8,marginTop:12}}><button onClick={save} style={{background:"#214f43",color:"#c9ffe8",border:"1px solid #8beac2",borderRadius:10,padding:9}}>📝 Save note</button><button onClick={()=>{setTarget(null);setPoint(null);setMessage("Drag the target ring to inspect anything.")}} style={{background:"#214f43",color:"#c9ffe8",border:"1px solid #8beac2",borderRadius:10,padding:9}}>⌖ Retarget</button></div></>:<p>Drag the glowing target onto any text, button, or card to inspect it.</p>}
 {message&&<p role="status" style={{fontSize:12,color:"#aaffd6"}}>{message}</p>}
 </section></div>;
}
