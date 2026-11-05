"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
type Video={video_id:string;title:string;channel_title:string;thumbnail_url:string|null;categories:string[];bot_b_reason:string|null;status:string;format:string};
export default function VideoReviewPage(){
 const [videos,setVideos]=useState<Video[]>([]),[message,setMessage]=useState("Loading review queue..."),[busy,setBusy]=useState("");
 const db=createClient();
 async function load(){const {data,error}=await db.from("islamic_video_registry").select("video_id,title,channel_title,thumbnail_url,categories,bot_b_reason,status,format").eq("status","pending").order("discovered_at",{ascending:false}).limit(100);setVideos(data||[]);setMessage(error?"Admin authorization required":data?.length?"":"No videos awaiting review")}
 useEffect(()=>{void load()},[]);
 async function review(id:string,status:"approved"|"rejected"){setBusy(id);const {error}=await db.rpc("review_islamic_video",{p_video_id:id,p_status:status});setBusy("");if(error)setMessage(error.message);else await load()}
 return <main style={{minHeight:"100vh",padding:"24px",background:"#081716",color:"#f1ead8"}}><h1>HudHud · Video Review</h1><p>Bot A discovers. Bot B screens. Only your approval publishes.</p><p role="status">{message}</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>{videos.map(v=><article key={v.video_id} style={{padding:14,border:"1px solid #7db9a755",borderRadius:16,background:"#ffffff10"}}>{v.thumbnail_url&&<img src={v.thumbnail_url} alt="" style={{width:"100%",borderRadius:10}}/>}<h2 style={{fontSize:18}}>{v.title}</h2><p>{v.channel_title} · {v.format}</p><p>{v.categories.join(", ")||"Uncategorized"}</p><p>{v.bot_b_reason}</p><a href={`https://www.youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noopener noreferrer" style={{color:"#bde5e0"}}>Watch on YouTube ↗</a><div style={{display:"flex",gap:12,marginTop:12}}><button disabled={busy===v.video_id} onClick={()=>void review(v.video_id,"approved")}>Approve</button><button disabled={busy===v.video_id} onClick={()=>void review(v.video_id,"rejected")}>Reject</button></div></article>)}</div></main>
}
