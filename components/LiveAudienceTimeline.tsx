"use client";
import {useMemo,useRef,useState} from "react";
type Sample={viewers:number;captured_at:string};
const clock=(seconds:number)=>{const s=Math.max(0,Math.floor(seconds));return Math.floor(s/3600)>0?`${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`:`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
export default function LiveAudienceTimeline({samples,startedAt,duration,videoUrl}:{samples:Sample[];startedAt:string|null;duration:number;videoUrl:string|null}){
 const svg=useRef<SVGSVGElement>(null),video=useRef<HTMLVideoElement>(null);
 const [hover,setHover]=useState<number|null>(null),[previewError,setPreviewError]=useState(false);
 const points=useMemo(()=>{if(!samples.length)return[];const start=startedAt?new Date(startedAt).getTime():new Date(samples[0].captured_at).getTime();return samples.map(s=>({seconds:Math.max(0,(new Date(s.captured_at).getTime()-start)/1000),viewers:s.viewers})).sort((a,b)=>a.seconds-b.seconds)},[samples,startedAt]);
 const maxTime=Math.max(1,duration,points[points.length-1]?.seconds??0),maxViewers=Math.max(1,...points.map(p=>p.viewers));
 const x=(t:number)=>60+t/maxTime*680,y=(v:number)=>210-v/maxViewers*175;
 const path=points.map((p,i)=>`${i?"L":"M"}${x(p.seconds).toFixed(2)} ${y(p.viewers).toFixed(2)}`).join(" ");
 const selected=hover===null?null:points.reduce((best,p)=>Math.abs(p.seconds-hover)<Math.abs(best.seconds-hover)?p:best,points[0]);
 const seek=(seconds:number)=>{setHover(seconds);if(video.current&&videoUrl&&!previewError){const v=video.current;if(v.readyState>=1){try{v.currentTime=Math.min(Math.max(0,seconds),Math.max(0,(Number.isFinite(v.duration)?v.duration:duration)-.15))}catch{}}}};
 const move=(clientX:number)=>{const rect=svg.current?.getBoundingClientRect();if(!rect)return;const fraction=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));const chartFraction=Math.max(0,Math.min(1,(fraction*800-60)/680));seek(chartFraction*maxTime)};
 if(points.length<2)return <p style={{color:"#c4d7c8"}}>Audience timeline becomes available after at least two live viewer snapshots.</p>;
 const ticks=Array.from({length:5},(_,i)=>maxTime*i/4);
 return <div className="audienceTimeline">
 <style>{`.audienceTimeline{border:1px solid #54775d;background:linear-gradient(160deg,#152f22,#0c1b13);padding:clamp(12px,3vw,22px);border-radius:20px}.audienceChart{width:100%;display:block;touch-action:pan-y;cursor:crosshair}.audienceTimeline .preview{display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:#254534;padding:12px;border-radius:14px;margin-top:12px}.audienceTimeline video{width:clamp(130px,36%,250px);max-height:145px;object-fit:contain;background:#070d09;border-radius:10px}.audienceTimeline .line{stroke:#bce7a5;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}.audienceTimeline .grid{stroke:#496552;stroke-width:1;stroke-dasharray:3 5}.audienceTimeline .axis{fill:#b7cbb9;font-size:13px}.audienceTimeline .hoverLine{stroke:#f6e8a7;stroke-width:1.5;stroke-dasharray:5 4}@media(prefers-reduced-motion:reduce){.audienceTimeline *{animation:none!important;transition:none!important}}`}</style>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><h3 style={{margin:"0 0 4px"}}>📈 Audience timeline</h3><small style={{color:"#b9cdbd"}}>Minutes → along the bottom · Viewers ↑ on the left</small></div><strong style={{color:"#d8ecb5"}}>Peak {maxViewers} viewers</strong></div>
 <svg ref={svg} className="audienceChart" viewBox="0 0 800 260" role="img" aria-label="Line graph of concurrent viewers by elapsed minutes. Use the timeline slider below to inspect moments." onPointerMove={e=>move(e.clientX)} onPointerLeave={()=>setHover(null)} onClick={e=>move(e.clientX)}>
 {Array.from({length:5},(_,i)=>{const v=maxViewers*i/4;return <g key={i}><line className="grid" x1="60" x2="740" y1={y(v)} y2={y(v)}/><text className="axis" x="49" y={y(v)+4} textAnchor="end">{Math.round(v)}</text></g>})}
 {ticks.map((t,i)=><g key={i}><line className="grid" x1={x(t)} x2={x(t)} y1="35" y2="210"/><text className="axis" x={x(t)} y="236" textAnchor="middle">{clock(t)}</text></g>)}
 <text className="axis" x="400" y="255" textAnchor="middle">Elapsed minutes</text><text className="axis" x="15" y="24">Viewers</text>
 <path d={path} className="line"/>{selected&&<><line className="hoverLine" x1={x(selected.seconds)} x2={x(selected.seconds)} y1="35" y2="210"/><circle cx={x(selected.seconds)} cy={y(selected.viewers)} r="7" fill="#f6e8a7" stroke="#203c2b" strokeWidth="3"/></>}
 </svg>
 <label style={{display:"block",fontSize:12,color:"#c8dfcc",marginTop:8}}>Inspect a moment: {clock(hover??0)}<input type="range" min="0" max={maxTime} step="1" value={hover??0} onChange={e=>seek(Number(e.target.value))} style={{display:"block",width:"100%",accentColor:"#cce7ad",marginTop:8}} aria-label="Select a moment in the live recording"/></label>
 {<div className="preview" style={{display:hover!==null&&selected?"flex":"none"}}><div><strong style={{display:"block",fontSize:24}}>{selected?.viewers??0} viewers</strong><span>At {clock(selected?.seconds??0)} · nearest audience sample</span></div>{videoUrl&&!previewError?<video ref={video} src={videoUrl} preload="metadata" playsInline muted onError={()=>setPreviewError(true)} aria-label="Paused video frame from the recording"/>:<small>{videoUrl?"Frame preview unavailable for this recording.":"Save a recording to preview video frames."}</small>}</div>}
 <small style={{display:"block",marginTop:12,color:"#afc6b3"}}>Viewer counts are sampled periodically. Hover or drag to inspect a moment; frame previews depend on the recording format and browser seeking support.</small>
 </div>;
}
