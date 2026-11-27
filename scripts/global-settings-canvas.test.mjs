import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Real signed-in Search Home opens settings as a local overlay, not a route",()=>{
 const home=read("app/search/SearchMemberHome.tsx");
 const results=read("app/search/page.tsx");
 assert.match(home,/aria-label="Settings"[^>]*1muslim:open-settings/);
 assert.match(results,/aria-label="Settings"[^>]*1muslim:open-settings/);
 assert.doesNotMatch(home,/href="\/settings"/);
 const layout=read("app/layout.tsx");
 assert.match(layout,/<GlobalSettingsCanvas\s*\/>/);
});

test("All six original profile editors render inside the global glass sheet",()=>{
 const canvas=read("app/components/GlobalSettingsCanvas.tsx");
 const profile=read("app/profile/page.tsx");
 assert.match(canvas,/<SettingsEmbedContext.Provider value=\{panel as ProfileTab\}>/);
 assert.match(canvas,/<ProfileEditor\/>/);
 for(const entry of ["profile","avatar","header","live","shahada","analytics"]){
  assert.match(canvas,new RegExp('id:"'+entry+'"'));
 }
 assert.match(profile,/useContext\(SettingsEmbedContext\)/);
 assert.match(profile,/setTab\(embeddedEditorTab\);setSearchProfileExpanded\(true\);setEditing\(true\)/);
 assert.match(profile,/uploadAdminAvatar/);
 assert.match(profile,/ProfileConnectionsPanel/);
 assert.match(profile,/ProfileAnalytics/);
 assert.match(profile,/shahada-safe-vault/);
 assert.match(profile,/onClick=\{save\}/);
});

test("Original app preferences and HudHud tools are embedded, not left on the old page",()=>{
 const canvas=read("app/components/GlobalSettingsCanvas.tsx");
 const prefs=read("app/settings/SettingsContent.tsx");
 const oldPage=read("app/settings/page.tsx");
 assert.match(canvas,/<SettingsHudHudCenter\s*\/>/);
 assert.match(canvas,/<AppSettings embedded\s*\/>/);
 for(const key of ["SocialConnectionsWidget","DeepWatchAppearanceSettings","LocationPreferences","AdhanSettings","requestNotifications","delete_my_account","saveAppearance","saveArabic"]){
  assert.match(prefs,new RegExp(key));
 }
 assert.match(oldPage,/\/search\?settings=1/);
 assert.doesNotMatch(oldPage,/<SettingsControlDrawer/);
});

test("Glass settings canvas is a modal bottom sheet on phones and a floating side panel on desktop",()=>{
 const canvas=read("app/components/GlobalSettingsCanvas.tsx");
 const css=read("app/components/global-settings-canvas.css");
 assert.match(canvas,/role="dialog" aria-modal="true"/);
 assert.match(canvas,/aria-label="Live profile preview"/);
 assert.match(canvas,/global-settings-canvas.css/);
 assert.match(canvas,/gscGrab/);
 assert.match(css,/backdrop-filter:blur\(35px\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/gscSlideUp/);
 assert.match(css,/gscSlideRight/);
 assert.match(css,/prefers-reduced-motion/);
});
