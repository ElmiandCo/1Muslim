"use client";
import {useEffect,useState} from "react";
type Item={id:string;recording_id:string;note:string;status:string;submitted_at:string;recording:{title:string;duration_seconds:number}|null};
export default function FeaturedLiveReview(){
 const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState<string|null>(null),[loaded,setLoaded]=useState(false);
 const load=async()=>{try{const r=await fetch("/api/admin/live-feature-submissions",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load");setItems(d.submissions??[]);setError("")}catch(e){setError(e instanceof Error?e.message:"Unable to load")}finally{setLoaded(true)}};
 useEffect(()=>{void load()},[]);
 const decide=async(id:string,status:"approved"|"rejected")=>{setBusy(id);try{const r=await fetch("/api/admin/live-feature-submissions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to review");setItems(prev=>prev.map(x=>x.id===id?{...x,status}:x));setError("")}catch(e){setError(e instanceof Error?e.message:"Unable to save")}finally{setBusy(null)}};
 return <section className="hqPanel" style={{marginBottom:18}}><div className="hqPanelHead"><h3>🏆 W Live · Main-page submissions</h3><span>{items.filter(x=>x.status==="pending").length} pending</span></div>
 <p style={{color:"#b9d5c0"}}>Review full livestreams submitted by hosts. Approval records your decision; homepage scheduling is a separate step.</p>
 {error&&<p role="alert" style={{color:"#ffbdab"}}>{error}</p>}
 {!loaded?<p>Loading submissions…</p>:!items.length?<p className="hqEmpty">No submitted W Lives yet.</p>:items.map(item=><div className="hqRow" key={item.id}><div className="hqRowBody"><strong>{item.recording?.title||"Recorded livestream"}</strong><small>{item.status.toUpperCase()} · {new Date(item.submitted_at).toLocaleString()} · {Math.round((item.recording?.duration_seconds??0)/60)} min</small><p style={{whiteSpace:"pre-wrap"}}>{item.note||"No host note provided."}</p></div><div className="hqRowActions"><a href={"/streaming/recordings?recording="+encodeURIComponent(item.recording_id)}>Review ↗</a>{item.status==="pending"&&<><button disabled={busy===item.id} onClick={()=>void decide(item.id,"approved")}>✓ Approve</button><button disabled={busy===item.id} onClick={()=>void decide(item.id,"rejected")}>✕ Reject</button></>}</div></div>)}
 </section>;
}
