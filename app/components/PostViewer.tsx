"use client";
import {cleanPostBody} from "../lib/cleanPostBody";
import Link from "next/link";
import Image from "next/image";
import SmartVideo from "../../lib/SmartVideo";
import {useEffect,useRef,useState} from "react";
import type {ReactNode} from "react";
import PostEngagementRail from "./PostEngagementRail";
import styles from "./PostViewer.module.css";
export type ViewerPost={id:string;user_id:string;body:string;created_at:string};
export type ViewerMedia={id:string;url:string;mime_type:string;file_name:string|null};
export type ViewerAuthor={display_name:string|null;username:string|null;avatar_url:string|null};
export default function PostViewer({post,author,media=[],actions,share}:{post:ViewerPost;author:ViewerAuthor|null;media?:ViewerMedia[];actions?:ReactNode;share:()=>void}){
 const [expanded,setExpanded]=useState(false);
 const [drawerHeight,setDrawerHeight]=useState(0);
 const viewerRef=useRef<HTMLElement>(null);
 const fadeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [paused,setPaused]=useState(true);
 const [muted,setMuted]=useState(true);
 const [showPlayback,setShowPlayback]=useState(false);
 const video=()=>viewerRef.current?.querySelector("video")||null;
 const flashPlayback=()=>{setShowPlayback(true);if(fadeTimer.current)clearTimeout(fadeTimer.current);fadeTimer.current=setTimeout(()=>setShowPlayback(false),750)};
 const togglePlayback=()=>{const node=video();if(!node)return;if(node.paused){void node.play().catch(()=>setPaused(true))}else node.pause();setPaused(node.paused);flashPlayback()};
 const toggleSound=()=>{const node=video();if(!node)return;node.muted=!node.muted;setMuted(node.muted)};
 useEffect(()=>()=>{if(fadeTimer.current)clearTimeout(fadeTimer.current)},[]);

 useEffect(()=>{if(!expanded)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setExpanded(false)};window.addEventListener("keydown",key);return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",key)}},[expanded]);
 const name=author?.display_name||author?.username||"1Muslim member";
 return <article ref={viewerRef} className={`${styles.viewer} ${expanded?styles.expanded:""}`} style={expanded?({"--comments-height":`${drawerHeight}px`} as React.CSSProperties):undefined}>
  <header className={styles.author}>
   <Link href={"/profile/"+post.user_id} className={styles.identity}>
    <span className={styles.avatar}>{author?.avatar_url?<Image src={author.avatar_url} alt="" fill unoptimized sizes="52px"/>:<span aria-hidden="true">✧</span>}</span>
    <span className={styles.names}><strong>{name}</strong><small>{author?.username?"@"+author.username+" · ":""}{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</small></span>
   </Link>
   <Link className={styles.profileLink} href={"/profile/"+post.user_id} aria-label="View creator profile">↗</Link>
  </header>
  <button type="button" className={styles.expandToggle} onClick={()=>{setExpanded(x=>!x);setDrawerHeight(0)}} aria-label={expanded?"Exit full screen":"View post full screen"}>{expanded?"✕":"⛶"}</button>
  <div className={styles.content}>{media.length>0&&<div className={styles.mediaGallery}>{media.map(item=>item.mime_type.startsWith("video/")?<SmartVideo key={item.id} mediaId={item.id} src={item.url} className={styles.media} controls={false} muted={muted} playsInline onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)} onClick={togglePlayback} aria-label={item.file_name||"Post video"}/>:item.mime_type.startsWith("image/")?<img key={item.id} src={item.url} alt={item.file_name||"Post image"} className={styles.media} loading="lazy"/>:null)}</div>}{post.body?.trim()&&<p className={styles.caption}>{cleanPostBody(post.body)}</p>}</div>
  {expanded&&media.some(item=>item.mime_type.startsWith("video/"))&&<>
   <button type="button" className={styles.soundToggle} aria-label={muted?"Unmute video":"Mute video"} aria-pressed={!muted} onClick={toggleSound}>{muted?"🔇":"🔊"}</button>
   <button type="button" className={`${styles.playbackOverlay} ${showPlayback?styles.playbackVisible:""}`} aria-label={paused?"Play video":"Pause video"} onClick={togglePlayback} aria-hidden={!showPlayback} tabIndex={showPlayback?0:-1}>{paused?"▶":"Ⅱ"}</button>
  </>}
  <PostEngagementRail postId={post.id} share={share} fullscreen={expanded} onDrawerHeightChange={setDrawerHeight}/><footer className={styles.actions}>{actions}</footer>
 </article>
}
