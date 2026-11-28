import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const feed=readFileSync(new URL("../app/posts/page.tsx",import.meta.url),"utf8");
const live=readFileSync(new URL("../app/posts/UmmahLiveForYou.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/posts/ummah-live-for-you.module.css",import.meta.url),"utf8");
const viewer=readFileSync(new URL("../components/LiveKitViewer.tsx",import.meta.url),"utf8");

test("Verified Live is featured above the member story strip and For You posts",()=>{
 const start=feed.indexOf("<UmmahLiveForYou/>");
 assert.ok(start>0,"missing Live feature");
 assert.ok(start<feed.indexOf("<section className={styles.discoverPeople}"),"Live should precede stories");
 assert.ok(start<feed.indexOf("<div className={styles.discoverFilters}"),"Live should precede post filters");
 assert.match(feed,/view==="feed"\?<>/);
});
test("Live content comes only from current server-verified public discovery",()=>{
 assert.match(live,/useLiveDiscovery\(\)/);
 assert.match(live,/state==="READY_VIDEO"\|\|state==="READY_AUDIO"/);
 assert.match(live,/scheduled_end_at/);
 assert.match(live,/if\(!current.length\)return null/);
 assert.doesNotMatch(live,/fakeLive|demoLive|status:"live"|setInterval\(/);
});
test("iPhone feed only mounts one nearby muted real LiveKit preview",()=>{
 assert.match(live,/IntersectionObserver/);
 assert.match(live,/inView&&visible&&!audio/);
 assert.match(live,/<LiveKitViewer embedded previewMuted smartMobileCrop/);
 assert.match(viewer,/previewMuted = false/);
 assert.match(viewer,/useState\(previewMuted\)/);
 assert.match(viewer,/useRef\(previewMuted\)/);
 assert.match(live,/aria-label="Join live conversation"/);
 assert.match(live,/aria-label="Share this live"/);
 assert.match(css,/touch-action:pan-y/);
});
test("Live For You layout supports adaptive phone display and reduced motion",()=>{
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(live,/Math\.abs\(dx\)>Math\.abs\(dy\)\*1\.4/);
});
