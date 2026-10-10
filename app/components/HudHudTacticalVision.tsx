"use client";
import {useEffect,useState,useRef} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

const hints=[
 {match:/^\/as-sahaba/,words:["الصحابة","أصحاب"],text:"These are the Companions of the Prophet ﷺ. Open a card to explore their lives and hadith references.",href:"/as-sahaba",label:"Explore the Companions"},
 {match:/^\/ashab/,words:["أصحاب","Ashab"],text:"أصحاب means companions. Here it means people you follow who follow you back. The Prophet's Companions are called الصحابة.",href:"/as-sahaba",label:"Learn about الصحابة"},
 {match:/^\/streaming/,words:["Go Live","Live Now","Streaming"],text:"Preparing to stream? Check your camera, microphone and title before going live.",href:"/streaming/go-live",label:"Prepare a live"},
 {match:/^\/messages/,words:["Messages","Message"],text:"Messages help you connect with your community. Check who can contact you in your privacy settings.",href:"/settings",label:"Privacy settings"},
 {match:/^\/learn/,words:["Learn","Lessons"],text:"Take one lesson at a time. Understanding matters more than rushing through the material.",href:"/learn",label:"Browse lessons"},
 {match:/^\/profile/,words:["Profile","Avatar"],text:"Your profile is how other members recognize you. Keep your information and avatar up to date.",href:"/profile",label:"Your profile"},
 {match:/^\/$/,words:["أصحاب","Ashab","Learn"],text:"Welcome! Explore the community, learn something new, or discover the meaning of أصحاب.",href:"/as-sahaba",label:"Discover أصحاب"}
];
const KEY="1muslim-hudhud-tactical-vision";
export default function HudHudTacticalVision(){
 const pathname=usePathname()||"/";
 const [on,setOn]=useState(true),[open,setOpen]=useState(false),[settings,setSettings]=useState(false);
 const [anchor,setAnchor]=useState<{x:number;y:number}|null>(null),[pos,setPos]=useState({x:20,y:160}),[dragged,setDragged]=useState(false);
 const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
 const hint=hints.find(h=>h.match.test(pathname))||{words:["أصحاب"],text:"HudHud can explain Arabic words and guide you to the most relevant learning page.",href:"/as-sahaba",label:"Explore Arabic words"};
 useEffect(()=>{try{setOn(localStorage.getItem(KEY)!=="off")}catch{}},[]);
 useEffect(()=>{const sync=()=>{try{setOn(localStorage.getItem(KEY)!=="off")}catch{}};window.addEventListener("1muslim:hudhud-vision-changed",sync);return()=>window.removeEventListener("1muslim:hudhud-vision-changed",sync)},[]);
 useEffect(()=>{setOpen(false);setDragged(false);const t=setTimeout(()=>setOpen(true),4200);return()=>clearTimeout(t)},[pathname]);
 useEffect(()=>{if(!on||!open)return;
 const locate=()=>{
  const elements=Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,a,button,span"));
  const found=elements.find(el=>el.offsetWidth>0&&el.offsetWidth<innerWidth*.75&&hint.words.some(w=>el.textContent?.trim().includes(w))&&(()=>{const r=el.getBoundingClientRect();return r.top>70&&r.top<innerHeight-90})());
  const r=found?.getBoundingClientRect();if(!r){setAnchor(null);return}
  setAnchor({x:r.left+r.width/2,y:r.top+r.height/2});
  if(!dragged){const width=Math.min(300,innerWidth-24);const x=r.right+width+18<innerWidth?r.right+14:r.left-width-14>8?r.left-width-14:Math.max(8,innerWidth-width-12);setPos({x,y:Math.max(88,Math.min(innerHeight-205,r.top))})}
 };
 locate();window.addEventListener("scroll",locate,true);window.addEventListener("resize",locate);
 const timer=setInterval(locate,2500);
 return()=>{window.removeEventListener("scroll",locate,true);window.removeEventListener("resize",locate);clearInterval(timer)}
 },[pathname,on,open,dragged]);
 const setEnabled=(value:boolean)=>{setOn(value);localStorage.setItem(KEY,value?"on":"off")};
 const start=(e:React.PointerEvent<HTMLElement>)=>{if(!(e.target as HTMLElement).closest("[data-vision-handle]"))return;drag.current={x:e.clientX,y:e.clientY,px:pos.x,py:pos.y};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLElement>)=>{if(!drag.current)return;if(Math.abs(e.clientX-drag.current.x)+Math.abs(e.clientY-drag.current.y)<5)return;setDragged(true);setPos({x:Math.max(8,Math.min(innerWidth-290,drag.current.px+e.clientX-drag.current.x)),y:Math.max(80,Math.min(innerHeight-130,drag.current.py+e.clientY-drag.current.y))})};
 return <>
 {on&&open&&<>{anchor&&<svg aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:9300}}><path d={`M${anchor.x} ${anchor.y} Q${(anchor.x+pos.x)/2} ${anchor.y-36} ${pos.x+14} ${pos.y+35}`} stroke="#8af5ca" strokeWidth="1.5" strokeDasharray="5 5" fill="none"/><circle cx={anchor.x} cy={anchor.y} r="5" stroke="#9dffda" fill="none"/></svg>}
 <section aria-label="HudHud contextual guidance" onPointerDown={start} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} style={{position:"fixed",left:pos.x,top:pos.y,width:Math.min(300,innerWidth-24),zIndex:9301,borderRadius:20,padding:16,background:"linear-gradient(130deg,rgba(9,47,36,.48),rgba(13,40,46,.42))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid #8beac2",boxShadow:"0 12px 45px #0009,0 0 20px #66eeb022",color:"#f3fff9",touchAction:"auto",cursor:"default",animation:"hudhudCalloutIn .45s ease both"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><button type="button" data-vision-handle aria-label="Drag HudHud Vision card" title="Drag this handle to move the card" style={{cursor:"grab",touchAction:"none",border:"1px solid #9affd977",borderRadius:10,padding:"7px 10px",background:"rgba(85,211,158,.13)",color:"#c3ffe9",fontSize:19,letterSpacing:2}}>⠿</button><b style={{flex:1}}>✦ HudHud · Vision</b><span><button title="Dismiss" onClick={()=>setOpen(false)}>✕</button></span></div>
 <p style={{fontSize:14,lineHeight:1.6}}>{hint.text}</p><Link href={hint.href} style={{color:"#9ef6cd",fontWeight:700}}>{hint.label} →</Link>
 </section></>}
 <style>{`@keyframes hudhudCalloutIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){section[aria-label="HudHud contextual guidance"]{animation:none!important}}`}</style>
 </>;
}
