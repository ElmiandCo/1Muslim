"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";

const discoveries=[
 {icon:"✨",title:"Bismillah",arabic:"بِسْمِ ٱللَّٰهِ",meaning:"In the name of Allah",detail:"A beautiful phrase to begin good things. Try saying it before eating or starting a task.",action:"Practice one small habit today."},
 {icon:"🌙",title:"As-salamu alaykum",arabic:"السَّلَامُ عَلَيْكُمْ",meaning:"Peace be upon you",detail:"A greeting of peace. The reply is Wa alaykum as-salam — and upon you be peace.",action:"Try greeting someone with peace."},
 {icon:"🤲",title:"Alhamdulillah",arabic:"ٱلْحَمْدُ لِلَّٰهِ",meaning:"All praise belongs to Allah",detail:"A phrase of gratitude, often said when something goes well and throughout everyday life.",action:"Name one thing you are grateful for."},
 {icon:"💚",title:"Tawhid",arabic:"التَّوْحِيد",meaning:"The oneness of Allah",detail:"A central belief in Islam: Allah is One. Surah Al-Ikhlas (112) is a short place to start learning about this.",action:"Read Surah Al-Ikhlas and its translation."}
];
export default function DiscoveryHold(){
 const [active,setActive]=useState<number|null>(null);
 const [seen,setSeen]=useState<number[]>([]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const point=useRef<{x:number;y:number}|null>(null);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;point.current=null};
 const reveal=(i:number)=>{cancel();setActive(i);setSeen(s=>s.includes(i)?s:[...s,i]);navigator.vibrate?.(15)};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{if(active===null)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setActive(null)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[active]);
 return <section className="discoverySection" aria-label="Interactive learning discoveries">
 <style jsx>{`
 .discoverySection{padding:22px 16px;margin:16px 0;border-radius:22px;background:linear-gradient(130deg,#12261b,#182d35);color:#f3fff4;border:1px solid #406b53}
 .discoveryHeading{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
 .discoveryHeading h2{font-size:clamp(21px,3vw,30px);margin:5px 0}.discoveryHeading p{font-size:13px;opacity:.8;margin:0}
 .discoveryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
 .discoveryCard{touch-action:pan-y;user-select:none;-webkit-user-select:none;border:1px solid #4a755a;background:#ffffff0d;border-radius:16px;min-height:125px;padding:14px 8px;color:inherit;cursor:pointer;transition:transform .22s,border-color .22s,background .22s}
 .discoveryCard:hover,.discoveryCard:focus-visible{transform:translateY(-4px);border-color:#c6e8a9;background:#ffffff18}
 .discoveryCard .icon{font-size:28px;display:block;margin-bottom:7px}.discoveryCard strong{display:block;font-size:13px}.discoveryCard small{display:block;font-size:10px;opacity:.72;margin-top:7px}
 .discoveryBackdrop{position:fixed;inset:0;background:#000b;z-index:10020;display:grid;place-items:center;padding:20px;animation:discoveryFade .25s ease-out}
 .discoveryModal{position:relative;overflow:hidden;width:min(100%,420px);background:linear-gradient(155deg,#203c2c,#0e2018);border:1px solid #b4dca6;border-radius:26px;padding:26px;text-align:center;box-shadow:0 30px 90px #000b;animation:discoveryPop .42s cubic-bezier(.2,.85,.25,1.15)}
 .discoveryModal .spark{position:absolute;opacity:.55;animation:discoveryFloat 2.2s ease-in-out infinite alternate;pointer-events:none}
 .discoveryModal .arabic{font-size:36px;line-height:1.8;direction:rtl;margin:12px 0}.discoveryModal h3{font-size:26px;margin:8px 0}.discoveryModal p{font-size:14px;line-height:1.65}
 .discoveryModal button,.discoveryModal a{display:inline-block;margin:6px;padding:10px 15px;border:1px solid #8bb79a;border-radius:999px;background:#d8edbf;color:#132519;font-weight:800;cursor:pointer;text-decoration:none}
 @keyframes discoveryFade{from{opacity:0}to{opacity:1}}@keyframes discoveryPop{from{opacity:0;transform:translateY(24px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
 @keyframes discoveryFloat{from{transform:translateY(0) rotate(-12deg)}to{transform:translateY(-24px) rotate(20deg)}}
 @media(max-width:540px){.discoveryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(prefers-reduced-motion:reduce){.discoveryCard,.discoveryBackdrop,.discoveryModal,.discoveryModal .spark{animation:none;transition:none}}
 `}</style>
 <div className="discoveryHeading"><div><span style={{fontSize:10,letterSpacing:2,color:"#cbe7b0",fontWeight:900}}>🌱 NEW HERE? START WITH A DISCOVERY</span><h2>Hold to uncover something beautiful.</h2><p>Press a card for 1 second to reveal a little piece of Islam. No quiz, no pressure.</p></div><span style={{fontSize:12,color:"#d8edbf"}}>{seen.length}/4 discovered ✨</span></div>
 <div className="discoveryGrid">{discoveries.map((item,i)=><button key={item.title} type="button" className="discoveryCard" aria-label={"Discover "+item.title+"; press and hold for one second or click"}
 onPointerDown={e=>{if(e.pointerType==="mouse"&&e.button!==0)return;cancel();point.current={x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>reveal(i),1000)}}
 onPointerMove={e=>{if(point.current&&Math.hypot(e.clientX-point.current.x,e.clientY-point.current.y)>12)cancel()}}
 onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
 onClick={()=>{if(!("ontouchstart" in window))reveal(i)}}
 onContextMenu={e=>{e.preventDefault();reveal(i)}}><span className="icon">{seen.includes(i)?"🌟":item.icon}</span><strong>{item.title}</strong><small>{seen.includes(i)?"✓ Discovered · Hold again":"Hold 1 second to discover"}</small></button>)}</div>
 {active!==null&&<div className="discoveryBackdrop" onClick={()=>setActive(null)}><div className="discoveryModal" role="dialog" aria-modal="true" aria-label={discoveries[active].title} onClick={e=>e.stopPropagation()}>
 <span className="spark" style={{left:22,top:28}}>✦</span><span className="spark" style={{right:28,top:48,animationDelay:".5s"}}>✧</span><span className="spark" style={{left:50,bottom:60,animationDelay:"1s"}}>✨</span>
 <div style={{fontSize:38}}>🎉</div><small style={{color:"#d8edbf",fontWeight:800}}>YOU DISCOVERED SOMETHING NEW</small>
 <h3>{discoveries[active].title}</h3><div className="arabic" lang="ar">{discoveries[active].arabic}</div>
 <strong>{discoveries[active].meaning}</strong><p>{discoveries[active].detail}</p>
 <p style={{color:"#d8edbf"}}>🌱 {discoveries[active].action}</p>
 <button type="button" onClick={()=>setActive(null)}>Keep exploring ✨</button><Link href="/learn/elm-tent#sessions">Explore lessons ↗</Link>
 </div></div>}
 </section>;
}
