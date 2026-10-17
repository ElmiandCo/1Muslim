"use client";
import {useEffect,useRef,useState} from "react";
import "./UmmahBubbleCarousel.css";
type Post={id:string;body:string};
export default function UmmahBubbleCarousel({posts}:{posts:Post[]}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[likes,setLikes]=useState<Record<string,boolean>>({});
 const touch=useRef<number|null>(null);
 useEffect(()=>{if(paused||posts.length<2)return;const t=setInterval(()=>setIndex(i=>(i+1)%posts.length),5000);return()=>clearInterval(t)},[paused,posts.length]);
 useEffect(()=>{setIndex(0)},[posts[0]?.id]);
 if(!posts.length)return <span className="ummahBubbleEmpty">Community posts will appear here</span>;
 const count=Math.min(3,posts.length);
 return <span className="ummahBubbleStage" onPointerEnter={()=>setPaused(true)} onPointerLeave={()=>setPaused(false)} onPointerDown={e=>{touch.current=e.clientX;setPaused(true)}} onPointerUp={e=>{if(touch.current!==null){const dx=e.clientX-touch.current;if(Math.abs(dx)>24)setIndex(i=>(i+(dx<0?1:posts.length-1))%posts.length);touch.current=null}setPaused(false)}} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)} aria-label="Swipe community posts; tap a card to like">
 {Array.from({length:count},(_,slot)=>{const post=posts[(index+slot)%posts.length];return <span key={post.id} className={"ummahBubbleCard ummahBubbleSlot"+slot} style={{animationDelay:(slot*-.9)+"s"}} onClick={e=>{e.preventDefault();e.stopPropagation();setLikes(prev=>({...prev,[post.id]:!prev[post.id]}))}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setLikes(prev=>({...prev,[post.id]:!prev[post.id]}))}}} aria-label={likes[post.id]?"Unlike post":"Like post"}><span className="ummahBubbleAvatar" aria-hidden="true">✦</span><span className="ummahBubbleBody">{post.body}</span><span className="ummahBubbleHeart">{likes[post.id]?"♥":"♡"}</span></span>})}
 </span>
}
