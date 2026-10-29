"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
const KEY="1muslim:welcome-swipe-v1";
export default function SwipeWelcome(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[offset,setOffset]=useState(0),[drag,setDrag]=useState(false);
 const start=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{if(pathname!=="/")return;try{if(!sessionStorage.getItem(KEY))setOpen(true)}catch{setOpen(true)}},[pathname]);
 const enter=()=>{try{sessionStorage.setItem(KEY,"seen")}catch{}setDrag(false);setOffset(window.innerWidth);window.setTimeout(()=>{setOpen(false);setOffset(0)},360)};
 if(!open||pathname!=="/")return null;
 return <div className="swWelcome" role="dialog" aria-label="Welcome to 1Muslim" aria-modal="true" onTouchStart={e=>{start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};setDrag(true)}} onTouchMove={e=>{if(!start.current)return;const dx=e.touches[0].clientX-start.current.x,dy=e.touches[0].clientY-start.current.y;if(Math.abs(dx)>Math.abs(dy))setOffset(Math.max(0,dx))}} onTouchEnd={()=>{if(offset>Math.min(110,window.innerWidth*.24))enter();else{setOffset(0);setDrag(false)}start.current=null}} style={{transform:`translateX(${offset}px)`,transition:drag?"none":"transform .36s cubic-bezier(.2,.8,.2,1)"}}>
 <div className="swStars" aria-hidden="true"/><div className="swFrame" aria-hidden="true"/><div className="swTop"><span className="swBrand"><img src="/icon.svg" alt="" className="swBrandLogo"/> 1MUSLIM</span><button onClick={enter} aria-label="Skip welcome">Skip →</button></div>
 <main className="swMain"><div className="swMoon" aria-hidden="true"><img src="/assets/hudhud-logo.PNG" alt=""/></div><div className="swTitle"><div>Welcome to</div><h1>1MUSLIM</h1><p>ONE MUSLIM · ONE UMMAH · ONE FUTURE</p></div><button className="swWatch" onClick={enter}>▶ &nbsp; Watch Live Now</button><p className="swTopics">LIVE · QUR’AN · POSTS · COMMUNITY</p><button className="swExplore" onClick={enter} aria-label="Swipe right to explore"><span>➜</span> Swipe Right to Explore</button></main>
 <style jsx>{`
 .swWelcome{position:fixed;inset:0;z-index:11000;overflow:hidden;color:#ffe7aa;background:linear-gradient(180deg,rgba(0,12,13,.3),rgba(0,12,13,.2) 38%,rgba(0,14,14,.84) 78%),url("/assets/profile-backgrounds/emerald.PNG") center/cover no-repeat,#061b19;touch-action:pan-x;isolation:isolate}
 .swWelcome:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 32%,transparent 8%,#0009 100%),linear-gradient(120deg,#c99d3e20,transparent 25%,#e8bf6c22 80%,transparent);z-index:-1}
 .swStars{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1px 1px at 10% 20%,#ffe8a8 99%,transparent),radial-gradient(2px 2px at 80% 35%,#ffe8a8 99%,transparent),radial-gradient(1px 1px at 50% 15%,#fff 99%,transparent);background-size:160px 210px;opacity:.55;animation:twinkle 6s ease-in-out infinite alternate}
 .swFrame{position:absolute;inset:12px;border:1px solid #d4aa6080;border-radius:32px;box-shadow:inset 0 0 0 7px #031d1c66,inset 0 0 0 9px #c5a26744;pointer-events:none}
 .swTop{position:relative;z-index:1;padding:calc(28px + env(safe-area-inset-top)) 30px 0;display:flex;align-items:center;justify-content:space-between;gap:12px}
 .swBrand{display:inline-flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.08em;font-size:clamp(16px,4vw,24px);text-shadow:0 0 15px #000}
 .swTop button{background:#062f2bdf;border:1px solid #bca66c;color:#ffe7aa;border-radius:100px;padding:10px 17px;font-weight:700}
 .swMain{position:absolute;inset:15% 5% 8%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;gap:clamp(12px,2.5dvh,25px);text-shadow:0 2px 12px #000}
 .swBrandLogo{width:32px;height:32px;object-fit:contain}.swMoon img{width:clamp(88px,22vw,170px);height:clamp(88px,22vw,170px);object-fit:contain;filter:drop-shadow(0 0 20px #42edca99)}.swMoon{margin-bottom:auto;font-size:clamp(64px,15vw,130px);color:#f8d796;filter:drop-shadow(0 0 20px #e6bd6a);opacity:.85}
 .swTitle>div{font-family:Georgia,serif;font-size:clamp(34px,8vw,64px);font-weight:400}
 .swTitle h1{font-family:Georgia,serif;font-size:clamp(56px,14vw,110px);letter-spacing:.045em;margin:0;line-height:1.05;font-weight:500}
 .swTitle p,.swTopics{font-size:clamp(10px,2.6vw,16px);letter-spacing:.19em;font-weight:600}
 .swWatch{background:linear-gradient(120deg,#004b38,#007a58);color:#fff6db;border:2px solid #44ffc4;border-radius:100px;padding:17px 30px;min-width:min(85%,340px);font-size:clamp(17px,4.5vw,24px);font-weight:700;box-shadow:0 0 22px #2affb58a;cursor:pointer}
 .swExplore{display:flex;flex-direction:column;gap:5px;align-items:center;border:0;background:transparent;color:#fff2cb;font-size:15px;cursor:pointer;margin:5px 0 max(12px,env(safe-area-inset-bottom))}
 .swExplore span{font-size:48px;line-height:1;animation:pointRight 1.8s ease-in-out infinite}
 @keyframes pointRight{50%{transform:translateX(13px)}}@keyframes twinkle{to{opacity:.85}}
 @media(prefers-reduced-motion:reduce){.swExplore span,.swStars{animation:none}}
 `}</style></div>;
}
