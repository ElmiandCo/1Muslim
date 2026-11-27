import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
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

test("auth defaults to Search Home but preserves explicit deep links",()=>{
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
  assert.match(callback,/\$\{origin\}\$\{next\}/);
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

test("Shahada admission returns directly to prior work without forcing profile gender",()=>{
 const onboard=read("app/components/HudHudShahadaV2.tsx");
 const route=read("app/onboarding/page.tsx");
 assert.match(onboard,/shahada_verified_at/);
 assert.match(onboard,/if\(onComplete\)\{onComplete\(\);return\}/);
 assert.match(onboard,/1muslim:auth-return/);
 assert.match(route,/<HudHudShahadaV2\/>/);
 assert.doesNotMatch(route,/ShahadaOnboardingExperience/);
});

test("Home tab opens Search and Profile remains a distinct destination",()=>{
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(nav,/{id:"search",label:"Home",href:"\/search"}/);
  assert.match(nav,/{id:"profile",label:"Profile",href:"\/profile"}/);
  assert.match(nav,/router\.push\("\/search"\)/);
});


test("Search Home retains real search and replaces creators and shortcut pills with two swipable card rows",()=>{
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
  assert.match(rail,/const rows: Destination\[\]\[\]/);
  assert.match(rail,/rows\.map\(\(items,index\)=>/);
  assert.match(rail,/href:"\/profile\?compass=1"/);
  assert.match(profile,/get\("compass"\)==="1"/);
  assert.match(railCss,/scroll-snap-type:x mandatory/);
  assert.match(railCss,/overflow-x:auto/);
  assert.match(railCss,/border:0/);
  assert.match(railCss,/\.dsHomeFeatureBreathingSpace\{height:205px/);
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
  assert.match(page,/href="\/settings" aria-label="Settings"/);
  assert.match(page,/href="\/profile" aria-label="Profile"/);
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
  assert.match(page,/className="dsHomeBrandLive" aria-hidden="true">\.live/);
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

test("results header reuses the animated One Muslim.live brand at the top left",()=>{
  const page=read("app/search/page.tsx");
  const css=read("app/search/search.css");
  const resultCss=read("app/search/search-results.css");
  assert.match(page,/!homeMode&&<Link href="\/search" className="dsResultsBrand"/);
  assert.match(page,/className="dsHomeBrandLive" aria-hidden="true">\.live/);
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
 assert.match(page,/HudHudOrb/);
 assert.match(page,/HudHudVerseCard/);
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
