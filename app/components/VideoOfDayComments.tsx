"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ExpressionKeyboard from "./ExpressionKeyboard";
import { createClient } from "../../utils/supabase/client";

const VIDEO_ID = "_8yvTAnwbQ8";
type Comment = { id: string; body: string; created_at: string; user_id: string };

export default function VideoOfDayComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase.from("featured_video_comments")
      .select("id,body,created_at,user_id").eq("video_id", VIDEO_ID)
      .order("created_at", { ascending: false }).limit(100);
    if (loadError) setError("Comments are not available yet.");
    else { setComments(data ?? []); setError(""); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    void refresh();
  }, [refresh]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !body.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("featured_video_comments")
      .insert({ video_id: VIDEO_ID, body: body.trim() });
    if (insertError) setError("Could not post comment. Please try again.");
    else { setBody(""); await refresh(); }
    setSaving(false);
  };

  return <div style={{ marginTop: 22, borderTop: "1px solid #b99c5544", paddingTop: 16 }}>
    <h3 style={{ margin: "0 0 12px" }}>💬 Community comments</h3>
    {userId ? <form onSubmit={submit} style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
      <label htmlFor="featured-video-comment" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Write a comment</label>
      <input id="featured-video-comment" value={body} onChange={e => setBody(e.target.value)} maxLength={1000}
        placeholder="Share a respectful reflection…" style={{ flex: "1 1 230px", padding: 12, borderRadius: 10, border: "1px solid #b99c5588", background: "var(--bg, #080d09)", color: "var(--text, white)" }} />
      <ExpressionKeyboard onInsert={text => setBody(prev => (prev ? prev + " " : "") + text)} />
      <button type="submit" disabled={saving || !body.trim()} style={{ padding: "11px 18px", borderRadius: 10, border: 0, background: "#b99c55", color: "#111", fontWeight: 700, cursor: "pointer" }}>{saving ? "Posting…" : "Post"}</button>
    </form> : <p style={{ fontSize: 13 }}><Link href="/auth">Sign in</Link> to join the conversation. Everyone can read comments.</p>}
    {error && <p role="status" style={{ color: "#dfaa8b", fontSize: 12 }}>{error}</p>}
    {loading ? <p>Loading comments…</p> : comments.length === 0 ? <p style={{ opacity: .7, fontSize: 13 }}>Be the first to share a reflection.</p> :
      <div style={{ display: "grid", gap: 10, marginTop: 15 }}>
        {comments.map(comment => <article key={comment.id} style={{ padding: 12, borderRadius: 12, border: "1px solid #b99c5533" }}>
          <div style={{ opacity: .65, fontSize: 11, marginBottom: 5 }}>Community member · {new Date(comment.created_at).toLocaleDateString()}</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13 }}>{comment.body}</p>
        </article>)}
      </div>}
  </div>;
}
