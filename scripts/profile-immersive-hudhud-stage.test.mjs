import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("profile home moves search left and wordmark into small header",()=>{
 const home=read("app/profile/ProfileSearchHome.tsx");
 const css=read("app/profile/profile-search-home.css");
 assert.match(home,/profileSearchUtilities/);
 assert.match(home,/profileSearchBrand/);
 assert.match(home,/profileSearchSubmit/);
 assert.match(home,/profileSearchAvatarControl/);
 assert.match(home,/className="profileSearchField"/);
 assert.match(home,/runStage\("search",search\)/);
 assert.match(home,/<ProfileImmersiveStage request=\{stageRequest\}\/>/);
 assert.doesNotMatch(home,/ProfileCinematicPosts|Your posts/);
 assert.match(home,/onClick=\{expanded\|\|editing\?onCollapse:onExpand\}/);
 assert.match(home,/SearchFeatureRails/);
 assert.doesNotMatch(home,/router\.push\("\/search\?q="/);
 assert.match(css,/\.profileSearchHome \.profileSearchUtilities \.profileSearchBrand/);
 assert.match(css,/\.profileHudFocusRegion\{/);
 assert.match(css,/@keyframes psLogoDock/);
 assert.match(css,/prefers-reduced-motion/);
});

test("HudHud stage has zero animated response border and readable adaptive font scale",()=>{
 const stage=read("app/hudhud/HudHudFocusStage.tsx");
 const css=read("app/hudhud/hudhud-focus.css");
 assert.match(stage,/hudReplyXL/);
 assert.match(stage,/hudReplyL/);
 assert.match(stage,/hudReplyM/);
 assert.match(stage,/hudReplyStandard/);
 assert.match(stage,/hudNarratedLead/);
 assert.match(css,/\.hudFocusCard::before\{content:none!important;display:none!important\}/);
 assert.doesNotMatch(css,/@keyframes hudFocusBorderBloom/);
 assert.doesNotMatch(css,/@keyframes hudFocusBorderLeft/);
 assert.match(css,/\.hudReplyXL\{font-size:clamp\(28px,6\.6vw,40px\)!important/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("in-place stage keeps verses, actual photos and one independent top website",()=>{
 const stage=read("app/hudhud/HudHudFocusStage.tsx");
 const profile=read("app/profile/ProfileImmersiveStage.tsx");
 const web=read("app/lib/hudhud-top-web.ts");
 const hud=read("app/hudhud/page.tsx");
 assert.match(stage,/HudHudVerseCard featured/);
 assert.match(stage,/hudFocusImageButton/);
 assert.match(stage,/hudTopWebsite/);
 assert.match(stage,/line\.webResult\.title/);
 assert.match(profile,/fetch\("\/api\/discover\/ask"/);
 assert.match(profile,/getHudHudTopWebResult/);
 assert.match(profile,/sessionId="profile-search"/);
 assert.match(profile,/persist\/>/);
 assert.match(hud,/getHudHudTopWebResult\(message\)/);
 assert.match(web,/\/api\/web-search\?q=/);
 assert.match(web,/result\.url/);
 assert.match(web,/url\.protocol!=="https:"&&url\.protocol!=="http:"/);
 assert.doesNotMatch(web,/1muslim\.live/);
});

test("HudHud embedded stage preserves conversational input and optional microphone",()=>{
 const profile=read("app/profile/ProfileSearchHome.tsx");
 const stage=read("app/profile/ProfileImmersiveStage.tsx");
 assert.match(profile,/SpeechRecognition\|\|host\.webkitSpeechRecognition/);
 assert.match(profile,/onresult=event=>/);
 assert.match(profile,/runStage\("hudhud",heard\)/);
 assert.match(profile,/onClick=\{\(\)=>search\.trim\(\)\?runStage\("hudhud",search\):speak\(\)\}/);
 assert.match(stage,/historyRef\.current\.slice\(-6\)/);
 assert.match(stage,/controller\.abort\(\)/);
 assert.match(stage,/getHudHudTopWebResult\(q,controller\.signal\)/);
});
