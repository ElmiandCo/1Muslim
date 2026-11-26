import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("HudHud offers a native-feel emerald conversational screen instead of the old Search side sheet",()=>{
 const page=read("app/hudhud/page.tsx");
 const search=read("app/search/page.tsx");
 const css=read("app/hudhud/hudhud.css");
 assert.match(page,/aria-label="HudHud chat"/);
 assert.match(page,/className="hudOrb"/);
 assert.match(page,/className="hudInputPill"/);
 assert.match(page,/placeholder=\{exhausted\?"Free replies completed":"Ask HudHud"\}/);
 assert.match(css,/\.hudOrbCloud/);
 assert.match(css,/radial-gradient/);
 assert.match(css,/\.hudTyping \.hudOrbGlow/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(search,/router\.push\("\/hudhud"/);
 assert.doesNotMatch(search,/dsChatOverlay/);
});
test("HudHud preserves the existing server-owned quota and per-turn chat history",()=>{
 const page=read("app/hudhud/page.tsx");
 assert.match(page,/fetch\("\/api\/discover\/ask"/);
 assert.match(page,/method:"POST"/);
 assert.match(page,/query:queryContext,message,history/);
 assert.match(page,/history=lines\.slice\(-6\)/);
 assert.match(page,/!unlocked&&remaining===0/);
 assert.match(page,/href="\/unlocked"/);
 assert.doesNotMatch(page,/localStorage|sessionStorage/);
});
test("HudHud microphone is permission-gated with real stop and unsupported-browser fallback",()=>{
 const page=read("app/hudhud/page.tsx");
 assert.match(page,/webkitSpeechRecognition/);
 assert.match(page,/if\(!Voice\)\{setError/);
 assert.match(page,/rec\.start\(\)/);
 assert.match(page,/rec\.abort\(\)/);
 assert.match(page,/visibilitychange/);
 assert.match(page,/aria-pressed=\{listening\}/);
 assert.match(page,/aria-label=\{listening\?"Stop microphone":"Close HudHud"\}/);
});
test("HudHud hides duplicate site-wide chrome but keeps navigation on other routes",()=>{
 const nav=read("app/components/GlobalNavigation.tsx");
 const launcher=read("app/components/HudHudChatLauncher.tsx");
 assert.match(nav,/pathname\?\.startsWith\("\/hudhud"\)/);
 assert.match(launcher,/pathname==="\/search"\|\|pathname==="\/hudhud"/);
 assert.match(nav,/pathname\?\.startsWith\("\/search"\)/);
});
