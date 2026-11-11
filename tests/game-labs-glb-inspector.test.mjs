import test from "node:test";
import assert from "node:assert/strict";
import {inspectCharacterGlb} from "../app/game-labs/characters/glb-inspector.ts";
const actions=["idle","walk","run","jump","dodge","attack","enter-vehicle","drive","hit"];
const mapping=Object.fromEntries(actions.map(x=>[x,x]));
function glb(doc){const raw=Buffer.from(JSON.stringify(doc));const padded=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(padded);const out=Buffer.alloc(20+padded.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(padded.length,12);out.writeUInt32LE(0x4e4f534a,16);padded.copy(out,20);return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength)}
function character(){return {asset:{version:"2.0"},meshes:[{primitives:[]}],nodes:[{mesh:0,skin:0},...Array.from({length:16},()=>({}))],skins:[{joints:Array.from({length:16},(_,i)=>i+1)}],animations:actions.map(name=>({name})),materials:[{name:"Emerald fabric"}]}}
test("valid structured rig and all required animation names",()=>{const result=inspectCharacterGlb(glb(character()),mapping);assert.equal(result.valid,true,JSON.stringify(result.errors));assert.equal(result.boneCount,16)});
test("rejects a decorative mesh without a bound skin",()=>{const doc=character();doc.nodes[0]={mesh:0};const result=inspectCharacterGlb(glb(doc),mapping);assert.equal(result.valid,false);assert.match(result.errors.join(" " ),/No node binds/)});
test("rejects absent clips and invalid GLB length",()=>{const doc=character();doc.animations.pop();assert.match(inspectCharacterGlb(glb(doc),mapping).errors.join(" "),/Missing animation for hit/);const bytes=new Uint8Array(glb(character()));bytes[8]=0;assert.match(inspectCharacterGlb(bytes.buffer,mapping).errors.join(" "),/declared length/)});
