"use client";
import Link from "next/link";
import Image from "next/image";
import type {ReactNode} from "react";
import styles from "./PostViewer.module.css";
export type ViewerPost={id:string;user_id:string;body:string;created_at:string};
export type ViewerMedia={id:string;url:string;mime_type:string;file_name:string|null};
export type ViewerAuthor={display_name:string|null;username:string|null;avatar_url:string|null};
export default function PostViewer({post,author,media=[],actions,share}:{post:ViewerPost;author:ViewerAuthor|null;media?:ViewerMedia[];actions?:ReactNode;share:()=>void}){
 const name=author?.display_name||author?.username||"1Muslim member";
 return <article className={styles.viewer}>
  <header className={styles.author}>
   <Link href={"/profile/"+post.user_id} className={styles.identity}>
    <span className={styles.avatar}>{author?.avatar_url?<Image src={author.avatar_url} alt="" fill unoptimized sizes="52px"/>:<span aria-hidden="true">✧</span>}</span>
    <span className={styles.names}><strong>{name}</strong><small>{author?.username?"@"+author.username+" · ":""}{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</small></span>
   </Link>
   <Link className={styles.profileLink} href={"/profile/"+post.user_id} aria-label="View creator profile">↗</Link>
  </header>
  <div className={styles.content}>{media.length>0&&<div className={styles.mediaGallery}>{media.map(item=>item.mime_type.startsWith("video/")?<video key={item.id} src={item.url} className={styles.media} controls playsInline preload="metadata" aria-label={item.file_name||"Post video"}/>:item.mime_type.startsWith("image/")?<img key={item.id} src={item.url} alt={item.file_name||"Post image"} className={styles.media} loading="lazy"/>:null)}</div>}{post.body?.trim()&&<p className={styles.caption}>{post.body}</p>}</div>
  <footer className={styles.actions}><button type="button" onClick={share}>↗ <span>Share</span></button>{actions}</footer>
 </article>
}
