// Run: node --test scripts/community-posts3-canonical.test.mjs
// Static contract checks only; staging migration, RLS and device QA still required.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=src("supabase/migrations/20261101014500_canonical_post_interactions.sql");
const comments=src("app/api/post-comments/route.ts");
const likes=src("app/api/post-likes/route.ts");
const commentLikes=src("app/api/post-comment-likes/route.ts");
const viewer=src("app/components/UmmahConversation.tsx");

test("canonical IDs are explicit and never inferred by text/time",()=>{
 assert.match(sql,/community_post_links/);
 assert.match(sql,/canonical_post_id uuid not null unique references public\.posts/);
 assert.match(sql,/No automatic backfill/);
 assert.match(viewer,/source\?:"ummah"\|"posts"/);
 assert.match(viewer,/const canonical=post\.source==="posts"/);
});
test("canonical comments use existing posts/comments tables and 3-level guard",()=>{
 assert.match(comments,/db\.from\("posts"\)/);
 assert.match(comments,/db\.from\("comments"\)/);
 assert.match(sql,/create trigger canonical_comment_thread_guard/);
 assert.match(sql,/Maximum three comment levels/);
 assert.match(comments,/grandparent\.parent_id/);
});
test("existing likes remain canonical and counters are anonymous-safe",()=>{
 assert.match(likes,/db\.from\("post_likes"\)/);
 assert.match(commentLikes,/db\.from\("comment_likes"\)/);
 assert.match(sql,/create table if not exists public\.post_like_counts/);
 assert.match(sql,/create table if not exists public\.comment_like_counts/);
 assert.match(sql,/revoke all on public\.post_like_counts/);
});
test("guest access to existing member posts is not widened",()=>{
 assert.doesNotMatch(sql,/create policy "Public canonical posts read"/);
 assert.doesNotMatch(sql,/grant select on public\.posts to anon/);
 assert.match(sql,/Existing posts\/comments\/post_likes\/comment_likes policies remain authoritative/);
});
test("canonical comment images and old comment media are supported",()=>{
 assert.match(comments,/db\.from\("comment_media"\)/);
 assert.match(comments,/image\.startsWith\(user\.id\+"\/ummah-comments\/"\)/);
 assert.match(comments,/MAX_IMAGE=5\*1024\*1024/);
});
test("source-aware viewer preserves scroll, focus and realtime fallback",()=>{
 assert.match(viewer,/scrollHistory\.current\.push/);
 assert.match(viewer,/event\.key!=="Tab"/);
 assert.match(viewer,/table:canonical\?"comments":"ummah_post_comments"/);
 assert.match(viewer,/setInterval\(queue,30000\)/);
 assert.match(viewer,/canonical\?"\/api\/post-comments":"\/api\/ummah-comments"/);
});
test("cross-origin writes and authenticated likes are enforced",()=>{
 assert.match(comments,/Invalid request origin/);
 assert.match(commentLikes,/Sign in to like comments/);
 assert.match(likes,/Sign in to like/);
 assert.match(commentLikes,/Comment not found/);
});

test("canonical like endpoints use INSERT under existing RLS and return actual state",()=>{
 assert.doesNotMatch(likes,/\.upsert\(/);
 assert.doesNotMatch(commentLikes,/\.upsert\(/);
 assert.match(likes,/\.insert\(\{post_id:postId,user_id:user\.id\}\)/);
 assert.match(commentLikes,/\.insert\(\{comment_id:commentId,user_id:user\.id\}\)/);
 assert.match(likes,/error\.code!=="23505"/);
 assert.match(commentLikes,/error\.code!=="23505"/);
 assert.match(commentLikes,/liked:!!current/);
});
test("canonical post like GET respects authenticated post RLS",()=>{
 const get=likes.slice(likes.indexOf("export async function GET"),likes.indexOf("export async function POST"));
 assert.match(get,/db\.from\("posts"\)\.select\("id"\)/);
 assert.match(get,/Post not found/);
 assert.match(get,/status:404/);
});
