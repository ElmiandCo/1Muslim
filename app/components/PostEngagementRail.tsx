"use client";
import {useCallback,useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import styles from "./PostEngagementRail.module.css";
type Comment={id:string;body:string;created_at:string};
export default function PostEngagementRail({postId,share}:{postId:string;share:()=>void}){
 const [likes,setLikes]=useState(0),[comments,setComments]=useState(0),[liked,setLiked]=useState(false),[saved,setSaved]=useState(false),[open,setOpen]=useState(false),[items,setItems]=useState<Comment[]>([]),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const db=createClient();
 const notify=(msg:string)=>{setNotice(msg);window.setTimeout(()=>setNotice(""),2600)};
 const refresh=useCallback(async()=>{
  const [l,c,u]=await Promise.all([db.from("post_likes").select("user_id",{count:"exact",head:true}).eq("post_id",postId),db.from("post_comments").select("id",{count:"exact",head:true}).eq("post_id",postId),db.auth.getUser()]);
  if(!l.error)setLikes(l.count||0);if(!c.error)setComments(c.count||0);
  if(u.data.user){const [mine,book]=await Promise.all([db.from("post_likes").select("post_id").eq("post_id",postId).eq("user_id",u.data.user.id).maybeSingle(),db.from("post_saves").select("post_id").eq("post_id",postId).eq("user_id",u.data.user.id).maybeSingle()]);if(!mine.error)setLiked(!!mine.data);if(!book.error)setSaved(!!book.data)}
 },[postId]);
 useEffect(()=>{void refresh()},[refresh]);
 const toggle=async(type:"like"|"save")=>{
  if(busy)return;const {data:{user}}=await db.auth.getUser();if(!user){notify("Sign in to interact with posts");return}
  setBusy(true);const isLike=type==="like",active=isLike?liked:saved,table=isLike?"post_likes":"post_saves";
  if(isLike){setLiked(!active);setLikes(n=>Math.max(0,n+(active?-1:1)))}else setSaved(!active);
  const result=active?await db.from(table).delete().eq("post_id",postId).eq("user_id",user.id):await db.from(table).insert({post_id:postId,user_id:user.id});
  if(result.error){if(isLike){setLiked(active);setLikes(n=>Math.max(0,n+(active?1:-1)))}else setSaved(active);notify("Unable to update. Please try again.")}
  else if(!isLike)notify(active?"Removed from saved posts":"Saved to Library");
  setBusy(false);
 };
 const openComments=async()=>{setOpen(true);const {data,error}=await db.from("post_comments").select("id,body,created_at").eq("post_id",postId).order("created_at",{ascending:false}).limit(100);if(!error)setItems(data||[])};
 const submit=async()=>{if(!draft.trim()||busy)return;const {data:{user}}=await db.auth.getUser();if(!user){notify("Sign in to comment");return}setBusy(true);const {error}=await db.from("post_comments").insert({post_id:postId,user_id:user.id,body:draft.trim()});if(error)notify("Unable to post comment");else{setDraft("");setComments(n=>n+1);void openComments()}setBusy(false)};
 return <><aside className={styles.rail} aria-label="Post engagement">
  <button aria-label={liked?"Unlike post":"Like post"} aria-pressed={liked} onClick={()=>void toggle("like")} className={liked?styles.active:""}><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>{likes}</span></button>
  <button aria-label="Open comments" onClick={()=>void openComments()}><svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.8-5.5A8.5 8.5 0 1 1 21 11.5Z"/></svg><span>{comments}</span></button>
  <button aria-label="Share post" onClick={share}><svg viewBox="0 0 24 24"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 14v6h14v-6"/></svg><span>Share</span></button>
  <button aria-label={saved?"Remove saved post":"Save post"} aria-pressed={saved} onClick={()=>void toggle("save")} className={saved?styles.bookmarked:""}><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg><span>{saved?"Saved":"Save"}</span></button>
 </aside>{notice&&<div role="status" className={styles.toast}>{notice}</div>}
 {open&&<div className={styles.scrim} onClick={()=>setOpen(false)}><section className={styles.drawer} role="dialog" aria-modal="true" aria-label="Post comments" onClick={e=>e.stopPropagation()}><header><strong>{comments} comments</strong><button aria-label="Close comments" onClick={()=>setOpen(false)}>×</button></header><div className={styles.list}>{items.length?items.map(x=><article key={x.id}><p>{x.body}</p><small>{new Date(x.created_at).toLocaleDateString()}</small></article>):<p>Be the first to join the conversation.</p>}</div><form onSubmit={e=>{e.preventDefault();void submit()}}><input aria-label="Write a comment" placeholder="Add a comment…" value={draft} onChange={e=>setDraft(e.target.value)}/><button disabled={!draft.trim()||busy}>Post</button></form></section></div>}</>;
}
