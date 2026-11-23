import test from "node:test";
import assert from "node:assert/strict";
import { storyModeAssetGate, verifyCharacterAsset } from "../app/game-labs/characters/asset-readiness.ts";

const animations = Object.fromEntries(["idle","walk","run","jump","dodge","attack","enter-vehicle","drive","hit"].map(x=>[x,x]));
const asset = id => ({id,glbUrl:"/game-labs/"+id+".glb",animations,skeletonRoot:"Hips",metersPerUnit:1,provenance:{creator:"Original",source:"internal",license:"owned"}});
test("missing bytes fail closed rather than allowing a placeholder",()=>{
 const result=verifyCharacterAsset(asset("male"),null);
 assert.equal(result.ready,false);
 assert.match(result.errors.join(" "),/not been loaded/);
});
test("malformed GLB fails closed",()=>{
 const result=verifyCharacterAsset(asset("female"),new ArrayBuffer(24));
 assert.equal(result.ready,false);
 assert.equal(result.inspection.valid,false);
});
test("story requires both independently inspected characters",()=>{
 const inspection={valid:true,errors:[],meshCount:1,skinnedMeshCount:1,boneCount:20,animationNames:Object.keys(animations),materialCount:1};
 const male={id:"male",ready:true,inspection,errors:[]};
 const female={id:"female",ready:true,inspection,errors:[]};
 assert.equal(storyModeAssetGate({male}).ready,false);
 assert.equal(storyModeAssetGate({male,female}).ready,true);
 assert.equal(storyModeAssetGate({male,female:{...female,ready:false}}).ready,false);
});
