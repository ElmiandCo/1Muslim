"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

export default function HudHudTenFriends({userId,connectionCount}:{userId:string;connectionCount:number}){
 const [open,setOpen]=useState(false);
 const [disabled,setDisabled]=useState(false);
 const [draft,setDraft]=useState("As-salamu alaykum! I'd love to connect, learn, and share beneficial knowledge with the 1Muslim community.");
 useEffect(()=>{
  try{
   setDisabled(localStorage.getItem("1muslim-ten-friends-disabled-"+userId)==="1");
   setOpen(connectionCount<10 && localStorage.getItem("1muslim-ten-friends-dismissed-"+userId)!==new Date().toISOString().slice(0,10));
  }catch{}
 },[userId,connectionCount]);
 if(disabled||connectionCount>=10||!open)return null;
 const dismiss=()=>{setOpen(false);try{localStorage.setItem("1muslim-ten-friends-dismissed-"+userId,new Date().toISOString().slice(0,10))}catch{}};
 const turnOff=()=>{setDisabled(true);try{localStorage.setItem("1muslim-ten-friends-disabled-"+userId,"1")}catch{}};
 return <aside aria-label="HudHud ten friends program" style={{margin:"16px auto",maxWidth:1120,padding:20,border:"1px solid #5476a6",borderRadius:20,background:"linear-gradient(125deg,#10253b,#1b1639)",color:"white"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12}}><strong>🐦 HudHud · Your first 10 Ashab</strong><button type="button" onClick={dismiss} aria-label="Dismiss HudHud suggestion" style={{background:"transparent",color:"white",border:0,cursor:"pointer"}}>✕</button></div>
  <p>You have {connectionCount} accepted Ashab connection{connectionCount===1?"":"s"}. Discover members and invite them to connect! {10-connectionCount} more to reach 10.</p>
  <label htmlFor="hudhud-intro-draft">Suggested introduction (edit before sharing)</label>
  <textarea id="hudhud-intro-draft" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={500} style={{display:"block",width:"100%",minHeight:75,margin:"10px 0",borderRadius:10,padding:10}}/>
  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
   <Link href="/find" className="primary">Discover members</Link>
   <button type="button" onClick={()=>{void navigator.clipboard?.writeText(draft)}} className="ghost">Copy introduction</button>
   <button type="button" onClick={turnOff} className="ghost">Don't suggest again</button>
  </div>
  <small style={{display:"block",marginTop:10}}>HudHud never follows anyone or posts to another member's page without your approval. Ashab connections are not the same as followers.</small>
 </aside>;
}
