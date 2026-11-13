"use client";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import GlobalNavIcon,{type GlobalNavDestination} from "./GlobalNavIcon";
const entries:{id:GlobalNavDestination;label:string;href?:string}[]=[
{id:"search",label:"Search"},{id:"settings",label:"Settings",href:"/profile?panel=settings"},{id:"deepwatch",label:"DeepWatch",href:"/deepwatch"},
{id:"muslims",label:"Muslims",href:"/profile?section=muslimeen"},{id:"quran",label:"Qur'an",href:"/quran-library"},
{id:"messages",label:"Messages",href:"/messages"},{id:"profile",label:"Profile",href:"/profile"},
{id:"unlocked",label:"1Muslim Unlocked",href:"/profile?panel=unlocked"},{id:"signout",label:"Sign Out"}];
type Entry=typeof entries[number];
export default function GlobalNavigation(){
 const pathname=usePathname(),router=useRouter();
 const [search,setSearch]=useState(false),[query,setQuery]=useState(""),[busy,setBusy]=useState(false);
 const [pending,setPending]=useState<Entry|null>(null),[dontAsk,setDontAsk]=useState(false);
 const [previous,setPrevious]=useState<string|null>(null);
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
 return <header className="oneGlobalNav" aria-label="1Muslim global navigation">
 <nav className="oneGlobalNavRail" aria-label="Global destinations">{previous&&previous!==pathname&&<span className="oneGlobalNavItem oneGlobalNavBack" key="back"><button type="button" title="Back to previous page" aria-label="Back to previous page" onClick={()=>{const target=previous;setPrevious(pathname);router.push(target)}}><span className="oneGlobalNavLabel">Back</span><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m13.5 5-7 7 7 7M7 12h13"/></svg></button></span>}{entries.map((item,index)=><span key={item.id} className={"oneGlobalNavItem "+(index%2?"labelBelow":"labelAbove")}>
 <button type="button" aria-label={item.label} title={item.label} aria-current={item.href&&pathname===item.href?"page":undefined} disabled={busy} onClick={()=>select(item)}>
 <span className="oneGlobalNavLabel">{item.label}</span><GlobalNavIcon name={item.id}/></button></span>)}</nav>
 {search&&<form className="oneGlobalNavSearch" onSubmit={e=>{e.preventDefault();router.push("/profile?section=muslimeen&search="+encodeURIComponent(query));setSearch(false)}}><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search Muslims" placeholder="Search 1Muslim members"/><button type="submit">Search</button></form>}
 {pending&&<div className="oneGlobalNavDialogBackdrop" onClick={()=>setPending(null)}>
 <div role="dialog" aria-modal="true" aria-labelledby="oneGlobalNavDialogTitle" className="oneGlobalNavDialog" onClick={e=>e.stopPropagation()}>
 <p id="oneGlobalNavDialogTitle">{pending.id==="signout"?"Sign out of 1Muslim?":pending.id==="search"?"Open Search?":"Open "+pending.label+"?"}</p>
 {pending.id!=="signout"&&<label className="oneGlobalNavRemember"><input type="checkbox" checked={dontAsk} onChange={e=>setDontAsk(e.target.checked)}/> Don't ask again</label>}
 <div className="oneGlobalNavDialogActions"><button type="button" onClick={()=>setPending(null)}>Cancel</button><button type="button" onClick={accept}>{pending.id==="signout"?"Sign Out":"Open"}</button></div>
 </div></div>}
 <style jsx global>{`.oneGlobalNav{position:relative;z-index:60;background:var(--global-nav-background,var(--page-background,#141318));color:var(--global-nav-color,var(--page-foreground,#e9e9f0));border-bottom:1px solid color-mix(in srgb,currentColor 13%,transparent)}.oneGlobalNavRail{display:flex;align-items:center;justify-content:space-around;gap:clamp(8px,1.3vw,20px);padding:10px 14px;overflow-x:auto;scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem{flex:0 0 auto}.oneGlobalNavBack{animation:oneGlobalNavBackEnter .3s ease-out both}.oneGlobalNavBack button{color:var(--global-nav-accent,#7dd7ef)!important}@keyframes oneGlobalNavBackEnter{from{opacity:0;transform:translateX(-14px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}@media(prefers-reduced-motion:reduce){.oneGlobalNavBack{animation:none}}.oneGlobalNavItem>button{width:clamp(62px,8vw,94px);height:67px;display:flex;align-items:center;justify-content:center;flex-direction:column;border:0;background:none;color:inherit;cursor:pointer;border-radius:12px;gap:3px}.oneGlobalNavItem.labelAbove>button{flex-direction:column-reverse}.oneGlobalNavLabel{display:block;font-size:10px;font-weight:600;letter-spacing:.02em;line-height:1.2;white-space:nowrap;opacity:.8}.oneGlobalNavItem>button:hover,.oneGlobalNavItem>button[aria-current=page]{background:color-mix(in srgb,currentColor 9%,transparent)}.oneGlobalNavSearch{display:flex;gap:8px;padding:8px 16px}.oneGlobalNavSearch input{flex:1;min-width:0;border:1px solid #777;border-radius:12px;padding:10px;background:transparent;color:inherit}.oneGlobalNavSearch button{border-radius:10px;padding:8px 14px}.oneGlobalNavDialogBackdrop{position:fixed;inset:0;background:#0009;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}.oneGlobalNavDialog{width:min(400px,100%);padding:22px;border:1px solid #ffffff32;border-radius:18px;background:#202024;color:#f8f8fa;box-shadow:0 15px 55px #0008}.oneGlobalNavDialog p{margin:0 0 20px;font-size:19px}.oneGlobalNavRemember{display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:18px}.oneGlobalNavRemember input{width:18px;height:18px}.oneGlobalNavDialogActions{display:flex;justify-content:flex-end;gap:16px}.oneGlobalNavDialogActions button{background:transparent;color:#78b3ff;border:0;padding:10px;cursor:pointer;font-size:16px}.profileSocialTop{display:none!important}@media(max-width:600px){.oneGlobalNavRail{justify-content:flex-start;gap:4px;padding:8px}.oneGlobalNavItem>button{width:68px;height:64px}}`}</style>
 </header>;
}
