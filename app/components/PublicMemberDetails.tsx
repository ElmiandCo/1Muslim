"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import CommunityMediaGallery from "./CommunityMediaGallery";
export default function PublicMemberDetails({userId}:{userId:string}){
 const [tab,setTab]=useState<"posts"|"videos"|"badges">("posts");
 const [posts,setPosts]=useState<{id:string;body:string|null;created_at:string}[]>([]);
 const [badges,setBadges]=useState<string[]>([]);
 useEffect(()=>{let alive=true;const db=createClient();void Promise.all([db.from("posts").select("id,body,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(30),db.from("member_badges").select("badge_key").eq("user_id",userId)]).then(([p,b])=>{if(alive){setPosts(p.data||[]);setBadges((b.data||[]).map(x=>x.badge_key))}});return()=>{alive=false}},[userId]);
 return <div style={{width:"100%",minWidth:0}}>
 <nav aria-label="Member content" style={{display:"flex",gap:7,margin:"12px 0",justifyContent:"center"}}>{(["posts","videos","badges"] as const).map(t=><button type="button" key={t} onClick={()=>setTab(t)} aria-pressed={tab===t} style={{flex:1,minWidth:0,borderRadius:20,padding:"9px 5px",border:"1px solid #d6ba7e88",background:tab===t?"#25614b":"#103b31",color:"#fff",textTransform:"capitalize"}}>{t}</button>)}</nav>
 <div style={{maxHeight:"42dvh",overflowY:"auto",overscrollBehavior:"contain",WebkitOverflowScrolling:"touch",touchAction:"pan-y",padding:"3px 2px 12px"}}>
 {tab==="videos"?<CommunityMediaGallery userId={userId}/>:tab==="badges"?(badges.length?<div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}>{badges.map(b=><div key={b} style={{padding:13,borderRadius:12,border:"1px solid #d6ba7e88",background:"#194b3d",textAlign:"center"}}>✦ {b.replace(/_/g," ")}</div>)}</div>:<p>No public badges yet.</p>):posts.length?<div style={{display:"grid",gap:9}}>{posts.map(post=><article key={post.id} style={{padding:12,background:"#0d392e",border:"1px solid #d6ba7e55",borderRadius:12,whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{post.body||"Media post"}<small style={{display:"block",marginTop:6,opacity:.7}}>{new Date(post.created_at).toLocaleDateString()}</small></article>)}</div>:<p>No public posts yet.</p>}
 </div></div>
}
