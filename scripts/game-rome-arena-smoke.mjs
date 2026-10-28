#!/usr/bin/env node
// Run from repository root: node scripts/game-rome-arena-smoke.mjs
// Executes the actual TypeScript scene body in V8 after removing only its type annotations.
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const scene=readFileSync("app/components/RomanArenaScene.ts","utf8");
const roman=readFileSync("app/components/RomanJudeaScene.ts","utf8");
const javascript=scene.replace(/^export type.*\n/gm,"")
 .replace(/player:\{x:number;z:number\}/g,"player")
 .replace(/:RomanArenaDraw|:RomanLionVisualState|:number|:boolean/g,"")
 .replace(/ as const/g,"").replace(/\bexport /g,"");
const {renderRomanGrandArena,renderRomanCats,renderRomanArenaLion,ROMAN_GRAND_ARENA}=
 new Function(javascript+";return {renderRomanGrandArena,renderRomanCats,renderRomanArenaLion,ROMAN_GRAND_ARENA};")();
let checks=0;
const verify=(condition,message)=>{checks++;assert.ok(condition,message)};
const sample=(x,z,now=10000)=>{const calls=[];renderRomanGrandArena((...a)=>{
 calls.push(a);
 verify(a.slice(0,6).every(Number.isFinite),"finite transform");
 verify(a[6].length===3&&a[6].every(Number.isFinite),"finite RGB");
},now,{x,z});return calls};
const near=sample(365,-345),mid=sample(365,-140),far=sample(0,0);
verify(near.length>130&&near.length<380,"near mobile draw cap");
verify(mid.length>20&&mid.length<near.length,"mid LOD");
verify(far.length===0,"far scene culled");
verify(ROMAN_GRAND_ARENA.outerX>=85&&ROMAN_GRAND_ARENA.outerZ>=60,"grand footprint");
verify(near.filter(a=>Math.abs(a[0]-365)<7&&Math.abs(a[2]+277)<5&&a[4]>5).length===0,"open southern entry");
let cats=0;renderRomanCats((...a)=>{cats++;verify(a.slice(0,6).every(Number.isFinite),"cat transform")},5000,{x:0,z:-110});
verify(cats>0&&cats<140,"cats bounded");
let distantCats=0;renderRomanCats(()=>distantCats++,5000,{x:500,z:500});verify(distantCats===0,"cats distance culled");
let lion=0;renderRomanArenaLion(()=>lion++,1000,{x:365,z:-345},{x:365,z:-345,heading:0,active:true,attackProgress:.5});verify(lion===8,"lion visual interface");
let inactive=0;renderRomanArenaLion(()=>inactive++,1000,{x:365,z:-345},{x:365,z:-345,heading:0,active:false});verify(inactive===0,"inactive lion hidden");
for(const token of ["ROMAN_PORTAL","ROMAN_JERUSALEM_COLLIDERS","ROMAN_ROME_COLLIDERS","romanJudeaCollisionIndex","renderRomanGrandArena(paint,now,player)","renderRomanCats(paint,now,player)"]){
 verify(roman.includes(token),"preserve Rome/Jerusalem contract: "+token);
}
console.log(JSON.stringify({result:"PASS",checks,nearDraws:near.length,midDraws:mid.length,farDraws:far.length,catDraws:cats}));
