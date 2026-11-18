import test from "node:test";
import assert from "node:assert/strict";
import {canAttack,validateRepair,battleWalletDelta,RAID_COOLDOWN_MS} from "../lib/one-world/security-rules.mjs";
const conquest = id => ({id,mode:"conquest"});
const peaceful = id => ({id,mode:"peaceful"});
test("peaceful attacker and peaceful defender cannot fight",()=>{
 assert.equal(canAttack({attacker:peaceful("a"),defender:conquest("b")}).allowed,false);
 assert.equal(canAttack({attacker:conquest("a"),defender:peaceful("b")}).allowed,false);
});
test("conquest players can attack eligible opponents",()=>assert.equal(canAttack({attacker:conquest("a"),defender:conquest("b")}).allowed,true));
test("self attacks and missing players blocked",()=>{assert.equal(canAttack({attacker:conquest("a"),defender:conquest("a")}).allowed,false);assert.equal(canAttack({attacker:null,defender:conquest("b")}).allowed,false)});
test("repeat raids are cooled down",()=>{assert.equal(canAttack({attacker:conquest("a"),defender:conquest("b"),now:RAID_COOLDOWN_MS-1,lastAttackAt:0}).allowed,false);assert.equal(canAttack({attacker:conquest("a"),defender:conquest("b"),now:RAID_COOLDOWN_MS,lastAttackAt:0}).allowed,true)});
test("battles never debit XP automatically",()=>assert.equal(battleWalletDelta(),0));
const repair={ownerId:"a",actorId:"a",durability:40,maxDurability:100,repairPoints:20,xpCost:5,xpBalance:20};
test("repair requires owner, sufficient XP, and valid durability",()=>{assert.equal(validateRepair(repair).allowed,true);assert.equal(validateRepair({...repair,actorId:"b"}).allowed,false);assert.equal(validateRepair({...repair,xpBalance:4}).allowed,false);assert.equal(validateRepair({...repair,repairPoints:70}).allowed,false);assert.equal(validateRepair({...repair,xpCost:-5}).allowed,false);assert.equal(validateRepair({...repair,durability:NaN}).allowed,false)});
