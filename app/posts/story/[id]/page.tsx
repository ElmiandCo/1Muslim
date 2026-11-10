"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {cleanPostBody} from "../../../lib/cleanPostBody";
import {useParams} from "next/navigation";
import styles from "../../posts-magazine.module.css";
import UnifiedPostMedia from "../../../components/UnifiedPostMedia";
type Post={id:string;body:string;author_name:string;author_handle:string;created_at:string;media_url:string|null;media_type:string|null};
const yt=(s:string)=>s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/)?.[1];
export default function MagazineStory(){
 const params=useParams(),id=String(params.id||"");const [post,setPost]=useState<Post|null>(null),[loading,setLoading]=useState(true),[imageOpen,setImageOpen]=useState(false);
 useEffect(()=>{let active=true;void fetch("/api/community-posts",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active)setPost((d.posts||[]).find((p:Post)=>p.id===id)||null)}).catch(()=>{}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 const video=post?yt(post.body):null;
 const body=post?cleanPostBody(post.body).replace(/https?:\/\/\S+/g,"").trim():"";
 const words=body.split(/\s+/).filter(Boolean);const headline=words.slice(0,Math.min(5,words.length)).join(" ");const remainder=words.slice(5).join(" ");
 return <main className={styles.page}><header className={styles.top}><Link className={styles.brand} href="/posts">1MUSLIM <span>POSTS.</span></Link><nav><Link href="/posts">← THE COLLECTION</Link><Link href="/community">COMMUNITY ↗</Link></nav></header>{loading?<div className={styles.status}>OPENING THE STORY…</div>:!post?<div className={styles.status}>STORY UNAVAILABLE · <Link href="/posts">BACK TO POSTS</Link></div>:<article className={styles.socialStory}>
 <div className={styles.socialStoryEdition}><span>THE PEOPLE'S EDITION</span><span>{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span></div>
 <div className={styles.socialStoryHeader}><div className={styles.socialAvatar} aria-hidden="true">{(post.author_name||"M").trim().slice(0,1).toUpperCase()}</div><div className={styles.socialIdentity}><strong>{post.author_name}</strong><span>{post.author_handle} · {new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div><Link href="/community" className={styles.socialCommunityBadge}>1M · COMMUNITY ↗</Link></div>
 {post.media_url&&post.media_type?.startsWith("image/")?<button type="button" className={styles.socialImageButton} onClick={()=>setImageOpen(true)} aria-label="Expand post image"><img className={styles.socialStoryImage} src={post.media_url} alt="Post media" loading="eager" fetchPriority="high"/><span className={styles.socialImageHint}>⤢ Expand image</span></button>:null}
 {body&&<div className={styles.socialPostCopy}><p className={styles.socialEditorialTitle}><strong>{headline}</strong>{remainder&&<><br/><em>{remainder}</em></>}</p></div>}
 {imageOpen&&post.media_url&&<div className={styles.socialLightbox} role="dialog" aria-modal="true" aria-label="Expanded post image" onClick={()=>setImageOpen(false)}><button type="button" aria-label="Close expanded image" onClick={()=>setImageOpen(false)}>✕</button><img src={post.media_url} alt="Expanded post media" onClick={e=>e.stopPropagation()}/></div>}
 <div className={styles.socialEngagement}><UnifiedPostMedia postId={post.id} mediaUrl={post.media_url} mediaType={post.media_type} youtubeId={video}/></div>
 <div className={styles.socialStoryFooter}><Link href="/posts">← MORE POSTS</Link><Link href="/community">EXPLORE COMMUNITY ↗</Link></div></article>}</main>;
}
