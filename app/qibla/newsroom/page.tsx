"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import styles from "./newsroom.module.css";

type Page = {
  id: string;
  title: string;
  template_type: string;
  hero_media_path: string | null;
  section_one: { text?: string } | null;
  section_two: { text?: string } | null;
  created_at: string;
  published: boolean;
  source: "editorial" | "legacy";
};
const categories = ["All stories"] as const;
// Editorial and legacy records have distinct publication sources; never infer approval from template alone.

export default function QiblaNewsroom() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<string>("All stories");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const supabase = createClient();
      const { data, error: readError } = await supabase
        .from("qibla_pages")
        .select("id,title,template_type,hero_media_path,section_one,section_two,created_at,published")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!alive) return;
      // Editorial articles are a separate, permission-gated backend contract (#549).
      // Never query or display draft/submitted articles in this public magazine.
      const { data: editorial, error: editorialError } = await supabase
        .from("qibla_articles")
        .select("id,title,subtitle,body,template,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(60);
      if (readError && editorialError) setError("Stories could not be loaded. Please try again.");
      else {
        const legacy = (data ?? []).map((page) => ({ ...page, source: "legacy" as const }));
        const approved = (editorial ?? []).map((article) => ({
          id: article.id, title: article.title, template_type: article.template,
          hero_media_path: null, section_one: { text: article.subtitle || article.body },
          section_two: { text: article.body }, created_at: article.published_at ?? "",
          published: true, source: "editorial" as const,
        }));
        setPages([...approved, ...legacy].sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")));
      }
      setLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => pages.filter((page) => {
    const query = search.trim().toLowerCase();
    // Legacy qibla_pages has no category field. Do not offer filters that cannot work.
    return (!query || [page.title, page.section_one?.text ?? "", page.section_two?.text ?? ""]
      .some((text) => text.toLowerCase().includes(query))) && category === "All stories";
  }), [pages, search, category]);
  const [featured, ...remaining] = filtered;

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="1Qibla navigation">
          <Link className={styles.brand} href="/">1Muslim <span>/ 1Qibla</span></Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/qibla/newsroom" aria-current="page">Magazine</Link>
            <Link href="/qibla/newsletters">Newsletters</Link>
            <Link href="/qibla/newsroom/about">About</Link>
            <Link href="/community">Community posts</Link>
          </nav>
          <div className={styles.sidebarNote}>Stories, reflection, and perspective from the Ummah.</div>
        </aside>
        <div className={styles.main}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>THE 1MUSLIM EDITORIAL</p>
              <h1>1Qibla</h1>
              <p className={styles.subhead}>One community. Many stories. One direction.</p>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12}}><Link className={styles.homeLink} href="/qibla">Explore Qibla</Link><Link className={styles.homeLink} href="/">← Home</Link></div>
          </header>
          <div className={styles.toolbar}>
            <div className={styles.categories} aria-label="Article categories">
              {categories.map((item) => <button key={item} type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={category === item ? styles.selected : ""}>{item}</button>)}
            </div>
            <label className={styles.searchLabel}>
              <span className={styles.srOnly}>Search stories</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stories" />
            </label>
          </div>
          {loading ? <p className={styles.status} role="status">Loading stories…</p> :
            error ? <p className={styles.status} role="alert">{error}</p> :
            !featured ? <p className={styles.status}>No published stories match your search yet.</p> :
            <section aria-label="Published stories">
              <article className={styles.hero}>
                {featured.hero_media_path && featured.template_type === "image" ?
                  <div className={styles.heroVisual} style={{ backgroundImage: `url("${encodeURI(featured.hero_media_path)}")` }} aria-hidden="true" /> :
                  <div className={styles.heroVisual} aria-hidden="true"><span>۞</span></div>}
                <div className={styles.heroCopy}>
                  <span className={styles.eyebrow}>{featured.source === "editorial" ? "1QIBLA EDITORIAL · FEATURED" : "FEATURED STORY"}</span>
                  <h2>{featured.title}</h2>
                  <p>{featured.section_one?.text?.slice(0, 220)}</p>
                  <Link href={`/qibla/newsroom/${encodeURIComponent(featured.id)}`}>Read article →</Link>
                </div>
              </article>
              <div className={styles.sectionHead}><h2>Latest stories</h2><span>{remaining.length} more</span></div>
              <div className={styles.cards}>{remaining.map((page) =>
                <article key={page.id} className={styles.card}>
                  <div className={styles.cardVisual} aria-hidden="true">۞</div>
                  <div className={styles.cardBody}>
                    <span className={styles.eyebrow}>{page.source === "editorial" ? "1QIBLA EDITORIAL" : page.template_type === "video" ? "VIDEO STORY" : "ARTICLE"}</span>
                    <h3>{page.title}</h3>
                    <p>{page.section_one?.text?.slice(0, 150)}</p>
                    <Link href={`/qibla/newsroom/${encodeURIComponent(page.id)}`}>Read article →</Link>
                  </div>
                </article>)}</div>
            </section>}
        </div>
        <aside className={styles.rightRail} aria-label="Editorial information">
          <div className={styles.railCard}><span className={styles.eyebrow}>OUR PURPOSE</span><h2>Stories that connect us.</h2><p>Discover thoughtful writing from across the 1Muslim community.</p></div>
          <div className={styles.railCard}><span className={styles.eyebrow}>JOIN THE CONVERSATION</span><h2>Your voice matters.</h2><p>L1 Member · L2 Writer · L3 Editor · L4 Approver. Discover how to contribute.</p><Link href="/qibla/newsroom/apply">Explore editorial levels →</Link></div>
        </aside>
      </div>
    </main>
  );
}
