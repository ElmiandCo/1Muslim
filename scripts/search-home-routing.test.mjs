import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("signed-in entry and restored sessions open Search Home",()=>{
  const root=read("app/page.tsx");
  assert.equal((root.match(/router\.replace\("\/search"\)/g)||[]).length,2);
  assert.doesNotMatch(root,/router\.replace\("\/profile"\)/);
});

test("auth defaults to Search Home but preserves explicit deep links",()=>{
  const auth=read("app/auth/page.tsx");
  assert.match(auth,/const safeNext =/);
  assert.match(auth,/return "\/search";/);
  assert.match(auth,/return match \? `\/profile\?member=/);
  assert.match(auth,/window\.location\.assign\(safeNext\(\)\)/);
  assert.match(auth,/const destination = isShahadaSignup \? "\/onboarding\?method="/);
  const callback=read("app/auth/callback/route.ts");
  assert.match(callback,/searchParams\.get\("next"\) \?\? "\/search"/);
  assert.match(callback,/next = "\/search";/);
  assert.match(callback,/return NextResponse\.redirect\(/);
  assert.match(callback,/\$\{origin\}\$\{next\}/);
});

test("new visitors keep the guest landing, while its sign-in buttons open Search Home",()=>{
  const home=read("app/page.tsx");
  assert.match(home,/return <GuestWelcomeHome\/>/);
  const guest=read("app/components/GuestWelcomeHome.tsx");
  assert.equal((guest.match(/next=%2Fsearch/g)||[]).length,4);
  assert.doesNotMatch(guest,/next=%2Fprofile/);
});

test("Shahada only returns explicitly requested profile flows to Profile",()=>{
  const onboard=read("app/onboarding/page.tsx");
  assert.equal((onboard.match(/get\("return"\)==="profile"\?"\/profile":"\/search"/g)||[]).length,2);
});

test("Home tab opens Search and Profile remains a distinct destination",()=>{
  const nav=read("app/components/GlobalNavigation.tsx");
  assert.match(nav,/{id:"search",label:"Home",href:"\/search"}/);
  assert.match(nav,/{id:"profile",label:"Profile",href:"\/profile"}/);
  assert.match(nav,/router\.push\("\/search"\)/);
});
