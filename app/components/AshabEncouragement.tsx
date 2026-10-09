"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";

type Item={id:string;body:string;created_at:string};
const KEY="1muslim-ashab-encouragement";
export default function AshabEncouragement(){
 const [enabled,setEnabled]=useState(false),[items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{try{setEnabled(localStorage.getItem(KEY)==="on")}catch{}},[]);
 useEffect(()=>{if(!enabled)return;let active=true;const load=async()=>{setLoading(true);const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){if(active){setMessage("Sign in to discover your Ashab.");setLoading(false)}return}
 const {data:rows,error}=await s.rpc("get_ashab_ids",{p_profile_id:user.id});if(error){if(active){setMessage("Your Ashab feed is unavailable right now.");setLoading(false)}return}
 const ids=(rows||[]).map((r:{user_id:string})=>r.user_id).filter((id:string)=>id!==user.id);
 if(!ids.length){if(active){setItems([]);setMessage("Follow people in Find People. When they follow you back, their posts can appear here.");setLoading(false)}return}
 const {data:posts,error:postsError}=await s.from("posts").select("id,body,created_at").in("user_id",ids).order("created_at",{ascending:false}).limit(12);
 if(active){setItems((posts||[]) as Item[]);setMessage(postsError?"Could not load posts right now.":posts?.length?"":"Your Ashab haven't shared posts recently.");setLoading(false)}
 };void load();return()=>{active=false}},[enabled]);
 const toggle=()=>{setEnabled(v=>{try{localStorage.setItem(KEY,!v?"on":"off")}catch{}return !v})};
 return <section id="ashab-encouragement" style={{margin:"24px 0",padding:22,border:"1px solid #6fefbb77",borderRadius:20,background:"rgba(7,49,33,.65)",color:"#eafff3"}}>
 <span style={{color:"#90f9c6",fontSize:12,letterSpacing:2}}>✦ HUDHUD · ASHAB CIRCLE</span>
 <h2>Encourage your Ashab 💚</h2>
 <p>Discover posts from people who follow you back. Visit, react, comment or share when you genuinely enjoy something. No automatic likes or forced engagement.</p>
 <button type="button" onClick={toggle} aria-pressed={enabled} style={{background:enabled?"#267a57":"#14523f",color:"white",padding:"12px 18px",border:"1px solid #78eeb8",borderRadius:14,cursor:"pointer"}}>{enabled?"✓ Encouragement feed ON · Turn off":"Yes, show me Ashab posts"}</button>
 {enabled&&<div style={{marginTop:18}}>{loading?<p>Finding your Ashab's posts…</p>:items.length?items.map(p=><Link key={p.id} href={"/posts/"+p.id} style={{display:"block",padding:13,marginTop:10,borderRadius:12,border:"1px solid #a2ffd144",color:"#eafff3",textDecoration:"none"}}><p>{(p.body||"Community post").slice(0,180)}</p><small>Open post to like, comment or share →</small></Link>):<p>{message}</p>}<p style={{fontSize:12,opacity:.8}}>Only mutual follows appear here. Notifications for new posts require a separate server-side subscription.</p></div>}
 <p style={{marginTop:12}}><Link href="/find" style={{color:"#a7f9d2"}}>Find more Ashab →</Link></p>
 </section>;
}
