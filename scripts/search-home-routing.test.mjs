import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("signed-in entry and restored sessions open Search Home",()=>{
  const root=read("app/page.tsx");
  assert.equal((root.match(/router\.replace\("\/search"\)/g)||[]).length,2);
  assert.doesNotMatch(root,/router\.replace\("\/profile"\)/);
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

test("new visitors keep the guest landing, while its sign-in buttons open Search Home",()=>{
  const home=read("app/page.tsx");
  assert.match(home,/return <GuestWelcomeHome\/>/);
  const guest=read("app/components/GuestWelcomeHome.tsx");
  assert.equal((guest.match(/next=%2Fsearch/g)||[]).length,4);
  assert.doesNotMatch(guest,/next=%2Fprofile/);
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
  assert.match(page,/\/api\/discover\/ask/);
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
