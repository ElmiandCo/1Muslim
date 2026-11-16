"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Article={id:string;title:string;description:string;cover:string|null;date:string};

export default function ProfileQiblaCarousel(){
 const [articles,setArticles]=useState<Article[]>([]);
 const [loading,setLoading]=useState(true);
 const rail=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let active=true;
  const db=createClient();
  void (async()=>{
   const [editorial,legacy,submissions]=await Promise.all([
    db.from("qibla_articles").select("id,title,subtitle,cover_url,published_at").eq("status","published").order("published_at",{ascending:false}).limit(16),
    db.from("qibla_pages").select("id,title,template_type,hero_media_path,section_one,created_at").eq("published",true).order("created_at",{ascending:false}).limit(16),
    db.from("qibla_submissions").select("published_page_id,kind").eq("status","published")
   ]);
   if(!active)return;
   const kinds=new Map((submissions.data||[]).map(s=>[s.published_page_id,s.kind]));
   const stories:Article[]=[
    ...(editorial.data||[]).filter(a=>kinds.get(a.id)!=="newsletter").map(a=>({id:a.id,title:a.title,description:a.subtitle||"",cover:a.cover_url||null,date:a.published_at||""})),
    ...(legacy.data||[]).filter(a=>kinds.get(a.id)!=="newsletter"&&!String(a.template_type||"").toLowerCase().includes("newsletter")).map(a=>({id:a.id,title:a.title,description:a.section_one?.text||"",cover:a.hero_media_path||null,date:a.created_at||""}))
   ];
   setArticles(stories.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10));
   setLoading(false);
  })();
  return()=>{active=false};
 },[]);
 if(!loading&&!articles.length)return null;
 return <section className="profileQibla" aria-label="Qibla news articles">
  <div className="profileQiblaHeader"><div><span className="profileQiblaEyebrow">1MUSLIM · EDITORIAL</span><h2>Qibla <em>News &amp; Articles</em></h2><p>Stories, ideas and perspectives from the Ummah.</p></div><Link href="/qibla/newsroom" className="profileQiblaMore">More <span aria-hidden="true">↗</span></Link></div>
  {loading?<div className="profileQiblaLoading">Loading published Qibla stories…</div>:<>
   <div className="profileQiblaRail" ref={rail}>{articles.map((article,index)=><Link className="profileQiblaCard" key={article.id} href={`/qibla/newsroom/${encodeURIComponent(article.id)}`}>
    <div className="profileQiblaCover">{article.cover?<img src={article.cover} alt="" loading="lazy"/>:<div className="profileQiblaFallback"><span>QIBLA</span><strong>THE 1MUSLIM EDITORIAL</strong></div>}<span className="profileQiblaIndex">{String(index+1).padStart(2,"0")}</span></div>
    <div className="profileQiblaBody"><span className="profileQiblaCategory">QIBLA · FEATURE</span><h3>{article.title}</h3>{article.description&&<p>{article.description}</p>}<span className="profileQiblaRead">Read article <span aria-hidden="true">↗</span></span></div>
   </Link>)}</div>
   <div className="profileQiblaControls"><span>Swipe to explore Qibla</span><div><button type="button" aria-label="Previous article" onClick={()=>rail.current?.scrollBy({left:-300,behavior:"smooth"})}>‹</button><button type="button" aria-label="Next article" onClick={()=>rail.current?.scrollBy({left:300,behavior:"smooth"})}>›</button></div></div>
  </>}
  <style jsx>{`
   .profileQibla{padding:30px 18px 48px;background:linear-gradient(180deg,#fff 0%,#faf8f3 100%);border-top:1px solid #e7e4dd;color:#182b44}
   .profileQiblaHeader{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:22px}.profileQiblaEyebrow{font-size:10px;font-weight:800;letter-spacing:.22em;color:#a27b42}.profileQiblaHeader h2{font-family:Georgia,serif;font-size:clamp(25px,5vw,35px);font-weight:600;line-height:1.15;margin:7px 0}.profileQiblaHeader h2 em{font-weight:400}.profileQiblaHeader p{font-size:12px;color:#718093;margin:0}.profileQiblaHeader :global(.profileQiblaMore){flex:none;border:1px solid #d7cdbd;border-radius:99px;padding:10px 15px;color:#243b57;text-decoration:none;font-size:13px;font-weight:700}.profileQiblaRail{display:flex;overflow-x:auto;gap:15px;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px 2px 16px;-webkit-overflow-scrolling:touch}.profileQiblaRail::-webkit-scrollbar{display:none}.profileQiblaRail :global(.profileQiblaCard){flex:0 0 min(78%,320px);scroll-snap-align:start;background:white;border:1px solid #e5e1da;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 9px 26px #25364c13}.profileQiblaCover{position:relative;aspect-ratio:16/11;background:#19283c;overflow:hidden}.profileQiblaCover img{width:100%;height:100%;object-fit:cover}.profileQiblaFallback{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;color:#e2c08b;background:linear-gradient(145deg,#12243b,#41516b)}.profileQiblaFallback span{font-family:Georgia,serif;font-size:36px;letter-spacing:.1em}.profileQiblaFallback strong{font-size:9px;letter-spacing:.2em}.profileQiblaIndex{position:absolute;top:12px;left:12px;background:#0c192abf;color:#fff;padding:6px 10px;border-radius:99px;font-size:11px}.profileQiblaBody{padding:17px 17px 19px}.profileQiblaCategory{font-size:10px;letter-spacing:.14em;color:#a17a47;font-weight:800}.profileQiblaBody h3{font-family:Georgia,serif;font-size:21px;line-height:1.23;margin:9px 0;color:#182b44;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.profileQiblaBody p{font-size:12px;line-height:1.5;color:#6b7888;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 16px}.profileQiblaRead{display:block;margin-top:15px;padding-top:12px;border-top:1px solid #edf0f3;font-size:12px;font-weight:700;color:#2b4766}.profileQiblaControls{display:flex;justify-content:space-between;align-items:center;color:#84909d;font-size:11px}.profileQiblaControls>div{display:flex;gap:8px}.profileQiblaControls button{border:1px solid #d8d5cf;border-radius:50%;background:#fff;color:#1c3452;font-size:23px;width:34px;height:34px;cursor:pointer}.profileQiblaLoading{padding:28px 0;color:#7b8490;font-size:13px}
   @media(min-width:760px){.profileQiblaRail :global(.profileQiblaCard){flex-basis:min(36%,350px)}}
  `}</style>
 </section>;
}
