import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { canStartAdminVoice } from "../app/api/admin/hudhud-voice/authorization.ts";

test("only the authenticated owner email is allowed", () => {
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com" }, null), true);
  assert.equal(canStartAdminVoice({ email: "HUDHUDBYELMI@gmail.com" }, null), true);
  assert.equal(canStartAdminVoice(null, null), false);
  assert.equal(canStartAdminVoice({}, null), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com" }, null), false);
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com.evil.test" }, null), false);
});

test("authentication errors and unapproved role or name claims fail closed", () => {
  assert.equal(canStartAdminVoice({ email: "hudhudbyelmi@gmail.com" }, new Error("auth failed")), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com", role: "admin" }, null), false);
  assert.equal(canStartAdminVoice({ email: "other@example.com", role: "vp", name: "Sav" }, null), false);
});

import {selectHudHudPresentation} from "../app/lib/hudhud-presentation.ts";
import {normalizeSpokenHudHudQuestion} from "../app/lib/hudhud-speech.ts";

test("HudHud parses clearly spoken Quran references without rewriting unrelated words",()=>{
 assert.equal(normalizeSpokenHudHudQuestion("Show me Quran verse nine sixteen"),"Show me Qur'an 9:16");
 assert.equal(normalizeSpokenHudHudQuestion("Read surah two verse two hundred fifty five"),"Read Surah 2 verse 255");
 assert.equal(normalizeSpokenHudHudQuestion("Where does Allah say He guides whom He wills?"),"Where does Allah say He guides whom He wills?");
 assert.equal(normalizeSpokenHudHudQuestion("Quran verse ninety nine"),"Quran verse ninety nine");
});

test("HudHud shows a single verified verse instead of six unrelated results",()=>{
 assert.deepEqual(selectHudHudPresentation("Give me one verse from the Quran"),{kind:"verse",verseKey:"1:1"});
 assert.deepEqual(selectHudHudPresentation("Show me Surah 2 verse 255"),{kind:"verse",verseKey:"2:255"});
 assert.deepEqual(selectHudHudPresentation("Quote Qur'an 112:1"),{kind:"verse",verseKey:"112:1"});
});
test("HudHud resolves a natural-language request for Allah guiding whom He wills",()=>{
 assert.deepEqual(selectHudHudPresentation("Where does Allah say in the Quran that Allah guides whom He wills?"),{kind:"verse",verseKey:"2:272"});
 assert.deepEqual(selectHudHudPresentation("Which verse says Allah guides whom he wills"),{kind:"verse",verseKey:"2:272"});
 assert.deepEqual(selectHudHudPresentation("Why does Allah guide me?"),{kind:"text"});
});

test("HudHud recognizes explicit cat images without converting unrelated questions into image searches",()=>{
 assert.deepEqual(selectHudHudPresentation("Can I see an image of a cat?"),{kind:"image",query:"cat"});
 assert.deepEqual(selectHudHudPresentation("Show me a picture of a fluffy cat"),{kind:"image",query:"fluffy cat"});
 assert.deepEqual(selectHudHudPresentation("Find photos of sunsets"),{kind:"image",query:"sunsets"});
 assert.deepEqual(selectHudHudPresentation("Does Allah mention cats?"),{kind:"text"});
});

test("HudHud never substitutes an unrelated default verse for a themed question",()=>{
 assert.deepEqual(selectHudHudPresentation("What does the Qur'an say about patience?"),{kind:"text"});
 assert.deepEqual(selectHudHudPresentation("Find a Quran verse about mercy"),{kind:"text"});
 assert.deepEqual(selectHudHudPresentation("Show me surah 999 verse 500"),{kind:"text"});
});
test("HudHud only recommends site results for site-content discovery",()=>{
 assert.deepEqual(selectHudHudPresentation("Find DeepWatch videos"),{kind:"results"});
 assert.deepEqual(selectHudHudPresentation("Show members on the app"),{kind:"results"});
 assert.deepEqual(selectHudHudPresentation("What is the capital of France?"),{kind:"text"});
});

test("asking for a verse interpretation is not silently reduced to only its citation",()=>{
 assert.deepEqual(selectHudHudPresentation("Explain Quran 2:255 and its meaning"),{kind:"text"});
 assert.deepEqual(selectHudHudPresentation("What is the context of Surah 112 verse 1?"),{kind:"text"});
});

test("HudHud account memory uses separate RLS-isolated AI chat storage, not legacy CRM",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261127090000_hudhud_opt_in_conversation_memory.sql",import.meta.url),"utf8");
 const route=readFileSync(new URL("../app/api/hudhud/memory/route.ts",import.meta.url),"utf8");
 assert.match(sql,/create table if not exists public\.hudhud_ai_chat_sessions/);
 assert.match(sql,/alter table public\.hudhud_ai_chat_sessions enable row level security/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/p\.enabled/);
 assert.doesNotMatch(sql,/create table if not exists public\.hudhud_conversations\s*\(/);
 assert.match(route,/"hudhud_ai_chat_sessions"/);
 assert.doesNotMatch(route,/\.from\("hudhud_conversations"\)/);
 assert.match(route,/body\.action==="preference"/);
 assert.match(route,/body\.action==="clear"/);
});

test("HudHud does not show broken Yes/No feedback controls under replies",()=>{
 const page=readFileSync(new URL("../app/hudhud/page.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../app/hudhud/hudhud.css",import.meta.url),"utf8");
 assert.doesNotMatch(page,/hudQuickChoices|Was this the verse you wanted\?|Was this helpful\?/);
 assert.doesNotMatch(page,/ask\(undefined,"Yes, thank you\."\)/);
 assert.doesNotMatch(css,/\.hudQuickChoices/);
 // Users may still ask follow-up questions in the existing composer.
 assert.match(page,/className="hudComposer"/);
});

test("HudHud automatically starts after permission, pauses while speaking, and retries quiet windows",()=>{
 const page=readFileSync(new URL("../app/hudhud/page.tsx",import.meta.url),"utf8");
 assert.match(page,/\[autoListening,setAutoListening\]=useState\(true\)/);
 assert.match(page,/const \[micPaused,setMicPaused\]=useState\(false\)/);
 assert.match(page,/if\(!autoListening\|\|micPaused\|\|micAccess!=="granted"/);
 assert.match(page,/listening\|\|busy\|\|speaking\|\|speechPending/);
 assert.match(page,/const timer=setTimeout\(\(\)=>startVoice\("auto"\),350\)/);
 assert.match(page,/pageVisible,listening,busy,speaking,speechPending/);
 assert.match(page,/rec\.onend=\(\)=>\{/);
 assert.match(page,/rec\.onresult=event=>\{/);
 assert.match(page,/event\.results\[i\]\.isFinal/);
 assert.match(page,/askRef\.current\(text\)/);
 assert.match(page,/stopVoice\(true\)/);
 assert.match(page,/setMicPaused\(true\)/);
 assert.match(page,/onFocus=\{\(\)=>\{setFocused\(true\);stopVoice\(true\)\}\}/);
 assert.match(page,/Start after permission; pauses while HudHud speaks or you type/);
 assert.doesNotMatch(page,/Allowed · only listens after you tap the mic/);
});

test("HudHud fourth turn does not violate legacy three-turn database constraint",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261127112000_fix_hudhud_v2_turn_limit.sql",import.meta.url),"utf8");
 const api=readFileSync(new URL("../app/api/discover/ask/route.ts",import.meta.url),"utf8");
 assert.match(sql,/drop constraint if exists discover_hudhud_usage_turns_used_check/);
 assert.match(sql,/turns_used >= 0 and turns_used <= 50/);
 assert.match(api,/const FREE_TURNS = 50;/);
 assert.match(api,/reserve_hudhud_v2_turn/);
 assert.match(api,/refund_discover_hudhud_turn/);
 assert.match(api,/HUDHUD_FALLBACK_MODEL\|\|"gpt-4o"/);
 assert.match(api,/phase="reserve-turn"/);
});
