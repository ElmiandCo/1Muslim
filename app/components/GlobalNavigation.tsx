"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useState} from "react";
import {createClient} from "../../utils/supabase/client";
import GlobalNavIcon,{type GlobalNavDestination} from "./GlobalNavIcon";
const entries:{id:GlobalNavDestination;label:string;href?:string}[]=[
{id:"search",label:"Search"},{id:"settings",label:"Settings",href:"/profile?panel=settings"},{id:"deepwatch",label:"DeepWatch",href:"/deepwatch"},
{id:"muslims",label:"Muslims",href:"/profile?section=muslimeen"},{id:"quran",label:"Qur'an",href:"/quran-library"},
{id:"messages",label:"Messages",href:"/messages"},{id:"profile",label:"Profile",href:"/profile"},
{id:"unlocked",label:"1Muslim Unlocked",href:"/profile?panel=unlocked"},{id:"signout",label:"Sign Out"}];
export default function GlobalNavigation(){
 const pathname=usePathname(),router=useRouter(),[search,setSearch]=useState(false),[query,setQuery]=useState(""),[busy,setBusy]=useState(false);
 if(pathname?.startsWith("/auth")||pathname?.startsWith("/login"))return null;
 async function signOut(){if(!window.confirm("Sign out of 1Muslim?"))return;setBusy(true);try{await createClient().auth.signOut();router.push("/");router.refresh()}finally{setBusy(false)}}
 return <header className="oneGlobalNav" aria-label="1Muslim global navigation">
 <nav className="oneGlobalNavRail" aria-label="Global destinations">{entries.map(item=><span key={item.id} className="oneGlobalNavItem">{item.href?<Link href={item.href} aria-label={item.label} title={item.label} aria-current={pathname===item.href?"page":undefined}><GlobalNavIcon name={item.id}/></Link>:<button type="button" title={item.label} aria-label={item.label} disabled={busy} onClick={()=>item.id==="search"?setSearch(v=>!v):void signOut()}><GlobalNavIcon name={item.id}/></button>}</span>)}</nav>
 {search&&<form className="oneGlobalNavSearch" onSubmit={e=>{e.preventDefault();router.push("/profile?section=muslimeen&search="+encodeURIComponent(query));setSearch(false)}}><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search Muslims" placeholder="Search 1Muslim members"/><button type="submit">Search</button></form>}
 <style jsx global>{`.oneGlobalNav{position:relative;z-index:60;background:var(--global-nav-background,var(--page-background,#141318));color:var(--global-nav-color,var(--page-foreground,#e9e9f0));border-bottom:1px solid color-mix(in srgb,currentColor 13%,transparent)}.oneGlobalNavRail{display:flex;align-items:center;justify-content:space-around;gap:clamp(6px,2vw,24px);padding:12px 16px;overflow-x:auto;scrollbar-width:none}.oneGlobalNavRail::-webkit-scrollbar{display:none}.oneGlobalNavItem>a,.oneGlobalNavItem>button{width:40px;height:42px;display:flex;align-items:center;justify-content:center;border:0;background:none;color:inherit;text-decoration:none;cursor:pointer;border-radius:12px}.oneGlobalNavItem>a:hover,.oneGlobalNavItem>button:hover,.oneGlobalNavItem>a[aria-current=page]{background:color-mix(in srgb,currentColor 9%,transparent)}.oneGlobalNavSearch{display:flex;gap:8px;padding:8px 16px}.oneGlobalNavSearch input{flex:1;min-width:0;border:1px solid #777;border-radius:12px;padding:10px;background:transparent;color:inherit}.oneGlobalNavSearch button{border-radius:10px;padding:8px 14px}.profileSocialTop{display:none!important}@media(max-width:600px){.oneGlobalNavRail{justify-content:flex-start;gap:10px;padding:8px 12px}.oneGlobalNavItem{flex:0 0 auto}.oneGlobalNavItem>a,.oneGlobalNavItem>button{width:38px;height:40px}}`}</style>
 </header>;
}
