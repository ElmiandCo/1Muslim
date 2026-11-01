"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import CommunityPostPresentation,{type CommunityPostMedia} from "./CommunityPostPresentation";
import ProfileAvatar from "./ProfileAvatar";
import {extractVerse} from "../../lib/community-post-content";
import styles from "./CommunityMediaFeed.module.css";

type MediaRow={id:string;post_id:string;user_id:string;storage_path:string;file_name:string|null;mime_type:string;created_at:string};
type MediaPost={id:string;userId:string;body:string;created:string;author:string;handle:string;media:CommunityPostMedia[];avatarGender:string|null;avatarPackage:string|null;avatarConfig:Record<string,unknown>|null;gender:string|null;accent:string|null};

export default function CommunityMediaFeed(){
 const [posts,setPosts]=useState<MediaPost[]>([]);
 const [visible,setVisible]=useState(6);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let alive=true;
  const load=async()=>{
   try{
    const db=createClient();
    const {data:rows,error:mediaError}=await db.from("post_media").select("id,post_id,user_id,storage_path,file_name,mime_type,created_at").order("created_at",{ascending:false}).limit(100);
    if(mediaError)throw mediaError;
    const media=((rows||[]) as MediaRow[]).filter(m=>m.mime_type?.startsWith("video/")||m.mime_type?.startsWith("image/"));
    if(!media.length){if(alive){setPosts([]);setError("")}return}
    const ids=[...new Set(media.map(m=>m.post_id))];
    const {data:parents,error:parentError}=await db.from("posts").select("id,user_id,body,created_at").in("id",ids);
    if(parentError)throw parentError;
    const byId=new Map((parents||[]).map(p=>[p.id,p]));
    const valid=media.filter(m=>byId.get(m.post_id)?.user_id===m.user_id);
    if(!valid.length){if(alive){setPosts([]);setError("")}return}
    const authorIds=[...new Set(valid.map(m=>m.user_id))];
    const [{data:signed,error:signError},{data:authors}]=await Promise.all([
     db.storage.from("community-media").createSignedUrls(valid.map(m=>m.storage_path),3600),
     db.from("profiles").select("id,display_name,username,avatar_gender,avatar_package,avatar_config,gender,profile_accent").in("id",authorIds)
    ]);
    if(signError)throw signError;
    const authorById=new Map((authors||[]).map(p=>[p.id,p]));
    const grouped=new Map<string,MediaPost>();
    valid.forEach((item,index)=>{
     const url=signed?.[index]?.signedUrl;
     const parent=byId.get(item.post_id);
     if(!url||!parent)return;
     let post=grouped.get(parent.id);
     if(!post){
      const author=authorById.get(parent.user_id);
      post={id:parent.id,userId:parent.user_id,body:parent.body||"",created:parent.created_at||item.created_at,author:author?.display_name||author?.username||"Community member",handle:author?.username?"@"+author.username:"@member",media:[],avatarGender:author?.avatar_gender||null,avatarPackage:author?.avatar_package||null,avatarConfig:author?.avatar_config&&typeof author.avatar_config==="object"&&!Array.isArray(author.avatar_config)?author.avatar_config as Record<string,unknown>:null,gender:author?.gender||null,accent:author?.profile_accent||null};
      grouped.set(parent.id,post);
     }
     post.media.push({id:item.id,url,mime_type:item.mime_type,file_name:item.file_name});
    });
    if(alive){setPosts([...grouped.values()].sort((a,b)=>Date.parse(b.created)-Date.parse(a.created)));setError("")}
   }catch{if(alive)setError("Media posts could not be loaded right now.")}
   finally{if(alive)setLoading(false)}
  };
  void load();
  const refresh=()=>{if(document.visibilityState==="visible")void load()};
  window.addEventListener("1muslim:community-post-published",refresh);
  document.addEventListener("visibilitychange",refresh);
  const timer=window.setInterval(refresh,20*60*1000);
  return()=>{alive=false;window.clearInterval(timer);window.removeEventListener("1muslim:community-post-published",refresh);document.removeEventListener("visibilitychange",refresh)};
 },[]);
 const share=async(id:string)=>{
  const url=location.origin+"/posts/"+encodeURIComponent(id);
  try{if(navigator.share)await navigator.share({title:"1Muslim community post",url});else await navigator.clipboard.writeText(url)}catch{}
 };
 if(!posts.length&&!error)return loading?<p className={styles.loading} role="status">Loading photo and video posts…</p>:null;
 return <section className={styles.feed} aria-label="Community photo and video posts">
  <header className={styles.heading}><strong>✦ Photo & video moments</strong><span>{posts.length} posts</span></header>
  {error&&<p role="status" className={styles.error}>{error}</p>}
  {posts.slice(0,visible).map(post=><article className={styles.card} key={post.id}>
   <header className={styles.author}><span className={styles.avatar}><ProfileAvatar name={post.author} gender={post.gender} avatarGender={post.avatarGender} avatarPackage={post.avatarPackage} avatarConfig={post.avatarConfig} accent={post.accent||"emerald"} size="sm" profileId={post.userId}/></span><span className={styles.authorName}><strong>{post.author}</strong><small>{post.handle} · {new Date(post.created).toLocaleDateString()}</small></span><span className={styles.kindBadge}>{extractVerse(post.body)?"۞ Qur’an":post.media.some(m=>m.mime_type.startsWith("video/"))?"▶ Video":"▧ Photos"}</span></header>
   <CommunityPostPresentation body={post.body} media={post.media} compact/>
   <footer className={styles.actions}><Link href={"/posts/"+encodeURIComponent(post.id)}>◯ Open post</Link><button type="button" onClick={()=>void share(post.id)}>↗ Share</button></footer>
  </article>)}
  {visible<posts.length&&<button type="button" className={styles.more} onClick={()=>setVisible(n=>n+6)}>Show more photo & video posts ↓</button>}
 </section>;
}
