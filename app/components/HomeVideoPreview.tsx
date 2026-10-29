"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import styles from "./home-video-preview.module.css";
type Clip={id:string;src:string;postId:string;body:string};
export default function HomeVideoPreview(){
 const [clips,setClips]=useState<Clip[]>([]);
 const [authorized,setAuthorized]=useState(false);
 useEffect(()=>{const db=createClient();let alive=true;void db.auth.getUser().then(({data})=>{if(alive)setAuthorized(!!data.user)});const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(alive)setAuthorized(!!session?.user)});return()=>{alive=false;subscription.unsubscribe()}},[]);
 const [active,setActive]=useState(0);
 const [loading,setLoading]=useState(true);
 const track=useRef<HTMLDivElement>(null);
 const [paused,setPaused]=useState(false);
 const [interacting,setInteracting]=useState(false);
 useEffect(()=>{if(!authorized){setClips([]);return}let alive=true;(async()=>{try{
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
 }catch{}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[authorized]);
 useEffect(()=>{const root=track.current;if(!root||clips.length<2||paused||interacting||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let frame=0;let last=0;const tick=(now:number)=>{if(!document.hidden){if(last){root.scrollLeft+=Math.min((now-last)*0.013,1.2);const half=root.scrollWidth/2;if(half>0&&root.scrollLeft>=half)root.scrollLeft-=half;}last=now;}else last=0;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[clips,paused,interacting]);
 const onScroll=()=>{const root=track.current;if(!root||!clips.length)return;const width=root.scrollWidth/(clips.length*2);if(width>0)setActive(Math.floor((root.scrollLeft+width*.5)/width)%clips.length)};
 const stopInteraction=()=>{setInteracting(false)};
 if(!authorized)return <div className={styles.root}><header><strong>COMMUNITY VIDEOS</strong></header><div className={styles.empty}>Sign in to watch videos. <Link href="/login">Sign In / Sign Up ↗</Link></div></div>;
 return <div className={styles.root}><header><strong>COMMUNITY VIDEOS</strong><span>{clips.length?active+1+" / "+clips.length:"1MUSLIM"}</span></header>
 {clips.length?<div className={styles.carouselWrap}><div className={styles.track} ref={track} onScroll={onScroll} onTouchStart={()=>setInteracting(true)} onTouchEnd={stopInteraction} onTouchCancel={stopInteraction} onPointerDown={()=>setInteracting(true)} onPointerUp={stopInteraction} onPointerCancel={stopInteraction} aria-label="Community video carousel">{[...clips,...clips].map((clip,i)=><Link className={styles.tile} href="/videos" key={clip.id+"-"+i} aria-label={"Open videos, preview "+(i%clips.length+1)}><video src={clip.src} muted autoPlay loop playsInline preload={i<3?"metadata":"none"} aria-hidden="true"/><span className={styles.tileOverlay}>Watch videos ↗</span></Link>)}</div><div className={styles.controls}><span>{active+1} / {clips.length}</span><button type="button" onClick={()=>setPaused(p=>!p)} aria-label={paused?"Resume carousel":"Pause carousel"}>{paused?"▶":"Ⅱ"}</button><Link href="/videos">Open Videos ↗</Link></div></div>:<div className={styles.empty}>{loading?"Loading community videos…":"No community videos yet."}<Link href="/videos">Explore Videos ↗</Link></div>}
 </div>
}
