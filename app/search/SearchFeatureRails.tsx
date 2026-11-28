"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type TouchEvent,type MouseEvent} from "react";

type Destination={label:string;detail:string;href:string;image:string};
const destinations: Destination[]=[
 {label:"DeepWatch",detail:"Films, shows & series",href:"/deepwatch",image:"/assets/deepwatch-icon.PNG"},
 {label:"Posts",detail:"What the Ummah is sharing",href:"/posts",image:"/assets/hudhud-messages.PNG"},
 {label:"LIVE",detail:"Join the conversation",href:"/streaming",image:"/assets/hudhud-live.PNG"},
 {label:"Muslims",detail:"Find your Ummah",href:"/profile?section=muslimeen",image:"/assets/avatars/cosmic-avatar-male.PNG"},
 {label:"Notifications",detail:"Your latest updates",href:"/notifications",image:"/assets/hudhud-salam-welcome.PNG"},
 {label:"Settings",detail:"Personalize 1Muslim",href:"/settings",image:"/assets/hudhud-security-guardian.webp"}
];
type Start={x:number;y:number;time:number};
export default function SearchFeatureRails(){
 const [hidden,setHidden]=useState(false);
 const [returning,setReturning]=useState(false);
 const gesture=useRef<Start|null>(null);
 const suppressClick=useRef(false);
 const restoreTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(restoreTimer.current)clearTimeout(restoreTimer.current)},[]);
 const dismiss=()=>{
  suppressClick.current=true;
  setHidden(true);setReturning(false);
 };
 const restore=()=>{
  setReturning(true);setHidden(false);
  if(restoreTimer.current)clearTimeout(restoreTimer.current);
  restoreTimer.current=setTimeout(()=>setReturning(false),600);
 };
 const begin=(e:TouchEvent<HTMLElement>)=>{
  const t=e.touches[0];if(!t)return;
  gesture.current={x:t.clientX,y:t.clientY,time:performance.now()};
 };
 const finish=(e:TouchEvent<HTMLElement>)=>{
  const start=gesture.current;gesture.current=null;
  const t=e.changedTouches[0];if(!t||!start)return;
  const dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(Math.abs(dx)<100||Math.abs(dx)<Math.abs(dy)*1.4)return;
  if(hidden){if(dx>100)restore();return}
  const speed=Math.abs(dx)/Math.max(30,performance.now()-start.time);
  // A deliberate fast leftward fling removes the entire rail for this visit.
  // Normal horizontal scrolling through the six genuine links keeps working.
  if(dx< -145&&speed>1.25)dismiss();
 };
 const suppress=(e:MouseEvent<HTMLElement>)=>{
  if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false}
 };
 return <section className={"dsExploreFeatureSection"+(hidden?" dsExploreHidden":"")+(returning?" dsExploreReturning":"")}
  aria-label="Explore 1Muslim shortcuts">
  {hidden?
   <button type="button" className="dsExploreRestore" onTouchStart={begin} onTouchEnd={finish}
    onClick={restore} aria-label="Show Explore 1Muslim app shortcuts">
    <span>Tap or swipe right to bring Explore back</span>
   </button>:
   <>
    <div className="dsSectionHead"><h2 id="dsExploreFeatureTitle">Explore 1Muslim</h2></div>
    <nav className="dsFeatureRail" aria-label="Explore 1Muslim. Swipe horizontally to access all six destinations."
     tabIndex={0} onTouchStart={begin} onTouchEnd={finish} onClickCapture={suppress}>
     {destinations.map(item=><Link className="dsFeatureCard" href={item.href} key={item.href}
       aria-label={item.label+": "+item.detail}>
       <span className="dsFeatureImage"><img src={item.image} alt="" loading="lazy"/></span>
       <span className="dsFeatureCopy"><strong>{item.label}</strong><small>{item.detail}</small></span>
      </Link>)}
    </nav>
   </>}
 </section>;
}
