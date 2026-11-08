import test from "node:test";
import assert from "node:assert/strict";
import { loadStoryModeCharacters } from "../app/game-labs/characters/load-character-assets.ts";

const animations = Object.fromEntries(["idle","walk","run","jump","dodge","attack","enter-vehicle","drive","hit"].map(x=>[x,x]));
const make = id => ({id,glbUrl:`/assets/${id}.glb`,animations,provenance:{creator:"Original artist",source:"Commission",license:"Exclusive use"},metersPerUnit:1,skeletonRoot:"Armature"});
const manifests = {male:make("male"),female:make("female")};
const reply = (bytes, declared) => ({ok:true,status:200,headers:{get:()=>declared},arrayBuffer:async()=>bytes});
test("missing files leave Story Mode unavailable",async()=>{
 const result=await loadStoryModeCharacters(manifests,{fetcher:async()=>({ok:false,status:404,headers:{get:()=>null},arrayBuffer:async()=>new ArrayBuffer(0)})});
 assert.equal(result.status,"unavailable");assert.equal(result.assets.male.ready,false);assert.equal(result.assets.female.ready,false);
});
test("oversize header fails before reading response body",async()=>{
 let reads=0;
 const result=await loadStoryModeCharacters(manifests,{maxBytes:100,fetcher:async()=>({ok:true,status:200,headers:{get:()=>"101"},arrayBuffer:async()=>{reads++;return new ArrayBuffer(1)}})});
 assert.equal(reads,0);assert.equal(result.status,"unavailable");
});
test("malformed binary fails closed",async()=>{
 const result=await loadStoryModeCharacters(manifests,{fetcher:async()=>reply(new ArrayBuffer(16),null)});
 assert.equal(result.status,"unavailable");assert.equal(result.assets.male.ready,false);
});
test("unsafe manifest path is rejected before network request",async()=>{
 let calls=0;
 const result=await loadStoryModeCharacters({...manifests,male:{...manifests.male,glbUrl:"/../secrets.glb"}},{fetcher:async()=>{calls++;return reply(new ArrayBuffer(16),null)}});
 assert.equal(calls,1);assert.match(result.assets.male.errors.join(" "),/Invalid or missing/);
});

test("streamed body without Content-Length is cancelled at budget",async()=>{
 let cancelled=0, reads=0;
 const fetcher=async()=>({ok:true,status:200,headers:{get:()=>null},arrayBuffer:async()=>{throw Error("must stream")},body:new ReadableStream({
  pull(controller){reads++;controller.enqueue(new Uint8Array(80));},
  cancel(){cancelled++;}
 })});
 const result=await loadStoryModeCharacters(manifests,{fetcher,maxBytes:100});
 assert.equal(result.status,"unavailable");
 assert.equal(cancelled,2);
 assert.equal(reads,4);
 assert.match(result.assets.female.errors.join(" "),/budget/);
});
test("streamed empty GLB fails closed",async()=>{
 const fetcher=async()=>({ok:true,status:200,headers:{get:()=>null},arrayBuffer:async()=>{throw Error("must stream")},body:new ReadableStream({start(controller){controller.close()}})});
 const result=await loadStoryModeCharacters(manifests,{fetcher});
 assert.equal(result.status,"unavailable");
 assert.match(result.assets.male.errors.join(" "),/missing/);
});
