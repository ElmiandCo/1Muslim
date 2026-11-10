"use client";
import {useEffect,useRef,useState} from "react";
type Comment={id:string;name:string;body:string;parent_id:string|null;avatar_url?:string|null};
export default function FloatingPostComments({postId}:{postId:string}){
 const root=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false);
 const [comments,setComments]=useState<Comment[]>([]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{rootMargin:"100px",threshold:0.05});
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible)return;
  let alive=true;
  const load=async()=>{try{
   const response=await fetch("/api/ummah-comments?postId="+encodeURIComponent(postId),{cache:"no-store"});
   if(!response.ok)return;
   const data=await response.json();
   if(alive)setComments((data.comments||[]).filter((comment:Comment)=>!comment.parent_id&&comment.body).slice(-3));
  }catch{/* Decorative comments must never interrupt feed navigation. */}};
  void load();
  const timer=window.setInterval(()=>{if(!document.hidden)void load()},45000);
  return()=>{alive=false;window.clearInterval(timer)};
 },[postId,visible]);
 return <div ref={root} className="ummah-live-comment-layer" aria-hidden="true">{visible&&comments.map((comment,index)=><div className={"ummah-live-comment ummah-live-comment-"+index} key={comment.id} style={{animationDelay:`${index*1.3}s`}}><span className="ummah-live-comment-avatar">{comment.avatar_url?<img src={comment.avatar_url} alt=""/>:(comment.name||"M").charAt(0).toUpperCase()}</span><span className="ummah-live-comment-copy"><strong>{comment.name||"Member"}</strong><span>{comment.body}</span></span></div>)}</div>;
}