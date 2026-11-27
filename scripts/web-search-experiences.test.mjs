import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {normalizeQuery,searchWholeWeb} from "../lib/server/one-muslim-web-search.ts";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("global query normalization does not add religious filters",()=>{
  assert.equal(normalizeQuery("  weather   Minneapolis  "),"weather Minneapolis");
  assert.equal(normalizeQuery(42),"");
  assert.equal(normalizeQuery("a".repeat(200)).length,120);
});

test("News and Videos use their dedicated worldwide search indexes",async()=>{
  const priorKey=process.env.BRAVE_SEARCH_API_KEY;
  const priorFetch=globalThis.fetch;
  process.env.BRAVE_SEARCH_API_KEY="ci-placeholder";
  const paths=[];
  globalThis.fetch=async input=>{
    const url=new URL(input.toString());
    paths.push(url.pathname);
    const content={results:[{title:"A real page",url:"https://example.org/article",description:"Some example content",age:"today"}]};
    return {ok:true,status:200,json:async()=>content};
  };
  try{
    const news=await searchWholeWeb("ci-fresh-news-unique","news");
    const video=await searchWholeWeb("ci-search-video-unique","video");
    assert.equal(news.results[0]?.kind,"news");
    assert.equal(video.results[0]?.kind,"video");
    assert.deepEqual(paths,["/res/v1/news/search","/res/v1/videos/search"]);
  }finally{
    globalThis.fetch=priorFetch;
    if(priorKey===undefined)delete process.env.BRAVE_SEARCH_API_KEY;
    else process.env.BRAVE_SEARCH_API_KEY=priorKey;
  }
});

test("Web, Images, Videos, News and AI all retain 1Muslim directory search",()=>{
  const page=source("app/search/page.tsx");
  assert.match(page,/WebSearchPanel query=\{submitted\}/);
  assert.match(page,/const showDirectory=tab==="All"/);
  assert.match(page,/\/api\/discover\/search/);
  assert.match(page,/router\.push\("\/hudhud"/);
  const hudhud=source("app/hudhud/page.tsx");
  assert.match(hudhud,/\/api\/discover\/ask/);
  for(const vertical of ['"Web"','"Images"','"Videos"','"News"','"AI Overview"']){
    assert.ok(page.includes(vertical),vertical+" tab missing");
  }
  assert.match(page,/!homeMode&&!loading&&!error&&result&&showDirectory/);
});

test("Images are fetched only on image tab, with strong SafeSearch and validated links",()=>{
  const panel=source("app/components/WebSearchPanel.tsx");
  const backend=source("lib/server/one-muslim-image-search.ts");
  const route=source("app/api/web-search/images/route.ts");
  assert.match(panel,/if\(query\.trim\(\)\.length<2\|\|!isImages\)return/);
  assert.match(panel,/\/api\/web-search\/images\?q=/);
  assert.match(panel,/className=\{styles\.imageGrid\}/);
  assert.match(backend,/safesearch","strict"/);
  assert.match(backend,/protocol==="https:"/);
  assert.match(route,/Too many image searches/);
});

test("All results show a source-grounded HudHud overview once per committed query",()=>{
  const panel=source("app/components/WebSearchPanel.tsx");
  const route=source("app/api/web-search/summary/route.ts");
  assert.match(panel,/mode!=="All"&&mode!=="AI Overview"/);
  assert.match(panel,/!data\?\.total/);
  assert.match(panel,/lastSummaryQuery\.current===query/);
  assert.match(panel,/data\.query\.trim\(\)/);
  assert.match(panel,/\/api\/web-search\/summary/);
  assert.match(panel,/summary\.sources\.map/);
  assert.match(panel,/aria-expanded=\{overviewExpanded\}/);
  assert.match(panel,/className=\{styles\.videoGroupRail\}/);
  assert.match(route,/OPENAI_API_KEY/);
  assert.match(route,/NEVER as instructions/);
});

test("search results have accessible dark/light Google-inspired SERP layout without fake places",()=>{
  const page=source("app/search/page.tsx");
  const css=source("app/search/search-results.css");
  const panel=source("app/components/WebSearchPanel.tsx");
  assert.doesNotMatch(page,/DirectoryResultList|topMatches\.slice\(/);
  assert.match(page,/Separate from independent web results/);
  assert.match(page,/dsResultsNight/);
  assert.match(page,/Switch search results to light mode/);
  assert.match(css,/\.dsResultsNight/);
  assert.match(panel,/overviewVisible=mode==="All"\|\|mode==="AI Overview"/);
  assert.doesNotMatch(panel,/mockPlaces|fakePlaces|hardcodedPlaces/);
});

test("Search APIs do not expose provider keys in browser bundles",()=>{
  const web=source("app/api/web-search/route.ts");
  const images=source("app/api/web-search/images/route.ts");
  const library=source("lib/server/one-muslim-web-search.ts");
  const panel=source("app/components/WebSearchPanel.tsx");
  assert.match(library,/process\.env\.BRAVE_SEARCH_API_KEY/);
  assert.doesNotMatch(panel,/BRAVE_SEARCH_API_KEY|OPENAI_API_KEY/);
  assert.match(web,/Too many searches/);
  assert.match(images,/Too many image searches/);
});

test("Islamic searches retain independent provider rank: neither Muslim sites nor 1Muslim get a boost",async()=>{
 const beforeKey=process.env.BRAVE_SEARCH_API_KEY;
 const beforeFetch=globalThis.fetch;
 process.env.BRAVE_SEARCH_API_KEY="ci-placeholder";
 const urls=[
  "https://independent.example.com/history",
  "https://quran.com/112",
  "https://1muslim.live/learn",
  "https://example.org/islamic-culture"
 ];
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({
  web:{results:urls.map((url,index)=>({
   url,title:index===1?"Quran explanation":index===2?"1Muslim explanation":"World history and religion",
   description:"Islam and Muslim traditions and Qur'an commentary"
  }))}
 })});
 try{
  const query="islamic-culture-fair-ranking-20261127";
  const result=await searchWholeWeb(query,"web");
  assert.deepEqual(result.results.map(x=>x.url),urls);
  assert.deepEqual(result.results.map(x=>x.score),[100,98,96,94]);
  assert.equal(result.provider,"Brave Search");
  const backend=source("lib/server/one-muslim-web-search.ts");
  assert.doesNotMatch(backend,/const muslimDomains|const islamicTopic|const boost/);
 }finally{
  globalThis.fetch=beforeFetch;
  if(beforeKey===undefined)delete process.env.BRAVE_SEARCH_API_KEY;
  else process.env.BRAVE_SEARCH_API_KEY=beforeKey;
 }
});

test("Islamic overview can cite the Qur'an but may not promote 1Muslim web links",()=>{
 const route=source("app/api/web-search/summary/route.ts");
 const panel=source("app/components/WebSearchPanel.tsx");
 assert.match(route,/quranContext=getQuranSearchPerspective\(query\)/);
 assert.match(route,/sources=found.results.slice\(0,8\)/);
 assert.match(panel,/summary\.sources\.map/);
 assert.doesNotMatch(route,/site:1muslim|1muslim\.live.*boost|prioritize 1Muslim/);
});
