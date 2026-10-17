"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
export default function LiveStudioDemo(){
 const video=useRef<HTMLVideoElement>(null);
 const stream=useRef<MediaStream|null>(null);
 const [open,setOpen]=useState(false);
 const [full,setFull]=useState(false);
 const [camera,setCamera]=useState(false);
 const [facing,setFacing]=useState<"user"|"environment">("user");
 const [muted,setMuted]=useState(true);
 const [error,setError]=useState("");
 const [draft,setDraft]=useState("");
 const [comments,setComments]=useState<string[]>(["Welcome to your private preview 👋"]);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false)};
 const start=async(face:"user"|"environment")=>{
  setError("");stop();
  if(!navigator.mediaDevices?.getUserMedia){setError("Camera preview requires HTTPS and a supported browser.");return}
  try{
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:face}},audio:false});
   stream.current=media;
   if(video.current){video.current.srcObject=media;await video.current.play().catch(()=>{})}
   setCamera(true);setFacing(face);
  }catch{setError("Camera access unavailable. You can still explore the preview layout.")}
 };
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[]);
 useEffect(()=>{if(open&&camera&&video.current&&stream.current){video.current.srcObject=stream.current;video.current.play().catch(()=>{})}},[open,full,camera]);
 return <section className={"home-live-demo"+(full?" home-live-demo-full":"")} aria-label="Private livestream preview">
  <header className="home-live-demo-head"><div><strong>◉ YOUR LIVE PREVIEW</strong><small>Only you can see this · Not broadcasting</small></div><span className="home-live-demo-pill">PREVIEW · NOT LIVE</span></header>
  <div className="home-live-demo-screen">
   {camera&&open?<video ref={video} autoPlay muted playsInline className="home-live-demo-video"/>:<div className="home-live-demo-placeholder"><span>▣</span><strong>Your camera preview</strong><small>Try your setup before going live</small></div>}
   <div className="home-live-demo-watermark">PREVIEW · NOT LIVE</div>
   <div className="home-live-demo-comments">{comments.slice(-3).map((c,i)=><div key={i}>{c}</div>)}</div>
  </div>
  {error&&<p className="home-live-demo-error" role="alert">{error}</p>}
  <div className="home-live-demo-actions">
   <button type="button" onClick={()=>{setOpen(true);start(facing)}}>▣ {camera?"Restart camera":"Try camera"}</button>
   <button type="button" onClick={()=>{setOpen(true);setFull(v=>!v)}}>{full?"↙ Exit full view":"⛶ Full preview"}</button>
   {camera&&<button type="button" onClick={()=>start(facing==="user"?"environment":"user")}>⇄ Flip</button>}
   {camera&&<button type="button" onClick={stop}>■ Stop</button>}
  </div>
  <form className="home-live-demo-comment-form" onSubmit={e=>{e.preventDefault();if(!draft.trim())return;setComments(v=>[...v.slice(-12),draft.trim().slice(0,180)]);setDraft("")}}>
   <input aria-label="Demo comment" placeholder="Try a comment (preview only)" maxLength={180} value={draft} onChange={e=>setDraft(e.target.value)}/>
   <button type="submit" disabled={!draft.trim()}>Send</button>
  </form>
  <p className="home-live-demo-note">Demo comments stay on this screen. No viewers are connected and nothing is published.</p>
  <Link className="home-live-demo-real-link" href="/streaming/go-live">Ready? Open real Go Live setup ↗</Link>
 </section>
}
