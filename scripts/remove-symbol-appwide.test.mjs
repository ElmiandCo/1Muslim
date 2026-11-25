import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import test from "node:test";

const trackedTextFiles=()=>execFileSync("git",["ls-files","-z"],{encoding:"utf8"})
  .split("\0")
  .filter(path=>!path.startsWith("scripts/") && /\.(?:tsx?|jsx?|mjs|cjs|css|scss|html|svg|json|md|txt|ya?ml)$/i.test(path));

test("no app-owned text or code contains the retired religious emblem",()=>{
  const forbidden=[
    String.fromCodePoint(0x262a),
    String.fromCharCode(92)+"u"+"262a",
    String.fromCharCode(38,35)+"9770;",
    String.fromCharCode(38,35)+"x262a;"
  ].map(s=>s.toLowerCase());
  const violations=[];
  for(const path of trackedTextFiles()){
    const content=readFileSync(path,"utf8").toLowerCase();
    if(forbidden.some(term=>content.includes(term)))violations.push(path);
  }
  assert.deepEqual(violations,[],"Retired emblem found in tracked UI or source files");
});

test("website, Apple, and PWA icon assets now show the original 1M identity",()=>{
  assert.match(readFileSync("app/icon.svg","utf8"),/>1M<\/text>/);
  assert.match(readFileSync("app/apple-icon.tsx","utf8"),/>1M<\/div>/);
  assert.match(readFileSync("app/app-install-icon/route.tsx","utf8"),/>1M<\/div>/);
});

test("all retired logo PNG references have migrated to the 1M vector icons",()=>{
  const retired=["1muslim-live-logo.PNG","1muslim-mobile-logo.PNG","new-1M-logo.PNG","new-1M-icon.PNG"];
  const stale=[];
  for(const path of trackedTextFiles()){
    const content=readFileSync(path,"utf8");
    if(retired.some(file=>content.includes("/assets/"+file)))stale.push(path);
  }
  assert.deepEqual(stale,[],"One or more routes still reference deleted logo assets");
});
