"use client";
import {cleanPostBody} from "../lib/cleanPostBody";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import {useEffect,useRef,useState} from "react";
import "./ProfileCinematicPosts.css";

type Post={id:string;author_id:string;body:string;media_url:string|null;media_type:string|null;thumbnail_url?:string|null;created_at:string;author_name?:string;author_handle?:string;author_avatar_url?:string|null;source?:"community"|"profile"};
export default function ProfileCinematicPosts({profileId,variant="grid",limit,feedMode="own"}:{profileId:string;variant?:"grid"|"recentCards";limit?:number;feedMode?:"own"|"community"}){
 const [posts,setPosts]=useState<Post[]>([]);
 const [loading,setLoading]=useState(true);
 const [isOwner,setIsOwner]=useState(false);
 const [deleting,setDeleting]=useState<string|null>(null);
 const [deleteError,setDeleteError]=useState("");
 useEffect(()=>{let mounted=true;createClient().auth.getUser().then(({data})=>{if(mounted)setIsOwner(data.user?.id===profileId)});return()=>{mounted=false}},[profileId]);
 const deleteOwnPost=async(p:Post)=>{
  if(deleting||!window.confirm("Permanently delete this post? This cannot be undone."))return;
  setDeleting(p.id);setDeleteError("");
  try{
   const db=createClient();const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user)throw Error("Your session expired. Sign in again and retry.");
   if(user.id!==profileId)throw Error("This profile is not linked to your signed-in account.");
   // Resolve the actual source from the database rather than trusting feed metadata.
   // A feed entry may originate from either the legacy or community table.
   let found:{table:"posts"|"community_posts";ownerColumn:"user_id"|"author_id"}|null=null;
   for(const candidate of [{table:"posts" as const,ownerColumn:"user_id" as const},{table:"community_posts" as const,ownerColumn:"author_id" as const}]){
    const {data,error}=await db.from(candidate.table).select("id").eq("id",p.id).eq(candidate.ownerColumn,user.id).maybeSingle();
    if(error)throw Error("Could not verify ownership ("+error.code+"). Please retry.");
    if(data){found=candidate;break;}
   }
   if(!found)throw Error("This post was not found under your account. Refresh the page and check you are signed in as its author.");
   const {data,error}=await db.from(found.table).delete().eq("id",p.id).eq(found.ownerColumn,user.id).select("id").maybeSingle();
   if(error){console.error("Profile post deletion failed",{table:found.table,code:error.code,message:error.message});throw Error("Deletion failed ("+error.code+"): "+error.message);}
   if(!data)throw Error("The post was not deleted. Refresh and retry; if it persists, contact support.");
   setPosts(current=>current.filter(row=>row.id!==p.id));
  }catch(e){setDeleteError(e instanceof Error?e.message:"Could not delete this post.");}
  finally{setDeleting(null)}
 };

 const [active,setActive]=useState<string|null>(null);
 const nodes=useRef(new Map<string,HTMLElement>());
 const carouselRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  let mounted=true;
  setLoading(true);
  const load=async()=>{
   if(feedMode==="community"){
    const discovery=await fetch("/api/community-posts",{cache:"no-store"}).then(r=>r.ok?r.json():null);
    if(!discovery||!Array.isArray(discovery.posts))throw new Error("Community feed unavailable");
    if(mounted){
     const candidates=(discovery.posts as Post[]).filter(p=>p.author_id!==profileId);
     const previousKey="1muslim:profile-ummah-previous";
     let previous:string[]=[];
     try{previous=JSON.parse(sessionStorage.getItem(previousKey)||"[]")}catch{}
     // Favor posts not displayed last time; use the whole available feed, not just the newest four.
     const fresh=candidates.filter(p=>!previous.includes(p.id));
     const pool=fresh.length>=Math.min(limit||4,candidates.length)?fresh:candidates;
     const shuffled=[...pool];
     for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
     const chosen=shuffled.slice(0,limit||4);
     try{sessionStorage.setItem(previousKey,JSON.stringify(chosen.map(p=>p.id)))}catch{}
     setPosts(chosen);
    }
    return;
   }
   const db=createClient();
   // Query by author: the global discovery endpoint may only return its first page.
   const [community,legacy,discovery]=await Promise.all([
    db.from("community_posts").select("id,author_id,body,created_at").eq("author_id",profileId).order("created_at",{ascending:false}).limit(100),
    db.from("posts").select("id,body,created_at").eq("user_id",profileId).order("created_at",{ascending:false}).limit(100),
    fetch("/api/community-posts",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)
   ]);
   const media=new Map<string,Post>((Array.isArray(discovery?.posts)?discovery.posts:[]).filter((p:Post)=>p.author_id===profileId).map((p:Post)=>[p.id,p]));
   const merged=new Map<string,Post>();
   for(const row of community.data||[])merged.set(row.id,{...row,media_url:null,media_type:null,...media.get(row.id),source:"community"});
   for(const row of legacy.data||[])if(!merged.has(row.id))merged.set(row.id,{...row,author_id:profileId,media_url:null,media_type:null,...media.get(row.id),source:"profile"});
   for(const row of media.values())if(!merged.has(row.id))merged.set(row.id,{...row,source:"community"});
   if(mounted)setPosts([...merged.values()].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  };
  void load().catch(()=>{if(mounted)setPosts([])}).finally(()=>{if(mounted)setLoading(false)});
  return()=>{mounted=false};
 },[profileId,feedMode,limit]);
 useEffect(()=>{
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
   if(visible.length)setActive(visible[0].target.getAttribute("data-post-id"));
   else setActive(current=>current&&nodes.current.get(current)?.getBoundingClientRect().bottom!>0?current:null);
  },{threshold:[0,.25,.5,.75,1],rootMargin:"-12% 0px -25% 0px"});
  nodes.current.forEach(node=>observer.observe(node));
  return()=>observer.disconnect();
 },[posts]);
 return <section className={"profileCinematicPosts"+(variant==="recentCards"?" profileRecentCards":"")+(feedMode==="community"?" profileUmmahCarousel":"")} aria-label={feedMode==="community"?"Ummah community discovery":"Member posts"}>
  <div className="profileCinematicHeading"><h2>{feedMode==="community"?"Ummah Discovery":"Posts"}</h2>{feedMode==="community"?<Link href="/posts" className="profileCinematicMore" aria-label="Explore more Ummah community posts">More →</Link>:<span>{posts.length} shared</span>}</div>
  {deleteError&&<p role="alert" className="profileCinematicEmpty">{deleteError}</p>}
  {loading?<div className="profileCinematicGrid profileSkeletonGrid" aria-label="Loading community posts" aria-busy="true">{Array.from({length:variant==="recentCards"?4:6},(_,i)=><div className="profileSkeletonCard" key={i}><div className="profileSkeletonMedia"><span className="profileSkeletonMark" aria-hidden="true">✦ 1M</span></div><div className="profileSkeletonLine"/><div className="profileSkeletonLine short"/></div>)}</div>:posts.length===0?<p className="profileCinematicEmpty">{feedMode==="community"?"No community posts to show yet.":"No posts to show yet."}</p>:
  <div className="profileCinematicGrid" ref={carouselRef}>{(limit?posts.slice(0,limit):posts).map((p,index)=>{
   const isVideo=p.media_type?.startsWith("video/")||/\.(mp4|webm|mov)(\?|$)/i.test(p.media_url||"");
   const isImage=!!p.media_url&&(p.media_type?.startsWith("image/")||/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(p.media_url));
   const playing=active===p.id;
   return <div key={p.id} className="profileCinematicItem"><Link href={`/posts/story/${encodeURIComponent(p.id)}`} className={`profileCinematicTile ${playing?"is-active":""}`} data-post-id={p.id} ref={el=>{if(el)nodes.current.set(p.id,el);else nodes.current.delete(p.id)}} aria-label={`View post: ${(cleanPostBody(p.body)||"Community post").slice(0,90)}`}>
    {feedMode==="community"&&<div className="profileUmmahAuthor"><span className="profileUmmahAvatar">{p.author_avatar_url?<img src={p.author_avatar_url} alt=""/>:(p.author_name||"M").slice(0,1).toUpperCase()}</span><span className="profileUmmahAuthorInfo"><strong>{p.author_name||"Community member"}</strong><small>{p.author_handle||"@member"} · {new Date(p.created_at).toLocaleDateString()}</small></span><span className="profileUmmahOpen" aria-hidden="true">↗</span></div>}
    <div className={"profileCinematicVisual"+((isVideo||isImage)?" premiumMediaPending":"")}>
     {isVideo&&p.media_url?<video src={p.media_url} poster={p.thumbnail_url||undefined} muted playsInline loop autoPlay={playing} preload={playing?"metadata":"none"} onLoadedData={e=>e.currentTarget.parentElement?.classList.add("premiumMediaReady")} onError={e=>e.currentTarget.parentElement?.classList.add("premiumMediaFailed")} ref={el=>{if(!el)return;if(playing){el.play().catch(()=>{});}else el.pause()}}/>:
      isImage?<img src={p.media_url!} alt="" loading={index<2?"eager":"lazy"} fetchPriority={index===0?"high":"auto"} decoding="async" onLoad={e=>e.currentTarget.parentElement?.classList.add("premiumMediaReady")} onError={e=>e.currentTarget.parentElement?.classList.add("premiumMediaFailed")}/>:
      <div className="profileCinematicText"><span>✦</span><p>{(cleanPostBody(p.body)||"Community post").replace(/https?:\/\/\S+/g,"").slice(0,150)}</p></div>}
    </div>
    {variant==="recentCards"&&<div className="profileRecentCardMeta"><strong>{(cleanPostBody(p.body)||"Community post").replace(/https?:\/\/\S+/g,"").slice(0,105)||"View post"}</strong><small>{new Date(p.created_at).toLocaleDateString()} · View post ↗</small></div>}
    {feedMode==="community"&&<div className="profileUmmahFooter"><span>♡ &nbsp; ◯ &nbsp; ♧</span><span>View post ↗</span></div>}
    {isVideo&&<span className="profileCinematicPlay" aria-hidden="true">▶</span>}
   </Link>{feedMode==="own"&&isOwner&&<button type="button" className="profileCinematicDelete" disabled={!!deleting} aria-label="Delete this post" title="Delete post" onClick={()=>void deleteOwnPost(p)}>{deleting===p.id?"…":"×"}</button>}</div>;
  })}</div>}
  {feedMode==="community"&&posts.length>1&&<div className="profileUmmahCarouselControls"><span>Swipe to explore the Ummah</span><div><button type="button" aria-label="Previous community post" onClick={()=>carouselRef.current?.scrollBy({left:-Math.max(250,carouselRef.current.clientWidth*.8),behavior:"smooth"})}>‹</button><button type="button" aria-label="Next community post" onClick={()=>carouselRef.current?.scrollBy({left:Math.max(250,carouselRef.current.clientWidth*.8),behavior:"smooth"})}>›</button></div></div>}
 </section>;
}
