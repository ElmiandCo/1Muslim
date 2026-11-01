import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {getYouTubeId,extractVerse} from "../lib/community-post-content.ts";

const id="dQw4w9WgXcQ";
test("YouTube watch, shorts, live and short links resolve to one video ID",()=>{
 assert.equal(getYouTubeId("https://www.youtube.com/watch?v="+id),id);
 assert.equal(getYouTubeId("https://youtu.be/"+id),id);
 assert.equal(getYouTubeId("https://youtube.com/shorts/"+id),id);
 assert.equal(getYouTubeId("https://m.youtube.com/live/"+id),id);
});
test("unsafe, unrelated and malformed YouTube URLs never become embeds",()=>{
 assert.equal(getYouTubeId("https://youtube.com.evil.example/watch?v="+id),null);
 assert.equal(getYouTubeId("https://www.youtube.com/watch?v=too-short"),null);
 assert.equal(getYouTubeId("javascript:alert(1)"),null);
 assert.equal(getYouTubeId("No video in this reflection"),null);
});
test("Qur'an Arabic, translation and reference are extracted without dropping reflection",()=>{
 const verse=extractVerse("My reflection\n\nQur’an 94:6\n\nإِنَّ مَعَ الْعُسْرِ يُسْرًا\n\nIndeed, with hardship comes ease.");
 assert.ok(verse);
 assert.equal(verse.reference,"Qur’an 94:6");
 assert.match(verse.arabic,/مَعَ/);
 assert.match(verse.english,/hardship/);
 assert.equal(verse.remaining,"My reflection");
});
test("ordinary text and reference without verse text remain normal posts",()=>{
 assert.equal(extractVerse("Remember Allah today."),null);
 assert.equal(extractVerse("Qur’an 94:6"),null);
});

test("Round Two media presentation preserves click-to-play and lazy poster frames",()=>{
 const source=readFileSync(new URL("../app/components/CommunityPostPresentation.tsx",import.meta.url),"utf8");
 assert.match(source,/IntersectionObserver/);
 assert.match(source,/nearViewport&&<video/);
 assert.match(source,/playing\?<video[^\n]*autoPlay/);
 assert.match(source,/youtube-nocookie\.com\/embed/);
 assert.doesNotMatch(source,/youtube-nocookie\.com\/embed\/[^\n]*autoplay=1/);
});
test("Round Two gallery and author visuals use real post assets and profile avatars",()=>{
 const renderer=readFileSync(new URL("../app/components/CommunityPostPresentation.tsx",import.meta.url),"utf8");
 const feed=readFileSync(new URL("../app/components/CommunityMediaFeed.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../app/components/CommunityPostPresentation.module.css",import.meta.url),"utf8");
 assert.match(renderer,/mosaic=galleryItems\.length>=2/);
 assert.match(renderer,/styles\.mediaMosaic/);
 assert.match(feed,/ProfileAvatar/);
 assert.match(feed,/post_media/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

// Round Three: overlapping visibility/publish refreshes must never replace newer
// signed media URLs or resurrect stale posts after a newer request completes.
test("Round Three media refresh discards stale asynchronous results",()=>{
 const feed=readFileSync(new URL("../app/components/CommunityMediaFeed.tsx",import.meta.url),"utf8");
 assert.match(feed,/let loadVersion=0/);
 assert.match(feed,/const requestId=\+\+loadVersion/);
 assert.match(feed,/const isCurrent=\(\)=>alive&&requestId===loadVersion/);
 assert.match(feed,/if\(isCurrent\(\)\)\{setPosts\(\[\.\.\.grouped\.values\(\)\]/);
 assert.match(feed,/catch\{if\(isCurrent\(\)\)setError/);
 assert.match(feed,/finally\{if\(isCurrent\(\)\)setLoading\(false\)\}/);
 assert.match(feed,/createSignedUrls\(valid\.map\(m=>m\.storage_path\),3600\)/);
});

test("Round Four media publishing is one canonical source and a single atomic RPC",()=>{
 const api=readFileSync(new URL("../app/api/community-posts/route.ts",import.meta.url),"utf8");
 const sql=readFileSync(new URL("../supabase/migrations/20261101021500_community_media_atomic_publish.sql",import.meta.url),"utf8");
 assert.match(api,/db\.rpc\("publish_community_media_post"/);
 assert.match(api,/source:"posts"/);
 assert.match(api,/source:"ummah"/);
 assert.match(api,/MEDIA_BODY_TOO_LONG/);
 assert.doesNotMatch(api,/db\.from\("post_media"\)\.insert/);
 assert.match(sql,/SECURITY INVOKER/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/INSERT INTO public\.posts/);
 assert.match(sql,/INSERT INTO public\.post_media/);
 assert.match(sql,/ON CONFLICT \(id\) DO NOTHING/g);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.publish_community_media_post/);
 assert.doesNotMatch(sql,/INSERT INTO public\.ummah_feed_posts/);
 assert.doesNotMatch(sql,/community_post_links\s*\(/);
});
test("Round Four retry keeps the same post UUID and upload path",()=>{
 const studio=readFileSync(new URL("../app/components/PostDesignStudio.tsx",import.meta.url),"utf8");
 assert.match(studio,/publishAttemptRef=useRef/);
 assert.match(studio,/attempt\.userId!==user\.id/);
 assert.match(studio,/attempt\.file!==media\.file/);
 assert.match(studio,/attempt\.body!==publishText/);
 assert.match(studio,/if\(!attempt\.uploaded\)/);
 assert.match(studio,/attempt\.uploaded=true/);
 assert.match(studio,/postId:media\?attempt\?\.postId/);
 assert.match(studio,/publishAttemptRef\.current=null;setText\(""/);
});
test("Round Four media feed uses canonical IDs and source-aware Bot A callback",()=>{
 const feed=readFileSync(new URL("../app/components/CommunityMediaFeed.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../app/components/CommunityMediaFeed.module.css",import.meta.url),"utf8");
 const theme=readFileSync(new URL("../app/components/community-posts3-theme.css",import.meta.url),"utf8");
 assert.match(feed,/source:"posts"/);
 assert.match(feed,/data-canonical-post-id=\{post\.id\}/);
 assert.match(feed,/onOpenConversation\(\{id:post\.id,author_id:post\.userId/);
 assert.match(feed,/href=\{"\/posts\/"\+encodeURIComponent\(post\.id\)\}/);
 assert.match(feed,/createSignedUrls\(valid\.map\(m=>m\.storage_path\),3600\)/);
 assert.match(css,/var\(--theme-accent/);
 assert.match(theme,/Never change scroll containers or layout heights here/);
 assert.doesNotMatch(feed,/autoPlay/);
});
