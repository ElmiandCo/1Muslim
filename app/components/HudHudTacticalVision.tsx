"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

const KEY="1muslim-hudhud-tactical-vision";
const VERSION="1.0";
const features=[
 {test:/qur.?an|verse|surah|ayah|annotation|tajw/i,title:"Qur’an Studio",info:"Read Arabic verses with translations, highlight words, annotate, and open study and recording tools. Saved highlights may be stored on this device.",href:"/elm-tent/quran"},
 {test:/live|stream|camera/i,title:"Live",info:"Explore live streams and Go Live with camera controls. Availability depends on permissions and account access.",href:"/streaming"},
 {test:/message|chat|ashab/i,title:"Ashab & Messages",info:"Connect with other members, explore companions and access conversations. Some actions require sign-in.",href:"/messages"},
 {test:/lesson|learn|xp|badge|arabic/i,title:"Learning",info:"Learn Qur’an, Arabic and foundational topics, with XP and badge-based progress.",href:"/learn"},
 {test:/profile|setting|theme|vision|orb|hudhud/i,title:"HudHud & Preferences",info:"HudHud 1.0 offers contextual targeting, draggable Vision cards, explanations, feature help and links. The bottom-center Orb opens controls; hold it for Vision on supported pages. Features may vary by page.",href:"/settings"},
 {test:/home|start|explore/i,title:"Explore 1Muslim",info:"Explore Qur’an, lessons, live streams, member profiles and the community from the main navigation.",href:"/"}
];
type Target={element:HTMLElement;label:string;x:number;y:number;href:string|null};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function candidate(el:Element|null):HTMLElement|null{
 if(!el||el.closest("[data-hudhud-vision-ui]"))return null;
 const picked=el.closest("a,button,[data-annotation-id],[data-annotation],mark,[data-vision-context],[data-verse-index],h1,h2,h3,h4,p,li,article,section,[role='button']")||el;
 if(!(picked instanceof HTMLElement))return null;
 if(picked.matches("html,body")||picked.closest("[aria-hidden='true']"))return null;
 return picked;
}
function describe(el:HTMLElement):Target{
 const r=el.getBoundingClientRect();
 const label=(el.getAttribute("data-vision-context")||el.getAttribute("aria-label")||el.innerText||el.textContent||el.tagName).replace(/\s+/g," ").trim().slice(0,180);
 const link=el.closest("a[href]") as HTMLAnchorElement|null;
 const href=link?.getAttribute("href")||null;
 return {element:el,label:label||"Selected element",x:r.left+r.width/2,y:r.top+r.height/2,href:href?.startsWith("/")?href:null};
}
function explain(t:Target|null,path:string){
 if(!t)return {title:"Choose a target",info:"Drag the glowing target onto any visible text or control to explore it.",href:null as string|null};
 const f=features.find(x=>x.test.test(t.label+" "+path));
 if(t.element.matches("button,[role='button']"))return {title:t.label,info:"This is an interactive control. Tap it to perform its labeled action. HudHud Vision does not activate it while targeting.",href:t.href||f?.href||null};
 if(t.element.matches("a"))return {title:t.label,info:"This is a navigation link. Open it to visit the related page.",href:t.href||f?.href||null};
 if(t.element.matches("mark,[data-annotation-id],[data-annotation]"))return {title:"Qur’an annotation",info:"This is highlighted or annotated text. Tap the highlighted word in the Qur’an reader to review its saved annotation.",href:"/elm-tent/quran"};
 return {title:f?.title||"On this screen",info:(f?.info||"This content is part of the current page. Drag the target to inspect another element.")+" Selected: "+t.label.slice(0,110),href:t.href||f?.href||null};
}
export default function HudHudTacticalVision(){
 const pathname=usePathname()||"/";
 const [enabled,setEnabled]=useState(false),[open,setOpen]=useState(false),[target,setTarget]=useState<Target|null>(null);
 const [point,setPoint]=useState({x:0,y:0}),[card,setCard]=useState({x:12,y:145}),[query,setQuery]=useState(""),[reply,setReply]=useState("");
 const dragging=useRef<{kind:"target"|"card";x:number;y:number;ox:number;oy:number}|null>(null);
 const targetRef=useRef<Target|null>(null);
 const pick=useCallback((x:number,y:number)=>{
  const els=document.elementsFromPoint(x,y);
  const el=els.map(candidate).find(Boolean);
  if(!el)return;
  const next=describe(el);targetRef.current=next;setTarget(next);setPoint({x:next.x,y:next.y});
 },[]);
 useEffect(()=>{try{setEnabled(localStorage.getItem(KEY)!=="off")}catch{}},[]);
 useEffect(()=>{
  const sync=()=>{try{setEnabled(localStorage.getItem(KEY)!=="off")}catch{}};
  const show=()=>{setEnabled(true);setOpen(true);try{localStorage.setItem(KEY,"on")}catch{}};
  const smart=(e:Event)=>{show();setReply((e as CustomEvent<{context?:string}>).detail?.context||"Drag the target to inspect a screen element.")};
  window.addEventListener("1muslim:hudhud-vision-changed",sync);
  window.addEventListener("1muslim:hudhud-vision-enable",show);
  window.addEventListener("1muslim:hudhud-smart-explain",smart);
  return()=>{window.removeEventListener("1muslim:hudhud-vision-changed",sync);window.removeEventListener("1muslim:hudhud-vision-enable",show);window.removeEventListener("1muslim:hudhud-smart-explain",smart)};
 },[]);
 useEffect(()=>{setOpen(false);setTarget(null);targetRef.current=null;setReply("")},[pathname]);
 useEffect(()=>{
  if(!enabled||!open)return;
  const timer=window.setTimeout(()=>{
   const preferred=pathname.includes("quran")?document.querySelector<HTMLElement>("[data-annotation-id],[data-annotation],mark,[data-vision-context]"):document.querySelector<HTMLElement>("[data-vision-context],main h1,main h2,main article");
   const el=preferred&&candidate(preferred);
   if(el){const t=describe(el);targetRef.current=t;setTarget(t);setPoint({x:t.x,y:t.y})}
   else setPoint({x:innerWidth/2,y:innerHeight/2});
  },350);
  return()=>clearTimeout(timer);
 },[pathname,enabled,open]);
 useEffect(()=>{
  if(!open)return;
  const reposition=()=>{
   if(dragging.current?.kind==="target")return;
   const t=targetRef.current;if(!t||!document.contains(t.element))return;
   const r=t.element.getBoundingClientRect();setPoint({x:r.left+r.width/2,y:r.top+r.height/2});
  };
  window.addEventListener("scroll",reposition,true);window.addEventListener("resize",reposition);
  return()=>{window.removeEventListener("scroll",reposition,true);window.removeEventListener("resize",reposition)};
 },[open]);
 const begin=(e:React.PointerEvent<HTMLElement>,kind:"target"|"card")=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);dragging.current={kind,x:e.clientX,y:e.clientY,ox:kind==="target"?point.x:card.x,oy:kind==="target"?point.y:card.y}};
 const move=(e:React.PointerEvent<HTMLElement>)=>{const d=dragging.current;if(!d)return;const x=d.ox+e.clientX-d.x,y=d.oy+e.clientY-d.y;if(d.kind==="target")setPoint({x:clamp(x,12,innerWidth-12),y:clamp(y,60,innerHeight-50)});else setCard({x:clamp(x,8,Math.max(8,innerWidth-300)),y:clamp(y,65,Math.max(65,innerHeight-160))})};
 const end=(e:React.PointerEvent<HTMLElement>)=>{const d=dragging.current;dragging.current=null;if(d?.kind==="target")pick(e.clientX,e.clientY)};
 const info=explain(target,pathname);
 const ask=()=>{const q=query.trim();if(!q)return;const f=features.find(x=>x.test.test(q));setReply(f?f.title+": "+f.info:"HudHud Vision 1.0 can explain site features, highlight screen elements and link to pages. Ask about Qur’an, live streams, messages, lessons, badges, settings or the Orb.");};
 if(!enabled||!open)return null;
 const cardWidth= Math.min(300,typeof window==="undefined"?300:window.innerWidth-20);
 return <div data-hudhud-vision-ui="true">
  <svg aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:9300}}>
   <path d={`M${point.x} ${point.y} Q${(point.x+card.x+30)/2} ${point.y-35} ${card.x+24} ${card.y+40}`} stroke="#85f6d4" strokeWidth="2" strokeDasharray="6 6" fill="none"/>
  </svg>
  <button type="button" aria-label="HudHud target. Drag to another element; arrow keys reposition" onPointerDown={e=>begin(e,"target")} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>dragging.current=null} onKeyDown={e=>{const steps:{[key:string]:[number,number]}={ArrowLeft:[-22,0],ArrowRight:[22,0],ArrowUp:[0,-22],ArrowDown:[0,22]};const step=steps[e.key];if(step){e.preventDefault();const x=clamp(point.x+step[0],12,innerWidth-12),y=clamp(point.y+step[1],60,innerHeight-50);setPoint({x,y});pick(x,y)}}} style={{position:"fixed",left:point.x,top:point.y,transform:"translate(-50%,-50%)",zIndex:9302,width:43,height:43,borderRadius:"50%",border:"2px solid #8bffe0",background:"#1b735c55",boxShadow:"0 0 0 8px #55ffc122,0 0 20px #7bffe0",touchAction:"none",cursor:"grab",color:"white"}}>✧</button>
  <section aria-label="HudHud Vision 1.0 contextual guidance" style={{position:"fixed",left:clamp(card.x,8,Math.max(8,innerWidth-cardWidth-8)),top:card.y,width:cardWidth,zIndex:9301,borderRadius:20,padding:14,background:"linear-gradient(130deg,#092e28ef,#101e35f2)",border:"1px solid #8beac2",boxShadow:"0 12px 45px #0009,0 0 20px #66eeb022",color:"#f3fff9",maxHeight:"min(65vh,470px)",overflowY:"auto"}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><button type="button" aria-label="Drag HudHud Vision card" onPointerDown={e=>begin(e,"card")} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>dragging.current=null} style={{touchAction:"none",padding:"8px",borderRadius:10,border:"1px solid #9affd977",background:"#204a45",color:"#e6fff5",cursor:"grab"}}>⠿</button><strong style={{flex:1}}>✦ HudHud · Vision v{VERSION}</strong><button type="button" aria-label="Close HudHud Vision" onClick={()=>setOpen(false)} style={{borderRadius:30,padding:"5px 12px"}}>×</button></div>
   <h3 style={{fontSize:16,margin:"14px 0 6px"}}>{info.title}</h3><p style={{fontSize:13,lineHeight:1.55}}>{info.info}</p>
   {info.href&&<Link href={info.href} style={{color:"#8fffdc",fontWeight:700}}>Explore related page ↗</Link>}
   <form onSubmit={e=>{e.preventDefault();ask()}} style={{marginTop:14,display:"flex",gap:6}}><input aria-label="Ask HudHud about a site feature" placeholder="Ask about 1Muslim…" value={query} onChange={e=>setQuery(e.target.value)} style={{minWidth:0,flex:1,borderRadius:9,padding:8,background:"#082027",border:"1px solid #6ca",color:"white"}}/><button type="submit" style={{borderRadius:9,padding:"6px 9px"}}>Ask</button></form>
   {reply&&<p role="status" style={{fontSize:13,lineHeight:1.5}}>{reply}</p>}
   <small style={{display:"block",marginTop:10,opacity:.75}}>Drag ✧ to retarget · Drag ⠿ to move · HudHud 1.0 · 1Muslim 2.1</small>
  </section>
 </div>;
}
