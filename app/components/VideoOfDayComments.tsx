"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ExpressionKeyboard from "./ExpressionKeyboard";
import ExpressiveText from "./ExpressiveText";
import { createClient } from "../../utils/supabase/client";

const VIDEO_ID = "_8yvTAnwbQ8";
type Comment = { id:string; body:string; created_at:string; user_id:string; parent_id:string|null; depth:number };
function playChime() {
  try {
    const Context = window.AudioContext;
    if (!Context) return;
    const ctx = new Context();
    const start = ctx.currentTime;
    [660,880].forEach((hz,i)=>{
      const oscillator=ctx.createOscillator(),gain=ctx.createGain();
      oscillator.type="sine";oscillator.frequency.value=hz;
      gain.gain.setValueAtTime(.0001,start+i*.09);
      gain.gain.exponentialRampToValueAtTime(.045,start+i*.09+.018);
      gain.gain.exponentialRampToValueAtTime(.0001,start+i*.09+.23);
      oscillator.connect(gain);gain.connect(ctx.destination);
      oscillator.start(start+i*.09);oscillator.stop(start+i*.09+.25);
    });
    window.setTimeout(()=>void ctx.close(),650);
  } catch { /* audio is optional */ }
}
export default function VideoOfDayComments() {
  const [comments,setComments]=useState<Comment[]>([]);
  const [body,setBody]=useState("");
  const [userId,setUserId]=useState<string|null>(null);
  const [replyTo,setReplyTo]=useState<Comment|null>(null);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const [loading,setLoading]=useState(true);
  const [effects,setEffects]=useState(true);
  const [sound,setSound]=useState(false);
  const [celebrate,setCelebrate]=useState(0);
  const [newId,setNewId]=useState<string|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pressed=useRef(false);
  const input=useRef<HTMLInputElement>(null);
  const refresh=useCallback(async()=>{
    const supabase=createClient();
    const {data,error:loadError}=await supabase.from("featured_video_comments")
      .select("id,body,created_at,user_id,parent_id,depth").eq("video_id",VIDEO_ID)
      .order("created_at",{ascending:true}).limit(200);
    if(loadError)setError("Comments are not available yet.");
    else {setComments((data??[]) as Comment[]);setError("");}
    setLoading(false);
  },[]);
  useEffect(()=>{
    const supabase=createClient();
    void supabase.auth.getUser().then(({data})=>setUserId(data.user?.id??null));
    void refresh();
    try {setSound(localStorage.getItem("1muslim-comment-sound")==="on");setEffects(localStorage.getItem("1muslim-comment-effects")!=="off");} catch {}
    return ()=>{if(timer.current)clearTimeout(timer.current)};
  },[refresh]);
  const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chooseReply=(comment:Comment)=>{
    if(!userId)return;
    setReplyTo(comment);
    if(effects&&!reduced())setCelebrate(v=>v+1);
    if(sound)playChime();
    window.setTimeout(()=>input.current?.focus(),40);
  };
  const holdStart=(comment:Comment)=>{
    pressed.current=false;
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(()=>{pressed.current=true;chooseReply(comment)},500);
  };
  const holdEnd=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null};
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!userId||!body.trim()||saving)return;
    setSaving(true);
    const supabase=createClient();
    const {data,error:insertError}=await supabase.from("featured_video_comments")
      .insert({video_id:VIDEO_ID,body:body.trim(),parent_id:replyTo?.id??null}).select("id").single();
    if(insertError)setError("Could not post comment. Please try again.");
    else {
      setBody("");setReplyTo(null);setNewId(data?.id??null);
      if(effects&&!reduced())setCelebrate(v=>v+1);
      if(sound)playChime();
      await refresh();
    }
    setSaving(false);
  };
  const children=(id:string)=>comments.filter(c=>c.parent_id===id);
  const render=(comment:Comment):React.ReactNode=><div key={comment.id} style={{marginLeft:Math.min(comment.depth,2)*14}}>
    <article id={`featured-comment-${comment.id}`} className={newId===comment.id&&effects?"omCommentPop":""}
      onPointerDown={e=>{if(e.pointerType!=="mouse")holdStart(comment)}}
      onPointerUp={holdEnd} onPointerCancel={holdEnd} onPointerLeave={holdEnd}
      onContextMenu={e=>{if(userId){e.preventDefault();chooseReply(comment)}}}
      style={{padding:12,borderRadius:12,border:"1px solid #b99c5533",marginBottom:8,touchAction:"pan-y"}}>
      <div style={{opacity:.65,fontSize:11,marginBottom:5}}>Community member · {new Date(comment.created_at).toLocaleDateString()}</div>
      <p style={{margin:0,whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:13}}><ExpressiveText text={comment.body}/></p>
      {userId&&<button type="button" onClick={()=>chooseReply(comment.depth>=2?(comments.find(c=>c.id===comment.parent_id)??comment):comment)}
        style={{marginTop:8,border:0,background:"transparent",color:"#d9bd70",fontWeight:700,cursor:"pointer"}}>
        ↩ Reply {comment.depth>=2?"in thread":""}
      </button>}
    </article>
    {children(comment.id).map(render)}
  </div>;
  return <div style={{marginTop:22,borderTop:"1px solid #b99c5544",paddingTop:16}}>
    <h3 style={{margin:"0 0 12px"}}>💬 Community comments</h3>
    <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,marginBottom:12}}>
      <label><input type="checkbox" checked={effects} onChange={e=>{setEffects(e.target.checked);try{localStorage.setItem("1muslim-comment-effects",e.target.checked?"on":"off")}catch{}}}/> ✨ Screen effects</label>
      <label><input type="checkbox" checked={sound} onChange={e=>{setSound(e.target.checked);try{localStorage.setItem("1muslim-comment-sound",e.target.checked?"on":"off")}catch{}}}/> 🔊 Sounds</label>
    </div>
    {replyTo&&<div style={{padding:10,background:"#17301d",borderRadius:10,marginBottom:10,fontSize:12}}>↩ Replying to: {replyTo.body.slice(0,90)} <button type="button" onClick={()=>setReplyTo(null)} style={{marginLeft:8}}>✕ Cancel</button></div>}
    {userId?<form onSubmit={submit} style={{display:"flex",gap:9,flexWrap:"wrap"}}>
      <label htmlFor="featured-video-comment" style={{position:"absolute",width:1,height:1,overflow:"hidden"}}>Write a comment</label>
      <input ref={input} id="featured-video-comment" value={body} onChange={e=>setBody(e.target.value)} maxLength={1000}
        placeholder={replyTo?"Write your reply…":"Share a respectful reflection…"} style={{flex:"1 1 230px",padding:12,borderRadius:10,border:"1px solid #b99c5588",background:"var(--bg,#080d09)",color:"var(--text,white)"}}/>
      <ExpressionKeyboard onInsert={text=>setBody(prev=>(prev?prev+" ":"")+text)}/>
      <button type="submit" disabled={saving||!body.trim()} style={{padding:"11px 18px",borderRadius:10,border:0,background:"#b99c55",color:"#111",fontWeight:700}}>{saving?"Posting…":replyTo?"Post reply":"Post"}</button>
    </form>:<p style={{fontSize:13}}><Link href="/auth">Sign in</Link> to join the conversation. Everyone can read comments.</p>}
    <p style={{fontSize:11,opacity:.7}}>Hold a comment on mobile to reply, or tap Reply. Replies nest up to three levels.</p>
    {error&&<p role="status" style={{color:"#dfaa8b",fontSize:12}}>{error}</p>}
    {loading?<p>Loading comments…</p>:comments.length===0?<p style={{opacity:.7,fontSize:13}}>Be the first to share a reflection.</p>:
      <div style={{display:"grid",gap:10,marginTop:15}}>{comments.filter(c=>!c.parent_id).map(render)}</div>}
    {effects&&celebrate>0&&<div key={celebrate} className="omScreenCelebration" aria-hidden="true">
      {Array.from({length:22},(_,i)=><span key={i} style={{left:`${(i*47)%100}%`,animationDelay:`${(i%7)*.06}s`}}>{["✨","💚","⭐","🌙","🐦"][i%5]}</span>)}
    </div>}
  </div>;
}
