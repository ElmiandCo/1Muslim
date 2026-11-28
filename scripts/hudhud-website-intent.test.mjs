import assert from "node:assert/strict";
import test from "node:test";
import {getHudHudTopWebResult,isHudHudLinkRequest} from "../app/lib/hudhud-top-web.ts";

test("HudHud website requests are explicit, not arbitrary conversation",()=>{
 for(const question of [
  "Take me to a website about Prophet Muhammad",
  "Please find a website about Qur'an learning",
  "Show me the official website for the museum",
  "Send me a link to an article",
  "Where can I find a website about astronomy?",
  "Website about the history of Makkah",
 ]){
  assert.equal(isHudHudLinkRequest(question),true,question);
 }
 for(const question of [
  "What does Islam teach about kindness?",
  "Are you listening?",
  "A website idea would be interesting",
  "I am building a website for my business",
  "What's the difference between a link and a URL?",
  "Hello",
 ]){
  assert.equal(isHudHudLinkRequest(question),false,question);
 }
});

test("ordinary questions never call the world-search provider",async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>{throw Error("Unexpected external search")};
  assert.equal(await getHudHudTopWebResult("Tell me about Prophet Muhammad"),undefined);
 }finally{globalThis.fetch=original}
});

test("verified website links use provider order, HTTPS and safe thumbnails",async()=>{
 const original=globalThis.fetch;
 let endpoint="",options={};
 try{
  globalThis.fetch=async(url,init)=>{
   endpoint=String(url);options=init;
   return new Response(JSON.stringify({results:[
    {title:"Insecure",url:"http://unsafe.example"},
    {title:"Unsafe",url:"javascript:alert(1)"},
    {title:"Verified Website",url:"https://example.org/about",source:"Provider",description:"Verified description",thumbnailUrl:"http://images.example/bad.png"},
    {title:"Later",url:"https://later.example/"}
   ]}),{status:200,headers:{"Content-Type":"application/json"}});
  };
  const signal=new AbortController().signal;
  const result=await getHudHudTopWebResult("Take me to a website about Prophet Muhammad",signal);
  assert.equal(result?.url,"https://example.org/about");
  assert.equal(result?.title,"Verified Website");
  assert.equal(result?.source,"Provider");
  assert.equal(result?.thumbnailUrl,undefined);
  assert.match(endpoint,/^\/api\/web-search\?q=/);
  assert.match(endpoint,/&type=web$/);
  assert.equal(options.signal,signal);
  assert.equal(options.cache,"no-store");
 }finally{globalThis.fetch=original}
});

test("provider failure or unverified URLs produce no fabricated website",async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({results:[{title:"Bad link",url:"data:text/html,hi"}]}),{status:200});
  assert.equal(await getHudHudTopWebResult("Find a link about Islam"),undefined);
  globalThis.fetch=async()=>new Response("Unavailable",{status:503});
  assert.equal(await getHudHudTopWebResult("Find a link about Islam"),undefined);
 }finally{globalThis.fetch=original}
});
