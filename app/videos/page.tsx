"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import {createClient} from "../../utils/supabase/client";
type Clip={id:string;postId:string;userId:string;body:string;src:string;created:string};
export default function HudHudVideos(){
 const [clips,setClips]=useState<Clip[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [active,setActive]=useState(0),[muted,setMuted]=useState(true);
 const container=useRef<HTMLDivElement>(null),videos=useRef<Record<string,HTMLVideoElement|null>>({});
 useEffect(()=>{let alive=true;const load=async()=>{const db=createClient();try{
  const {data:media,error:me}=await db.from("post_media").select("id,post_id,user_id,storage_path,created_at").ilike("mime_type","video/%").order("created_at",{ascending:false}).limit(100);
  if(me)throw me;
  const rows=media||[];const ids=[...new Set(rows.map(m=>m.post_id))];
  if(!ids.length){if(alive)setClips([]);return}
  const {data:posts,error:pe}=await db.from("posts").select("id,user_id,body").in("id",ids);if(pe)throw pe;
  const byId=new Map((posts||[]).map(p=>[p.id,p]));
  const valid=rows.filter(m=>{const post=byId.get(m.post_id);return post&&post.user_id===m.user_id});
  const paths=valid.map(m=>m.storage_path);
  const {data:signed,error:se}=await db.storage.from("community-media").createSignedUrls(paths,3600);
  if(se)throw se;
  const result=valid.flatMap((m,i)=>{const post=byId.get(m.post_id);const url=signed?.[i]?.signedUrl;return post&&url?[{id:m.id,postId:m.post_id,userId:m.user_id,body:post.body||"",src:url,created:m.created_at}]:[]});
  if(alive)setClips(result);
 }catch(e){if(alive)setError(e instanceof Error?e.message:"Video feed is unavailable.")}finally{if(alive)setLoading(false)}};
 void load();return()=>{alive=false}},[]);
 useEffect(()=>{const root=container.current;if(!root||!clips.length)return;const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&e.intersectionRatio>=.65){const i=Number((e.target as HTMLElement).dataset.index);setActive(i)}}},{root,threshold:[.65]});root.querySelectorAll("[data-index]").forEach(el=>observer.observe(el));return()=>observer.disconnect()},[clips]);
 useEffect(()=>{for(const [id,video] of Object.entries(videos.current)){if(!video)continue;const selected=clips[active]?.id===id;if(selected){video.muted=muted;void video.play().catch(()=>{})}else{video.pause();video.currentTime=0}}},[active,clips,muted]);
 useEffect(()=>{const onVisibility=()=>{const video=videos.current[clips[active]?.id];if(!video)return;if(document.hidden)video.pause();else void video.play().catch(()=>{})};document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[active,clips]);
 const jump=(direction:number)=>{const next=Math.max(0,Math.min(clips.length-1,active+direction));container.current?.querySelectorAll<HTMLElement>("[data-index]")[next]?.scrollIntoView({behavior:"smooth",block:"start"})};
 return <main className="hh-reels"><SiteNav/><header className="hh-reels-head"><Link href="/community">← Community</Link><strong><img src="/assets/hudhud-logo.PNG" alt="" /> 1Muslim · Videos</strong><Link href="/streaming/library">＋ Post video</Link></header>
 <div className="hh-reels-track" ref={container} aria-label="User video posts">{loading?<div className="hh-reels-empty">Loading community videos…</div>:error?<div className="hh-reels-empty" role="alert">{error}</div>:!clips.length?<div className="hh-reels-empty"><h2>No video posts yet</h2><p>Videos uploaded by members will appear here.</p><Link href="/streaming/library">Upload a video →</Link></div>:clips.map((clip,i)=><section className="hh-reel" data-index={i} key={clip.id} aria-label={`Video ${i+1} of ${clips.length}`}>
  <video ref={el=>{videos.current[clip.id]=el}} src={clip.src} playsInline loop muted={muted} preload={Math.abs(i-active)<=1?"metadata":"none"} onClick={e=>{const v=e.currentTarget;if(v.paused)void v.play();else v.pause()}} />
  <div className="hh-reel-shade"/>
  <div className="hh-reel-caption"><Link href={`/profile/${clip.userId}`}>@ View creator ↗</Link><p>{clip.body}</p><small>{i+1} / {clips.length} · Swipe up for next</small></div>
  <div className="hh-reel-actions"><button type="button" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Unmute":"Mute"}>{muted?"🔇":"🔊"}</button><Link href={`/posts/${clip.postId}`} aria-label="Open post">💬</Link><button type="button" onClick={()=>{if(navigator.share)void navigator.share({url:location.origin+"/posts/"+clip.postId,title:"1Muslim video"}).catch(()=>{});else void navigator.clipboard?.writeText(location.origin+"/posts/"+clip.postId)}} aria-label="Share video">↗</button><button type="button" onClick={()=>jump(-1)} aria-label="Previous video">↑</button><button type="button" onClick={()=>jump(1)} aria-label="Next video">↓</button></div>
 </section>)}</div>
 <style jsx>{`.hh-reels{background:#030908;color:#fff;min-height:100dvh}.hh-reels-head{position:fixed;top:0;left:0;right:0;z-index:40;height:58px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 16px;background:#071c17b8;backdrop-filter:blur(15px);border-bottom:1px solid #a4ffe42b}.hh-reels-head :global(a){font-size:12px;color:#d7ffec;text-decoration:none}.hh-reels-head strong{display:flex;align-items:center;gap:8px;font-size:13px}.hh-reels-head img{width:30px;height:30px;object-fit:contain}.hh-reels-track{height:100dvh;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior-y:contain;scrollbar-width:none}.hh-reels-track::-webkit-scrollbar{display:none}.hh-reel{height:100dvh;scroll-snap-align:start;scroll-snap-stop:always;position:relative;display:grid;place-items:center;background:#000}.hh-reel video{height:100%;width:100%;object-fit:contain;max-width:680px}.hh-reel-shade{position:absolute;inset:0;background:linear-gradient(transparent 60%,#000a);pointer-events:none}.hh-reel-caption{position:absolute;bottom:calc(110px + env(safe-area-inset-bottom));left:20px;right:95px;z-index:2;text-shadow:0 2px 9px #000}.hh-reel-caption :global(a){color:#baffd7;text-decoration:none;font-weight:700;font-size:13px}.hh-reel-caption p{font-size:14px;line-height:1.45;max-height:5.8em;overflow:hidden}.hh-reel-caption small{font-size:11px;color:#c5e5d3}.hh-reel-actions{position:absolute;right:14px;bottom:calc(120px + env(safe-area-inset-bottom));z-index:3;display:grid;gap:12px}.hh-reel-actions button,.hh-reel-actions :global(a){display:grid;place-items:center;width:43px;height:43px;border:1px solid #ffffff50;border-radius:50%;background:#123d34a8;color:#fff;font-size:19px;text-decoration:none;backdrop-filter:blur(10px);cursor:pointer}.hh-reels-empty{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:30px}.hh-reels-empty :global(a){color:#adffda}@media(min-width:700px){.hh-reel video{border-left:1px solid #ffffff22;border-right:1px solid #ffffff22}}`}</style>
 </main>;
}
