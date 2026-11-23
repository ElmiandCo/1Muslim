import assert from "node:assert/strict";
import test from "node:test";
import {stepVehicle,DEFAULT_VEHICLE_CONFIG} from "../app/game-labs/world/vehicle-controller.ts";
const origin={x:0,z:0,heading:0,speed:0};
test("vehicle accelerates forward and stays within speed cap",()=>{
 let s=origin;for(let i=0;i<1000;i++)s=stepVehicle(s,{throttle:1,brake:0,steer:0},1/60);
 assert.ok(s.speed>0&&s.speed<=DEFAULT_VEHICLE_CONFIG.maxForward);
 assert.equal(s.x,0);assert.ok(s.z>0);
});
test("braking reduces speed and turning changes heading only while moving",()=>{
 const still=stepVehicle(origin,{throttle:0,brake:0,steer:1},1/60);assert.equal(still.heading,0);
 let s=origin;for(let i=0;i<120;i++)s=stepVehicle(s,{throttle:1,brake:0,steer:0},1/60);
 const turning=stepVehicle(s,{throttle:0,brake:0,steer:1},1/60);assert.ok(turning.heading>0);
 const braking=stepVehicle(turning,{throttle:0,brake:1,steer:0},1/60);assert.ok(braking.speed<turning.speed);
});
test("fixed-step is deterministic and invalid dt rejected",()=>{
 const simulate=()=>{let s=origin;for(let i=0;i<60;i++)s=stepVehicle(s,{throttle:0.7,brake:0,steer:0.2},1/60);return s;};
 assert.deepEqual(simulate(),simulate());
 assert.throws(()=>stepVehicle(origin,{throttle:1,brake:0,steer:0},0),/fixed/);
});
