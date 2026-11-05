"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../../utils/supabase/client";
import styles from "./studio.module.css";

type Role = "writer" | "editor" | "approver";
type Article = { id: string; author_id: string; title: string; subtitle: string; body: string; status: string; template: string; revision: number; updated_at: string };
const statuses = ["draft", "submitted", "editing", "awaiting_approval", "published", "rejected"];

export default function QiblaStudio() {
  const [role, setRole] = useState<Role | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState({ title: "", subtitle: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");
  const [template, setTemplate] = useState<"classic" | "feature">("classic");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const load = useCallback(async () => {
    const db = createClient();
    const { data: auth, error: authError } = await db.auth.getUser();
    if (authError || !auth.user) { setMessage("Sign in to access the editorial studio."); setLoading(false); return; }
    const { data: staff, error: staffError } = await db.from("qibla_staff").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (staffError || !staff || !["writer", "editor", "approver"].includes(staff.role)) {
      setMessage("Editorial access is restricted to approved team members."); setLoading(false); return;
    }
    setRole(staff.role as Role);
    const { data, error } = await db.from("qibla_articles")
      .select("id,author_id,title,subtitle,body,status,template,revision,updated_at")
      .order("updated_at", { ascending: false }).limit(100);
    if (error) setMessage("Could not load the editorial queue.");
    else setArticles((data ?? []) as Article[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const active = articles.find((a) => a.id === selected);
  useEffect(() => {
    if (active) { setForm({ title: active.title, subtitle: active.subtitle, body: active.body }); setTemplate(active.template === "feature" ? "feature" : "classic"); setDirty(false); }
  }, [active?.id, active?.revision]);
  const visible = articles.filter((a) => (filter === "all" || a.status === filter) && [a.title, a.subtitle, a.status].some(value => (value || "").toLowerCase().includes(queueSearch.trim().toLowerCase()))).sort((a,b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? a.updated_at.localeCompare(b.updated_at) : b.updated_at.localeCompare(a.updated_at));
  const queueCounts = statuses.map(status => ({ status, count: articles.filter(article => article.status === status).length }));
  const canEdit = !!active && ((role === "writer" && active.status === "draft") || ((role === "editor" || role === "approver") && ["submitted", "editing", "awaiting_approval"].includes(active.status)));
  const canPublish = !!active && role === "approver" && active.status === "awaiting_approval";
  // Live editorial metrics are derived from the current form, not stale saved data.
  const wordCount = form.body.trim() ? form.body.trim().split(/\\s+/u).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const titleLength = form.title.trim().length;
  const deckLength = form.subtitle.trim().length;
  const createDraft = async () => {
    if (role !== "writer" || busy) return;
    setBusy(true); setMessage("");
    const { data, error } = await createClient().rpc("qibla_create_draft", { p_title: "", p_subtitle: "", p_body: "", p_template: "classic" });
    if (error) setMessage(error.message);
    else { await load(); setSelected(String(data)); setMessage("Draft created. Add a headline and story."); }
    setBusy(false);
  };
  const perform = async (action: "save" | "publish" | "submit") => {
    if (!active || busy) return;
    setBusy(true); setMessage("");
    const db = createClient();
    let error: { message: string } | null = null;
    if (action === "save") {
      if (!canEdit) { setBusy(false); return; }
      if (role === "writer") {
        ({ error } = await db.rpc("qibla_update_draft", { p_article_id: active.id, p_title: form.title.trim(), p_subtitle: form.subtitle.trim(), p_body: form.body.trim(), p_template: template }));
      } else {
        if (!form.title.trim() || !form.body.trim()) { setMessage("A title and article body are required."); setBusy(false); return; }
        ({ error } = await db.rpc("qibla_save_editor_revision", { p_article_id: active.id, p_title: form.title.trim(), p_subtitle: form.subtitle.trim(), p_body: form.body.trim() }));
      }
    } else if (action === "publish") {
      if (!canPublish || dirty) { setMessage("Save your changes before publishing."); setBusy(false); return; }
      ({ error } = await db.rpc("qibla_publish_article", { p_article_id: active.id }));
    } else {
      if (role !== "writer" || active.status !== "draft" || dirty) { setBusy(false); return; }
      ({ error } = await db.rpc("qibla_submit_article", { p_article_id: active.id }));
    }
    if (error) setMessage(error.message);
    else { setMessage(action === "save" ? (role === "writer" ? "Draft saved." : "Revision saved for approval.") : action === "publish" ? "Article published." : "Draft submitted for review."); await load(); }
    setBusy(false);
  };
  return <main className={styles.root}>
    <header className={styles.header}><div><Link href="/qibla/newsroom" onClick={e => { if (dirty && !window.confirm("Leave without saving your changes?")) e.preventDefault(); }}>← 1Qibla Magazine</Link><h1>Editorial Studio</h1><p>{role ? `${role.charAt(0).toUpperCase() + role.slice(1)} workspace` : "Your newsroom workspace"}</p></div><Link href="/" onClick={e => { if (dirty && !window.confirm("Leave without saving your changes?")) e.preventDefault(); }}>1Muslim Home</Link></header>
    {message && <p className={styles.notice} role="status">{message}</p>}
    {loading ? <p className={styles.notice}>Loading workspace…</p> : !role ? null :
    <div className={styles.layout}>
      <section className={styles.queue} aria-label="Editorial queue">
        <div className={styles.queueHead}><h2>Articles</h2>{role === "writer" && <button type="button" disabled={busy} onClick={() => void createDraft()}>+ New draft</button>}<label>Filter <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses ({articles.length})</option>{queueCounts.map(({ status, count }) => <option key={status} value={status}>{status.replaceAll("_", " ")} ({count})</option>)}</select></label></div>
        <div className={styles.queueTools}><label>Find article<input type="search" value={queueSearch} onChange={e => setQueueSearch(e.target.value)} placeholder="Search title, deck or status" /></label><label>Sort<select value={sort} onChange={e => setSort(e.target.value as "newest" | "oldest" | "title")}><option value="newest">Recently updated</option><option value="oldest">Oldest updated</option><option value="title">Title A–Z</option></select></label></div>
        <p role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "article" : "articles"} shown</p>
        {visible.length === 0 ? <p>No articles in this queue.</p> : visible.map(a =>
          <button type="button" key={a.id} className={selected === a.id ? styles.active : styles.queueItem} onClick={() => { if (dirty && !window.confirm("Discard unsaved changes?")) return; setSelected(a.id); setPreview(false); }} aria-pressed={selected === a.id}>
            <strong>{a.title || "Untitled draft"}</strong><span>{a.status.replaceAll("_", " ")} · revision {a.revision}</span>
          </button>)}
      </section>
      <section className={styles.editor} aria-label="Article workspace">
        {!active ? <p>Select an article to review its contents.</p> : <>
          <div className={styles.editorHead}><h2>{active.title || "Untitled draft"}</h2><span>{active.status.replaceAll("_", " ")}</span></div>
          <label>Title<input value={form.title} onChange={e => { setDirty(true); setForm(f => ({...f, title:e.target.value})); }} maxLength={250} readOnly={!canEdit}/></label>
          <label>Subtitle<input value={form.subtitle} onChange={e => { setDirty(true); setForm(f => ({...f, subtitle:e.target.value})); }} maxLength={500} readOnly={!canEdit}/></label>
          <label>Article body<textarea rows={14} value={form.body} onChange={e => { setDirty(true); setForm(f => ({...f, body:e.target.value})); }} readOnly={!canEdit}/></label>
          <div className={styles.editorMetrics} role="status" aria-live="off" aria-label="Article writing statistics">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{readingMinutes} min read</span>
            <span>Headline {titleLength}/250</span>
            <span>Deck {deckLength}/500</span>
          </div>
          {role === "writer" && active.status === "draft" && <label>Layout template <select value={template} onChange={e => { setTemplate(e.target.value as "classic" | "feature"); setDirty(true); }}><option value="classic">Classic</option><option value="feature">Feature</option></select></label>}
          {dirty && <p role="status">Unsaved changes — save before submitting, publishing or leaving.</p>}
          <button type="button" className={styles.previewToggle} aria-expanded={preview} onClick={() => setPreview(value => !value)}>{preview ? "Hide reading preview" : "Preview article"}</button>
          {preview && <article className={styles.preview} aria-label="Article reading preview"><p className={styles.previewKicker}>1Qibla · {template === "feature" ? "Feature" : "Classic"} preview</p><h2>{form.title || "Untitled article"}</h2>{form.subtitle && <p className={styles.previewDeck}>{form.subtitle}</p>}<div className={styles.previewBody}>{form.body || "Your article will appear here as you write."}</div><p className={styles.previewFoot}>Draft preview only · Not published</p></article>}
          <div className={styles.actions}>
            {canEdit && <button type="button" disabled={busy} onClick={() => void perform("save")}>{role === "writer" ? "Save draft" : "Save revision"}</button>}
            {canPublish && <button type="button" disabled={busy || dirty} onClick={() => void perform("publish")}>Approve & publish</button>}
            {role === "writer" && active.status === "draft" && <button type="button" disabled={busy || dirty || !form.title.trim() || !form.body.trim()} onClick={() => void perform("submit")}>Submit for review</button>}
            {!canEdit && <span>Read-only preview</span>}
          </div>
        </>}
      </section>
    </div>}
  </main>;
}
