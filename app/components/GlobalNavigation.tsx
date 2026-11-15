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
 if(pathname?.startsWith("/streaming/go-live")||pathname?.startsWith("/auth")||pathname?.startsWith("/login")||pathname?.startsWith("/posts/story/")||pathname==="/create")return null;
 async function perform(item:Entry){
  if(item.id==="search"){setSearch(v=>!v);return}
  if(item.id==="signout"){setBusy(true);try{await createClient().auth.signOut();router.push("/");router.refresh()}finally{setBusy(false)}return}
  if(item.href){const destination=item.id==="profile"?"/profile":item.id==="muslims"?"/profile?section=muslimeen":item.id==="posts"?"/posts":item.href;if(pathname&&pathname!==destination.split("?")[0]){setPrevious(pathname);try{sessionStorage.setItem("1muslim:nav-previous",pathname)}catch{}}if(item.id==="profile"||item.id==="muslims"||item.id==="posts"){window.location.assign(destination);return}router.push(destination)}
 }
 function select(item:Entry){
  if(busy)return;
  // Sign out always asks, even when navigation confirmations are disabled.
  const skip=item.id!=="signout"&&typeof window!=="undefined"&&localStorage.getItem("1muslim:nav-confirm-skip")==="true";
  if(skip){void perform(item);return}
  setDontAsk(false);setPending(item);
 }
 function accept(){
  if(!pending)return;
  if(dontAsk&&pending.id!=="signout")localStorage.setItem("1muslim:nav-confirm-skip","true");
  const selected=pending;setPending(null);void perform(selected);
 }
 return <><button type="button" className={"oneGlobalNavPinnedEmblem"+(emblemPinned?" is-visible":"")} aria-label="Scroll to top" tabIndex={emblemPinned?0:-1} onClick={()=>{window.scrollTo({top:0,behavior:"smooth"});document.scrollingElement?.scrollTo({top:0,behavior:"smooth"})}}><img src="/assets/new-1M-logo.PNG" alt="" /></button><header className={"oneGlobalNav"+(pathname.startsWith("/deepwatch")?" oneGlobalNavDeepWatch":"")+(dockHidden?" oneGlobalNavHidden":"")+(immersive?" oneGlobalNavImmersive":"")} aria-label="1Muslim global navigation">
 <div className="oneGlobalNavBrand"><img src="/assets/new-1M-logo.PNG" alt="1Muslim" onError={e=>{const img=e.currentTarget;if(!img.src.endsWith("/assets/1muslim-mobile-logo.PNG"))img.src="/assets/1muslim-mobile-logo.PNG"}} /></div>
 <div className="oneGlobalNavRailShell"><nav ref={railRef} onScroll={onRailScroll} className="oneGlobalNavRail" aria-label="Global destinations">{previous&&previous!==pathname&&<span className="oneGlobalNavItem oneGlobalNavBack" key="back"><button type="button" title="Back to previous page" aria-label="Back to previous page" onClick={()=>{const target=previous;setPrevious(pathname);router.push(target)}}><span className="oneGlobalNavLabel">Back</span><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m13.5 5-7 7 7 7M7 12h13"/></svg></button></span>}{entries.filter(item=>item.id!=="unlocked"||!isUnlocked||unlockExit).map((item,index)=><span key={item.id} data-nav-id={item.id} style={{"--nav-distance":item.id===centered?0:1} as React.CSSProperties} className={"oneGlobalNavItem"+(item.id===centered?" is-centered":"")+(item.id==="unlocked"&&unlockExit?" oneGlobalNavUnlockedExit":"")}>
 <button type="button" aria-label={item.label} title={item.label} aria-current={item.href&&pathname===item.href?"page":undefined} disabled={busy} onClick={()=>{centerItem(item.id);select(item)}}>
 <span className="oneGlobalNavLabel">{item.label}</span><span className="oneGlobalNavIconWrap"><GlobalNavIcon name={item.id}/>{item.id==="profile"&&<span className="oneGlobalNavProfileGear" aria-hidden="true"><GlobalNavIcon name="settings" size={13}/></span>}</span></button></span>)}</nav></div>
 {search&&<form className="oneGlobalNavSearch" onSubmit={e=>{e.preventDefault();router.push("/profile?section=muslimeen&search="+encodeURIComponent(query));setSearch(false)}}><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search Muslims" placeholder="Search 1Muslim members"/><button type="submit">Search</button></form>}
 {pending&&<div className="oneGlobalNavDialogBackdrop" onClick={()=>setPending(null)}>
 <div role="dialog" aria-modal="true" aria-labelledby="oneGlobalNavDialogTitle" className="oneGlobalNavDialog" onClick={e=>e.stopPropagation()}>
 <p id="oneGlobalNavDialogTitle">{pending.id==="signout"?"Sign out of 1Muslim?":pending.id==="search"?"Open Search?":"Open "+pending.label+"?"}</p>
 {pending.id!=="signout"&&<label className="oneGlobalNavRemember"><input type="checkbox" checked={dontAsk} onChange={e=>setDontAsk(e.target.checked)}/> Don't ask again</label>}
 <div className="oneGlobalNavDialogActions"><button type="button" onClick={()=>setPending(null)}>Cancel</button><button type="button" onClick={accept}>{pending.id==="signout"?"Sign Out":"Open"}</button></div>
 </div></div>}
 <style jsx global>{`@media(max-width:767px){body{padding-bottom:calc(90px + env(safe-area-inset-bottom,0px))}.oneGlobalNav{position:fixed!important;left:12px!important;right:12px!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;top:auto!important;z-index:9000!important;border:1px solid rgba(230,235,245,.34)!important;border-radius:999px!important;background:linear-gradient(145deg,rgba(33,37,44,.96),rgba(3,5,9,.97))!important;color:#f7f8fb!important;box-shadow:0 12px 32px #0006,inset 0 1px 1px #fff4!important;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);transition:transform .28s ease,opacity .28s ease}.oneGlobalNavHidden,.oneGlobalNavImmersive{transform:translateY(calc(120% + env(safe-area-inset-bottom,0px)));opacity:0;pointer-events:none}.oneGlobalNavBrand{display:none!important}.oneGlobalNavRailShell{overflow:hidden;border-radius:999px}.oneGlobalNavRail{justify-content:flex-start!important;gap:2px!important;padding:8px 10px!important;scroll-snap-type:x mandatory}.oneGlobalNavItem{scroll-snap-align:center}.oneGlobalNavItem>button{height:54px!important;width:66px!important;gap:3px!important;color:#f7f8fb!important;border-radius:999px!important}.oneGlobalNavLabel{font-size:9px!important;opacity:.88}.oneGlobalNav .oneGlobalNavIconWrap svg{color:#f7f8fb!important}.oneGlobalNavItem.is-centered>button,.oneGlobalNavItem>button[aria-current=page]{background:radial-gradient(circle at 50% 20%,#ffffff30,#ffffff08 70%)!important;box-shadow:inset 0 0 0 1px #ffffff3d,0 0 15px #ffffff22}.oneGlobalNavProfileGear{background:#171a20!important;color:#fff!important}.oneGlobalNavSearch{position:absolute;bottom:calc(100% + 12px);left:0;right:0;background:#151820;color:#fff;border-radius:18px;box-shadow:0 8px 25px #0005}.oneGlobalNavPinnedEmblem{z-index:70}}@media(min-width:768px){.oneGlobalNavHidden{transform:none;opacity:1}}@media(prefers-reduced-motion:reduce){.oneGlobalNav{transition:none!important}}.oneGlobalNavPinnedEmblem{position:fixed;top:calc(env(safe-area-inset-top,0px) + 3px);left:50%;transform:translate(-50%,-12px) scale(.9);opacity:0;pointer-events:none;z-index:1000;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;filter:none;appearance:none;cursor:pointer;transition:opacity .32s ease,transform .42s cubic-bezier(.2,.75,.2,1)}.oneGlobalNavPinnedEmblem.is-visible{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}.oneGlobalNavPinnedEmblem img{display:block;width:auto;max-width:min(155px,45vw);height:34px;object-fit:contain}@media(prefers-reduced-motion:reduce){.oneGlobalNavPinnedEmblem{transition:none}}.oneGlobalNav{position:relative;z-index:60;background:#fff;color:#172d4b;border-bottom:1px solid #e0e5eb}.oneGlobalNav.oneGlobalNavDeepWatch{background:#080b13;color:#f1f4fb;border-bottom-color:#252c3a}.oneGlobalNavDeepWatch .oneGlobalNavRail{background:#080b13}.oneGlobalNavDeepWatch .oneGlobalNavItem>button{color:#f1f4fb}.oneGlobalNavDeepWatch .oneGlobalNavItem>button:hover,.oneGlobalNavDeepWatch .oneGlobalNavItem>button[aria-current=page]{background:#ffffff1a}.oneGlobalNavDeepWatch .oneGlobalNavProfileGear{background:#1c2230;color:#f1f4fb;border-color:#46536c}.oneGlobalNav{--global-nav-accent:#111827}.oneGlobalNav.oneGlobalNavDeepWatch{--global-nav-accent:#f9fafb}.oneGlobalNav .oneGlobalNavIconWrap svg{color:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavIconWrap svg .accent{stroke:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavLabel{color:inherit}.oneGlobalNavBrand{display:flex;justify-content:center;align-items:center;padding:0 12px;min-height:29px;height:29px;background:linear-gradient(to bottom,#050505 0%,#171717 55%,rgba(0,0,0,0) 100%)}.oneGlobalNavBrand img{display:block;max-width:min(190px,60vw);max-height:27px;width:auto;height:auto;object-fit:contain}.oneGlobalNavRail{display:flex;align-items:center;justify-content:space-around;gap:clamp(8px,1.3vw,20px);padding:1px 14px 2px;overflow-x:auto;scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem{flex:0 0 auto}.oneGlobalNavIconWrap{position:relative;display:inline-flex;align-items:center;justify-content:center}.oneGlobalNavProfileGear{position:absolute;top:-7px;right:-10px;width:19px;height:19px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;border:1px solid color-mix(in srgb,currentColor 30%,transparent);box-shadow:0 1px 4px #0004;pointer-events:none}.oneGlobalNavUnlockedExit{animation:oneGlobalNavUnlockFloat .85s cubic-bezier(.2,.65,.25,1) both;pointer-events:none}@keyframes oneGlobalNavUnlockFloat{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}55%{opacity:.85;transform:translateY(-20px) scale(1.13);filter:blur(0)}100%{opacity:0;transform:translateY(-65px) scale(.72);filter:blur(5px)}}.oneGlobalNavBack{animation:oneGlobalNavBackEnter .3s ease-out both}.oneGlobalNavBack button{color:var(--global-nav-accent,#7dd7ef)!important}@keyframes oneGlobalNavBackEnter{from{opacity:0;transform:translateX(-14px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}@media(prefers-reduced-motion:reduce){.oneGlobalNavBack,.oneGlobalNavUnlockedExit{animation:none}}.oneGlobalNavItem>button{width:clamp(62px,8vw,94px);height:51px;display:flex;align-items:center;justify-content:center;flex-direction:column;border:0;background:none;color:inherit;cursor:pointer;border-radius:12px;gap:3px}.oneGlobalNavItem.labelAbove>button{flex-direction:column-reverse}.oneGlobalNavLabel{display:block;font-size:10px;font-weight:600;letter-spacing:.02em;line-height:1.2;white-space:nowrap;opacity:.8}.oneGlobalNavItem>button:hover,.oneGlobalNavItem>button[aria-current=page]{background:color-mix(in srgb,currentColor 9%,transparent)}.oneGlobalNavSearch{display:flex;gap:8px;padding:8px 16px}.oneGlobalNavSearch input{flex:1;min-width:0;border:1px solid #777;border-radius:12px;padding:10px;background:transparent;color:inherit}.oneGlobalNavSearch button{border-radius:10px;padding:8px 14px}.oneGlobalNavDialogBackdrop{position:fixed;inset:0;background:#0009;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}.oneGlobalNavDialog{width:min(400px,100%);padding:22px;border:1px solid #ffffff32;border-radius:18px;background:#202024;color:#f8f8fa;box-shadow:0 15px 55px #0008}.oneGlobalNavDialog p{margin:0 0 20px;font-size:19px}.oneGlobalNavRemember{display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:18px}.oneGlobalNavRemember input{width:18px;height:18px}.oneGlobalNavDialogActions{display:flex;justify-content:flex-end;gap:16px}.oneGlobalNavDialogActions button{background:transparent;color:#78b3ff;border:0;padding:10px;cursor:pointer;font-size:16px}.profileSocialTop{display:none!important}@media(max-width:600px){.oneGlobalNavRail{justify-content:flex-start;gap:4px;padding:1px 8px 2px}.oneGlobalNavBrand{padding:0 10px;min-height:29px;height:29px}.oneGlobalNavBrand img{max-height:34px}.oneGlobalNavItem>button{width:68px;height:49px}}@media(max-width:767px){
.oneGlobalNav{background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;left:4px!important;right:4px!important;bottom:env(safe-area-inset-bottom,0px)!important;overflow:visible!important;transition:transform .22s ease,opacity .22s ease!important}
.oneGlobalNavHidden,.oneGlobalNavImmersive{transform:translateY(calc(110% + env(safe-area-inset-bottom,0px)))!important;opacity:0!important;pointer-events:none!important}
.oneGlobalNavRailShell{position:relative;border-radius:0!important;overflow:visible!important;mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent)}
.oneGlobalNavRailShell::before{content:"";position:absolute;inset:50% -4px -12px;pointer-events:none;background:linear-gradient(to bottom,rgba(8,10,16,0),rgba(8,10,16,.38) 55%,rgba(8,10,16,.68));filter:blur(13px);z-index:0}.oneGlobalNavRail{position:relative;z-index:1;height:112px!important;align-items:center!important;gap:1px!important;padding:9px calc(50% - 43px)!important;overflow-x:auto!important;overscroll-behavior-x:contain;scroll-snap-type:x mandatory!important;touch-action:pan-x!important}
.oneGlobalNavItem{width:86px!important;flex:0 0 86px!important;display:flex;align-items:center;justify-content:center;transform-origin:50% 50%;transform:perspective(340px) rotateY(calc((var(--nav-distance,1)) * -18deg)) scale(calc(1.31 - var(--nav-distance,1) * .54));opacity:calc(1 - var(--nav-distance,1) * .25);transition:none;will-change:transform;scroll-snap-align:center}
.oneGlobalNavItem>button{height:76px!important;width:82px!important;color:#fff!important;gap:5px!important;background:transparent!important;box-shadow:none!important;text-shadow:0 1px 5px #000,0 0 10px #0009!important;filter:drop-shadow(0 2px 3px #000a)}
.oneGlobalNavLabel{font-size:10px!important;font-weight:700!important;opacity:1!important;text-shadow:0 1px 4px #000,0 0 7px #000!important}
.oneGlobalNavIconWrap svg{width:33px!important;height:33px!important;color:#f6f4ee!important;filter:drop-shadow(0 0 3px #c5a76688)}
.oneGlobalNavItem.is-centered{z-index:2}
.oneGlobalNavItem.is-centered .oneGlobalNavIconWrap svg{filter:drop-shadow(0 0 6px #d4b675)}
.oneGlobalNavItem[data-nav-id="deepwatch"] .oneGlobalNavIconWrap svg{color:#bd9aff!important;filter:drop-shadow(0 0 6px #7c3de8)}
.oneGlobalNavItem[data-nav-id="messages"] .oneGlobalNavIconWrap svg{color:#a7d8ff!important;filter:drop-shadow(0 0 5px #459cfa)}
.oneGlobalNavItem[data-nav-id="unlocked"] .oneGlobalNavIconWrap svg{color:#f0d28b!important;filter:drop-shadow(0 0 6px #caa24a)}
.oneGlobalNavItem[data-nav-id="quran"] .oneGlobalNavIconWrap svg{color:#fff4d9!important}
.oneGlobalNavItem.is-centered>button,.oneGlobalNavItem>button[aria-current=page]{background:transparent!important;box-shadow:none!important}
.oneGlobalNavBack{transform:none!important}
}
@media(prefers-reduced-motion:reduce){.oneGlobalNavItem{transition:none!important;transform:none!important}}
`}</style>
 </header></>;
}
