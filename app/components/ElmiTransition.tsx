"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
type Burst={id:number;x:number;y:number};
export default function ElmiTransition(){
 const router=useRouter(),pathname=usePathname();
 const [phase,setPhase]=useState<"idle"|"pop"|"poof"|"reveal">("idle");
 const [burst,setBurst]=useState<Burst[]>([]);
 const [farewell,setFarewell]=useState(false);
 useEffect(()=>{if(phase==="idle")return;setPhase("reveal");const t=setTimeout(()=>setPhase("idle"),750);return()=>clearTimeout(t)},[pathname]);
 useEffect(()=>{
  let navigating=false;const timers:number[]=[];
  const enabled=()=>{try{return localStorage.getItem("1muslim-elmi-light")!=="off"&&!matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return true}};
  const sparkle=(x:number,y:number)=>{if(!enabled())return;const id=Date.now()+Math.random();setBurst(a=>[...a.slice(-8),{id,x,y}]);timers.push(window.setTimeout(()=>setBurst(a=>a.filter(b=>b.id!==id)),1300))};
  const onAction=(e:Event)=>{const d=(e as CustomEvent<{x?:number;y?:number}>).detail;sparkle(d?.x??innerWidth/2,d?.y??innerHeight/2)};
  const onClick=(e:MouseEvent)=>{
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||navigating)return;
   const target=e.target;if(!(target instanceof Element))return;
   const a=target.closest("a[href]") as HTMLAnchorElement|null;
   if(!a||a.hasAttribute("download")||a.target==="_blank"||a.dataset.noElmiTransition!==undefined)return;
   const url=new URL(a.href,location.href);
   if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;
   if(!enabled())return;
   e.preventDefault();navigating=true;sparkle(e.clientX,e.clientY);setPhase("pop");
   timers.push(window.setTimeout(()=>setPhase("poof"),190));
   timers.push(window.setTimeout(()=>{router.push(url.pathname+url.search+url.hash);navigating=false;setPhase("reveal")},470));
   timers.push(window.setTimeout(()=>setPhase("idle"),1250));
  };
  const onSubmit=(e:Event)=>{const t=e.target;if(t instanceof HTMLFormElement){const r=t.getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2)}};
  document.addEventListener("click",onClick,true);document.addEventListener("submit",onSubmit);
  const onFarewell=()=>{if(!enabled())return;setFarewell(true);setPhase("pop");for(let i=0;i<7;i++){timers.push(window.setTimeout(()=>{sparkle(innerWidth*(.15+.7*(i%2)),innerHeight*(.2+.6*((i%3)/2)));setPhase(i%2?"poof":"pop")},i*155))}timers.push(window.setTimeout(()=>{setPhase("reveal");setFarewell(false)},1280))};
  window.addEventListener("1muslim:farewell",onFarewell);
  window.addEventListener("1muslim:action-success",onAction);
  return()=>{document.removeEventListener("click",onClick,true);document.removeEventListener("submit",onSubmit);window.removeEventListener("1muslim:action-success",onAction);window.removeEventListener("1muslim:farewell",onFarewell);timers.forEach(clearTimeout)};
 },[router]);
 return <div className="elmi-cinema" aria-hidden="true">
  {farewell&&<div className="elmi-farewell-title">✦ Until next time ✦</div>}
  {phase!=="idle"&&<div className={"elmi-cinema-veil "+phase}><i className="elmi-cinema-beam"/></div>}
  {burst.map(b=><div key={b.id} className="elmi-cinema-burst" style={{left:b.x,top:b.y}}>{Array.from({length:16},(_,i)=><i key={i} style={{["--i" as string]:i,["--dx" as string]:Math.cos(i*Math.PI/8)*((i%3+1)*26)+"px",["--dy" as string]:Math.sin(i*Math.PI/8)*((i%3+1)*26)+"px"}}/>)}</div>)}
  <style jsx>{`
   .elmi-farewell-title{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);color:#fff3cb;text-shadow:0 0 24px #67efff;font-size:clamp(20px,5vw,38px);font-weight:900;letter-spacing:.1em;white-space:nowrap;z-index:2;animation:elmiVeil .35s both}
   .elmi-cinema{position:fixed;inset:0;pointer-events:none;z-index:2147483645;overflow:hidden}
   .elmi-cinema-veil{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,#173c4d88,#020c1bd9);animation:elmiVeil .4s both}
   .elmi-cinema-veil.pop{opacity:.35}.elmi-cinema-veil.poof{opacity:.9}.elmi-cinema-veil.reveal{animation:elmiReveal .75s both}
   .elmi-cinema-beam{position:absolute;left:50%;top:-15%;height:130%;width:5px;background:linear-gradient(transparent,#6ff9ff,#fff3be,#6ff9ff,transparent);box-shadow:0 0 28px 10px #72ebff88;animation:elmiSweep .8s ease-in-out both}
   .elmi-cinema-burst{position:absolute;width:1px;height:1px}
   .elmi-cinema-burst i{position:absolute;width:4px;height:22px;border-radius:50%;background:linear-gradient(transparent,#79f4ff,#fff0b4,transparent);box-shadow:0 0 10px #8ffaff;animation:elmiParticle 1.25s ease-out both;animation-delay:calc(var(--i)*18ms)}
   @keyframes elmiParticle{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 130px)) scale(.3)}}
   @keyframes elmiVeil{from{opacity:0}to{opacity:1}}
   @keyframes elmiReveal{from{opacity:.85}to{opacity:0}}
   @keyframes elmiSweep{0%{opacity:0;transform:translateX(-45vw) scaleY(.2)}30%{opacity:1}100%{opacity:0;transform:translateX(45vw) scaleY(1)}}
   @media(prefers-reduced-motion:reduce){.elmi-cinema{display:none}}
  `}</style>
 </div>
}
