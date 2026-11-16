import {youtubeVideoId} from "./YouTubePostLink";
"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import "./ProfileCinematicPosts.css";

type Post={id:string;author_id:string;body:string;media_url:string|null;media_type:string|null;thumbnail_url?:string|null;created_at:string};
export default function ProfileCinematicPosts({profileId}:{profileId:string}){
 const [posts,setPosts]=useState<Post[]>([]);
 const [loading,setLoading]=useState(true);
 const [active,setActive]=useState<string|null>(null);
 const nodes=useRef(new Map<string,HTMLElement>());
 useEffect(()=>{let mounted=true;setLoading(true);fetch("/api/community-posts",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Posts unavailable");return r.json()}).then(data=>{if(mounted)setPosts((Array.isArray(data.posts)?data.posts:[]).filter((p:Post)=>p.author_id===profileId))}).catch(()=>{if(mounted)setPosts([])}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[profileId]);
 useEffect(()=>{
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
   if(visible.length)setActive(visible[0].target.getAttribute("data-post-id"));
   else setActive(current=>current&&nodes.current.get(current)?.getBoundingClientRect().bottom!>0?current:null);
  },{threshold:[0,.25,.5,.75,1],rootMargin:"-12% 0px -25% 0px"});
  nodes.current.forEach(node=>observer.observe(node));
  return()=>observer.disconnect();
 },[posts]);
 return <section className="profileCinematicPosts" aria-label="Member posts">
  <div className="profileCinematicHeading"><h2>Posts</h2><span>{posts.length} shared</span></div>
  {loading?<p className="profileCinematicEmpty">Loading posts…</p>:posts.length===0?<p className="profileCinematicEmpty">No posts to show yet.</p>:
  <div className="profileCinematicGrid">{posts.map(p=>{
   const isVideo=p.media_type?.startsWith("video/")||/\.(mp4|webm|mov)(\?|$)/i.test(p.media_url||"");
   const isImage=!!p.media_url&&(p.media_type?.startsWith("image/")||/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(p.media_url));
   const youtubeId=youtubeVideoId(p.body||"");
   const playing=active===p.id;
   return <Link key={p.id} href={`/posts/story/${encodeURIComponent(p.id)}`} className={`profileCinematicTile ${playing?"is-active":""}`} data-post-id={p.id} ref={el=>{if(el)nodes.current.set(p.id,el);else nodes.current.delete(p.id)}} aria-label={`View post: ${(p.body||"Community post").slice(0,90)}`}>
    <div className="profileCinematicVisual">
     {youtubeId&&!p.media_url?<img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="YouTube video thumbnail" loading="lazy"/>:isVideo&&p.media_url?<video src={p.media_url} poster={p.thumbnail_url||undefined} muted playsInline loop autoPlay={playing} preload={playing?"metadata":"none"} ref={el=>{if(!el)return;if(playing){el.play().catch(()=>{});}else el.pause()}}/>:
      isImage?<img src={p.media_url!} alt="" loading="lazy"/>:
      <div className="profileCinematicText"><span>✦</span><p>{(p.body||"Community post").replace(/https?:\/\/\S+/g,"").slice(0,150)}</p></div>}
    </div>
    {(isVideo||youtubeId)&&<span className="profileCinematicPlay" aria-hidden="true">▶</span>}
   </Link>;
  })}</div>}
 </section>;
}
