import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {
 clearHudHudTabHistory,isHudHudOpenSelectedWebsiteCommand,isSafeHudHudWebsiteUrl,
 readHudHudTabHistory,writeHudHudTabHistory
} from "../app/lib/hudhud-tab-history.ts";

const makeStore=()=>{
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),
  removeItem:key=>values.delete(key),size:()=>values.size};
};
const sample={activeId:"chat-one",sessions:[{
 id:"chat-one",title:"Prophet's stories",lines:[
  {role:"user",content:"Find a website about Prophet Muhammad"},
  {role:"assistant",content:"Here is a verified website",webResult:{
   title:"Verified article",source:"publisher",url:"https://example.org/muhammad",description:"Article"}}
 ]}]};

test("HudHud tab history restores only in the same tab and account context",()=>{
 const storage=makeStore();
 assert.equal(writeHudHudTabHistory(storage,"user-1",sample,500_000),true);
 const result=readHudHudTabHistory(storage,"user-1",500_080);
 assert.equal(result?.activeId,"chat-one");
 assert.equal(result?.sessions[0]?.lines[1]?.webResult?.url,"https://example.org/muhammad");
 assert.equal(readHudHudTabHistory(storage,"user-2",500_100),null);
 assert.equal(storage.size(),0,"switching users removes the prior user's tab cache");
 assert.equal(writeHudHudTabHistory(storage,"guest",sample,500_200),true);
 assert.equal(readHudHudTabHistory(storage,"guest",500_250)?.sessions.length,1);
 clearHudHudTabHistory(storage);
 assert.equal(readHudHudTabHistory(storage,"guest",500_300),null);
});

test("HudHud tabs expire and reject untrusted or overlong URL data",()=>{
 const storage=makeStore();
 assert.equal(writeHudHudTabHistory(storage,"guest",sample,500_000),true);
 assert.equal(readHudHudTabHistory(storage,"guest",500_000+4*60*60*1000+1),null);
 assert.equal(isSafeHudHudWebsiteUrl("https://example.org/article"),true);
 for(const link of ["javascript:alert(1)","http://example.org","https://localhost/private",
  "https://name:pass@example.org","//example.org","https://site.local/"]){
  assert.equal(isSafeHudHudWebsiteUrl(link),false,link);
 }
});

test("spoken navigation only visits an explicit already-selected website",()=>{
 for(const text of ["open that website","Visit the link!","go to the top result",
  "Please navigate to this site","Go there","take me there"]){
  assert.equal(isHudHudOpenSelectedWebsiteCommand(text),true,text);
 }
 for(const text of ["open","visit","I opened the website","find a website about Allah",
  "take me to a website about prayer","open my profile","show me that picture"]){
  assert.equal(isHudHudOpenSelectedWebsiteCommand(text),false,text);
 }
});

test("HudHud screen restores tab history, retains origin and never silently follows a guessed URL",()=>{
 const page=readFileSync(new URL("../app/hudhud/page.tsx",import.meta.url),"utf8");
 const launcher=readFileSync(new URL("../app/components/HudHudChatLauncher.tsx",import.meta.url),"utf8");
 assert.match(page,/readHudHudTabHistory\(window\.sessionStorage,owner\)/);
 assert.match(page,/client\.auth\.getUser\(\)/);
 assert.match(page,/event==="SIGNED_OUT"/);
 assert.match(page,/writeHudHudTabHistory\(window\.sessionStorage/);
 assert.match(page,/isHudHudOpenSelectedWebsiteCommand\(message\)/);
 assert.match(page,/latestAnswer\?\.webResult\?\.url/);
 assert.match(page,/isSafeHudHudWebsiteUrl\(selected\)/);
 assert.match(page,/window\.location\.assign\(selected\)/);
 assert.match(page,/saveTabNow\(\)/);
 assert.match(launcher,/sessionStorage\.setItem\("1muslim:hudhud:return",origin\)/);
 assert.match(page,/originRef\.current=safeReturn\(source\)/);
});
