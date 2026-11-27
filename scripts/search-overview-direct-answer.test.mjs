import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {startSearchOverviewWithAnswer} from "../lib/server/search-overview-prose.ts";

test("AI Overview opens with the answer for general prayer searches",()=>{
 const original="The search query about \"praying\" yields various perspectives on the act of prayer. It is described as a means of communication with God, involving both personal supplication and a deeper spiritual connection. [1]";
 const answer=startSearchOverviewWithAnswer("praying",original);
 assert.equal(answer,"Praying is described as a means of communication with God, involving both personal supplication and a deeper spiritual connection. [1]");
 assert.doesNotMatch(answer,/^(?:The query|The search query)/i);
});

test("AI Overview opens with the Islamic subject instead of narrating the query",()=>{
 const original="The query pertains to the practice of praying in Islam, known as Salah or Salat. It is one of the five pillars of Islam and is performed five times daily. [2]";
 const answer=startSearchOverviewWithAnswer("praying in islam",original);
 assert.equal(answer,"Praying in Islam, known as Salah or Salat, is one of the five pillars of Islam and is performed five times daily. [2]");
 assert.doesNotMatch(answer,/^(?:The query|The search query)/i);
});

test("Direct answers and citation markers are not changed",()=>{
 const answer="Praying is an act of worship or supplication. [1] In Islam, salah is performed five times daily. [2]";
 assert.equal(startSearchOverviewWithAnswer("praying",answer),answer);
});

test("Both Muslim-specific and general overview prompts forbid query boilerplate",()=>{
 const route=readFileSync(new URL("../app/api/web-search/summary/route.ts",import.meta.url),"utf8");
 assert.equal((route.match(/Answer the subject immediately in the FIRST sentence/g)||[]).length,2);
 assert.match(route,/Never force an Islamic perspective onto a general query/);
 assert.match(route,/startSearchOverviewWithAnswer\(query,text\)/);
 assert.match(route,/numbered source markers like \[1\]/);
});
