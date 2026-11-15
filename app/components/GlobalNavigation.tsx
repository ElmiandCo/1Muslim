"use client";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import GlobalNavIcon,{type GlobalNavDestination} from "./GlobalNavIcon";
const entries:{id:GlobalNavDestination;label:string;href?:string}[]=[
{id:"search",label:"Search"},{id:"profile",label:"Profile",href:"/profile"},
{id:"muslims",label:"Muslims",href:"/profile?section=muslimeen"},
{id:"posts",label:"Ummah Posts",href:"/posts"},
{id:"messages",label:"Messages",href:"/messages"},
{id:"quran",label:"Qur'an",href:"/quran-library"},
{id:"deepwatch",label:"DeepWatch",href:"/deepwatch"},
{id:"unlocked",label:"Unlocked",href:"/unlocked"},
{id:"signout",label:"Sign Out"}];
type Entry=typeof entries[number];
export default function GlobalNavigation(){
 const pathname=usePathname(),router=useRouter();
 const railRef=useRef<HTMLElement|null>(null);
 const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);\n const railFrame=useRef(0);
 const [centered,setCentered]=useState<GlobalNavDestination>("muslims");
 const [search,setSearch]=useState(false),[query,setQuery]=useState(""),[busy,setBusy]=useState(false);
 const [pending,setPending]=useState<Entry|null>(null),[dontAsk,setDontAsk]=useState(false);
 const [previous,setPrevious]=useState<string|null>(null);
 const [isUnlocked,setIsUnlocked]=useState(false);
 const [unlockExit,setUnlockExit]=useState(false);
 const [emblemPinned,setEmblemPinned]=useState(false);
 const [dockHidden,setDockHidden]=useState(false);
 const [immersive,setImmersive]=useState(false);
 useEffect(()=>{
  let last=Math.max(0,window.scrollY),direction=0,travel=0,frame=0;
  const reveal=()=>{direction=0;travel=0;setDockHidden(false)};
  const measure=()=>{
   frame=0;
   const y=Math.max(0,window.scrollY),delta=y-last;last=y;
   if(y<12){reveal();return}
   if(Math.abs(delta)<1)return;
   const next=delta>0?1:-1;
   if(next!==direction){direction=next;travel=0}
   travel+=Math.abs(delta);
   // Keep the orbital dock visible while the page scrolls.
   // Navigation is gesture-controlled, never auto-hidden.
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(measure)};
  const onPageShow=()=>{last=Math.max(0,window.scrollY);reveal()};
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("pageshow",onPageShow);
  return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("pageshow",onPageShow);if(frame)cancelAnimationFrame(frame)};
 },[]);
 useEffect(()=>{setDockHidden(false)},[pathname]);
 useEffect(()=>{const check=()=>setImmersive(Boolean(document.fullscreenElement));document.addEventListener("fullscreenchange",check);check();return()=>document.removeEventListener("fullscreenchange",check)},[]);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;setEmblemPinned(window.scrollY>95)};
  const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(update)};
  update();
  window.addEventListener("scroll",onScroll,{passive:true});
  return()=>{window.removeEventListener("scroll",onScroll);if(frame)window.cancelAnimationFrame(frame)};
 },[]);

 const unlockExitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  let alive=true;
  const check=async()=>{
   try{
    const response=await fetch("/api/stripe/status",{cache:"no-store"});
    if(!response.ok){if(alive)setIsUnlocked(false);return}
    const status=await response.json();
    if(!alive)return;
    if(status.unlocked===true){
     setIsUnlocked(true);
     const returnedFromUnlocked=pathname!=="/unlocked"&&sessionStorage.getItem("1muslim:unlocked-visited")==="1";
     if(returnedFromUnlocked){
      sessionStorage.removeItem("1muslim:unlocked-visited");
      setUnlockExit(true);
      if(unlockExitTimer.current)clearTimeout(unlockExitTimer.current);
      unlockExitTimer.current=setTimeout(()=>setUnlockExit(false),850);
     }
    }else{setIsUnlocked(false);setUnlockExit(false)}
   }catch{/* Keep the subscription option visible when status cannot be verified. */}
  };
  if(pathname==="/unlocked"){try{sessionStorage.setItem("1muslim:unlocked-visited","1")}catch{}}
  void check();
  const onFocus=()=>{void check()};
  window.addEventListener("focus",onFocus);
  return()=>{alive=false;window.removeEventListener("focus",onFocus)};
 },[pathname]);
 useEffect(()=>()=>{if(unlockExitTimer.current)clearTimeout(unlockExitTimer.current)},[]);
 const lastPath=useRef(pathname);
 useEffect(()=>{
  const prior=lastPath.current;
  if(prior&&pathname&&prior!==pathname){
   setPrevious(prior);
   try{sessionStorage.setItem("1muslim:nav-previous",prior)}catch{}
  }else if(!previous){
   try{const saved=sessionStorage.getItem("1muslim:nav-previous");if(saved&&saved!==pathname)setPrevious(saved)}catch{}
  }
  lastPath.current=pathname;
 },[pathname]);
 const visibleEntries=entries.filter(item=>item.id!=="unlocked"||!isUnlocked||unlockExit);
 const activeEntry=pathname?.startsWith("/posts")?"posts":pathname?.startsWith("/deepwatch")?"deepwatch":pathname?.startsWith("/quran")?"quran":pathname?.startsWith("/messages")?"messages":pathname?.startsWith("/unlocked")?"unlocked":pathname==="/profile"?(typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("section")==="muslimeen"?"muslims":"profile"):"muslims";
 const centerItem=(id:GlobalNavDestination,behavior:ScrollBehavior="smooth")=>{const rail=railRef.current;const target=rail?.querySelector<HTMLElement>(`[data-nav-id="${id}"]`);if(!rail||!target)return;rail.scrollTo({left:target.offsetLeft+target.offsetWidth/2-rail.clientWidth/2,behavior});setCentered(id)};
 useEffect(()=>{const frame=requestAnimationFrame(()=>{centerItem(activeEntry,"instant");onRailScroll()});return()=>cancelAnimationFrame(frame)},[pathname,isUnlocked]);
 useEffect(()=>()=>{if(settleTimer.current)clearTimeout(settleTimer.current)},[]);
 const onRailScroll=()=>{
  if(railFrame.current)return;
  railFrame.current=requestAnimationFrame(()=>{
   railFrame.current=0;
   const rail=railRef.current;if(!rail)return;
   const middle=rail.scrollLeft+rail.clientWidth/2;
   let nearest:HTMLElement|null=null,distance=Infinity;
   rail.querySelectorAll<HTMLElement>("[data-nav-id]").forEach(el=>{
    const d=Math.abs(el.offsetLeft+el.offsetWidth/2-middle);
    const t=Math.min(1,d/Math.max(90,rail.clientWidth*.43));
    const eased=t*t*(3-2*t);
    el.style.setProperty("--nav-distance",String(eased));
    if(d<distance){distance=d;nearest=el}
   });
   if(nearest){const id=nearest.dataset.navId as GlobalNavDestination;setCentered(prev=>prev===id?prev:id)}
  });
 };
 useEffect(()=>()=>{if(railFrame.current)cancelAnimationFrame(railFrame.current)},[]);
