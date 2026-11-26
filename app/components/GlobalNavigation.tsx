"use client";
import {usePathname,useRouter} from "next/navigation";
import {createPortal} from "react-dom";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import GlobalNavIcon,{type GlobalNavDestination} from "./GlobalNavIcon";
const entries:{id:GlobalNavDestination;label:string;href?:string}[]=[
{id:"search",label:"Home",href:"/search"},{id:"profile",label:"Profile",href:"/profile"},
{id:"muslims",label:"Muslims",href:"/profile?section=muslimeen"},
{id:"posts",label:"Ummah Posts",href:"/posts"},
{id:"messages",label:"Messages",href:"/messages"},
{id:"notifications",label:"Notifications",href:"/notifications"},
{id:"quran",label:"Qur'an",href:"/quran-library"},
{id:"deepwatch",label:"DeepWatch",href:"/deepwatch"},
{id:"unlocked",label:"Unlocked",href:"/unlocked"},
{id:"signout",label:"Sign Out"}];
type Entry=typeof entries[number];
export default function GlobalNavigation(){
 const pathname=usePathname(),router=useRouter();
 const railRef=useRef<HTMLElement|null>(null);
 const settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const railFrame=useRef(0);
 const [centered,setCentered]=useState<GlobalNavDestination>("muslims");
 const [busy,setBusy]=useState(false);
 const [pending,setPending]=useState<Entry|null>(null),[dontAsk,setDontAsk]=useState(false);
 const [previous,setPrevious]=useState<string|null>(null);
 const [isUnlocked,setIsUnlocked]=useState(false);
 const [unlockExit,setUnlockExit]=useState(false);
 const [emblemPinned,setEmblemPinned]=useState(false);
 const [dockHidden,setDockHidden]=useState(false);
 const [immersive,setImmersive]=useState(false);
 const [unreadMessages,setUnreadMessages]=useState(0),[unreadNotifications,setUnreadNotifications]=useState(0);
 useEffect(()=>{
  const db=createClient();let active=true;let userId:string|null=null;
  const refresh=async()=>{
   const {data:{user}}=await db.auth.getUser();if(!active)return;
   userId=user?.id??null;if(!userId){setUnreadMessages(0);setUnreadNotifications(0);return}
   const [{count:alerts},{data:participants}]=await Promise.all([
    db.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null),
    db.from("dm_participants").select("conversation_id,last_read_at").eq("user_id",userId)
   ]);
   if(!active)return;
   setUnreadNotifications(pathname?.startsWith("/notifications")?0:alerts??0);
   const reads=participants??[];if(!reads.length){setUnreadMessages(0);return}
   const ids=reads.map(x=>x.conversation_id);
   const {data:recent}=await db.from("dm_messages").select("conversation_id,created_at,sender_id").in("conversation_id",ids).order("created_at",{ascending:false}).limit(500);
   if(!active)return;
   const lastRead=new Map(reads.map(x=>[x.conversation_id,x.last_read_at]));
   const unread=(recent??[]).filter(m=>m.sender_id!==userId&&(!lastRead.get(m.conversation_id)||new Date(m.created_at).getTime()>new Date(lastRead.get(m.conversation_id)!).getTime())).length;
   setUnreadMessages(unread);
  };
  void refresh();
  const interval=window.setInterval(()=>void refresh(),12000);
  const channel=db.channel("global-nav-alerts").on("postgres_changes",{event:"*",schema:"public",table:"notifications"},()=>void refresh()).on("postgres_changes",{event:"*",schema:"public",table:"dm_messages"},()=>void refresh()).on("postgres_changes",{event:"UPDATE",schema:"public",table:"dm_participants"},()=>void refresh()).subscribe();
  const onFocus=()=>void refresh();window.addEventListener("focus",onFocus);
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{void refresh()});
  return()=>{active=false;clearInterval(interval);window.removeEventListener("focus",onFocus);subscription.unsubscribe();void db.removeChannel(channel)};
 },[pathname]);
 useEffect(()=>{
  // Scroll direction, not finger jitter, drives the floating dock. The former
  // touchmove and scroll listeners competed every few pixels on iPhone and
  // repeatedly animated the dock while native momentum scrolling was active.
  let windowY=window.scrollY;
  const positions=new WeakMap<Element,number>();
  let lastSource:Element|null=null;
  let direction=0;
  let travel=0;
  const onScroll=(event:Event)=>{
   const target=event.target;
   const element=target instanceof Element?target:null;
   const scrolling=element&&element.scrollHeight>element.clientHeight+4?element:null;
   if(element&&!scrolling)return;
   if(scrolling?.closest(".oneGlobalNavRail"))return;
   const y=scrolling?scrolling.scrollTop:window.scrollY;
   const previous=scrolling?(positions.get(scrolling)??y):windowY;
   if(scrolling)positions.set(scrolling,y);else windowY=y;
   if(lastSource!==scrolling){lastSource=scrolling;direction=0;travel=0}
   if(y<=4){direction=0;travel=0;setDockHidden(false);return}
   const delta=y-previous;
   if(Math.abs(delta)<.8)return;
   const nextDirection=Math.sign(delta);
   if(nextDirection!==direction){direction=nextDirection;travel=0}
   travel+=Math.abs(delta);
   if(travel>=22){travel=0;setDockHidden(nextDirection>0)}
  };
  window.addEventListener("scroll",onScroll,{passive:true,capture:true});
  return()=>window.removeEventListener("scroll",onScroll,true);
 },[]);
 useEffect(()=>{setDockHidden(false)},[pathname]);
 useEffect(()=>{
  // Warm route chunks after the current screen paints. Next can retain the
  // existing React tree rather than forcing a fresh document navigation.
  const paths=["/profile","/posts","/messages","/search","/deepwatch","/quran-library"];
  const timer=window.setTimeout(()=>{for(const path of paths)router.prefetch(path)},450);
  return()=>window.clearTimeout(timer);
 },[router]);
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
 const activeEntry=pathname?.startsWith("/search")?"search":pathname?.startsWith("/posts")?"posts":pathname?.startsWith("/deepwatch")?"deepwatch":pathname?.startsWith("/quran")?"quran":pathname?.startsWith("/messages")?"messages":pathname?.startsWith("/unlocked")?"unlocked":pathname==="/profile"?(typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("section")==="muslimeen"?"muslims":"profile"):"muslims";
 const centerItem=(id:GlobalNavDestination,behavior:ScrollBehavior="smooth")=>{const rail=railRef.current;const target=rail?.querySelector<HTMLElement>(`[data-nav-id="${id}"]`);if(!rail||!target)return;rail.scrollTo({left:target.offsetLeft+target.offsetWidth/2-rail.clientWidth/2,behavior});setCentered(id)};
 useEffect(()=>{const frame=requestAnimationFrame(()=>{centerItem(activeEntry,"instant");onRailScroll()});return()=>cancelAnimationFrame(frame)},[pathname,isUnlocked]);
 useEffect(()=>()=>{if(settleTimer.current)clearTimeout(settleTimer.current)},[]);
 const onRailScroll=()=>{
  if(railFrame.current)return;
  railFrame.current=requestAnimationFrame(()=>{
   railFrame.current=0;
   const rail=railRef.current;if(!rail)return;
   const middle=rail.scrollLeft+rail.clientWidth/2;
   let nearestId:GlobalNavDestination|null=null,distance=Infinity;
   rail.querySelectorAll<HTMLElement>("[data-nav-id]").forEach(el=>{
    const d=Math.abs(el.offsetLeft+el.offsetWidth/2-middle);
    const t=Math.min(1,d/Math.max(90,rail.clientWidth*.43));
    const eased=t*t*(3-2*t);
    el.style.setProperty("--nav-distance",String(eased));
    if(d<distance){distance=d;nearestId=el.dataset.navId as GlobalNavDestination}
   });
   if(nearestId){const id=nearestId;setCentered(prev=>prev===id?prev:id)}
  });
 };
 useEffect(()=>()=>{if(railFrame.current)cancelAnimationFrame(railFrame.current)},[]);
 // The Qur’an Library / Studio owns its own top navigation and reading controls.
 // Never overlay the global bottom carousel on the 114-surah index or reader.
 if(pathname?.startsWith("/quran")||pathname?.startsWith("/elm-tent/quran"))return null;
 // Signed-in Search Home has its own small account controls and immersive search surface.
 if(pathname==="/"||pathname?.startsWith("/search")||pathname?.startsWith("/hudhud")||pathname?.startsWith("/onboarding")||pathname?.startsWith("/streaming/go-live")||pathname?.startsWith("/auth")||pathname?.startsWith("/login")||pathname?.startsWith("/posts/story/")||pathname==="/create")return null;
 async function perform(item:Entry){
  if(item.id==="signout"){setBusy(true);try{
   const {error}=await createClient().auth.signOut();
   if(error)throw error;
   router.replace("/");
   router.refresh();
  }catch(e){window.alert(e instanceof Error?e.message:"Could not sign out.")}finally{setBusy(false)}return}
  if(!item.href)return;
  const destination=item.id==="muslims"?"/profile?section=muslimeen":item.id==="profile"?"/profile":item.href;
  // The directory and profile are two panels of the SAME mounted screen.
  // Switching them must not remount the heavy profile or fetch it again.
  if(pathname==="/profile"&&(item.id==="profile"||item.id==="muslims")){
   if(item.id==="muslims")window.dispatchEvent(new CustomEvent("1muslim:discover-muslims",{detail:{}}));
   else{window.history.pushState(null,"","/profile");window.dispatchEvent(new PopStateEvent("popstate"));window.scrollTo({top:0,behavior:"smooth"})}
   return;
  }
  if(pathname===destination.split("?")[0]&&item.id!=="muslims")return;
  if(pathname){setPrevious(pathname);try{sessionStorage.setItem("1muslim:nav-previous",pathname)}catch{}}
  router.prefetch(destination.split("?")[0]);
  router.push(destination);
 }
 function select(item:Entry){
  if(busy)return;
  // Tabs navigate immediately. Only a destructive sign-out asks permission.
  if(item.id!=="signout"){void perform(item);return}
  setDontAsk(false);setPending(item);
 }
 function accept(){
  if(!pending)return;
  if(dontAsk&&pending.id!=="signout")localStorage.setItem("1muslim:nav-confirm-skip","true");
  const selected=pending;setPending(null);void perform(selected);
 }
 return <><header className={"oneGlobalNav"+((pathname.startsWith("/quran")||pathname.startsWith("/elm-tent/quran"))?" oneGlobalNavQuran":"")+(pathname.startsWith("/deepwatch")?" oneGlobalNavDeepWatch":"")+(dockHidden?" oneGlobalNavHidden":"")+(immersive?" oneGlobalNavImmersive":"")} aria-label="1Muslim global navigation">
 <div className="oneGlobalNavBrand"><img src="/assets/1muslim-wordmark.svg" alt="1Muslim" /></div>
 <button type="button" className="oneGlobalNavFixedBack" aria-label="Go back one page" title="Back" onClick={()=>{if(window.history.length>1){router.back()}else{router.push("/search")}}}><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><div className="oneGlobalNavRailShell"><nav ref={railRef} onScroll={onRailScroll} className="oneGlobalNavRail" aria-label="Global destinations">{entries.filter(item=>item.id!=="unlocked"||!isUnlocked||unlockExit).map((item,index)=><span key={item.id} data-nav-id={item.id} style={{"--nav-distance":item.id===centered?0:1} as React.CSSProperties} className={"oneGlobalNavItem"+(item.id===centered?" is-centered":"")+(item.id==="unlocked"&&unlockExit?" oneGlobalNavUnlockedExit":"")}>
 <button type="button" aria-label={item.label} title={item.label} aria-current={item.href&&pathname===item.href?"page":undefined} disabled={busy} onPointerEnter={()=>{if(item.href)router.prefetch(item.href.split("?")[0])}} onTouchStart={()=>{if(item.href)router.prefetch(item.href.split("?")[0])}} onClick={()=>{centerItem(item.id);select(item)}}>
 <span className="oneGlobalNavLabel">{item.label}</span><span className="oneGlobalNavIconWrap"><GlobalNavIcon name={item.id}/>{(item.id==="messages"?unreadMessages:item.id==="notifications"?unreadNotifications:0)>0&&<span className="oneGlobalNavBadge" aria-label={(item.id==="messages"?unreadMessages:unreadNotifications)+" unread"}>{Math.min(99,item.id==="messages"?unreadMessages:unreadNotifications)}{(item.id==="messages"?unreadMessages:unreadNotifications)>99?"+":""}</span>}{item.id==="profile"&&<span className="oneGlobalNavProfileGear" aria-hidden="true"><GlobalNavIcon name="settings" size={13}/></span>}</span></button></span>)}</nav></div>
 
 {pending&&typeof document!=="undefined"&&createPortal(<div className="oneGlobalNavDialogBackdrop" onClick={()=>setPending(null)}>
 <div role="dialog" aria-modal="true" aria-labelledby="oneGlobalNavDialogTitle" className="oneGlobalNavDialog" onClick={e=>e.stopPropagation()}>
 <p id="oneGlobalNavDialogTitle">{pending.id==="signout"?"Sign out of 1Muslim?":pending.id==="search"?"Open Search?":"Open "+pending.label+"?"}</p>
 {pending.id!=="signout"&&<label className="oneGlobalNavRemember"><input type="checkbox" checked={dontAsk} onChange={e=>setDontAsk(e.target.checked)}/> Don't ask again</label>}
 <div className="oneGlobalNavDialogActions"><button type="button" onClick={()=>setPending(null)}>Cancel</button><button type="button" onClick={accept}>{pending.id==="signout"?"Sign Out":"Open"}</button></div>
 </div></div>,document.body)}
 <style jsx global>{`@media(max-width:767px){.oneGlobalNav{display:flex!important;align-items:center!important;gap:3px!important;padding-left:7px!important}.oneGlobalNavFixedBack{flex:0 0 48px;width:48px;height:52px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:linear-gradient(150deg,rgba(255,255,255,.15),rgba(255,255,255,.035));color:#f9fbff;box-shadow:inset 0 1px 0 rgba(255,255,255,.16);cursor:pointer;transition:background .22s ease,box-shadow .22s ease}.oneGlobalNavFixedBack:active{background:rgba(255,255,255,.24)}.oneGlobalNavFixedBack:focus-visible{outline:2px solid #b9d7ff;outline-offset:2px}.oneGlobalNavRailShell{flex:1;min-width:0}.oneGlobalNavRail{scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem>button{transition:background .22s ease,box-shadow .22s ease,transform .22s ease}.oneGlobalNavItem>button:active{transform:scale(.96)}.oneGlobalNavItem.is-centered>button{box-shadow:inset 0 0 0 1px rgba(219,235,255,.55),0 0 18px rgba(185,214,255,.24)!important}}@media(min-width:768px){.oneGlobalNavFixedBack{display:grid;place-items:center;flex:0 0 44px;margin:4px 8px;border:1px solid #d8e1ed;border-radius:999px;background:#f5f7fa;color:#172d4b;cursor:pointer}.oneGlobalNav{display:flex;align-items:center}.oneGlobalNavRailShell{flex:1;min-width:0}}@media(prefers-reduced-motion:reduce){.oneGlobalNavFixedBack,.oneGlobalNavItem>button{transition:none!important}}@media(max-width:767px){body{padding-bottom:calc(90px + env(safe-area-inset-bottom,0px))}.oneGlobalNav{position:fixed!important;left:12px!important;right:12px!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;top:auto!important;z-index:9000!important;border:1px solid rgba(230,235,245,.34)!important;border-radius:999px!important;background:linear-gradient(145deg,rgba(33,37,44,.96),rgba(3,5,9,.97))!important;color:#f7f8fb!important;box-shadow:0 12px 32px #0006,inset 0 1px 1px #fff4!important;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);transition:transform .28s ease,opacity .28s ease}.oneGlobalNavHidden,.oneGlobalNavImmersive{transform:translateY(calc(120% + env(safe-area-inset-bottom,0px)));opacity:0;pointer-events:none}.oneGlobalNavBrand{display:none!important}.oneGlobalNavRailShell{overflow:hidden;border-radius:999px}.oneGlobalNavRail{justify-content:flex-start!important;gap:2px!important;padding:8px 10px!important;scroll-snap-type:x mandatory}.oneGlobalNavItem{scroll-snap-align:center}.oneGlobalNavItem>button{height:54px!important;width:66px!important;gap:3px!important;color:#f7f8fb!important;border-radius:999px!important}.oneGlobalNavLabel{font-size:9px!important;opacity:.88}.oneGlobalNav .oneGlobalNavIconWrap svg{color:#f7f8fb!important}.oneGlobalNavItem.is-centered>button,.oneGlobalNavItem>button[aria-current=page]{background:radial-gradient(circle at 50% 20%,#ffffff30,#ffffff08 70%)!important;box-shadow:inset 0 0 0 1px #ffffff3d,0 0 15px #ffffff22}.oneGlobalNavProfileGear{background:#171a20!important;color:#fff!important}.oneGlobalNavSearch{position:absolute;bottom:calc(100% + 12px);left:0;right:0;background:#151820;color:#fff;border-radius:18px;box-shadow:0 8px 25px #0005}.oneGlobalNavPinnedEmblem{z-index:70}}@media(min-width:768px){.oneGlobalNavHidden{transform:none;opacity:1}}@media(prefers-reduced-motion:reduce){.oneGlobalNav{transition:none!important}}@media(max-width:767px){
html.profileDockThemed body{padding-bottom:calc(118px + env(safe-area-inset-bottom,0px))!important}
html.profileDockThemed .oneGlobalNav{border:1px solid color-mix(in srgb,var(--profile-dock-accent,#8b98aa) 55%,#ffffff55)!important;background:linear-gradient(145deg,rgba(29,33,42,.88),rgba(8,10,16,.91))!important;backdrop-filter:blur(28px) saturate(1.35)!important;-webkit-backdrop-filter:blur(28px) saturate(1.35)!important;box-shadow:0 15px 34px #0005,0 0 18px color-mix(in srgb,var(--profile-dock-accent,#8b98aa) 12%,transparent),inset 0 1px 0 #ffffff30!important}
html.profileDockThemed .oneGlobalNav .oneGlobalNavItem.is-centered>button,html.profileDockThemed .oneGlobalNav .oneGlobalNavItem>button[aria-current=page]{background:radial-gradient(circle at 50% 20%,color-mix(in srgb,var(--profile-dock-accent,#8b98aa) 20%,transparent),#ffffff06 75%)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--profile-dock-accent,#8b98aa) 45%,#ffffff55),0 0 14px color-mix(in srgb,var(--profile-dock-accent,#8b98aa) 16%,transparent)!important}
html.profileDockThemed .oneGlobalNav .oneGlobalNavItem.is-centered .oneGlobalNavLabel{color:#fff!important;text-decoration:underline;text-decoration-color:var(--profile-dock-accent,#b6c2d1);text-decoration-thickness:2px;text-underline-offset:5px}
html.profileDockThemed .oneGlobalNav .oneGlobalNavItem:not(.is-centered) .oneGlobalNavIconWrap svg{color:#d8dce5!important}
}
.oneGlobalNavPinnedEmblem{position:fixed;top:calc(env(safe-area-inset-top,0px) + 3px);left:50%;transform:translate(-50%,-12px) scale(.9);opacity:0;pointer-events:none;z-index:1000;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;filter:none;appearance:none;cursor:pointer;transition:opacity .32s ease,transform .42s cubic-bezier(.2,.75,.2,1)}.oneGlobalNavPinnedEmblem.is-visible{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}.oneGlobalNavPinnedEmblem img{display:block;width:auto;max-width:min(155px,45vw);height:34px;object-fit:contain}@media(prefers-reduced-motion:reduce){.oneGlobalNavPinnedEmblem{transition:none}}.oneGlobalNav{position:relative;z-index:60;background:#fff;color:#172d4b;border-bottom:1px solid #e0e5eb}.oneGlobalNav.oneGlobalNavDeepWatch{background:#080b13;color:#f1f4fb;border-bottom-color:#252c3a}.oneGlobalNavDeepWatch .oneGlobalNavRail{background:#080b13}.oneGlobalNavDeepWatch .oneGlobalNavItem>button{color:#f1f4fb}.oneGlobalNavDeepWatch .oneGlobalNavItem>button:hover,.oneGlobalNavDeepWatch .oneGlobalNavItem>button[aria-current=page]{background:#ffffff1a}.oneGlobalNavDeepWatch .oneGlobalNavProfileGear{background:#1c2230;color:#f1f4fb;border-color:#46536c}.oneGlobalNav{--global-nav-accent:#111827}.oneGlobalNav.oneGlobalNavDeepWatch{--global-nav-accent:#f9fafb}.oneGlobalNav .oneGlobalNavIconWrap svg{color:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavIconWrap svg .accent{stroke:var(--global-nav-accent)}.oneGlobalNav .oneGlobalNavLabel{color:inherit}.oneGlobalNavBrand{display:flex;justify-content:center;align-items:center;padding:0 12px;min-height:29px;height:29px;background:linear-gradient(to bottom,#050505 0%,#171717 55%,rgba(0,0,0,0) 100%)}.oneGlobalNavBrand img{display:block;max-width:min(190px,60vw);max-height:27px;width:auto;height:auto;object-fit:contain}.oneGlobalNavRail{display:flex;align-items:center;justify-content:space-around;gap:clamp(8px,1.3vw,20px);padding:1px 14px 2px;overflow-x:auto;scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem{flex:0 0 auto}.oneGlobalNavIconWrap{position:relative;display:inline-flex;align-items:center;justify-content:center}.oneGlobalNavProfileGear{position:absolute;top:-7px;right:-10px;width:19px;height:19px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;border:1px solid color-mix(in srgb,currentColor 30%,transparent);box-shadow:0 1px 4px #0004;pointer-events:none}.oneGlobalNavUnlockedExit{animation:oneGlobalNavUnlockFloat .85s cubic-bezier(.2,.65,.25,1) both;pointer-events:none}@keyframes oneGlobalNavUnlockFloat{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}55%{opacity:.85;transform:translateY(-20px) scale(1.13);filter:blur(0)}100%{opacity:0;transform:translateY(-65px) scale(.72);filter:blur(5px)}}.oneGlobalNavBack{animation:oneGlobalNavBackEnter .3s ease-out both}.oneGlobalNavBack button{color:var(--global-nav-accent,#7dd7ef)!important}@keyframes oneGlobalNavBackEnter{from{opacity:0;transform:translateX(-14px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}@media(prefers-reduced-motion:reduce){.oneGlobalNavBack,.oneGlobalNavUnlockedExit{animation:none}}.oneGlobalNavItem>button{width:clamp(62px,8vw,94px);height:51px;display:flex;align-items:center;justify-content:center;flex-direction:column;border:0;background:none;color:inherit;cursor:pointer;border-radius:12px;gap:3px}.oneGlobalNavItem.labelAbove>button{flex-direction:column-reverse}.oneGlobalNavLabel{display:block;font-size:10px;font-weight:600;letter-spacing:.02em;line-height:1.2;white-space:nowrap;opacity:.8}.oneGlobalNavItem>button:hover,.oneGlobalNavItem>button[aria-current=page]{background:color-mix(in srgb,currentColor 9%,transparent)}.oneGlobalNavSearch{display:flex;gap:8px;padding:8px 16px}.oneGlobalNavSearch input{flex:1;min-width:0;border:1px solid #777;border-radius:12px;padding:10px;background:transparent;color:inherit}.oneGlobalNavSearch button{border-radius:10px;padding:8px 14px}.oneGlobalNavDialogBackdrop{position:fixed;inset:0;background:#0009;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}.oneGlobalNavDialog{width:min(400px,100%);padding:22px;border:1px solid #ffffff32;border-radius:18px;background:#202024;color:#f8f8fa;box-shadow:0 15px 55px #0008}.oneGlobalNavDialog p{margin:0 0 20px;font-size:19px}.oneGlobalNavRemember{display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:18px}.oneGlobalNavRemember input{width:18px;height:18px}.oneGlobalNavDialogActions{display:flex;justify-content:flex-end;gap:16px}.oneGlobalNavDialogActions button{background:transparent;color:#78b3ff;border:0;padding:10px;cursor:pointer;font-size:16px}.profileSocialTop{display:none!important}@media(max-width:600px){.oneGlobalNavRail{justify-content:flex-start;gap:4px;padding:1px 8px 2px}.oneGlobalNavBrand{padding:0 10px;min-height:29px;height:29px}.oneGlobalNavBrand img{max-height:34px}.oneGlobalNavItem>button{width:68px;height:49px}}@media(max-width:767px){
.oneGlobalNav{background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;left:4px!important;right:4px!important;bottom:0!important;overflow:visible!important;transition:transform .22s ease,opacity .22s ease!important}
.oneGlobalNavHidden,.oneGlobalNavImmersive{transform:translateY(calc(110% + env(safe-area-inset-bottom,0px)))!important;opacity:0!important;pointer-events:none!important}
.oneGlobalNavRailShell{position:relative;border-radius:0!important;overflow:visible!important;mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent)}
.oneGlobalNavRailShell::before{content:"";position:absolute;inset:50% -4px -12px;pointer-events:none;background:linear-gradient(to bottom,rgba(8,10,16,0),rgba(8,10,16,.38) 55%,rgba(8,10,16,.68));filter:blur(13px);z-index:0}.oneGlobalNavRail{position:relative;z-index:1;height:78px!important;align-items:flex-end!important;gap:1px!important;padding:0 calc(50% - 43px) 0!important;overflow-x:auto!important;overscroll-behavior-x:contain;scroll-snap-type:x mandatory!important;touch-action:pan-x!important}
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
.oneGlobalNavSearch{position:absolute!important;bottom:calc(100% + 8px)!important;left:8px!important;right:8px!important;display:flex!important;align-items:center!important;gap:8px!important;padding:10px!important;border:1px solid #ffffff35!important;border-radius:18px!important;background:rgba(18,21,29,.82)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;box-shadow:0 8px 28px #0005!important}
.oneGlobalNavSearch input{flex:1!important;min-width:0!important;color:#fff!important;font-size:16px!important}
.oneGlobalNavSearch button[type="submit"]{background:#ffffff20!important;color:#fff!important;border:1px solid #ffffff35!important}
.oneGlobalNavSearchClose{display:flex!important;align-items:center!important;justify-content:center!important;width:36px!important;height:36px!important;flex:0 0 36px!important;padding:0!important;background:#ffffff18!important;color:#fff!important;border:1px solid #ffffff35!important;border-radius:50%!important;font-size:26px!important;line-height:1!important}
}
@media(prefers-reduced-motion:reduce){.oneGlobalNavItem{transition:none!important;transform:none!important}}
/* Mobile navigation: clean flat five-across tab strip, not the floating 3D carousel. */
@media(max-width:767px){
html body{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}
html.profileDockThemed body{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}
html .oneGlobalNav,html.profileDockThemed .oneGlobalNav{
position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;
display:block!important;width:100%!important;margin:0!important;padding:0 0 env(safe-area-inset-bottom,0px)!important;
border:0!important;border-top:1px solid #e3e5e8!important;border-radius:0!important;
background:#fff!important;color:#6a6d72!important;box-shadow:0 -2px 9px #10151a0d!important;
backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
html .oneGlobalNav .oneGlobalNavFixedBack{display:none!important}
html .oneGlobalNav .oneGlobalNavRailShell{
width:100%!important;overflow:hidden!important;border-radius:0!important;
mask-image:none!important;-webkit-mask-image:none!important;background:#fff!important;
}
html .oneGlobalNav .oneGlobalNavRailShell::before{display:none!important}
html .oneGlobalNav .oneGlobalNavRail{
display:flex!important;align-items:stretch!important;justify-content:flex-start!important;
height:72px!important;width:100%!important;gap:0!important;padding:0!important;
overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:none!important;
scrollbar-width:none!important;overscroll-behavior-x:contain!important;touch-action:pan-x!important;
}
html .oneGlobalNav .oneGlobalNavItem{
width:20%!important;min-width:20%!important;flex:0 0 20%!important;
height:72px!important;transform:none!important;opacity:1!important;
filter:none!important;perspective:none!important;scroll-snap-align:none!important;
will-change:auto!important;
}
html .oneGlobalNav .oneGlobalNavItem>button{
display:flex!important;flex-direction:column-reverse!important;justify-content:center!important;align-items:center!important;
width:100%!important;height:72px!important;gap:5px!important;padding:7px 1px!important;
border:0!important;border-radius:0!important;background:transparent!important;color:#72767b!important;
box-shadow:none!important;text-shadow:none!important;filter:none!important;
}
html .oneGlobalNav .oneGlobalNavItem>button[aria-current=page],
html .oneGlobalNav .oneGlobalNavItem.is-centered>button{background:transparent!important;box-shadow:none!important}
html .oneGlobalNav .oneGlobalNavItem>button[aria-current=page]{color:#171c20!important}
html .oneGlobalNav .oneGlobalNavLabel{
font-family:system-ui,-apple-system,sans-serif!important;font-size:clamp(9px,2.5vw,12px)!important;
font-weight:500!important;letter-spacing:0!important;line-height:1.15!important;opacity:1!important;
color:inherit!important;text-shadow:none!important;max-width:100%!important;
}
html .oneGlobalNav .oneGlobalNavIconWrap{height:30px!important;display:grid!important;place-items:center!important}
html .oneGlobalNav .oneGlobalNavIconWrap svg,
html .oneGlobalNav .oneGlobalNavItem[data-nav-id="deepwatch"] .oneGlobalNavIconWrap svg,
html .oneGlobalNav .oneGlobalNavItem[data-nav-id="messages"] .oneGlobalNavIconWrap svg,
html .oneGlobalNav .oneGlobalNavItem[data-nav-id="quran"] .oneGlobalNavIconWrap svg,
html .oneGlobalNav .oneGlobalNavItem[data-nav-id="unlocked"] .oneGlobalNavIconWrap svg{
width:27px!important;height:27px!important;color:currentColor!important;
filter:none!important;stroke:currentColor!important;
}
html .oneGlobalNav .oneGlobalNavItem.is-centered .oneGlobalNavIconWrap svg{filter:none!important}
html .oneGlobalNav .oneGlobalNavProfileGear{display:none!important}
html .oneGlobalNav .oneGlobalNavItem>button:active{background:#f2f5f3!important;transform:none!important}
html .oneGlobalNav .oneGlobalNavSearch{bottom:calc(100% + 6px)!important}
}

.oneGlobalNavIconWrap{position:relative!important}.oneGlobalNavBadge{position:absolute;top:-7px;right:-13px;min-width:18px;height:18px;display:grid;place-items:center;padding:0 4px;border-radius:99px;background:#d8314f;color:#fff;font:700 10px/1 system-ui;box-shadow:0 0 0 2px #fff;z-index:4}

/* Qur'an destination: match the charcoal reader, rather than the white mobile dock. */
@media(max-width:767px){
 html .oneGlobalNav.oneGlobalNavQuran,html.profileDockThemed .oneGlobalNav.oneGlobalNavQuran{
  background:#151519!important;color:#c6c1ba!important;
  border-top:1px solid rgba(216,177,116,.24)!important;
  box-shadow:0 -10px 28px rgba(5,5,8,.3)!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavRailShell{
  background:#151519!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavItem>button{
  color:#aaa6a1!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavItem>button[aria-current=page],
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavItem[data-nav-id="quran"]>button{
  color:#dfbb84!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavItem>button[aria-current=page] .oneGlobalNavLabel{
  font-weight:700!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavItem>button:active{
  background:#252329!important;
 }
 html .oneGlobalNav.oneGlobalNavQuran .oneGlobalNavBadge{
  box-shadow:0 0 0 2px #151519;
 }
}
`}</style>
 </header></>;
}
