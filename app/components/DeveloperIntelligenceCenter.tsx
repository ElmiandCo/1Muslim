"use client";
import {useEffect,useState} from "react";
type Probe={name:string;status:"checking"|"healthy"|"degraded";latency:number|null;detail:string};
const targets=[["Application","/"],["DeepWatch","/deepwatch"],["Qur'an","/quran"],["Admin API","/api/admin/presence"]];
const sections=[["Reliability","Crashes, failed requests and incident frequency"],["Revenue protection","Checkout, trial conversion, renewals and failed payments"],["Retention","Day 1 / 7 / 30 cohorts, churn and active users"],["Playback","Startup latency, buffering, missing thumbnails"],["Infrastructure","Database, storage, API and deployment health"],["Investor readiness","Verified growth, margins, revenue and data quality"]];
export default function DeveloperIntelligenceCenter(){
 const [probes,setProbes]=useState<Probe[]>(targets.map(([name])=>({name,status:"checking",latency:null,detail:"Awaiting probe"})));
 const [errors,setErrors]=useState<{time:string;message:string;source:string}[]>([]);
 const [timing,setTiming]=useState<number|null>(null);
 const [updated,setUpdated]=useState("");
 useEffect(()=>{const nav=performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming|undefined;if(nav)setTiming(Math.round(nav.domContentLoadedEventEnd-nav.startTime));
 const onError=(e:ErrorEvent)=>setErrors(p=>[{time:new Date().toLocaleTimeString(),message:e.message.slice(0,220),source:"Browser"},...p].slice(0,30));
 const onReject=(e:PromiseRejectionEvent)=>setErrors(p=>[{time:new Date().toLocaleTimeString(),message:String(e.reason).slice(0,220),source:"Promise"},...p].slice(0,30));
 window.addEventListener("error",onError);window.addEventListener("unhandledrejection",onReject);
 return()=>{window.removeEventListener("error",onError);window.removeEventListener("unhandledrejection",onReject)}},[]);
 async function refresh(){setProbes(targets.map(([name])=>({name,status:"checking",latency:null,detail:"Checking"})));await Promise.all(targets.map(async ([name,url],i)=>{const start=performance.now();let result:Probe;try{const response=await fetch(url,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(8000)});const latency=Math.round(performance.now()-start);result={name,latency,status:response.ok?"healthy":"degraded",detail:response.ok?"HTTP "+response.status:"HTTP "+response.status+" (may require authentication)"};}catch(e){result={name,latency:null,status:"degraded",detail:e instanceof Error?e.message:"Request failed"};}setProbes(p=>p.map((v,j)=>i===j?result:v));}));setUpdated(new Date().toLocaleTimeString())}
 useEffect(()=>{void refresh();const id=setInterval(()=>void refresh(),60000);return()=>clearInterval(id)},[]);
 const card:React.CSSProperties={border:"1px solid #263948",background:"linear-gradient(145deg,#101d2a,#071018)",borderRadius:18,padding:18};
 return <main style={{height:"100%",overflowY:"auto",color:"#e9f2f6",fontFamily:"inherit",padding:"8px 4px 90px"}}>
 <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:18}}><div><small style={{letterSpacing:3,color:"#9db3c4"}}>1MUSLIM · ENGINEERING</small><h1 style={{fontSize:"clamp(23px,4vw,35px)",margin:"5px 0"}}>Developer Intelligence</h1><p style={{margin:0,color:"#9bb0bd",fontSize:13}}>Live diagnostics · operational intelligence · growth readiness</p></div><button onClick={()=>void refresh()} style={{border:"1px solid #48616c",background:"#152733",color:"white",padding:"10px 14px",borderRadius:12}}>↻ Refresh</button></header>
 <section aria-label="Diagnostic status" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:18}}>
 <div style={card}><small>PROBES HEALTHY</small><h2>{probes.filter(p=>p.status==="healthy").length} / {probes.length}</h2><small style={{color:"#9bb0bd"}}>HTTP checks, not full service health</small></div>
 <div style={card}><small>PAGE INTERACTIVE LOAD</small><h2>{timing===null?"—":timing+" ms"}</h2><small style={{color:"#9bb0bd"}}>Current browser only</small></div>
 <div style={card}><small>SESSION ERRORS</small><h2>{errors.length}</h2><small style={{color:"#9bb0bd"}}>Since dashboard opened</small></div>
 <div style={card}><small>LAST CHECK</small><h2 style={{fontSize:20}}>{updated||"Checking…"}</h2><small style={{color:"#9bb0bd"}}>Automatic refresh every 60s</small></div></section>
 <section style={{...card,marginBottom:18}}><h2 style={{marginTop:0,fontSize:18}}>Endpoint diagnostics</h2>{probes.map(p=><div key={p.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderTop:"1px solid #233746"}}><span aria-label={p.status} style={{width:9,height:9,borderRadius:10,background:p.status==="healthy"?"#61d9ac":p.status==="checking"?"#e3c66b":"#f28383"}}/><strong style={{minWidth:100}}>{p.name}</strong><small style={{color:"#a9bdc9",flex:1}}>{p.detail}</small><small>{p.latency===null?"—":p.latency+"ms"}</small></div>)}</section>
 <section style={{...card,marginBottom:18}}><h2 style={{marginTop:0,fontSize:18}}>Current-session errors</h2>{errors.length===0?<p style={{color:"#9bb0bd"}}>No errors captured while this screen has been open. Historical incidents require persistent telemetry integration.</p>:errors.map((e,i)=><p key={i} style={{borderTop:"1px solid #263948",paddingTop:10,overflowWrap:"anywhere"}}><small>{e.time} · {e.source}</small><br/>{e.message}</p>)}</section>
 <h2 style={{fontSize:19}}>Intelligence modules</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>{sections.map(([title,desc])=><article key={title} style={card}><strong>{title}</strong><p style={{fontSize:13,color:"#a9bdc9",lineHeight:1.5}}>{desc}</p><small style={{color:"#d4bb80"}}>Telemetry integration required</small></article>)}</div>
 <p style={{fontSize:12,color:"#8ea5b2",marginTop:20}}>No simulated revenue, retention, or infrastructure metrics. Backend collectors and access-controlled historical reporting are required before those panels can report verified figures.</p>
 </main>
}