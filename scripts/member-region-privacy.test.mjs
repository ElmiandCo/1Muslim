import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {canonicalCountry} from "../lib/member-region-country.ts";

test("country aliases and codes resolve consistently for map and previews", () => {
  for (const [value, expected] of [["US", "United States"], ["U.S.", "United States"], ["GB", "United Kingdom"], ["TR", "Türkiye"], ["Turkey", "Türkiye"], ["CI", "Côte d’Ivoire"], ["Ivory Coast", "Côte d’Ivoire"], ["", ""]]) {
    assert.equal(canonicalCountry(value), expected);
  }
});

test("public aggregates never read or return profile state", async () => {
  const source = await readFile(new URL("../app/api/member-regions/route.ts", import.meta.url), "utf8");
  assert.match(source, /\.not\("consented_at","is",null\)/);
  assert.match(source, /\.select\("id,country"\)/);
  assert.match(source, /states:\[\]/);
  assert.doesNotMatch(source, /row\.state/);
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
