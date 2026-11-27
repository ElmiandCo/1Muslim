import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {getQuranSearchPerspective} from "../lib/server/quran-search-perspective.ts";
const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("alcohol gives Qur'an-first prohibition, not a generic drug-only overview",()=>{
 const p=getQuranSearchPerspective("alcohol");
 assert.ok(p);
 assert.match(p.lead,/consuming intoxicating drinks is haram/);
 assert.match(p.lead,/Qur'an 5:90–91/);
 assert.match(p.lead,/Qur'an 2:219/);
 assert.equal(p.citations[0].url,"https://quran.com/5/90-91");
 assert.equal(p.citations[1].url,"https://quran.com/2/219");
 assert.doesNotMatch(p.lead,/guidance/i);
});

test("ordinary chemical and emergency questions must not receive blanket beverage rulings",()=>{
 for(const query of [
  "drinking water","is drinking water good","alcohol poisoning emergency",
  "alcohol withdrawal","rubbing alcohol for cleaning","alcohol in hand sanitizer",
  "wine vinegar","ethanol production chemical formula","alcohol based perfume"
 ]){
  assert.equal(getQuranSearchPerspective(query),null,query);
 }
});

test("religious context is selectively applied to proven references",()=>{
 assert.match(getQuranSearchPerspective("gambling online")?.lead||"",/gambling is prohibited/i);
 assert.match(getQuranSearchPerspective("pork")?.lead||"",/eating pork is prohibited/i);
 assert.match(getQuranSearchPerspective("riba")?.lead||"",/prohibits riba/i);
 assert.equal(getQuranSearchPerspective("stock market trends"),null);
 assert.equal(getQuranSearchPerspective("weather Minneapolis"),null);
 assert.equal(getQuranSearchPerspective("AI development"),null);
});

test("HudHud search renders Qur'an from reviewed sources before objective web snippets",()=>{
 const api=source("app/api/web-search/summary/route.ts");
 const panel=source("app/components/WebSearchPanel.tsx");
 const css=source("app/components/WebSearchPanel.module.css");
 assert.match(api,/getQuranSearchPerspective\(query\)/);
 assert.match(api,/quranContext/);
 assert.match(api,/Do not call this 'guidance'/);
 assert.match(api,/NEVER invent scripture/);
 assert.match(panel,/summary\.quranContext\.lead/);
 assert.match(panel,/summary\.quranContext\.citations\.map/);
 assert.match(panel,/!summary\.quranContext&&overviewThumbnail/);
 assert.match(panel,/summary\.sources\.map/);
 assert.match(css,/\.quranContext\{/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
