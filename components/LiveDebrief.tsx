"use client";
import {useEffect,useState} from "react";
import {createClient} from "../utils/supabase/client";
import LiveAudienceTimeline from "./LiveAudienceTimeline";
type Stat={views:number;likes:number;comments:number;duration:number;title:string;id:string;streamId:string|null;videoPath:string};
export default function LiveDebrief({streamId,onClose}:{streamId:string;onClose:()=>void}){
 const [submitting,setSubmitting]=useState(false),[submitted,setSubmitted]=useState(false),[submissionError,setSubmissionError]=useState(""),[note,setNote]=useState("");
 const [startedAt,setStartedAt]=useState<string|null>(null);
 const [samples,setSamples]=useState<{viewers:number;captured_at:string}[]>([]);
 const [stats,setStats]=useState<Stat|null>(null),[previous,setPrevious]=useState<Stat|null>(null),[top,setTop]=useState<{body:string;sender_id:string;created_at:string}[]>([]),[tab,setTab]=useState<"overview"|"comments"|"clips">("overview"),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data:streams}=await db.from("live_streams").select("id,recording_id,started_at").eq("host_id",user.id).eq("id",streamId).limit(1);
 const stream=streams?.[0];if(!stream){setLoading(false);return}
 const {data:recordings}=await db.from("live_recordings").select("id,title,views,likes,comments_count,duration_seconds,created_at,video_path").eq("user_id",user.id).order("created_at",{ascending:false}).limit(25);
 const current=recordings?.find(r=>r.id===stream.recording_id);
 const earlier=recordings?.find(r=>r.id!==stream.recording_id);
 const toStat=(r:NonNullable<typeof current>):Stat=>({id:r.id,title:r.title,views:r.views??0,likes:r.likes??0,comments:r.comments_count??0,duration:r.duration_seconds??0,streamId:null,videoPath:r.video_path??""});
 const {data:comments}=await db.from("live_chat_messages").select("body,sender_id,created_at").eq("stream_id",streamId).order("created_at",{ascending:false}).limit(200);
 const {data:audience}=await db.from("live_analytics_samples").select("viewers,captured_at").eq("stream_id",streamId).order("captured_at",{ascending:true}).limit(3000);
 if(active){setStartedAt(stream.started_at??null);setSamples(audience??[]);setStats(current?toStat(current):null);setPrevious(earlier?toStat(earlier):null);setTop(comments??[]);setLoading(false)}
 };void load();return()=>{active=false}},[streamId]);
 useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",esc);return()=>window.removeEventListener("keydown",esc)},[onClose]);
 const submitFeature=async()=>{if(!stats||submitting)return;setSubmitting(true);setSubmissionError("");try{const response=await fetch("/api/live-feature-submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recordingId:stats.id,note})});const data=await response.json();if(!response.ok)throw Error(data.error||"Submission failed");setSubmitted(true)}catch(e){setSubmissionError(e instanceof Error?e.message:"Please retry")}finally{setSubmitting(false)}};
 const shareRecording=async()=>{if(!stats)return;const url=window.location.origin+"/streaming/recordings?recording="+encodeURIComponent(stats.id);if(navigator.share){try{await navigator.share({title:stats.title||"My 1Muslim live",url})}catch{}}else{try{await navigator.clipboard.writeText(url);setSubmissionError("Link copied. Check that the recording is publicly accessible before sharing.")}catch{setSubmissionError("Could not copy link")}}};
 const reactions=stats?.likes??0;
 const peak=samples.length?Math.max(...samples.map(s=>s.viewers)):null;
 const avg=samples.length?Math.round(samples.reduce((a,s)=>a+s.viewers,0)/samples.length):null;
 const peakSample=samples.find(s=>s.viewers===peak);
 const grouped=top.reduce<Record<string,number>>((acc,msg)=>{const bucket=new Date(msg.created_at);bucket.setMinutes(Math.floor(bucket.getMinutes()/5)*5,0,0);const key=bucket.toISOString();acc[key]=(acc[key]??0)+1;return acc},{});
 const hottest=Object.entries(grouped).sort((a,b)=>b[1]-a[1])[0];
 const delta=stats&&previous?stats.views-previous.views:null;
 return <div className="debriefBackdrop" onClick={onClose}><style>{`
 .debriefBackdrop{position:fixed;inset:0;z-index:12000;background:#000c;backdrop-filter:blur(9px);display:grid;place-items:center;padding:14px;animation:dbFade .3s ease}
 .debrief{background:linear-gradient(145deg,#183c2c,#0a1711);color:#f5fff5;border:1px solid #83a988;border-radius:25px;width:min(100%,760px);max-height:92vh;overflow:auto;padding:clamp(18px,4vw,32px);box-shadow:0 35px 100px #000b;animation:dbWhoosh .45s cubic-bezier(.2,.9,.2,1)}
 .dbNav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.dbNav button{border:1px solid #698b6b;background:#203d2d;color:white;border-radius:999px;padding:10px 15px;cursor:pointer}.dbNav button[aria-selected=true]{background:#d6edba;color:#102319}
 .dbGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:12px}.dbStat{background:#ffffff0d;border:1px solid #ffffff24;border-radius:16px;padding:18px}.dbStat strong{display:block;font-size:26px}.dbStat small{opacity:.75}
 .dbComment{padding:12px;border-bottom:1px solid #ffffff1a;line-height:1.5}
 @keyframes dbFade{from{opacity:0}to{opacity:1}}@keyframes dbWhoosh{from{opacity:0;transform:translateY(32px) scale(.94)}to{opacity:1;transform:none}}
 @media(prefers-reduced-motion:reduce){.debriefBackdrop,.debrief{animation:none}}
 `}</style>
 <section className="debrief" role="dialog" aria-modal="true" aria-label="Your live performance recap" onClick={e=>e.stopPropagation()}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span style={{fontSize:12,letterSpacing:2,color:"#d5e9b2"}}>✨ LIVE COMPLETED</span><button onClick={onClose} aria-label="Close recap" style={{background:"transparent",color:"white",border:"1px solid #729b7a",borderRadius:999,padding:"8px 12px",cursor:"pointer"}}>✕</button></div>
 <h2 style={{fontSize:"clamp(25px,5vw,36px)",margin:"10px 0"}}>🎉 Your live recap</h2><p>Nice work showing up for your community. Here's what happened.</p>
 <nav className="dbNav" aria-label="Live recap sections">{(["overview","comments","clips"] as const).map(t=><button key={t} aria-selected={tab===t} onClick={()=>setTab(t)}>{t==="overview"?"📈 Stats":t==="comments"?"💬 Comments":"✂️ Clips"}</button>)}</nav>
 {loading?<p>Gathering your live recap…</p>:tab==="overview"?<><div className="dbGrid"><div className="dbStat"><strong>{peak??"—"}</strong><small>Peak concurrent viewers (sampled)</small></div><div className="dbStat"><strong>{avg??"—"}</strong><small>Average concurrent viewers (sampled)</small></div><div className="dbStat"><strong>{stats?.views??"—"}</strong><small>Recording views</small></div><div className="dbStat"><strong>{reactions}</strong><small>Recording likes</small></div><div className="dbStat"><strong>{top.length}</strong><small>Recent live chat messages (up to 200)</small></div><div className="dbStat"><strong>{stats?Math.ceil(stats.duration/60)+"m":"—"}</strong><small>Recording duration</small></div></div><div style={{marginTop:24}}><LiveAudienceTimeline samples={samples} startedAt={startedAt} duration={stats?.duration??0} videoUrl={stats?.videoPath?createClient().storage.from("live-recordings").getPublicUrl(stats.videoPath).data.publicUrl:null}/></div>
 <p>{peakSample?"🔥 Peak audience at "+new Date(peakSample.captured_at).toLocaleTimeString():"Audience snapshots will appear for future lives once analytics is enabled."}</p>
 <p style={{marginTop:20}}>{delta===null?"📊 Your previous-live comparison will appear when both recordings are available.":`Compared with your previous recording: ${delta>=0?"+":""}${delta} views.`}</p><small>Recording metrics update as people watch afterward. Live reactions require dedicated event tracking. Audience figures are periodic snapshots, not exact attendance.</small></>:tab==="comments"?<><h3>💬 Recent conversation</h3><p>{top.length} recent messages retrieved (up to 200).</p>{hottest&&<div className="quizResult" style={{padding:15,border:"1px solid #85ac8c",borderRadius:14,background:"#234b33"}}>🔥 Most active five-minute chat window: {new Date(hottest[0]).toLocaleTimeString()} · {hottest[1]} messages in retrieved history.</div>}{top.slice(0,25).map((c,i)=><div className="dbComment" key={c.created_at+i}><small>{new Date(c.created_at).toLocaleTimeString()}</small><div>{c.body}</div></div>)}{!top.length&&<p>No chat messages were found for this live.</p>}</>:<><h3>✂️ Highlights & clips</h3><p>Automated highlights aren't generated yet. Once a recording is saved, you can review it in Live Recordings. Automatic clipping and most-commented timestamps will require a media processing pipeline.</p></>}
 <section style={{marginTop:25,padding:22,background:"linear-gradient(125deg,#2b5136,#173423)",border:"1px solid #729e7a",borderRadius:20}}>
 <small>🚀 KEEP THE MOMENT GOING</small><h3>That was a W Live? Share it!</h3>
 <p>Share the recording, plan a clip for your profile, or submit the full broadcast for main-page review.</p>
 <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
 <button onClick={()=>setTab("clips")} style={{padding:12,borderRadius:12,background:"#d8edc4",color:"#18331d",border:0,cursor:"pointer"}}>✂️ Make a clip</button>
 <button onClick={()=>void shareRecording()} disabled={!stats} style={{padding:12,borderRadius:12,background:"#254d32",color:"white",border:"1px solid #73997a",cursor:"pointer"}}>↗ Share recording</button>
 </div><div style={{marginTop:20,borderTop:"1px solid #ffffff33",paddingTop:16}}>
 <strong>🌟 Submit your full live for main-page review</strong>
 <p style={{fontSize:13}}>Tell us what made this a W Live. The team must approve it before featuring it.</p>
 <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="What made this live special? (optional)" aria-label="Submission note" style={{width:"100%",boxSizing:"border-box",minHeight:70,borderRadius:12,padding:12,background:"#102619",border:"1px solid #729e7a",color:"white"}}/>
 <button onClick={()=>void submitFeature()} disabled={!stats||submitting||submitted} style={{display:"block",marginTop:12,padding:"12px 18px",borderRadius:999,border:0,background:"#d9edb8",color:"#16301e",fontWeight:850,cursor:"pointer"}}>{submitted?"✓ Submitted for review":submitting?"Submitting…":"🏆 Submit this W Live"}</button>
 {submissionError&&<p role="status">{submissionError}</p>}
 </div></section>
 <div style={{display:"flex",gap:12,marginTop:25,flexWrap:"wrap"}}><a href="/streaming/recordings" style={{padding:"12px 16px",borderRadius:999,background:"#d6edba",color:"#132b1a",fontWeight:800,textDecoration:"none"}}>🎞️ View my recordings</a><button onClick={onClose} style={{padding:"12px 16px",borderRadius:999,border:"1px solid #83a988",background:"transparent",color:"white",cursor:"pointer"}}>Close recap</button></div>
 </section></div>
}
