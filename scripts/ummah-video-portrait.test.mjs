import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Ummah feed uses real media dimensions instead of landscape-only framing",()=>{
 const feed=source("app/posts/page.tsx");
 const video=source("app/components/OneMuslimVideo.tsx");
 const css=source("app/posts/posts-magazine.module.css");
 assert.match(feed,/<OneMuslimVideo[^>]+feedMode\s*\/>/);
 assert.match(video,/node\.videoWidth\/node\.videoHeight/);
 assert.match(video,/setFeedAspect/);
 assert.match(video,/style=\{feedMode&&!youtubeId\?/);
 assert.match(video,/\.omVideoFeed \.omVideoStage/);
 assert.match(css,/\.igUmmah \.feedVideoStage :global\(\.omVideoTools\)/);
 assert.match(css,/position:absolute!important/);
 assert.match(css,/\.igUmmah \.feedVideoStage :global\(\.omVideoFeed/);
});

test("OneMuslimVideo preserves native controls and timestamped comments in portrait mode",()=>{
 const src=source("app/components/OneMuslimVideo.tsx");
 assert.match(src,/controls playsInline autoPlay muted loop/);
 assert.match(src,/onTimeUpdate/);
 assert.match(src,/featured_video_timed_comments/);
 assert.match(src,/\.omVideoFeed \.omVideoStage video\{object-fit:contain/);
 assert.match(src,/@media\(prefers-reduced-motion:reduce\)/);
});
