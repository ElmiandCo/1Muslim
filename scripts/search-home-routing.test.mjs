import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import "./hudhud-voice-and-flat-settings.test.mjs";
import "./hudhud-stream-first-voice.test.mjs";
import "./search-member-voice-ui.test.mjs";
import "./hudhud-personalization.test.mjs";
import {passwordWarning} from "../app/lib/auth-password-policy.ts";
import {hasShahada,SHAHADA_ARABIC,SHAHADA_ENGLISH} from "../app/lib/shahada-recognition.ts";
import {signAdminGate,validAdminGate} from "../lib/admin-security-gate.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("signed-in and anonymous visitors enter the same Search Home immediately",()=>{
  const root=read("app/page.tsx");
  const proxy=read("utils/supabase/proxy.ts");
  assert.match(root,/redirect\("\/search"\)/);
  assert.doesNotMatch(root,/GuestWelcomeHome|createClient|router\.replace|oneWhiteWelcomeLoading/);
  assert.match(proxy,/pathname === "\/search"/);
  assert.match(proxy,/if \(!guestAllowed\)/);
  assert.match(proxy,/loginUrl\.pathname = "\/auth"/);
});

test("one-second in-place Search Home reveal is quiet, repeat-safe and motion-safe",()=>{
  const page=read("app/search/page.tsx");
  const styles=read("app/search/search.css");
  const auth=read("app/auth/page.tsx");
  assert.match(page,/useState<"pending"\|"playing"\|"done">\("pending"\)/);
  assert.match(page,/sessionStorage\.getItem\(key\)==="seen"/);
  assert.match(page,/const hasQuery=Boolean\(params\.get\("q"\)\?\.trim\(\)\)/);
  assert.match(page,/\(prefers-reduced-motion: reduce\)/);
  assert.match(page,/window\.setTimeout\(\(\)=>setIntroStage\("done"\),1000\)/);
  assert.match(page,/dsIntro/);
  assert.match(auth,/sessionStorage\.removeItem\("1muslim:search-intro:v1"\)/);
  assert.match(styles,/\.dsPage\.dsHomeMode\.dsIntroPending/);
  assert.match(styles,/@keyframes dsIntroWordmark/);
  assert.match(styles,/@keyframes dsIntroLive/);
  assert.match(styles,/@keyframes dsIntroArrive/);
  assert.match(styles,/dsIntroWordmark 1000ms/);
  assert.match(styles,/dsIntroLive 1000ms/);
  assert.match(styles,/dsIntroArrive 1000ms/);
  assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
  // No hard route changes, duplicate logo, fixed splash or layout replacement.
  assert.doesNotMatch(page.slice(page.indexOf("const [introStage"),page.indexOf("// The same Search Home renders")),/setTimeout\(\(\)=>router\.(?:push|replace)/);
});

test("auth routes verified sign-ins to Search Home and preserves explicit deep links",()=>{
  const auth=read("app/auth/page.tsx");
  assert.match(auth,/const safeNext =/);
  assert.match(auth,/return "\/search";/);
  assert.match(auth,/return match \? `\/profile\?member=/);
  assert.match(auth,/window\.location\.assign\(safeNext\(\)\)/);
  assert.match(auth,/const destination = isShahadaSignup \? "\/onboarding\?method="/);
  const callback=read("app/auth/callback/route.ts");
  assert.match(callback,/searchParams\.get\("next"\) \?\? "\/search"/);
  assert.match(callback,/next = "\/search";/);
  assert.match(callback,/return NextResponse\.redirect\(/);
  assert.match(callback,/\$\{origin\}\$\{next === "\/search" \? "\/search\?arrival=1" : next\}/);
});

test("visitors can search without signing in, while private account controls are gated",()=>{
  const page=read("app/search/page.tsx");
  const webSearch=read("app/components/WebSearchPanel.tsx");
  const proxy=read("utils/supabase/proxy.ts");
  const css=read("app/search/search.css");
  assert.match(page,/const \[account,setAccount\]=useState<"checking"\|"guest"\|"member">\("checking"\)/);
  assert.match(page,/account==="guest"\?<div className="dsGuestAccount"/);
  assert.match(page,/account==="member"\?<>/);
  assert.match(page,/href="\/auth\?next=%2Fsearch&login=1"/);
  assert.match(page,/href="\/auth\?next=%2Fsearch&mode=signup"/);
  assert.match(page,/\/api\/discover\/search/);
  assert.match(page,/<WebSearchPanel query=\{submitted\}/);
  assert.match(webSearch,/\/api\/web-search\?q=/);
  assert.match(proxy,/pathname === "\/search"/);
  assert.match(css,/\.dsResultsNight \.dsGuestAccount/);
});

test("personalized Search Profile keeps immersive search but relegates own posts to full profile",()=>{
 const profile=read("app/profile/page.tsx");
 const home=read("app/profile/ProfileSearchHome.tsx");
 const css=read("app/profile/profile-search-home.css");
 const search=read("app/search/page.tsx");
 const rail=read("app/search/search-feature-rails.css");
 assert.match(profile,/<ProfileSearchHome profile=\{profile\}/);
 assert.match(profile,/<ProfileSocialHub profile=\{profile\}/);
 assert.match(profile,/\(searchProfileExpanded\|\|editing\)/);
 assert.doesNotMatch(home,/ProfileCinematicPosts|profileSearchStoryRail|Your posts/);
 assert.match(home,/onClick=\{expanded\|\|editing\?onCollapse:onExpand\}/);
 assert.match(home,/runStage\("search",search\)/);
 assert.match(home,/<ProfileImmersiveStage request=\{stageRequest\}\/>/);
 assert.doesNotMatch(home,/router\.push\("\/search\?q="/);
 assert.match(home,/onSettings=|onSettings\}/);
 assert.match(profile,/<ProfileSocialHub profile=\{profile\}/);
 assert.match(home,/onSignOut\}/);
 assert.match(home,/SearchFeatureRails/);
 assert.match(home,/hide_1muslim_id/);
 assert.match(home,/prefers-reduced-motion: reduce/);
 assert.match(css,/profileCinematicGrid\{display:flex!important/);
 assert.match(css,/border-radius:50%!important/);
 assert.match(rail,/\.dsPage\.dsHomeMode \.dsContent\{width:100%;max-width:none\}/);
 assert.match(search,/setAuthReturn\]=useState\("\/search"\)/);
});
test("signed-in Search Home is the actual personalized experience, not the old Profile page",()=>{
 const page=read("app/search/page.tsx");
 const member=read("app/search/SearchMemberHome.tsx");
 const styles=read("app/search/search-member-home.css");
 const stage=read("app/profile/ProfileImmersiveStage.tsx");
 const focus=read("app/hudhud/HudHudFocusStage.tsx");
 const auth=read("app/components/SearchAuthFlow.tsx");
 assert.match(page,/if\(account==="member"&&!showAuth&&!submitted\.trim\(\)\)return <SearchMemberHome/);
 assert.match(auth,/1muslim:member-home-arrival/);
 assert.match(member,/ProfileImmersiveStage request=\{request\}/);
 assert.match(member,/showEmpty=\{false\}/);
 assert.match(member,/getUserMedia\(\{audio:true\}\)/);
 assert.match(member,/SpeechRecognition/);
 assert.match(member,/normalizeSpokenHudHudQuestion/);
 assert.match(member,/createHudHudAiVoicePlayer/);
 assert.match(member,/micCooldown/);
 assert.doesNotMatch(member,/speechSynthesis\\.speak/);
 assert.match(member,/Assalamu Alaikum Wa Rahmatullahi Wa Barakatuh/);
 assert.match(member,/insert\("Search 1Muslim"/);
 assert.match(member,/insert\(" witg"/);
 assert.match(member,/insert\("1Muslim.Live"/);
 const movable=read("app/search/SearchDraggableDisplayName.tsx");
 assert.match(member,/<SearchDraggableDisplayName/);
 assert.match(movable,/className={styles.nameButton}/);
 assert.match(movable,/onEdit\(\)/);
 assert.match(member,/display_name:next/);
 assert.match(member,/href="\/create"/);
 assert.doesNotMatch(member,/ProfileCinematicPosts|Your posts/);
 assert.match(member,/onReply=\{onReply\}/);
 assert.match(member,/setPaused\(true\)/);
 assert.match(styles,/@keyframes smhAvatarTravel/);
 assert.match(styles,/smhResponseSpace/);
 assert.match(styles,/border:0!important/);
 assert.match(stage,/HudHudFocusStage/);
 assert.match(stage,/onReplyRef\.current\?\./);
 assert.match(focus,/hudNarratedReply/);
});
test("Shahada admission returns directly to prior work without forcing profile gender",()=>{
 const onboard=read("app/components/HudHudShahadaV2.tsx");
 const route=read("app/onboarding/page.tsx");
 assert.match(onboard,/shahada_verified_at/);
 assert.match(onboard,/if\(onComplete\)\{onComplete\(\);return\}/);
 assert.match(onboard,/1muslim:auth-return/);
 assert.match(route,/<HudHudShahadaV2\/>/);
 assert.doesNotMatch(route,/ShahadaOnboardingExperience/);
});

test("Home and Profile shortcuts open unified Search Home while directory stays separate",()=>{
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(nav,/{id:"search",label:"Home",href:"\/search"}/);
  assert.match(nav,/{id:"profile",label:"Profile",href:"\/profile"}/);
  assert.match(nav,/item\.id==="profile"\?"\/search"/);
  assert.match(nav,/item\.id==="muslims"\?"\/profile\?section=muslimeen"/);
  assert.match(nav,/router\.push\("\/search"\)/);
});


test("Search Home places every Explore destination in one bottom-anchored swipable rail",()=>{
  const page=read("app/search/page.tsx");
  const css=read("app/search/search.css");
  const rail=read("app/search/SearchFeatureRails.tsx");
  const railCss=read("app/search/search-feature-rails.css");
  const profile=read("app/profile/page.tsx");
  assert.match(page,/const homeMode=!query\.trim\(\)/);
  assert.match(page,/<h1 className="dsHomeBrand" aria-hidden=\{!homeMode\}/);
  assert.match(page,/className="dsSearchForm" role="search"/);
  assert.match(page,/<SearchFeatureRails\/>/);
  assert.match(page,/dsHomeFeatureBreathingSpace/);
  assert.doesNotMatch(page,/Discover your Ummah|People to explore|dsExploreGrid|\/api\/discover\/creators/);
  assert.match(page,/\/api\/discover\/search/);
  assert.match(page,/className="dsCategoryBar"/);
  assert.match(css,/\.dsHomeMode \.dsCategoryBar\{display:none\}/);
  assert.match(page,/!homeMode&&!loading&&!error&&result/);
  assert.match(page,/!homeMode&&loading/);
  assert.match(css,/\.dsHomeMode \.dsSearchForm/);
  assert.match(rail,/const destinations: Destination\[\]/);
  assert.match(rail,/destinations\.map\(item=>/);
  assert.doesNotMatch(rail,/rows\.map|const rows:/);
  assert.match(rail,/href:"\/profile\?compass=1"/);
  assert.match(profile,/get\("compass"\)==="1"/);
  assert.match(railCss,/scroll-snap-type:x mandatory/);
  assert.match(railCss,/overflow-x:auto/);
  assert.match(railCss,/border:0/);
  assert.match(railCss,/\.dsHomeFeatureBreathingSpace\{/);
  assert.match(railCss,/\.dsPage\.dsHomeMode\{[\s\S]*display:flex;[\s\S]*flex-direction:column/);
  assert.match(railCss,/\.dsHomeMode \.dsContent\{[\s\S]*display:flex;[\s\S]*flex-direction:column/);
  assert.match(railCss,/\.dsHomeMode \.dsExploreFeatureSection\{[\s\S]*margin-top:auto/);
  assert.match(railCss,/\.dsHomeMode \.dsFeatureRail\{[\s\S]*flex-wrap:nowrap/);
  assert.match(railCss,/@media\(prefers-reduced-motion:reduce\)/);
});
test("HudHud docks before activation and keeps the existing conversation endpoint",()=>{
  const page=read("app/search/page.tsx");
  const css=read("app/search/search.css");
  assert.match(page,/setTimeout\(\(\)=>setHudhudDocked\(true\),1050\)/);
  assert.match(page,/disabled=\{!homeMode\|\|!hudhudDocked\}/);
  assert.match(page,/onClick=\{\(\)=>void openHudHud\(\)\}/);
  assert.match(page,/router\.push\("\/hudhud"/);
  const hudhud=read("app/hudhud/page.tsx");
  assert.match(hudhud,/\/api\/discover\/ask/);
  assert.match(css,/@keyframes dsHudDockIn/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("Home has floating accessible Settings, Profile and Sign out without the global dock",()=>{
  const page=read("app/search/page.tsx");
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(page,/aria-label="Settings"[\s\S]{0,250}1muslim:open-settings/);
 const signedIn=read("app/search/SearchMemberHome.tsx");
 assert.match(signedIn,/aria-label="Settings"[\s\S]{0,250}1muslim:open-settings/);
 assert.doesNotMatch(signedIn,/href="\/settings"/);
  assert.match(page,/href="\/search" aria-label="Your personalized Search Home"/);
  assert.match(page,/aria-label="Sign out"/);
  assert.match(page,/const signOut=async\(\)=>/);
  assert.match(nav,/pathname\?\.startsWith\("\/search"\)/);
  assert.match(nav,/pathname\?\.startsWith\("\/onboarding"\)/);
});

test("30-second .live wordmark loop is seamless, interactive and reduced-motion safe",()=>{
  const css=read("app/search/search.css");
  const page=read("app/search/page.tsx");
  assert.match(css,/animation:dsLivePulse 30s ease-in-out infinite both/);
  assert.match(css,/@keyframes dsLivePulse\{\s*0%,100%\{/);
  assert.match(css,/\.dsHomeBrand:hover \.dsHomeBrandLive/);
  assert.match(css,/\.dsResultsBrand:hover \.dsHomeBrandLive/);
  assert.match(css,/\.dsResultsBrand:focus-visible \.dsHomeBrandLive/);
  assert.match(css,/\.dsHomeBrandLive\{animation:none!important;transition:none!important/);
  assert.match(page,/className="dsHomeBrandLive" aria-hidden="true">\.Live/);
});

test("magnetic interactions preserve page markup and navigation while staying motion-safe",()=>{
  const page=read("app/search/page.tsx");
  const hook=read("app/search/useSearchMagneticMotion.ts");
  const css=read("app/search/search-magnetic.css");
  assert.match(page,/import "\.\/search-magnetic\.css"/);
  assert.match(page,/useSearchMagneticMotion\(magneticRoot\)/);
  assert.match(page,/return <main ref=\{magneticRoot\}/);
  assert.match(hook,/REACH_PX = 68/);
  assert.match(hook,/requestAnimationFrame\(animateClosest\)/);
  assert.match(hook,/\(hover: hover\) and \(pointer: fine\)/);
  assert.match(hook,/\(prefers-reduced-motion: reduce\)/);
  assert.match(hook,/pointerdown/);
  assert.match(hook,/pointercancel/);
  assert.match(hook,/\.dsHomeMode \.dsCreatorRow/);
  assert.match(hook,/\.dsResultsMode \.dsTabs button/);
  assert.match(css,/transition:transform 500ms/);
  assert.match(css,/\.dsMagnetTap\.dsMagnetTap/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(hook,/preventDefault\(|router\.push\(|router\.replace\(/);
});

test("results header reuses the inward-animating 1Muslim.Live brand at the top left",()=>{
  const page=read("app/search/page.tsx");
  const css=read("app/search/search.css");
  const resultCss=read("app/search/search-results.css");
  assert.match(page,/!homeMode&&<Link href="\/search" className="dsResultsBrand"/);
  assert.match(page,/className="dsHomeBrandLive" aria-hidden="true">\.Live/);
  assert.match(css,/@keyframes dsLivePulse/);
  assert.match(css,/\.dsHomeBrandLive\{/);
  assert.match(resultCss,/\.dsResultsMode \.dsHomeUtilities \.dsResultsBrand/);
  assert.match(resultCss,/\.dsResultsNight \.dsHomeUtilities \.dsResultsBrand/);
  assert.match(resultCss,/@media\(max-width:370px\)/);
});

test("Search Home account entry morphs in place and preserves public search",()=>{
 const page=read("app/search/page.tsx");
 const flow=read("app/components/SearchAuthFlow.tsx");
 const styles=read("app/search/search.css");
 const flowCss=read("app/components/search-auth-flow.css");
 assert.match(page,/import SearchAuthFlow/);
 assert.match(page,/openAuth\("signin"\)/);
 assert.match(page,/openAuth\("signup"\)/);
 assert.match(page,/showAuth&&authMode!=="shahada"&&<SearchAuthFlow/);
 assert.match(page,/placeholder="Search 1Muslim with HudHud"/);
 assert.match(page,/<WebSearchPanel query=\{submitted\}/);
 assert.match(page,/account==="member"/);
 assert.match(styles,/\.dsPage\.dsInlineAuthOpen \.dsSearchForm/);
 assert.match(flowCss,/\.dsInlineAuthFields/);
 assert.doesNotMatch(flow,/position:fixed|backdrop-filter/);
});
test("HudHud owns a single white Shahada flow with audio, optional Help and secure saving",()=>{
 const page=read("app/search/page.tsx");
 const onboard=read("app/components/HudHudShahadaV2.tsx");
 const callback=read("app/auth/callback/route.ts");
 const auth=read("app/auth/page.tsx");
 const styles=read("app/components/hudhud-shahada-v2.css");
 assert.match(page,/<HudHudShahadaV2 embedded returnTo=/);
 assert.match(onboard,/getUserMedia/);
 assert.match(onboard,/MediaRecorder/);
 assert.match(onboard,/hasShahada/);
 assert.match(onboard,/shahada-safe-vault/);
 assert.match(onboard,/award_profile_badge/);
 assert.match(onboard,/shahada_verified_at/);
 assert.match(onboard,/onComplete\?/);
 assert.match(onboard,/self-attested-checkbox/);
 assert.match(onboard,/60-elapsed/);
 assert.match(styles,/background:#fff/);
 assert.match(callback,/!profile\?\.shahada_verified_at/);
 assert.match(auth,/search\.searchParams\.set\("auth",guided\?/);
 assert.doesNotMatch(auth,/<SeamlessEntry /);
});
test("Password policy blocks trivial passwords and user identity leakage",()=>{
 assert.match(passwordWarning("12345678","Sam Yusuf","sam@test.com"),/at least 12/);
 assert.match(passwordWarning("Password123!","Sam Yusuf","sam@test.com"),/predictable/);
 assert.match(passwordWarning("Violet!Road73_Yusuf","Sam Yusuf","sam@test.com"),/name or email/);
 assert.equal(passwordWarning("Violet!Road73_Mountain","Sam Yusuf","sam@test.com"),"");
 const flow=read("app/components/SearchAuthFlow.tsx");
 assert.match(flow,/pass!==confirm/);
 assert.match(flow,/idStatus==="taken"/);
 assert.match(flow,/callback\.searchParams\.set\("next","\/search\?auth=shahada"/);
});
test("1Muslim ID authentication does not reveal email and is distributed rate limited",()=>{
 const handler=read("app/api/auth/id-access/route.ts");
 const flow=read("app/components/SearchAuthFlow.tsx");
 const reset=read("app/auth/reset-password/page.tsx");
 assert.match(handler,/createHmac/);
 assert.match(handler,/claim_search_api_quota/);
 assert.match(handler,/auth\.signInWithPassword/);
 assert.match(handler,/auth\.admin\.getUserById/);
 assert.match(handler,/action==="recover"/);
 assert.doesNotMatch(handler,/return reply\(\{email:/);
 assert.match(flow,/action:"signin"/);
 assert.match(flow,/action:"recover"/);
 assert.match(reset,/auth\.updateUser\(\{password\}\)/);
});

test("Shahada recognizer requires both clauses and never accepts a partial phrase",()=>{
 assert.equal(hasShahada(SHAHADA_ARABIC),true);
 assert.equal(hasShahada(SHAHADA_ENGLISH),true);
 assert.equal(hasShahada("Ashhadu an la ilaha illallah wa ashhadu anna Muhammadan rasulullah"),true);
 assert.equal(hasShahada("I believe in Allah"),false);
 assert.equal(hasShahada("Muhammad is the Messenger of Allah"),false);
 assert.equal(hasShahada("I bear witness that there is no god except Allah"),false);
 assert.equal(hasShahada("Take your time. I'm listening. Just say your Shahada."),false);
});

test("HudHud pilot keeps one reasoning tier and the 50-action server cap",()=>{
 const api=read("app/api/discover/ask/route.ts");
 const page=read("app/hudhud/page.tsx");
 const styles=read("app/hudhud/hudhud.css");
 const sql=read("supabase/migrations/20261126200000_hudhud_v2_fifty_premium_turns.sql");
 assert.match(api,/FREE_TURNS = 50/);
 assert.match(api,/reserve_hudhud_v2_turn/);
 assert.match(api,/HUDHUD_REASONING_MODEL/);
 assert.match(api,/HUDHUD_DAILY_AI_LIMIT/);
 assert.doesNotMatch(api,/gpt-4o-mini/);
 assert.match(sql,/turns_used < 50/);
 assert.match(sql,/REVOKE ALL/);
 assert.doesNotMatch(page,/HudHudOrb/);
  assert.match(page,/requestMicrophonePermission/);
  assert.match(page,/getUserMedia\(\{audio:true\}\)/);
  assert.match(page,/AnimatedMuslimBrand/);
  const brand=read("app/components/AnimatedMuslimBrand.tsx");
  assert.match(brand,/setTimeout\(\(\)=>setCondensed\(true\),4000\)/);
  assert.match(brand,/prefers-reduced-motion/);
 const focus=read("app/hudhud/HudHudFocusStage.tsx");
 assert.match(page,/<HudHudFocusStage lines=\{lines\}/);
 assert.match(focus,/HudHudVerseCard/);
 assert.match(focus,/hudHistoryOverlay/);
 assert.match(focus,/hudFocusCard/);
 assert.doesNotMatch(page,/className="hudMessages"/);
 assert.match(focus,/20_000/);
 assert.match(focus,/hudFocusRestore/);
 assert.match(focus,/hudImageInfoBackdrop/);
 assert.match(page,/askRef\.current\(text\)/);
 assert.match(page,/hudExiting/);
 assert.doesNotMatch(page,/of 3 free replies remaining/);
 assert.match(styles,/\.hudMatchCard/);
});

test("admin password proof is short-lived, role gated and never stores Shahada recordings",()=>{
 const saved=process.env.HUDHUD_ADMIN_GATE_SECRET;
 process.env.HUDHUD_ADMIN_GATE_SECRET="test-only-admin-gate-secret-do-not-use-live";
 try{
  const token=signAdminGate("admin-user-1");
  assert.equal(validAdminGate(token,"admin-user-1"),true);
  assert.equal(validAdminGate(token,"other-user"),false);
  assert.equal(validAdminGate(token+"tampered","admin-user-1"),false);
  assert.equal(validAdminGate(signAdminGate("admin-user-1",-5),"admin-user-1"),false);
 }finally{if(saved===undefined)delete process.env.HUDHUD_ADMIN_GATE_SECRET;else process.env.HUDHUD_ADMIN_GATE_SECRET=saved}
 const page=read("app/admin/security/page.tsx");
 const route=read("app/api/admin/security-recheck/route.ts");
 assert.match(page,/user\.app_metadata/);
 assert.match(page,/validAdminGate/);
 assert.match(page,/AdminPasswordGate/);
 assert.match(route,/signInWithPassword/);
 assert.match(route,/claim_search_api_quota/);
 assert.doesNotMatch(route,/shahada-safe-vault/);
});

test("location cue never interrupts Shahada or blocks the white Search Home",()=>{
 const location=read("app/components/LocationOnboarding.tsx");
 assert.match(location,/shahada_verified_at/);
 assert.match(location,/role="region"/);
 assert.match(location,/pointer-events:none!important/);
 assert.match(location,/setTimeout\(\(\)=>/);
 assert.doesNotMatch(location,/role="dialog" aria-modal="true"/);
});

test("Shared route-aware mobile chrome stays white on Search Home and supports day/night",()=>{
 const component=read("app/components/SiteChromeTheme.tsx");
 const root=read("app/layout.tsx");
 const global=read("app/globals.css");
 const manifest=read("app/manifest.ts");
 const search=read("app/search/page.tsx");
 const deepwatch=read("app/deepwatch/useDeepWatchSolarTheme.ts");
 assert.match(root,/SiteChromeTheme/);
 assert.match(root,/themeColor:"#ffffff"/);
 assert.match(root,/viewportFit:"cover"/);
 assert.match(component,/const LIGHT="#ffffff",DARK="#090c0b"/);
 assert.match(component,/root\.dataset\.oneChrome=night\?"night":"day"/);
 assert.match(component,/meta\[name="theme-color"\]/);
 assert.match(component,/1muslim:appearance-updated/);
 assert.match(component,/1muslim:route-appearance/);
 assert.match(search,/night:!homeMode&&resultsNight/);
 assert.match(deepwatch,/night:appearance\.night/);
 assert.match(global,/html\[data-one-chrome="day"\]/);
 assert.match(global,/html\[data-one-chrome="night"\]/);
 assert.match(manifest,/"theme_color": "#ffffff"/);
});


test("HudHud speech is AI-generated with a hard microphone playback barrier",()=>{
 const member=read("app/search/SearchMemberHome.tsx");
 const hudhud=read("app/hudhud/page.tsx");
 const window=read("app/components/HudHudChatWindow.tsx");
 const player=read("app/lib/hudhud-ai-voice-player.ts");
 const route=read("app/api/hudhud/speech/route.ts");
 const guard=read("lib/server/search-api-quota.ts");
 assert.match(member,/stopRecognition\(\);stopAudio\(\)/);
 assert.match(member,/micCooldown/);
 assert.match(member,/player\.play\(words,/);
 assert.match(hudhud,/setSpeechPending\(true\)/);
 assert.match(hudhud,/audioCooldown/);
 assert.match(window,/voiceBusy\.current/);
 assert.match(player,/audio\.pause\(\)/);
 assert.match(player,/\/api\/hudhud\/speech/);
 assert.match(route,/OPENAI_API_KEY/);
 assert.match(route,/voice:"marin"/);
 assert.match(route,/claimSearchQuota\(req,"voice"\)/);
 assert.match(guard,/globalDaily:900/);
 assert.doesNotMatch(member,/speechSynthesis/);
 assert.doesNotMatch(hudhud,/speechSynthesis/);
 assert.doesNotMatch(window,/SpeechSynthesisUtterance/);
});


test("Search Home display name stays inside the upper safe band with bounded pointer and pinch gestures",()=>{
 const member=read("app/search/SearchMemberHome.tsx");
 const movable=read("app/search/SearchDraggableDisplayName.tsx");
 const css=read("app/search/SearchDraggableDisplayName.module.css");
 assert.match(member,/memberId=\{member\?\.id\|\|null\}/);
 assert.match(member,/visibleName=\{displayedName\}/);
 assert.match(member,/onEdit=\{\(\)=>\{stopRecognition\(\)/);
 assert.match(member,/<SearchDraggableDisplayName[\s\S]+?<form className="smhSearchForm"/);
 assert.match(movable,/const MIN_SIZE=16/);
 assert.match(movable,/const MAX_SIZE=40/);
 assert.match(movable,/setPointerCapture\(event\.pointerId\)/);
 assert.match(movable,/current\.size\*distance\(a,b\)\/current\.distance/);
 assert.match(movable,/event\.clientX-current\.origin\.x/);
 assert.match(movable,/const edgeX=Math\.min\(\.5/);
 assert.match(movable,/const edgeY=Math\.min\(\.5/);
 assert.match(movable,/1muslim:home-name-layout:/);
 assert.match(movable,/moved\.current\|\|loadedFor!==memberId/);
 assert.match(movable,/case "ArrowLeft"/);
 assert.match(css,/touch-action:none/);
 assert.match(css,/overflow:hidden/);
 assert.match(css,/width:calc\(100vw - 24px\)/);
 assert.match(css,/max-height:calc\(100% - 12px\)/);
});

test("signed-in Search Home removes the microphone from the search pill but retains voice controls below",()=>{
 const home=read("app/search/SearchMemberHome.tsx");
 const css=read("app/search/search-member-home.css");
 const form=home.slice(home.indexOf('<form className="smhSearchForm"'),home.indexOf('</form>',home.indexOf('<form className="smhSearchForm"')));
 assert.doesNotMatch(form,/smhMic|toggleMic|<svg/);
 assert.match(form,/className="smhSubmit"/);
 assert.match(home,/listening\?<div className="smhListeningControls"/);
 assert.match(home,/className="smhListening smhListenControl" type="button" onClick=\{toggleMic\}/);
 assert.match(home,/aria-label="Pause HudHud microphone listening"/);
 assert.match(home,/\(paused\|\|!autoMicEnabled\)&&micPermission==="granted"/);
 assert.match(home,/>Resume listening</);
 assert.match(home,/micPermission==="denied"\|\|micPermission==="needs-tap"/);
 assert.match(home,/Enable microphone to speak/);
 assert.match(home,/\(listening\|\|speaking\|\|speechPending\|\|thinking\|\|paused\|\|!autoMicEnabled\|\|micPermission===/);
 assert.match(home,/className="smhHeaderSpeaker"/);
 assert.match(home,/onClick=\{toggleVoice\}/);
 assert.match(css,/\.smhListeningControls\{/);
 assert.match(css,/\.smhVoiceLine \.smhListenControl\{/);
 assert.doesNotMatch(css,/\.smhMic/);
 assert.match(css,/\.smhSubmit\{/);
});

test("Shahada uses HudHud animated guidance instead of green orb, keeping all recording and accessibility controls",()=>{
 const shahada=read("app/components/HudHudShahadaV2.tsx");
 const guide=read("app/components/HudHudShahadaGuide.tsx");
 const css=read("app/components/hudhud-shahada-v2.css");
 assert.match(shahada,/import HudHudShahadaGuide/);
 assert.doesNotMatch(shahada,/HudHudOrb|HudHudOrb compact|hudV2LockButton/);
 assert.match(shahada,/<HudHudShahadaGuide/);
 assert.match(shahada,/<h1>Shahada<\/h1>/);
 assert.match(shahada,/Start recording/);
 assert.match(shahada,/Pause<\/button>/);
 assert.match(shahada,/>Help<\/button>/);
 assert.match(shahada,/\{muted\?"Unmute":"Mute"\}/);
 assert.match(shahada,/>العربية<\/button>/);
 assert.match(shahada,/>English<\/button>/);
 assert.match(shahada,/getUserMedia/);
 assert.match(shahada,/MediaRecorder/);
 assert.match(shahada,/hasShahada/);
 assert.match(shahada,/60-elapsed/);
 assert.match(shahada,/shahada-safe-vault/);
 assert.match(shahada,/speechSynthesis/);
 assert.match(guide,/role="status"/);
 assert.match(guide,/aria-live="polite"/);
 assert.match(guide,/Recording · \{seconds\}s/);
 assert.match(guide,/prefers-reduced-motion/);
 assert.doesNotMatch(guide,/<input|<form/);
 assert.match(css,/\.hudV2GuideCard/);
 assert.match(css,/\.hudV2GuideTypewriter/);
 assert.doesNotMatch(css,/\.hudV2OrbZone|\.hudV2LockButton/);
});
