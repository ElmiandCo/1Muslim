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
};

export default function QiblaArticlePage() {
  const params = useParams();
  const articleId = typeof params.id === "string" ? params.id : "";
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (data && !queryError) setArticle(data as Article);
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

  const parsed = article?.section_one?.text ? unpack(article.section_one.text) : null;
  const media = parsed?.design.media.filter(m=>m.url.trim()) || [];
  const videoId = (url:string) => {try {const u=new URL(url);const id=u.hostname==="youtu.be"?u.pathname.slice(1):["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(u.hostname)?u.searchParams.get("v")||u.pathname.match(/\\/(?:shorts|embed)\\/([\\w-]{11})/)?.[1]:null;return id&&/^[\\w-]{11}$/.test(id)?id:null}catch{return null}};
  return <main className={styles.root}>
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Article navigation">
        <Link href="/qibla/newsroom">← 1Qibla Magazine</Link>
        <Link href="/">1Muslim Home</Link>
      </nav>
      {loading ? <p role="status" className={styles.message}>Loading article…</p> :
        error ? <p role="alert" className={styles.message}>{error}</p> :
        article ? <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.kicker}>1QIBLA · {article.template_type === "video" ? "VIDEO" : "ARTICLE"}</p>
            <h1>{article.title}</h1>
            {article.subtitle && <p>{article.subtitle}</p>}
            <time dateTime={article.created_at}>{new Date(article.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time>
          </header>
          {article.hero_media_path && article.template_type === "image" ?
            <div className={styles.cover} style={{ backgroundImage: `url("${encodeURI(article.hero_media_path)}")` }} role="img" aria-label="Article cover" /> : null}
          {article.template_type === "video" && article.hero_media_path && <OneMuslimVideo videoKey={"qibla:"+article.id+":hero"} src={article.hero_media_path} youtubeId={videoId(article.hero_media_path)} title={article.title}/>}
          <div className={styles.body}>
            {parsed?.body && <p>{parsed.body}</p>}
            {media.map((m,i)=>m.type==="video"?<figure key={i} style={{margin:"24px 0"}}><OneMuslimVideo videoKey={"qibla:"+article.id+":media:"+i} src={m.url} youtubeId={videoId(m.url)} title={m.caption||article.title}/>{m.caption&&<figcaption>{m.caption}</figcaption>}</figure>:<figure key={i} style={{margin:"24px 0"}}><img src={m.url} alt={m.caption||"Article image"} style={{width:"100%",height:"auto"}}/>{m.caption&&<figcaption>{m.caption}</figcaption>}</figure>)}
            {article.section_two?.text && <p>{article.section_two.text}</p>}
          </div>
          <footer className={styles.footer}><Link href="/qibla/newsroom">Explore more stories →</Link></footer>
        </article> : null}
    </div>
  </main>;
}
