"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Movie={video_id:string;title:string;categories:string[]|null;discovered_at:string|null};
const validId=(id:string)=>/^[a-zA-Z0-9_-]{11}$/.test(id);

export default function ProfileDeepWatchCarousel(){
 const [movies,setMovies]=useState<Movie[]>([]);
 const [loading,setLoading]=useState(true);
 const rail=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let mounted=true;
  const db=createClient();
  void (async()=>{
   try{
    const [library,hidden]=await Promise.all([
     db.from("islamic_video_registry").select("video_id,title,categories,discovered_at").eq("status","approved").order("discovered_at",{ascending:false}).limit(60),
     fetch("/api/deepwatch/exclusions",{cache:"no-store"}).then(r=>r.ok?r.json():[]).catch(()=>[])
    ]);
    const excluded=new Set<string>(Array.isArray(hidden)?hidden.map((item:{item_id:string})=>item.item_id):[]);
    const seen=new Set<string>();
    const newest=(library.data||[]).filter(item=>{
     if(!validId(item.video_id)||excluded.has(item.video_id)||seen.has(item.video_id))return false;
     seen.add(item.video_id);return true;
    }).slice(0,8);
    if(mounted)setMovies(newest);
   }finally{if(mounted)setLoading(false)}
  })();
  return()=>{mounted=false};
 },[]);
 if(!loading&&!movies.length)return null;
 return <section className="profileDeepWatch" aria-label="Newest DeepWatch movies, shows and videos">
  <div className="profileDeepWatchHeading"><div><span className="profileDeepWatchKicker">1MUSLIM · DEEPWATCH</span><h2><span aria-hidden="true">✦</span> New on DeepWatch</h2><p>Fresh movies, shows &amp; videos from the Movie Bank.</p></div><Link href="/deepwatch" className="profileDeepWatchAll">See All ↗</Link></div>
  {loading?<p className="profileDeepWatchLoading">Finding the newest DeepWatch releases…</p>:<>
   <div className="profileDeepWatchRail" ref={rail}>{movies.map((movie,index)=><Link key={movie.video_id} className="profileDeepWatchCard" href={`/deepwatch?video=${encodeURIComponent(movie.video_id)}`} aria-label={`Watch ${movie.title} on DeepWatch`}>
    <img src={`https://i.ytimg.com/vi/${movie.video_id}/hqdefault.jpg`} alt="" loading="lazy"/>
    <span className="profileDeepWatchShade"/><span className="profileDeepWatchPlay" aria-hidden="true">▶</span>
    <span className="profileDeepWatchIndex">{String(index+1).padStart(2,"0")}</span>
    <span className="profileDeepWatchCaption"><strong>{movie.title}</strong><small>{movie.categories?.[0]||"DeepWatch"} · Watch now ↗</small></span>
   </Link>)}</div>
   <div className="profileDeepWatchFooter"><span>Swipe to discover more</span><div><button type="button" aria-label="Previous DeepWatch titles" onClick={()=>rail.current?.scrollBy({left:-300,behavior:"smooth"})}>‹</button><button type="button" aria-label="Next DeepWatch titles" onClick={()=>rail.current?.scrollBy({left:300,behavior:"smooth"})}>›</button></div></div>
  </>}
  <style jsx>{`
  .profileDeepWatch{background:#fff;color:#193451;padding:27px 18px 30px;margin:0;border-top:1px solid #e2e7ef}
  .profileDeepWatchHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
  .profileDeepWatchKicker{color:#9d7543;font-size:10px;letter-spacing:.18em;font-weight:800}
  .profileDeepWatchHeading h2{font-size:clamp(21px,5vw,29px);margin:5px 0;font-weight:800;letter-spacing:-.035em}
  .profileDeepWatchHeading h2 span{color:#b88b4e}
  .profileDeepWatchHeading p{margin:0;color:#64748b;font-size:12px}
  .profileDeepWatchHeading :global(.profileDeepWatchAll){white-space:nowrap;color:#1b3d65;font-size:13px;text-decoration:none;font-weight:700}
  .profileDeepWatchRail{display:flex;gap:13px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:15px 8px 22px;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
  .profileDeepWatchRail::-webkit-scrollbar{display:none}
  .profileDeepWatchRail :global(.profileDeepWatchCard){position:relative;flex:0 0 clamp(218px,69vw,320px);aspect-ratio:1.6;display:block;overflow:hidden;border-radius:17px;scroll-snap-align:start;border:1px solid #d8b77a77;box-shadow:0 10px 23px #0009;transform:perspective(800px) rotateY(-3deg) rotateZ(-.6deg);transition:transform .3s ease,box-shadow .3s ease;text-decoration:none;color:white}
  .profileDeepWatchRail :global(.profileDeepWatchCard):nth-child(even){transform:perspective(800px) rotateY(3deg) rotateZ(.6deg)}
  .profileDeepWatchRail :global(.profileDeepWatchCard):hover,.profileDeepWatchRail :global(.profileDeepWatchCard):focus-visible{transform:perspective(800px) rotateY(0) rotateZ(0) translateY(-4px);box-shadow:0 14px 30px #000c}
  .profileDeepWatchCard :global(img){width:100%;height:100%;object-fit:cover;display:block}
  .profileDeepWatchShade{position:absolute;inset:0;background:linear-gradient(180deg,#0005 0%,transparent 28%,#000b 100%)}
  .profileDeepWatchPlay{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#0c1420cc;border:1px solid #fff9;font-size:14px;padding-left:2px}
  .profileDeepWatchIndex{position:absolute;left:14px;top:14px;font-size:11px;font-weight:800;letter-spacing:.1em;color:#f4dfba}
  .profileDeepWatchCaption{position:absolute;left:15px;right:12px;bottom:13px;display:flex;flex-direction:column;gap:4px;text-shadow:0 2px 5px #000}
  .profileDeepWatchCaption strong{font-size:16px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .profileDeepWatchCaption small{font-size:11px;color:#e6d5b8}
  .profileDeepWatchFooter{display:flex;align-items:center;justify-content:space-between;color:#64748b;font-size:12px}
  .profileDeepWatchFooter div{display:flex;gap:9px}.profileDeepWatchFooter button{width:37px;height:37px;border:1px solid #cdd6e1;border-radius:50%;background:#fff;color:#1b3d65;font-size:25px;cursor:pointer}
  .profileDeepWatchLoading{font-size:13px;color:#64748b}
  @media(prefers-reduced-motion:reduce){.profileDeepWatchRail :global(.profileDeepWatchCard){transition:none;transform:none!important}}
  `}</style>
 </section>;
}
