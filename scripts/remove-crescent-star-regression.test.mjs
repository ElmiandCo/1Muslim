import assert from "node:assert/strict";
import {existsSync, readdirSync, readFileSync, statSync} from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(new URL("..",import.meta.url).pathname);
const sourceDirs=["app","components","lib","utils","hooks","public","supabase"];
const codeExtensions=new Set([".ts",".tsx",".js",".jsx",".css",".scss",".svg",".html",".json",".mdx",".sql"]);
const ignoredDirs=new Set(["node_modules",".git",".next","dist","build"]);
function* files(dir) {
 if(!existsSync(dir))return;
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(entry.isDirectory()){
   if(!ignoredDirs.has(entry.name))yield* files(path.join(dir,entry.name));
  }else if(entry.isFile()&&codeExtensions.has(path.extname(entry.name).toLowerCase())){
   yield path.join(dir,entry.name);
  }
 }
}
test("first-party UI, icons and text contain no crescent-and-star glyph",()=>{
 const glyph=String.fromCodePoint(0x262a);
 const encoded=[String.raw`\u262a`,String.raw`\u{262a}`,String.raw`\262a`,"&#9770;","&#x262a;"];
 const offenders=[];
 for(const location of sourceDirs){
  for(const file of files(path.join(root,location))){
   const contents=readFileSync(file,"utf8");
   if(contents.includes(glyph)||encoded.some(form=>contents.toLowerCase().includes(form.toLowerCase())))
    offenders.push(path.relative(root,file));
  }
 }
 assert.deepEqual(offenders,[],"Replace the emblem with neutral 1M, calligraphy or relevant functional icons");
});
test("browser and iOS app icon use the emblem-free 1M identity",()=>{
 const browser=readFileSync(path.join(root,"app/icon.svg"),"utf8");
 const apple=readFileSync(path.join(root,"app/apple-icon.tsx"),"utf8");
 assert.match(browser,/>1M<\/text>/);
 assert.match(apple,/>1M<\/div>/);
 for(const legacy of ["new-1M-logo.PNG","1muslim-mobile-logo.PNG","1muslim-live-logo.PNG"])
  assert.equal(existsSync(path.join(root,"public/assets",legacy)),false,legacy+" must not be shipped");
});
