"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../../utils/supabase/client";
import styles from "./article.module.css";
import OneMuslimVideo from "../../../components/OneMuslimVideo";
import {unpack} from "../../studio/PublicationDesigner";

type Article = {
  id: string;
  title: string;
  template_type: string;
  hero_media_path: string | null;
  section_one: { text?: string } | null;
  section_two: { text?: string } | null;
  created_at: string;
  subtitle?: string;
  kind?: "article"|"newsletter";
};

export default function QiblaArticlePage() {
  const params = useParams();
  const articleId = typeof params.id === "string" ? params.id : "";
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [superAdmin,setSuperAdmin]=useState(false);

  useEffect(()=>{let mounted=true;const db=createClient();const check=async()=>{const {data:{user}}=await db.auth.getUser();if(!user){if(mounted)setSuperAdmin(false);return}const {data}=await db.rpc("qibla_is_superadmin");if(mounted)setSuperAdmin(data===true)};void check();const {data:{subscription}}=db.auth.onAuthStateChange(()=>void check());return()=>{mounted=false;subscription.unsubscribe()}},[]);
  useEffect(() => {
    let active = true;
    if (!articleId) {
      setError("Article not found.");
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data, error: queryError } = await createClient()
        .from("qibla_pages")
        .select("id,title,template_type,hero_media_path,section_one,section_two,created_at")
        .eq("id", articleId)
        .eq("published", true)
        .maybeSingle();
      if (!active) return;
      if (data && !queryError) { const {data:publication}=await createClient().from("qibla_submissions").select("kind,subtitle").eq("published_page_id",articleId).eq("status","published").maybeSingle();if(active)setArticle({...data,kind:publication?.kind==="newsletter"?"newsletter":"article",subtitle:publication?.subtitle||undefined} as Article); }
      else {
        // Only published editorial articles may resolve on public article URLs.
        // Backend RLS remains the authority for access to unpublished content.
        const { data: approved, error: editorialError } = await createClient()
          .from("qibla_articles")
          .select("id,title,subtitle,body,template,published_at")
          .eq("id", articleId)
          .eq("status", "published")
          .maybeSingle();
        if (approved && !editorialError) setArticle({
          id: approved.id, title: approved.title, subtitle: approved.subtitle,
          template_type: approved.template, hero_media_path: null,
          section_one: { text: approved.body }, section_two: null,
          created_at: approved.published_at ?? "",
        });
        else if (queryError && editorialError) setError("Unable to load this article.");
        else setError("This article is unavailable.");
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [articleId]);

  const parsed = article?.section_two?.text ? unpack(article.section_two.text) : article?.section_one?.text ? unpack(article.section_one.text) : null;
  const media = parsed?.design.media.filter(m=>m.url.trim()) || [];
  const clean=(value:string)=>value.replace(/\\r\\n/g,"\n").replace(/\\n/g,"\n").replace(/\\t/g," ").replace(/\\\"/g,'"').replace(/\}\}\s*→\s*$/,"").trim();
  const story=clean(parsed?.body||article?.section_two?.text||article?.section_one?.text||"");
  const blocks=story.split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean).flatMap(t=>t.length>950&&!t.includes("\n")?(t.match(/.{1,750}(?:[.!?](?:\\s|$)|$)/g)||[t]):[t]);
  const leadImage=media.find(m=>m.type==="image")?.url||((article?.hero_media_path&&!article.hero_media_path.includes("youtu"))?article.hero_media_path:null);
  const otherMedia=media.filter(m=>m.url!==leadImage);
  const isHeading=(t:string)=>t.length<110&&!/[.!?]$/.test(t)&&!/^https?:/i.test(t)&&(/^[A-Z\d\s•—:–-]+$/.test(t)||/^(chapter|section|background|timeline|impact|conclusion|editorial note|the rise|what comes next)/i.test(t));
  const videoId = (url:string) => {try {const u=new URL(url);const parts=u.pathname.split("/");const id=u.hostname==="youtu.be"?parts[1]:["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(u.hostname)?u.searchParams.get("v")||(["shorts","embed"].includes(parts[1])?parts[2]:null):null;return id&&id.length===11&&Array.from(id).every(c=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-".includes(c))?id:null}catch{return null}};
  return <main className={`${styles.root} ${article?.kind==="newsletter"?styles.newsletter:styles.magazine}`}>
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Article navigation"><Link href="/qibla/newsroom">← QIBLA</Link><strong className={styles.qiblaBrand}>1MUSLIM <span>QIBLA</span></strong><Link href="/qibla/newsroom">MORE STORIES ↗</Link></nav>
      {superAdmin&&article&&<Link className={styles.editShortcut} href={"/qibla/command?editPage="+encodeURIComponent(article.id)} aria-label="Edit this live publication">✎ Edit live</Link>}
      {loading?<p className={styles.message}>Loading article…</p>:error?<p className={styles.message}>{error}</p>:article?<article className={styles.article}>
        <header className={styles.header}><div className={styles.masthead}>1MUSLIM QIBLA <span>·</span> {article.kind==="newsletter"?"THE NEWSLETTER":"THE MAGAZINE"}</div><p className={styles.kicker}>{article.kind==="newsletter"?"NEWS DESK · FEATURE REPORT":"FEATURE STORY · CULTURE & COMMUNITY"}</p><h1>{article.title}</h1>{article.subtitle&&<p className={styles.subtitle}>{clean(article.subtitle)}</p>}<div className={styles.byline}><span className={styles.editorAvatar} aria-hidden="true">Q</span><span>1Qibla Editorial</span><time dateTime={article.created_at}>{new Date(article.created_at).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}</time></div></header>
        {leadImage&&<figure className={styles.heroFigure}><img src={leadImage} alt={media.find(m=>m.url===leadImage)?.caption||article.title} loading="eager"/>{media.find(m=>m.url===leadImage)?.caption&&<figcaption>{media.find(m=>m.url===leadImage)?.caption}</figcaption>}</figure>}
        {!leadImage&&article.template_type==="video"&&article.hero_media_path&&<div className={styles.heroVideo}><OneMuslimVideo videoKey={"qibla:"+article.id+":hero"} src={article.hero_media_path} youtubeId={videoId(article.hero_media_path)} title={article.title}/></div>}
        <div className={`${styles.story} ${parsed?.design.columns==="double"?styles.doubleColumns:parsed?.design.columns==="mixed"?styles.mixedColumns:""}`}>{blocks.map((block,i)=>{const mediaIndex=otherMedia.length&&blocks.length>1?Math.floor((i-1)*otherMedia.length/(blocks.length-1)):-1;const m=i>0&&mediaIndex>=0&&mediaIndex<otherMedia.length&&Math.floor((i-2)*otherMedia.length/(blocks.length-1))!==mediaIndex?otherMedia[mediaIndex]:null;return <section key={i} className={styles.storySection}>{m&&<figure className={styles.inlineMedia}>{m.type==="video"?<OneMuslimVideo videoKey={"qibla:"+article.id+":media:"+mediaIndex} src={m.url} youtubeId={videoId(m.url)} title={m.caption||article.title}/>:<img src={m.url} alt={m.caption||"Story photograph"} loading="lazy"/>}{m.caption&&<figcaption>{m.caption}</figcaption>}</figure>}{isHeading(block)?<h2>{block}</h2>:<p className={i===0?styles.lead:""}>{block}</p>}</section>})}{!blocks.length&&<p>Story content is being prepared.</p>}{otherMedia.length>0&&(blocks.length<=1||otherMedia.length>Math.max(0,blocks.length-1))&&<div className={styles.gallery}>{(blocks.length<=1?otherMedia:otherMedia.slice(Math.max(0,blocks.length-1))).map((m,i)=><figure key={i}>{m.type==="video"?<OneMuslimVideo videoKey={"qibla:"+article.id+":extra:"+i} src={m.url} youtubeId={videoId(m.url)} title={m.caption||article.title}/>:<img src={m.url} alt={m.caption||"Story photograph"} loading="lazy"/>}{m.caption&&<figcaption>{m.caption}</figcaption>}</figure>)}</div>}</div>
        <footer className={styles.footer}><Link href="/qibla/newsroom">← Explore more Qibla stories</Link></footer>
      </article>:null}
    </div>
  </main>;
}
