import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 cleanHudHudPersonalText,containsRestrictedHudHudSecret,
 verifiedHudHudNotes,parseHudHudRememberRequest,
 isHudHudIdentityQuestion,hudHudPersonalPrompt,hudHudIdentityAnswer
} from "../app/lib/hudhud-member-context.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("HudHud answers 'do you know me' using authenticated profile, not a generic denial",()=>{
 const mock={signedIn:true,storeReady:true,profile:{
  displayName:"1Muslim President",username:"member_one",bio:"Founder and creator",memberSince:"2026-01-01"
 },privateContext:{aboutMe:"I build software",answerPreferences:"Short answers",
  notes:[{id:"test",text:"I prefer concise guidance",savedAt:"2026-11-28T00:00:00Z",source:"user"}],
  allowRememberRequests:true,updatedAt:null}};
 assert.ok(isHudHudIdentityQuestion("HudHud, do you know me?"));
 assert.ok(isHudHudIdentityQuestion("Do you know who I am?"));
 assert.ok(isHudHudIdentityQuestion("What is my name?"));
 const answer=hudHudIdentityAnswer(mock);
 assert.ok(answer.includes("1Muslim President"));
 assert.ok(answer.includes("cannot see your password"));
 assert.doesNotMatch(answer,/don't actually know who you are|unless you tell me/i);
 const context=hudHudPersonalPrompt(mock);
 assert.ok(context.includes("1Muslim President"));
 assert.ok(context.includes("I build software"));
 assert.ok(context.includes("Short answers"));
 assert.ok(context.includes("I prefer concise guidance"));
 assert.doesNotMatch(context,/password\s*[:=]/i);
 assert.ok(hudHudPersonalPrompt({...mock,signedIn:false}).includes("not signed in"));
});

test("HudHud never trusts client-selected userId or a visitor's claim to a profile",()=>{
 const api=read("app/api/discover/ask/route.ts");
 assert.ok(api.includes("const memberContext=await loadHudHudMemberSnapshot(auth.db,auth.userId)"));
 assert.ok(api.includes("hudHudPersonalPrompt(memberContext)"));
 assert.ok(api.includes("hudHudIdentityAnswer(memberContext)"));
 assert.ok(api.includes("userId: user?.id||null"));
 assert.ok(!api.includes("body.userId"));
 const server=read("app/lib/hudhud-member-context.ts");
 assert.ok(server.includes('.eq("id",userId)'));
 assert.ok(server.includes('.eq("user_id",userId)'));
 assert.ok(server.includes("hide_1muslim_id"));
 assert.ok(!server.includes(".select(\"*\""));
});

test("Member can teach HudHud only on explicit instruction and opt-in",()=>{
 assert.equal(parseHudHudRememberRequest("Hey HudHud, remember that I like short answers."),"I like short answers");
 assert.equal(parseHudHudRememberRequest("remember this: I am building a platform"),"I am building a platform");
 assert.equal(parseHudHudRememberRequest("Tell me about forgiveness"),null);
 assert.equal(cleanHudHudPersonalText("My preference is step-by-step answers",400),"My preference is step-by-step answers");
 assert.equal(cleanHudHudPersonalText("My password is hunter2",400),null);
 assert.ok(containsRestrictedHudHudSecret("My API key is SECRET"));
 assert.ok(containsRestrictedHudHudSecret("sk-00000000000000000000"));
 assert.equal(cleanHudHudPersonalText("x".repeat(401),400),null);
 const route=read("app/api/hudhud/context/route.ts");
 assert.ok(route.includes('action==="remember"&&row?.allow_remember_requests!==true'));
 assert.ok(route.includes('action==="delete-note"'));
 assert.ok(route.includes('action==="clear"'));
 assert.ok(route.includes('cleanHudHudPersonalText(body.aboutMe,6000)'));
 assert.ok(route.includes('cleanHudHudPersonalText(body.answerPreferences,2000)'));
 assert.ok(route.includes('action==="add-note"'));
 assert.ok(route.includes("Never"));
});

test("Only private owner RLS storage; no passwords, raw audio, or private data in public profiles",()=>{
 const sql=read("supabase/migrations/20261128123000_hudhud_personal_context.sql");
 assert.match(sql,/create table if not exists public\.hudhud_personal_context/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.hudhud_personal_context from public,anon/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/references auth\.users\(id\) on delete cascade/);
 assert.match(sql,/allow_remember_requests boolean not null default false/);
 const api=read("app/api/hudhud/context/route.ts");
 assert.ok(api.includes('const {data:{user},error}=await db.auth.getUser()'));
 assert.ok(api.includes('headers={"Cache-Control":"private, no-store"'));
 assert.ok(!api.includes('from("profiles").update('));
 const validated=verifiedHudHudNotes([
  {id:"1",text:"I like gentle reminders",savedAt:"2026-11-28",source:"hudhud"},
  {id:"2",text:"password is hunter2",savedAt:"2026-11-28",source:"user"}
 ]);
 assert.equal(validated.length,1);
});

test("Venn settings are editable, reversible and integrated with existing chat history",()=>{
 const center=read("app/settings/SettingsHudHudCenter.tsx");
 const panel=read("app/settings/HudHudPersonalContextPanel.tsx");
 const css=read("app/settings/hudhud-personal-context.css");
 assert.ok(center.includes("<HudHudPersonalContextPanel/>"));
 assert.ok(panel.includes("What HudHud knows"));
 assert.ok(panel.includes('role="img"'));
 assert.ok(panel.includes("hhVennCore"));
 assert.ok(panel.includes("Save what HudHud knows"));
 assert.ok(panel.includes("Delete my private HudHud details"));
 assert.ok(panel.toLowerCase().includes("never"));
 assert.ok(css.includes(":root:not(.light)"));
 assert.ok(css.includes("@media(max-width:425px)"));
});

test("Opt-in saved HudHud chat history redacts apparent credentials",()=>{
 const route=read("app/api/hudhud/memory/route.ts");
 assert.ok(route.includes("containsRestrictedHudHudSecret(value.content)"));
 assert.ok(route.includes("Private credentials excluded from saved HudHud history."));
});
