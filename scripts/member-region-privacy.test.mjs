import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {canonicalCountry} from "../lib/member-region-country.ts";
import {canonicalUsState,isKnownUsState} from "../lib/member-region-state.ts";

test("country aliases and codes resolve consistently for map and previews", () => {
  for (const [value, expected] of [["US", "United States"], ["U.S.", "United States"], ["GB", "United Kingdom"], ["TR", "Türkiye"], ["Turkey", "Türkiye"], ["CI", "Côte d’Ivoire"], ["Ivory Coast", "Côte d’Ivoire"], ["", ""]]) {
    assert.equal(canonicalCountry(value), expected);
  }
});

test("public map exposes consent-based state aggregates but no personal locations", async () => {
  const source = await readFile(new URL("../app/api/member-regions/route.ts", import.meta.url), "utf8");
  assert.match(source, /\.not\("consented_at","is",null\)/);
  assert.match(source, /\.select\("id,country,state"\)/);
  assert.match(source, /if\(country==="United States"\)/);
  assert.match(source, /if\(isKnownUsState\(row\.state\)\)/);
  assert.match(source, /states:rows\(states\)/);
  assert.doesNotMatch(source, /select\("[^"]*(?:city|latitude|longitude|prayer_location)/);
});

test("state aliases and unmappable regions are handled without invented dots", () => {
  assert.equal(canonicalUsState("MN"),"Minnesota");
  assert.equal(canonicalUsState("new york"),"New York");
  assert.equal(isKnownUsState("IA"),true);
  assert.equal(isKnownUsState(""),false);
  assert.equal(isKnownUsState("unrecognized region"),false);
});

test("admin and member maps read the same explicitly consented country/state aggregates", async () => {
  const source=await readFile(new URL("../app/api/admin/member-regions/route.ts", import.meta.url),"utf8");
  assert.match(source, /\.not\("consented_at","is",null\)/);
  assert.match(source, /canonicalCountry\(p\.country\)/);
  assert.match(source, /canonicalUsState\(p\.state\)/);
  assert.match(source, /isKnownUsState\(state\)/);
});

test("country previews require sign-in and both consents and hide private IDs", async () => {
  const source = await readFile(new URL("../app/api/member-regions/people/route.ts", import.meta.url), "utf8");
  assert.match(source, /if\(!user\).*status:401/);
  assert.match(source, /\.eq\("directory_visible",true\)\.not\("consented_at","is",null\)/);
  assert.match(source, /username:profile\.hide_1muslim_id\?null:profile\.username/);
  assert.match(source, /offset<5000&&found\.length<8/);
});

test("region selection closes the unconsented directory and member traversal", async () => {
  const source = await readFile(new URL("../app/profile/page.tsx", import.meta.url), "utf8");
  assert.match(source, /selectedRegion\|\|selectedState\?<p role="status">/);
  assert.match(source, /selectedIndex=selectedRegion\|\|selectedState\?-1/);
  assert.match(source, /!selectedRegion&&!selectedState&&!memberLoading&&members\.length>0/);
});
