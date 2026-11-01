// Run: node --test scripts/community-posts-3.test.mjs
// Static contract tests; database RLS, migration and browser interaction need integration QA.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sql=source("supabase/migrations/20261101004000_community_posts_3_interactions.sql");
const api=source("app/api/ummah-comments/route.ts");
const viewer=source("app/components/UmmahConversation.tsx");

test("three-level nesting is guarded at the database and API layers",()=>{
 assert.match(sql,/great_grandparent_id is not null/);
 assert.match(sql,/Reply target must belong to the same post/);
 assert.match(sql,/ummah_comment_thread_guard/);
 assert.match(api,/ancestor\.parent_id/);
 assert.match(api,/Maximum three comment levels/);
});
test("comments accept only owner-scoped image paths and bounded image formats",()=>{
 assert.match(sql,/image_path like author_id::text/);
 assert.match(api,/image\.startsWith\(user\.id\+"\/ummah-comments\/"\)/);
 assert.match(api,/maxImageBytes=5\*1024\*1024/);
 assert.match(api,/image\/png","image\/jpeg","image\/webp/);
 assert.doesNotMatch(viewer,/accept="video/);
});
test("thread and engagement realtime subscriptions have a polling fallback",()=>{
 for(const table of ["ummah_post_comments","ummah_comment_likes","ummah_post_like_counts","ummah_post_share_counts"]){
  assert.ok(sql.includes("'"+table+"'"));
  assert.ok(viewer.includes('table:"'+table+'"'));
 }
 assert.match(viewer,/setInterval\(queue,30000\)/);
 assert.match(viewer,/removeChannel\(channel\)/);
});
test("share tracking is RLS-restricted and separate from media",()=>{
 assert.match(sql,/create table if not exists public\.ummah_post_shares/);
 assert.match(sql,/user_id = \(select auth\.uid\(\)\)/);\n assert.match(sql,/Read your own Ummah share events/);\n assert.match(sql,/ummah_post_share_counts/);
 assert.match(sql,/revoke all on table public\.ummah_post_shares/);
 assert.match(viewer,/if\(user\)\{const response=await fetch\("\/api\/ummah-post-shares"/);
});
