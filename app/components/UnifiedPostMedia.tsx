"use client";
import OneMuslimVideo from "./OneMuslimVideo";
import {useCallback,useEffect,useState,type FormEvent} from "react";
type Comment={id:string;body:string;name:string;created_at:string};
type Props={postId:string;mediaUrl?:string|null;mediaType?:string|null;youtubeId?:string|null};
export default function UnifiedPostMedia({postId,mediaUrl,mediaType,youtubeId}:Props){
 const [comments,setComments]=useState<Comment[]>([]),[open,setOpen]=useState(false),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[float,setFloat]=useState<Comment|null>(null);
 const load=useCallback(async()=>{try{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(postId),{cache:"no-store"});if(r.ok){const j=await r.json();setComments(j.comments||[])}}catch{}},[postId]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),15000);return()=>clearInterval(timer)},[load]);
 useEffect(()=>{if(!float)return;const t=setTimeout(()=>setFloat(null),4000);return()=>clearTimeout(t)},[float]);
 async function send(e:FormEvent){e.preventDefault();if(!draft.trim()||busy)return;setBusy(true);setError("");try{const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId,body:draft.trim()})});const j=await r.json();if(!r.ok)throw Error(j.error||"Comment failed");setDraft("");setFloat(j.comment);await load()}catch(e){setError(e instanceof Error?e.message:"Comment failed")}finally{setBusy(false)}}
 async function share(){const url=window.location.href;try{if(navigator.share)await navigator.share({url});else await navigator.clipboard.writeText(url)}catch{}}
 const hasVideo=!!youtubeId||!!(mediaUrl&&mediaType?.startsWith("video/"));
 return <section className="unifiedPostMedia" aria-label="Post media and conversation">
 {hasVideo&&<OneMuslimVideo videoKey={youtubeId?"youtube:"+youtubeId:"public-post:"+postId} src={mediaUrl||""} youtubeId={youtubeId} title="Public Post video"/>}
 <div className="unifiedActions"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>♡ &nbsp; 💬 {comments.length} {open?"Hide discussion":"Discuss"}</button><button type="button" onClick={()=>void share()}>↗ Share</button></div>
 {open&&<div className="unifiedDiscussion"><div className="unifiedComments">{comments.length?comments.map(c=><div key={c.id} className="unifiedComment"><b>{c.name}</b><p>{c.body}</p></div>):<p>Start the conversation.</p>}</div><form onSubmit={e=>void send(e)}><input aria-label="Write a comment" placeholder="Add to the conversation…" value={draft} maxLength={1500} onChange={e=>setDraft(e.target.value)}/><button disabled={busy||!draft.trim()}>{busy?"Sending…":"Send ↗"}</button></form>{error&&<p role="alert">{error}</p>}</div>}
 <style jsx>{`
 .unifiedPostMedia{--ink:currentColor;--line:color-mix(in srgb,currentColor 30%,transparent);width:100%;color:inherit;font-family:inherit;background:transparent;border:0;box-shadow:none;margin:32px 0}
 .unifiedStage{position:relative;aspect-ratio:16/9;width:100%;background:#111;overflow:hidden}
 .unifiedStage iframe,.unifiedStage video{width:100%;height:100%;border:0;display:block;object-fit:contain}
 .unifiedActions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-block:1px solid var(--line)}
 button{font:inherit;cursor:pointer;color:inherit}.unifiedActions button{background:none;border:0;padding:8px 2px;font-size:clamp(12px,2vw,15px);letter-spacing:.04em}
 .unifiedDiscussion{padding:16px 0 8px;animation:appear .3s ease}.unifiedComments{max-height:320px;overflow:auto}.unifiedComment{border-bottom:1px solid var(--line);padding:12px 0}.unifiedComment b{font-size:12px}.unifiedComment p{margin:5px 0;overflow-wrap:anywhere;line-height:1.5}.unifiedDiscussion form{display:flex;gap:8px;margin-top:15px}.unifiedDiscussion input{min-width:0;flex:1;border:1px solid var(--line);border-radius:0;padding:12px;background:transparent;color:inherit;font:inherit}.unifiedDiscussion form button{background:transparent;border:1px solid var(--line);padding:8px 14px}
 .unifiedFloat{position:absolute;left:12%;right:12%;bottom:12%;padding:12px 16px;background:#1119;color:white;backdrop-filter:blur(9px);border:1px solid #ffffff40;display:grid;gap:5px;pointer-events:none;animation:float 4s ease both;overflow-wrap:anywhere}
 @keyframes float{0%{opacity:0;transform:translateY(45px)}25%,70%{opacity:1;transform:translateY(-15px)}100%{opacity:0;transform:translateY(-70px)}}@keyframes appear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
 @media(prefers-reduced-motion:reduce){.unifiedFloat,.unifiedDiscussion{animation:none}}
 `}</style></section>
}
