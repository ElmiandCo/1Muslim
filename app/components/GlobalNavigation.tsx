"use client";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import GlobalNavIcon,{type GlobalNavDestination} from "./GlobalNavIcon";
const entries:{id:GlobalNavDestination;label:string;href?:string}[]=[
{id:"search",label:"Search"},{id:"deepwatch",label:"DeepWatch",href:"/deepwatch"},
{id:"muslims",label:"Muslims",href:"/profile?section=muslimeen"},{id:"quran",label:"Qur'an",href:"/quran-library"},
{id:"messages",label:"Messages",href:"/messages"},{id:"profile",label:"Profile",href:"/profile"},
{id:"unlocked",label:"Unlocked",href:"/unlocked"},{id:"signout",label:"Sign Out"}];
type Entry=typeof entries[number];
export default function GlobalNavigation(){
 const pathname=usePathname(),router=useRouter();
 const railRef=useRef<HTMLElement|null>(null);
 const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [centered,setCentered]=useState<GlobalNavDestination>("muslims");
 const [search,setSearch]=useState(false),[query,setQuery]=useState(""),[busy,setBusy]=useState(false);
 const [pending,setPending]=useState<Entry|null>(null),[dontAsk,setDontAsk]=useState(false);
 const [previous,setPrevious]=useState<string|null>(null);
 const [isUnlocked,setIsUnlocked]=useState(false);
 const [unlockExit,setUnlockExit]=useState(false);
 const [emblemPinned,setEmblemPinned]=useState(false);
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
 const activeEntry=pathname?.startsWith("/deepwatch")?"deepwatch":pathname?.startsWith("/quran")?"quran":pathname?.startsWith("/messages")?"messages":pathname?.startsWith("/unlocked")?"unlocked":pathname==="/profile"?(typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("section")==="muslimeen"?"muslims":"profile"):"muslims";
 const centerItem=(id:GlobalNavDestination,behavior:ScrollBehavior="smooth")=>{const rail=railRef.current;const target=rail?.querySelector<HTMLElement>(`[data-nav-id="${id}"]`);if(!rail||!target)return;rail.scrollTo({left:target.offsetLeft+target.offsetWidth/2-rail.clientWidth/2,behavior});setCentered(id)};
 useEffect(()=>{const frame=requestAnimationFrame(()=>centerItem(activeEntry,"instant"));return()=>cancelAnimationFrame(frame)},[pathname,isUnlocked]);
 useEffect(()=>()=>{if(settleTimer.current)clearTimeout(settleTimer.current)},[]);
 const onRailScroll=()=>{const rail=railRef.current;if(!rail)return;const middle=rail.scrollLeft+rail.clientWidth/2;let nearest:HTMLElement|null=null;let distance=Infinity;rail.querySelectorAll<HTMLElement>("[data-nav-id]").forEach(el=>{const d=Math.abs(el.offsetLeft+el.offsetWidth/2-middle);const normalized=Math.min(1,d/Math.max(110,rail.clientWidth*.55));el.style.setProperty("--nav-distance",String(normalized));if(d<distance){distance=d;nearest=el}});if(nearest)setCentered((nearest as HTMLElement).dataset.navId as GlobalNavDestination);if(settleTimer.current)clearTimeout(settleTimer.current);settleTimer.current=setTimeout(()=>{const selected=rail.querySelector<HTMLElement>("[data-nav-id].is-centered");if(selected)centerItem(selected.dataset.navId as GlobalNavDestination)},130)};
 if(pathname?.startsWith("/auth")||pathname?.startsWith("/login"))return null;
 async function perform(item:Entry){
  if(item.id==="search"){setSearch(v=>!v);return}
  if(item.id==="signout"){setBusy(true);try{await createClient().auth.signOut();router.push("/");router.refresh()}finally{setBusy(false)}return}
  if(item.href){if(pathname&&pathname!==item.href.split("?")[0]){setPrevious(pathname);try{sessionStorage.setItem("1muslim:nav-previous",pathname)}catch{}}router.push(item.href)}
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
 return <><button type="button" className={"oneGlobalNavPinnedEmblem"+(emblemPinned?" is-visible":"")} aria-label="Scroll to top" tabIndex={emblemPinned?0:-1} onClick={()=>{window.scrollTo({top:0,behavior:"smooth"});document.scrollingElement?.scrollTo({top:0,behavior:"smooth"})}}><img src="/assets/new-1M-logo.PNG" alt="" /></button><header className={"oneGlobalNav"+(pathname.startsWith("/deepwatch")?" oneGlobalNavDeepWatch":"")} aria-label="1Muslim global navigation">
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
 <style jsx global>{`.oneGlobalNavPinnedEmblem{position:fixed;top:calc(env(safe-area-inset-top,0px) + 3px);left:50%;transform:translate(-50%,-12px) scale(.9);opacity:0;pointer-events:none;z-index:1000;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;filter:none;appearance:none;cursor:pointer;transition:opacity .32s ease,transform .42s cubic-bezier(.2,.75,.2,1)}.oneGlobalNavPinnedEmblem.is-visible{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}.oneGlobalNavPinnedEmblem img{display:block;width:auto;max-width:min(155px,45vw);height:34px;object-fit:contain}@media(prefers-reduced-motion:reduce){.oneGlobalNavPinnedEmblem{transition:none}}.oneGlobalNav{position:relative;z-index:60;background:#fff;color:#172d4b;border-bottom:1px solid #e0e5eb}.oneGlobalNav.oneGlobalNavDeepWatch{background:#080b13;color:#f1f4fb;border-bottom-color:#252c3a}.oneGlobalNavDeepWatch .oneGlobalNavRail{background:#080b13}.oneGlobalNavDeepWatch .oneGlobalNavItem>button{color:#f1f4fb}.oneGlobalNavDeepWatch .oneGlobalNavItem>button:hover,.oneGlobalNavDeepWatch .oneGlobalNavItem>button[aria-current=page]{background:#ffffff1a}.oneGlobalNavDeepWatch .oneGlobalNavProfileGear{background:#1c2230;color:#f1f4fb;border-color:#46536c}.oneGlobalNav{--global-nav-accent:#111827}.oneGlobalNav.oneGlobalNavDeepWatch{--global-nav-accent:#f9fafb}.oneGlobalNav .oneGlobalNavIconWrap svg{color:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavIconWrap svg .accent{stroke:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavLabel{color:inherit}.oneGlobalNavBrand{display:flex;justify-content:center;align-items:center;padding:0 12px;min-height:29px;height:29px;background:linear-gradient(to bottom,#050505 0%,#171717 55%,rgba(0,0,0,0) 100%)}.oneGlobalNavBrand img{display:block;max-width:min(190px,60vw);max-height:27px;width:auto;height:auto;object-fit:contain}.oneGlobalNavRail{display:flex;align-items:center;justify-content:space-around;gap:clamp(8px,1.3vw,20px);padding:1px 14px 2px;overflow-x:auto;scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem{flex:0 0 auto}.oneGlobalNavIconWrap{position:relative;display:inline-flex;align-items:center;justify-content:center}.oneGlobalNavProfileGear{position:absolute;top:-7px;right:-10px;width:19px;height:19px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;border:1px solid color-mix(in srgb,currentColor 30%,transparent);box-shadow:0 1px 4px #0004;pointer-events:none}.oneGlobalNavUnlockedExit{animation:oneGlobalNavUnlockFloat .85s cubic-bezier(.2,.65,.25,1) both;pointer-events:none}@keyframes oneGlobalNavUnlockFloat{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}55%{opacity:.85;transform:translateY(-20px) scale(1.13);filter:blur(0)}100%{opacity:0;transform:translateY(-65px) scale(.72);filter:blur(5px)}}.oneGlobalNavBack{animation:oneGlobalNavBackEnter .3s ease-out both}.oneGlobalNavBack button{color:var(--global-nav-accent,#7dd7ef)!important}@keyframes oneGlobalNavBackEnter{from{opacity:0;transform:translateX(-14px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}@media(prefers-reduced-motion:reduce){.oneGlobalNavBack,.oneGlobalNavUnlockedExit{animation:none}}.oneGlobalNavItem>button{width:clamp(62px,8vw,94px);height:51px;display:flex;align-items:center;justify-content:center;flex-direction:column;border:0;background:none;color:inherit;cursor:pointer;border-radius:12px;gap:3px}.oneGlobalNavItem.labelAbove>button{flex-direction:column-reverse}.oneGlobalNavLabel{display:block;font-size:10px;font-weight:600;letter-spacing:.02em;line-height:1.2;white-space:nowrap;opacity:.8}.oneGlobalNavItem>button:hover,.oneGlobalNavItem>button[aria-current=page]{background:color-mix(in srgb,currentColor 9%,transparent)}.oneGlobalNavSearch{display:flex;gap:8px;padding:8px 16px}.oneGlobalNavSearch input{flex:1;min-width:0;border:1px solid #777;border-radius:12px;padding:10px;background:transparent;color:inherit}.oneGlobalNavSearch button{border-radius:10px;padding:8px 14px}.oneGlobalNavDialogBackdrop{position:fixed;inset:0;background:#0009;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}.oneGlobalNavDialog{width:min(400px,100%);padding:22px;border:1px solid #ffffff32;border-radius:18px;background:#202024;color:#f8f8fa;box-shadow:0 15px 55px #0008}.oneGlobalNavDialog p{margin:0 0 20px;font-size:19px}.oneGlobalNavRemember{display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:18px}.oneGlobalNavRemember input{width:18px;height:18px}.oneGlobalNavDialogActions{display:flex;justify-content:flex-end;gap:16px}.oneGlobalNavDialogActions button{background:transparent;color:#78b3ff;border:0;padding:10px;cursor:pointer;font-size:16px}.profileSocialTop{display:none!important}@media(max-width:600px){.oneGlobalNavRail{justify-content:flex-start;gap:4px;padding:1px 8px 2px}.oneGlobalNavBrand{padding:0 10px;min-height:29px;height:29px}.oneGlobalNavBrand img{max-height:34px}.oneGlobalNavItem>button{width:68px;height:49px}}`}</style>
 </header></>;
}
