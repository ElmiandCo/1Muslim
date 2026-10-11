"use client";
import {useEffect,useState,useRef} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

const tips=[
 {text:"🌱 Be a pioneer: set the tone with kindness. Your words shape the Ummah here.",href:"/community",label:"Encourage the Ummah"},
 {text:"🛡️ Keep 1Muslim safe. Report harassment, scams or harmful content instead of spreading it.",href:"/community",label:"Help protect our community"},
 {text:"✨ Be the face of 1Muslim! Share a reflection or a useful reminder on your profile.",href:"/profile",label:"Post on your profile"},
 {text:"🔴 Your voice matters. Go Live, introduce yourself, and welcome other Muslims.",href:"/streaming/go-live",label:"Try Go Live"},
 {text:"🎥 Going Live on 1Muslim is a different experience. Explore the camera, live interactions and effects.",href:"/streaming/go-live",label:"Explore Go Live"},
 {text:"🤝 Make your first Ashab connection. Great communities start with sincere friendships.",href:"/find",label:"Find people"},
 {text:"💬 Check in on someone. A thoughtful message can brighten a person's day.",href:"/messages",label:"Open messages"},
 {text:"👥 Bring your circle together. Use messages to plan a group conversation or a live gathering.",href:"/messages",label:"Plan a gathering"},
 {text:"📞 Want a FaceTime-style gathering with more energy? Invite friends to a Live session and explore the interactive experience.",href:"/streaming/go-live",label:"Start a live gathering"},
 {text:"📚 Share what you learn, and cite reliable sources. Accuracy helps keep our platform trustworthy.",href:"/learn",label:"Explore lessons"},
 {text:"📖 Make the Qur’an part of your day. Practice a little in Qur’an Studio.",href:"/quran-studio",label:"Open Qur’an Studio"},
 {text:"🌙 Try a Daily Post. One meaningful reflection can inspire the whole Ummah.",href:"/community",label:"Visit the Ummah"},
 {text:"🧭 Welcome newcomers. Explain where to find lessons, stories and Lives.",href:"/community",label:"Welcome someone"},
 {text:"🕊️ Disagree respectfully. Correct ideas with evidence, never with insults.",href:"/community",label:"Lead by example"},
 {text:"🔐 Protect privacy. Ask permission before sharing someone else's recording, photo or personal details.",href:"/profile",label:"Review your profile"},
 {text:"🎙️ Your story may help someone. Share a short audio reflection or an encouraging video.",href:"/profile",label:"Explore your library"},
 {text:"📺 Explore other people's public content and support thoughtful creators.",href:"/streaming/library",label:"Watch recordings"},
 {text:"💚 Celebrate helpful posts. Positive engagement makes useful content easier to discover.",href:"/community",label:"Support a post"},
 {text:"🧑‍🤝‍🧑 Invite your Ashab to watch a Live together, ask questions and learn.",href:"/streaming",label:"Explore Lives"},
 {text:"🚀 Pioneers build the culture. Share beneficial content, be welcoming, and help 1Muslim grow responsibly.",href:"/community",label:"Be a pioneer"}
];
const pageTips=(pathname:string)=>pathname.startsWith("/streaming")?[3,4,8,16,18]:pathname.startsWith("/messages")?[6,7,8,14]:pathname.startsWith("/profile")?[2,14,15,19]:pathname.startsWith("/learn")||pathname.startsWith("/quran")?[9,10,12,13]:pathname.startsWith("/ashab")||pathname.startsWith("/find")?[5,7,12,18]:Array.from({length:tips.length},(_,i)=>i);
const KEY="1muslim-hudhud-tactical-vision";
export default function HudHudTacticalVision(){
 const pathname=usePathname()||"/";
 const [on,setOn]=useState(true),[open,setOpen]=useState(false),[settings,setSettings]=useState(false);
 const [anchor,setAnchor]=useState<{x:number;y:number}|null>(null),[pos,setPos]=useState({x:20,y:160}),[dragged,setDragged]=useState(false);
 const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
 const [tipIndex,setTipIndex]=useState(0);const [dismissed,setDismissed]=useState(false);const choices=pageTips(pathname);const hint=tips[choices[tipIndex%choices.length]];
 useEffect(()=>{try{setOn(localStorage.getItem(KEY)!=="off")}catch{}},[]);
 useEffect(()=>{const sync=()=>{try{setOn(localStorage.getItem(KEY)!=="off")}catch{}};window.addEventListener("1muslim:hudhud-vision-changed",sync);return()=>window.removeEventListener("1muslim:hudhud-vision-changed",sync)},[]);
 useEffect(()=>{setOpen(false);setDragged(false);setDismissed(false);const t=setTimeout(()=>setOpen(true),4200);return()=>clearTimeout(t)},[pathname]);\n useEffect(()=>{const timer=setInterval(()=>{if(!open||dismissed)return;setTipIndex(v=>v+1)},22000);return()=>clearInterval(timer)},[open,dismissed]);
 useEffect(()=>{if(!on||!open||dismissed)return;
 const locate=()=>{
  const elements=Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,a,button,span"));
  const found=elements.find(el=>el.offsetWidth>0&&el.offsetWidth<innerWidth*.75&&["Live","Profile","Message","Learn","Ummah","Ashab","Post"].some(w=>el.textContent?.trim().includes(w))&&(()=>{const r=el.getBoundingClientRect();return r.top>70&&r.top<innerHeight-90})());
  const r=found?.getBoundingClientRect();if(!r){setAnchor(null);return}
  setAnchor({x:r.left+r.width/2,y:r.top+r.height/2});
  if(!dragged){const width=Math.min(300,innerWidth-24);const x=r.right+width+18<innerWidth?r.right+14:r.left-width-14>8?r.left-width-14:Math.max(8,innerWidth-width-12);setPos({x,y:Math.max(88,Math.min(innerHeight-205,r.top))})}
 };
 locate();window.addEventListener("scroll",locate,true);window.addEventListener("resize",locate);
 const timer=setInterval(locate,2500);
 return()=>{window.removeEventListener("scroll",locate,true);window.removeEventListener("resize",locate);clearInterval(timer)}
 },[pathname,on,open,dragged,tipIndex,dismissed]);
 const setEnabled=(value:boolean)=>{setOn(value);localStorage.setItem(KEY,value?"on":"off")};
 const start=(e:React.PointerEvent<HTMLElement>)=>{if(!(e.target as HTMLElement).closest("[data-vision-handle]"))return;drag.current={x:e.clientX,y:e.clientY,px:pos.x,py:pos.y};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLElement>)=>{if(!drag.current)return;if(Math.abs(e.clientX-drag.current.x)+Math.abs(e.clientY-drag.current.y)<5)return;setDragged(true);setPos({x:Math.max(8,Math.min(innerWidth-290,drag.current.px+e.clientX-drag.current.x)),y:Math.max(80,Math.min(innerHeight-130,drag.current.py+e.clientY-drag.current.y))})};
 return <>
 {on&&open&&!dismissed&&<>{anchor&&<svg aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:9300}}><path d={`M${anchor.x} ${anchor.y} Q${(anchor.x+pos.x)/2} ${anchor.y-36} ${pos.x+14} ${pos.y+35}`} stroke="#8af5ca" strokeWidth="1.5" strokeDasharray="5 5" fill="none"/><circle cx={anchor.x} cy={anchor.y} r="5" stroke="#9dffda" fill="none"/></svg>}
 <section aria-label="HudHud contextual guidance" onPointerDown={start} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} style={{position:"fixed",left:pos.x,top:pos.y,width:Math.min(300,innerWidth-24),zIndex:9301,borderRadius:20,padding:16,background:"linear-gradient(130deg,rgba(9,47,36,.48),rgba(13,40,46,.42))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid #8beac2",boxShadow:"0 12px 45px #0009,0 0 20px #66eeb022",color:"#f3fff9",touchAction:"auto",cursor:"default",animation:"hudhudCalloutIn .45s ease both"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><button type="button" data-vision-handle aria-label="Drag HudHud Vision card" title="Drag this handle to move the card" style={{cursor:"grab",touchAction:"none",border:"1px solid #9affd977",borderRadius:10,padding:"7px 10px",background:"rgba(85,211,158,.13)",color:"#c3ffe9",fontSize:19,letterSpacing:2}}>⠿</button><b style={{flex:1}}>✦ HudHud · Vision</b><span><button title="Dismiss" onClick={()=>{setDismissed(true);setOpen(false)}}>✕</button></span></div>
 <p style={{fontSize:14,lineHeight:1.6}}>{hint.text}</p><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:9,fontSize:11,color:"#a8ebd1"}}><span>Tip {tipIndex%choices.length+1} of {choices.length}</span><button type="button" onClick={()=>setTipIndex(v=>v+1)} style={{border:"1px solid #9affd977",borderRadius:999,padding:"6px 11px",background:"#154337",color:"#e9fff5",cursor:"pointer"}}>Next tip →</button></div><Link href={hint.href} style={{color:"#9ef6cd",fontWeight:700}}>{hint.label} →</Link>
 </section></>}
 <style>{`@keyframes hudhudCalloutIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){section[aria-label="HudHud contextual guidance"]{animation:none!important}}`}</style>
 </>;
}
