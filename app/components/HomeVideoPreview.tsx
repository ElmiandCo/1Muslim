"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import styles from "./home-video-preview.module.css";
type Clip={id:string;src:string;postId:string;body:string};
export default function HomeVideoPreview(){
 const [clips,setClips]=useState<Clip[]>([]);
 const [active,setActive]=useState(0);
 const [loading,setLoading]=useState(true);
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{let alive=true;(async()=>{try{
 const db=createClient();
 const {data:media,error}=await db.from("post_media").select("id,post_id,user_id,storage_path,created_at").ilike("mime_type","video/%").order("created_at",{ascending:false}).limit(12);
 if(error)throw error;
 const rows=media||[];if(!rows.length)return;
 const {data:posts}=await db.from("posts").select("id,user_id,body").in("id",[...new Set(rows.map(x=>x.post_id))]);
 const postMap=new Map((posts||[]).map(x=>[x.id,x]));
 const valid=rows.filter(x=>postMap.get(x.post_id)?.user_id===x.user_id);
 if(!valid.length)return;
 const {data:urls}=await db.storage.from("community-media").createSignedUrls(valid.map(x=>x.storage_path),3600);
 if(alive)setClips(valid.flatMap((x,i)=>urls?.[i]?.signedUrl?[{id:x.id,postId:x.post_id,body:postMap.get(x.post_id)?.body||"",src:urls[i].signedUrl}]:[]));
 }catch{}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[]);
 useEffect(()=>{const el=video.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting&&!document.hidden){void el.play().catch(()=>{})}else el.pause()},{threshold:.3});observer.observe(el);const onVisibility=()=>{if(document.hidden)el.pause();else void el.play().catch(()=>{})};document.addEventListener("visibilitychange",onVisibility);return()=>{observer.disconnect();document.removeEventListener("visibilitychange");el.pause()}},[active,clips]);
 return <div className={styles.root}><header><strong>COMMUNITY VIDEOS</strong><span>{clips.length?active+1+" / "+clips.length:"1MUSLIM"}</span></header>
 {clips.length?<div className={styles.player}><video key={clips[active].id} ref={video} src={clips[active].src} muted autoPlay loop playsInline preload="metadata" aria-label="Community video preview"/><div className={styles.controls}><button type="button" onClick={()=>setActive(i=>(i+clips.length-1)%clips.length)} aria-label="Previous video">‹</button><Link href={"/posts/"+clips[active].postId}>Open video ↗</Link><button type="button" onClick={()=>setActive(i=>(i+1)%clips.length)} aria-label="Next video">›</button></div></div>:<div className={styles.empty}>{loading?"Loading community videos…":"No community videos yet."}<Link href="/videos">Explore Videos ↗</Link></div>}
 </div>
}
