"use client";
import {useCallback,useEffect,useState} from "react";
type Candidate={id:string;title:string;creator:string;source_url:string;thumbnail_url:string|null;review_status:string;category:string;rights_status:string};
export default function ContentDiscoveryAdmin(){
 const [items,setItems]=useState<Candidate[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const load=useCallback(async()=>{const r=await fetch("/api/hudhud/content-discovery",{cache:"no-store"});const j=await r.json();if(r.ok)setItems(j.candidates||[]);else setMessage(j.error||"Could not load candidates");},[]);
 useEffect(()=>{void load()},[load]);
 const action=async(body:Record<string,string>)=>{setBusy(true);setMessage("");try{const r=await fetch("/api/hudhud/content-discovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();setMessage(r.ok?(body.action==="discover"?"Found "+j.discovered+" candidates for review.":"Review saved."):j.error||"Request failed");await load()}catch{setMessage("Network error")}finally{setBusy(false)}};
 return <main style={{minHeight:"100dvh",background:"#041b13",color:"#f2e2b5",padding:"36px 18px",fontFamily:"inherit"}}><div style={{maxWidth:950,margin:"auto"}}>
 <h1>🦜 HudHud Content Discovery</h1><p>Find positive Islamic videos. Every result requires your approval. YouTube videos remain linked to their creators; clipping requires separate rights.</p>
 <button disabled={busy} onClick={()=>void action({action:"discover"})} style={{padding:"13px 22px",borderRadius:22,background:"#17634c",color:"#fff",border:"1px solid #c9aa6c"}}>Discover Islamic Videos</button>
 <p role="status">{message}</p><h2>Approval Queue</h2><div style={{display:"grid",gap:16}}>{items.map(item=><article key={item.id} style={{border:"1px solid #ac9259",borderRadius:18,padding:15,background:"#0a2c20",display:"flex",gap:15,flexWrap:"wrap"}}>
 {item.thumbnail_url&&<img src={item.thumbnail_url} alt="" width={160} height={90} style={{objectFit:"cover",borderRadius:10}}/>}
 <div style={{flex:"1 1 260px"}}><strong>{item.title}</strong><p>{item.creator} · {item.review_status} · {item.rights_status}</p><a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{color:"#bcefd7"}}>Watch original ↗</a>
 <div style={{display:"flex",gap:10,marginTop:12}}><button disabled={busy} onClick={()=>void action({action:"review",id:item.id,status:"approved"})}>Approve</button><button disabled={busy} onClick={()=>void action({action:"review",id:item.id,status:"rejected"})}>Reject</button></div></div></article>)}</div>
 </div></main>;
}
