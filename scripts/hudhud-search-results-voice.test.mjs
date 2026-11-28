import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {editHudHudSearchQuery} from "../app/lib/hudhud-search-voice-edit.ts";

const act=(spoken,current="",previous=null)=>editHudHudSearchQuery(spoken,current,previous);
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Dictation edits text without accidentally submitting search",()=>{
 assert.deepEqual(act("Prophet Muhammad"),{action:"edit",next:"Prophet Muhammad",message:"Search updated"});
 assert.equal(act("biography","Prophet Muhammad").next,"Prophet Muhammad biography");
 assert.equal(act("dictate Islamic history","another topic").next,"Islamic history");
});
test("Search only fires on a deliberate search command",()=>{
 assert.equal(act("search that","Prophet Muhammad").action,"search");
 assert.equal(act("show results","Muhammad").action,"search");
 assert.equal(act("search that","").action,"ignore");
 assert.equal(act("edit the phrase","Muhammad").action,"edit");
});
test("Clear, remove, replace and undo preserve the current idea",()=>{
 assert.equal(act("erase the search","Prophet Muhammad").next,"");
 assert.equal(act("remove word Muhammad","Prophet Muhammad biography").next,"Prophet biography");
 assert.equal(act("erase this word","Prophet Muhammad biography").next,"Prophet Muhammad");
 assert.equal(act("replace Muhammad with Ibrahim","Prophet Muhammad biography").next,"Prophet Ibrahim biography");
 assert.equal(act("undo that","new text","previous text").next,"previous text");
 assert.equal(act("undo that","new text",null).action,"ignore");
 assert.equal(act("remove word nonexistent","Prophet Muhammad").action,"ignore");
});
test("Malicious-looking speech is text only and cannot become navigation or a tool action",()=>{
 const result=act("open javascript:alert(1)","Qur'an");
 assert.equal(result.action,"edit");
 assert.ok(result.next.includes("javascript"));
 assert.ok(result.next.length<=90);
 assert.equal(act("delete all posts","Qur'an").action,"edit");
});
test("Signed-in Search keeps a real results mode during voice edits and routes to /hudhud",()=>{
 const page=source("app/search/page.tsx");
 const member=source("app/search/SearchMemberHome.tsx");
 const voice=source("app/search/SearchResultsHudHudVoice.tsx");
 assert.match(page,/const homeMode=!resultsOpened&&!submitted\.trim\(\)/);
 assert.match(page,/if\(account==="member"&&!showAuth&&homeMode\)return <SearchMemberHome/);
 assert.match(page,/<SearchResultsHudHudVoice query=\{query\}/);
 assert.match(page,/setResultsOpened\(true\)/);
 assert.match(member,/Search All Results ↗/);
 assert.match(member,/Explore 1Muslim <span aria-hidden="true">↗/);
 assert.match(voice,/onOpenHudHud/);
 assert.match(voice,/if\(!item\?\.isFinal\)continue/);
 assert.doesNotMatch(voice,/new Audio\(|speechSynthesis\.speak\(/);
});
