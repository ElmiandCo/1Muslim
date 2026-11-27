import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Search-first profile Home has no personal-post stories or large circular strip",()=>{
 const home=read("app/profile/ProfileSearchHome.tsx");
 const css=read("app/profile/profile-search-home.css");
 assert.doesNotMatch(home,/ProfileCinematicPosts|profileSearchStoryHeading|profileSearchStoryRail|Your posts/);
 assert.match(home,/<ProfileImmersiveStage request=\{stageRequest\}\/>/);
 assert.match(home,/className="profileSearchFullRail"/);
 assert.match(home,/className="profileSearchAvatarControl" onClick=\{expanded\|\|editing\?onCollapse:onExpand\}/);
 assert.match(css,/\.profileSearchHome:not\(\.hasOpenPanel\) \.profileSearchFullRail/);
 assert.match(css,/margin-top:auto/);
});

test("redundant mobile nav is hidden on Search Home but kept on real profile panels",()=>{
 const css=read("app/profile/profile-search-home.css");
 const nav=read("app/components/GlobalNavigation.tsx");
 assert.match(css,/html:has\(\.profileSearchHome:not\(\.hasOpenPanel\)\) \.oneGlobalNav\{display:none!important\}/);
 assert.match(css,/html:has\(\.profileSearchHome:not\(\.hasOpenPanel\)\) body\{/);
 assert.match(css,/padding-bottom:env\(safe-area-inset-bottom,0px\)!important/);
 assert.match(nav,/pathname\?\.startsWith\("\/search"\)/);
 assert.match(nav,/oneGlobalNav/);
 assert.doesNotMatch(css,/html:has\(\.profileSearchHome\) \.oneGlobalNav\{display:none/);
});

test("Post creation and editing remain available from full profile and Explore",()=>{
 const full=read("app/profile/page.tsx");
 const home=read("app/profile/ProfileSearchHome.tsx");
 const explore=read("app/search/SearchFeatureRails.tsx");
 assert.match(full,/<ProfileSocialHub profile=\{profile\}/);
 assert.match(home,/onExpand/);
 assert.match(explore,/label:"Ummah Posts"/);
 assert.match(explore,/href:"\/posts"/);
});
