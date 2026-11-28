import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Settings keeps every functional existing app control, despite the new shell",()=>{
 const page=read("app/settings/SettingsContent.tsx");
 const redirect=read("app/settings/page.tsx");
 assert.match(redirect,/\/search\?settings=1/);
 for(const feature of ["SocialConnectionsWidget","LocationPreferences","AdhanSettings","DeepWatchAppearanceSettings","delete_my_account","deactivateAccount","requestNotifications","saveArabic","saveAppearance","saveHudhudVision"]){
  assert.match(page,new RegExp(feature));
 }
 assert.match(page,/<SettingsControlDrawer\/>/);
 assert.match(page,/<SettingsHudHudCenter\/>/);
});
test("Settings side drawer uses the existing real profile and all six editor tabs",()=>{
 const drawer=read("app/settings/SettingsControlDrawer.tsx");
 assert.match(drawer,/getUser\(\)/);
 assert.match(drawer,/\.eq\("id",user.id\)/);
 assert.match(drawer,/role="dialog" aria-modal="true"/);
 assert.match(drawer,/aria-label="Your current profile preview"/);
 for(const route of ["profile","avatar","header","live","shahada","analytics"]){
  assert.ok(drawer.includes("/profile?edit="+route),"Missing "+route+" editor deep-link");
 }
 const profile=read("app/profile/page.tsx");
 assert.match(profile,/setSearchProfileExpanded\(true\);setTab\(selected\);setEditing\(true\)/);
 assert.match(profile,/PROFILE_EDITOR_SECTIONS/);
 assert.match(profile,/shahada-safe-vault/);
 assert.match(profile,/ProfileConnectionsPanel/);
});
test("HudHud control center is account-isolated and respects opt-in memory",()=>{
 const center=read("app/settings/SettingsHudHudCenter.tsx");
 const api=read("app/api/hudhud/memory/route.ts");
 assert.match(center,/Search saved HudHud conversations/);
 assert.match(center,/action:"preference"/);
 assert.match(center,/action:"delete"/);
 assert.match(center,/action:"clear"/);
 assert.match(center,/exportMine/);
 assert.match(center,/hudhud\?session=/);
 assert.match(api,/current\(\)/);
 assert.match(api,/eq\("user_id",user.id\)\.eq\("id",body.id\)/);
 assert.match(api,/enabled:preference\?\.enabled===true/);
 assert.doesNotMatch(center,/getUser\(\).*?profiles\)\.select\("\*"/s);
});
test("Saved chats can reopen without accidentally enabling future memory",()=>{
 const hudhud=read("app/hudhud/page.tsx");
 assert.match(hudhud,/selectedSession=new URLSearchParams\(window.location.search\)\.get\("session"\)/);
 assert.match(hudhud,/data.enabled===true\|\|Boolean\(selectedSession\)/);
 assert.match(hudhud,/setHudHudVoiceEnabled\(next\)/);
 assert.match(read("app/settings/SettingsContent.tsx"),/localStorage\.setItem\("1muslim:hudhud:auto-listen"/);
});
test("No false claims about always-on listening or deleting Shahada recordings",()=>{
 const center=read("app/settings/SettingsHudHudCenter.tsx");
 assert.match(read("app/settings/SettingsContent.tsx"),/Browser permission is still required/);
 assert.match(center,/Shahada verification recordings live in a separate private vault/);
 const css=read("app/settings/settings-control-center.css");
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:root:not\(\.light\)/);
});
