import test from "node:test";
import assert from "node:assert/strict";
import {initialTraversalState,stepTraversal,followCamera} from "../app/game-labs/world/traversal-controller.ts";
const camera={yaw:0,pitch:0};
const idle={right:0,forward:0,intensity:0,run:false};
const floor=()=>0;
test("fixed-step motion advances camera-relative forward with no lateral drift",()=>{
 const s=stepTraversal(initialTraversalState(),{motion:{right:0,forward:1,intensity:1,run:true},camera,jump:false},1/60,floor);
 assert.ok(s.position.z>0);assert.equal(s.position.x,0);assert.equal(s.grounded,true);
});
test("jump launches, gravity returns, and collision resolver can block motion",()=>{
 let s=stepTraversal(initialTraversalState(),{motion:idle,camera,jump:true},1/60,floor);
 assert.ok(s.position.y>0);assert.equal(s.grounded,false);
 for(let i=0;i<90;i++)s=stepTraversal(s,{motion:idle,camera,jump:false},1/60,floor);
 assert.equal(s.position.y,0);assert.equal(s.grounded,true);
 const blocked=stepTraversal(initialTraversalState(),{motion:{right:1,forward:0,intensity:1,run:true},camera,jump:false},1/60,floor,(from,to)=>({...to,x:from.x}));
 assert.equal(blocked.position.x,0);
});
test("follow camera tracks player and supports collision shortening",()=>{
 const p={x:10,y:0,z:20};const pose=followCamera(p,camera);
 assert.equal(pose.target.x,10);assert.ok(pose.position.z<20);
 const clipped=followCamera(p,camera,(from,to)=>({...to,z:from.z-1}));
 assert.equal(clipped.position.z,19);
 assert.throws(()=>followCamera(p,{yaw:NaN,pitch:0}),RangeError);
});
test("invalid frame timestep rejected",()=>assert.throws(()=>stepTraversal(initialTraversalState(),{motion:idle,camera,jump:false},.5,floor),RangeError));
