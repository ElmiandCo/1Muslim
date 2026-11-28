import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {selectHudHudPresentation} from "../app/lib/hudhud-presentation.ts";
import {selectHudHudProductAnswer} from "../app/lib/hudhud-product-knowledge.ts";
import {isHudHudLinkRequest} from "../app/lib/hudhud-top-web.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Natural HudHud voice photo question is always an image-first presentation",()=>{
 assert.deepEqual(selectHudHudPresentation("HudHud, let me see a picture of a Dog."),{kind:"image",query:"Dog"});
 assert.deepEqual(selectHudHudPresentation("hey HudHud show me a photo of a cat"),{kind:"image",query:"cat"});
 assert.deepEqual(selectHudHudPresentation("Can I see an image of a cat?"),{kind:"image",query:"cat"});
 assert.deepEqual(selectHudHudPresentation("Does Islam mention pictures?"),{kind:"text"});
 const api=read("app/api/discover/ask/route.ts");
 assert.ok(api.includes('if(presentation.kind==="image")'));
 assert.ok(api.includes("searchImages(presentation.query)"));
 assert.ok(api.includes("images:[selected]"));
});

test("HudHud only adds external links when someone requests one",()=>{
 assert.equal(isHudHudLinkRequest("HudHud, what's a dog?"),false);
 assert.equal(isHudHudLinkRequest("What does the Quran say about mercy?"),false);
 assert.equal(isHudHudLinkRequest("Tell me about One Muslim"),false);
 assert.equal(isHudHudLinkRequest("Give me a link to the Quran website"),true);
 assert.equal(isHudHudLinkRequest("Find a website about Islam"),true);
 assert.ok(read("app/lib/hudhud-top-web.ts").includes("!isHudHudLinkRequest(query)"));
});

test("First-party apps appear as real clickable cards for guests and members, not generic religious questions",()=>{
 const q=selectHudHudProductAnswer("Open the Qur'an reader",[],false);
 assert.ok(q&&q.matches.length===1&&q.matches[0].href==="/quran-library");
 const compass=selectHudHudProductAnswer("Show me your Qibla Compass",[],false);
 assert.equal(compass?.matches?.[0]?.href,"/profile?compass=1");
 const apps=selectHudHudProductAnswer("What apps does 1Muslim have?",[],true);
 assert.ok(apps&&apps.matches.length>=2&&apps.matches.every(x=>x.href.startsWith("/")));
 assert.equal(selectHudHudProductAnswer("Explain Qur'an 2:255 in detail",[],true),null);
 assert.equal(selectHudHudProductAnswer("What is a business?",[],true),null);
 assert.equal(selectHudHudProductAnswer("Please tell me the capital of France",[],true),null);
 const renderer=read("app/hudhud/HudHudFocusStage.tsx");
 assert.ok(renderer.includes('match.image?.startsWith("/assets/")'));
});

test("Coming-soon concepts are not advertised until asked; no fictional shop launch",()=>{
 assert.equal(selectHudHudProductAnswer("As-salamu alaykum",[],false),null);
 const first=selectHudHudProductAnswer("What is One Muslim Shop?",[],false);
 assert.equal(first?.matches?.[0]?.kind,"Coming soon");
 assert.ok(first?.reply.includes("coming-soon")||first?.reply.includes("coming"));
 const repeat=selectHudHudProductAnswer("What about your business?",[{content:"What about the shop?"},{content:"When is One Muslim Shop coming?"}],true);
 assert.ok(repeat?.reply.includes("Halal Market"));
 assert.ok(repeat?.reply.includes("Nothing is launched yet"));
 assert.equal(selectHudHudProductAnswer("Am I signed in?",[],false)?.matches[0].href,"/auth");
 assert.equal(selectHudHudProductAnswer("Am I signed in?",[],true)?.matches.length,0);
});
