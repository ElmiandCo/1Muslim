import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const page = read("app/search/page.tsx");
const css = read("app/search/search.css");

test("Search Home keeps one field and reveals categories and results for a query", () => {
  assert.equal((page.match(/role="search"/g) || []).length, 1);
  assert.match(page, /!query\.trim\(\)&&<div className="dsHomeIntro"/);
  assert.match(page, /query\.trim\(\)&&<div className="dsCategoryBar"/);
  assert.match(page, /query\.trim\(\)\.length>=2&&!loading&&!error&&result/);
  assert.match(page, /\/api\/discover\/search\?q=/);
  assert.match(page, /\/api\/discover\/creators/);
  assert.match(page, /data\.recommended\.slice\(0,7\)/);
  assert.match(page, /window\.addEventListener\("popstate",syncQuery\)/);
  assert.match(page, /window\.history\.pushState/);
});

test("HudHud docks before interaction and uses the existing assistant", () => {
  assert.match(page, /setTimeout\(\(\)=>setHudDocked\(true\),1000\)/);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.match(page, /disabled=\{!hudDocked\} onClick=\{\(\)=>void openHudHud\(\)\}/);
  assert.match(page, /\/api\/discover\/ask/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.dsLiveSuffix\{animation:none/);
});

test("account shortcuts and navigation removal are scoped to Search", () => {
  assert.match(page, /href="\/settings" aria-label="Settings"/);
  assert.match(page, /href="\/profile" aria-label="Profile"/);
  assert.match(page, /window\.confirm\("Sign out of 1Muslim\?"\)/);
  assert.match(page, /auth\.signOut\(\)/);
  assert.match(css, /html:has\(\.dsPage\) body\{padding-bottom:0!important/);
  assert.match(css, /width:44px;height:44px/);
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(nav, /pathname==="\/search"\|\|pathname\?\.startsWith\("\/onboarding"\)/);
  assert.doesNotMatch(nav, /pathname\?\.startsWith\("\/search"\)\|\|pathname\?\.startsWith\("\/onboarding"\)/);
});
