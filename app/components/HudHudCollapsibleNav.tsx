"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import CelestialOrb from "./CelestialOrb";

/** Landing-style collapsible navigation shared by Messenger and Profile. */
export default function HudHudCollapsibleNav(){
 const router=useRouter();
 const [collapsed,setCollapsed]=useState(false);
 const [light,setLight]=useState(false);
 const [search,setSearch]=useState("");

 useEffect(()=>{try{setLight(localStorage.getItem("1muslim-theme")==="light")}catch{}},[]);
 const toggleTheme=()=>{setLight(v=>{const next=!v;try{localStorage.setItem("1muslim-theme",next?"light":"dark")}catch{}document.documentElement.classList.toggle("light",next);window.dispatchEvent(new Event("1muslim:theme-changed"));return next})};
 const submit=(e:React.FormEvent)=>{e.preventDefault();const q=search.trim();if(q)router.push("/find?q="+encodeURIComponent(q))};
 return <div className="hudhudSharedNav">
  <div className="hudhudSharedRow">
   <Link href="/" className="hudhudSharedLogo" aria-label="1Muslim Home"><img src="/assets/hudhud-logo.PNG" alt="1Muslim"/></Link>
   {!collapsed&&<form onSubmit={submit} className="hudhudSharedSearch" role="search"><input aria-label="Search 1Muslim" placeholder="Search 1Muslim · people, verses, live…" value={search} onChange={e=>setSearch(e.target.value)}/><button type="submit" aria-label="Search">⌕</button></form>}
   <CelestialOrb light={light} onToggle={toggleTheme}/>
   <button type="button" className="hudhudSharedCollapse" aria-expanded={!collapsed} aria-label={collapsed?"Expand navigation":"Collapse navigation"} onClick={()=>setCollapsed(v=>!v)}><img src="/assets/hudhud-logo.PNG" alt="HudHud" /></button>
  </div>
  <style jsx global>{`
   .hudhudSharedNav{position:relative;z-index:70;width:100%;max-width:1100px;margin:0 auto 12px;padding:8px 12px;background:linear-gradient(110deg,rgba(4,28,29,.9),rgba(4,40,33,.83));border-bottom:1px solid rgba(123,206,185,.25);backdrop-filter:blur(20px);color:#e8f7f1}
   .hudhudSharedRow{display:flex;align-items:center;gap:10px;min-height:58px}
   .hudhudSharedLogo{width:48px;height:48px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid #67c8b577;background:#0b2b2b}
   .hudhudSharedLogo img{width:44px;height:44px;object-fit:contain}
   .hudhudSharedSearch{flex:1;display:flex;min-width:0;align-items:center;background:rgba(255,255,255,.09);border:1px solid #7dcab977;border-radius:999px;overflow:hidden;height:43px}
   .hudhudSharedSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#f4fff9;font-size:16px;padding:0 12px}
   .hudhudSharedSearch input::placeholder{color:#c1d8d1}
   .hudhudSharedSearch button{border:0;background:transparent;color:#c9f5e5;font-size:27px;padding:0 12px;cursor:pointer}
   .hudhudSharedCollapse,.hudhudSharedHudhud{width:43px;height:43px;flex:none;border:1px solid #83c8b780;border-radius:14px;background:rgba(10,54,50,.8);color:#d9f9ee;font-size:23px;cursor:pointer}
   .hudhudSharedCollapse img{width:31px;height:31px;object-fit:contain}
   @media(max-width:700px){.hudhudSharedNav{margin-bottom:8px;padding:6px 8px}.hudhudSharedRow{gap:6px}.hudhudSharedLogo{width:40px;height:40px}.hudhudSharedLogo img{width:38px;height:38px}.hudhudSharedCollapse,.hudhudSharedHudhud{width:37px;height:40px;font-size:20px}.hudhudSharedSearch{height:40px}.hudhudSharedSearch input{font-size:16px;padding:0 8px}.hudhudSharedSearch input::placeholder{font-size:12px}}
  `}</style>
 </div>;
}
