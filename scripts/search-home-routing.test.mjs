import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

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
  assert.doesNotMatch(page,/setTimeout\(\(\)=>router\.(?:push|replace)/);
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

test("Shahada only returns explicitly requested profile flows to Profile",()=>{
  const onboard=read("app/onboarding/page.tsx");
  assert.equal((onboard.match(/get\("return"\)==="profile"\?"\/profile":"\/search"/g)||[]).length,2);
});

test("Home tab opens Search and Profile remains a distinct destination",()=>{
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(nav,/{id:"search",label:"Home",href:"\/search"}/);
  assert.match(nav,/{id:"profile",label:"Profile",href:"\/profile"}/);
  assert.match(nav,/router\.push\("\/search"\)/);
});


test("signed-in Search Home is centered and preserves the real search implementation",()=>{
  const page=read("app/search/page.tsx");
  const css=read("app/search/search.css");
  assert.match(page,/const homeMode=!query\.trim\(\)/);
  assert.match(page,/<h1 className="dsHomeBrand" aria-hidden=\{!homeMode\}/);
  assert.match(page,/className="dsSearchForm" role="search"/);
  assert.match(page,/creators\.slice\(0,4\)/);
  assert.match(page,/\/api\/discover\/creators/);
  assert.match(page,/\/api\/discover\/search/);
  assert.match(page,/className="dsCategoryBar"/);
  assert.match(css,/\.dsHomeMode \.dsCategoryBar\{display:none\}/);
  assert.match(page,/!homeMode&&!loading&&!error&&result/);
  assert.match(page,/!homeMode&&loading/);
  assert.match(css,/\.dsHomeMode \.dsSearchForm/);
  assert.match(css,/\.dsHomeMode \.dsCreatorList/);
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
