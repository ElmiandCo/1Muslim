"use client";
import {useEffect,useRef,useState} from "react";
import "./UmmahBubbleCarousel.css";
import {createClient} from "../../utils/supabase/client";
type Post={id:string;body:string;author_id?:string|null;avatar_url?:string|null;display_name?:string|null};
export default function UmmahBubbleCarousel({posts}:{posts:Post[]}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[likes,setLikes]=useState<Record<string,boolean>>({});
 const touch=useRef<number|null>(null);
 const [busy,setBusy]=useState<Record<string,boolean>>({});
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!active||!user)return;const ids=posts.map(p=>p.id);if(!ids.length)return;const {data,error}=await db.from("ummah_post_likes").select("post_id").eq("user_id",user.id).in("post_id",ids);if(!active)return;if(error){setError("Could not load likes");return}setLikes(Object.fromEntries((data||[]).map(row=>[row.post_id,true])))};void load();return()=>{active=false}},[posts.map(p=>p.id).join(",")]);
 const toggleLike=async(id:string)=>{if(busy[id])return;setError("");const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setError("Sign in to like posts");return}const wasLiked=!!likes[id];setLikes(prev=>({...prev,[id]:!wasLiked}));setBusy(prev=>({...prev,[id]:true}));const result=wasLiked?await db.from("ummah_post_likes").delete().eq("post_id",id).eq("user_id",user.id):await db.from("ummah_post_likes").upsert({post_id:id,user_id:user.id},{onConflict:"post_id,user_id"});if(result.error){setLikes(prev=>({...prev,[id]:wasLiked}));setError("Like could not be saved. Try again.")}setBusy(prev=>({...prev,[id]:false}))};
 useEffect(()=>{if(paused||posts.length<2)return;const t=setInterval(()=>setIndex(i=>(i+1)%posts.length),5000);return()=>clearInterval(t)},[paused,posts.length]);
 useEffect(()=>{setIndex(0)},[posts[0]?.id]);
 if(!posts.length)return <span className="ummahBubbleEmpty">Community posts will appear here</span>;
 const count=Math.min(3,posts.length);
 return <span className="ummahBubbleStage" onPointerEnter={()=>setPaused(true)} onPointerLeave={()=>setPaused(false)} onPointerDown={e=>{touch.current=e.clientX;setPaused(true)}} onPointerUp={e=>{if(touch.current!==null){const dx=e.clientX-touch.current;if(Math.abs(dx)>24)setIndex(i=>(i+(dx<0?1:posts.length-1))%posts.length);touch.current=null}setPaused(false)}} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)} aria-label="Swipe community posts; tap a card to like">
 {Array.from({length:count},(_,slot)=>{const post=posts[(index+slot)%posts.length];return <span key={post.id} className={"ummahBubbleCard ummahBubbleSlot"+slot} style={{animationDelay:(slot*-.9)+"s"}} onClick={e=>{e.preventDefault();e.stopPropagation();void toggleLike(post.id)}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();void toggleLike(post.id)}}} aria-label={likes[post.id]?"Unlike post":"Like post"}><span className="ummahBubbleAvatar" aria-hidden="true">{post.avatar_url?<img src={post.avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>:(post.display_name?.trim()?.[0]?.toUpperCase()||"✦")}</span><span className="ummahBubbleContent"><span className="ummahBubbleAuthor">{post.display_name||"1Muslim member"}</span><span className="ummahBubbleBody">{post.body}</span></span><span className="ummahBubbleHeart">{likes[post.id]?"♥":"♡"}</span></span>})}
 {error&&<small className="ummahBubbleError" role="status">{error}</small>}
 </span>
}
