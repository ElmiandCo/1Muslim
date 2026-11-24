import {test} from "node:test";
import assert from "node:assert/strict";
import {avatarDragPosition,snapAvatarPosition} from "../app/components/profileAvatarPosition.ts";

test("avatar drag stays within the track and can move from either side",()=>{
 assert.equal(avatarDragPosition(0,500,100),1);
 assert.equal(avatarDragPosition(0,-500,100),-1);
 assert.equal(avatarDragPosition(-1,100,100),0);
 assert.equal(avatarDragPosition(1,-200,100),-1);
 assert.equal(avatarDragPosition(1,-50,0),1);
});

test("release snaps to the nearest position",()=>{
 assert.equal(snapAvatarPosition(-0.51),-1);
 assert.equal(snapAvatarPosition(-0.5),0);
 assert.equal(snapAvatarPosition(0.5),0);
 assert.equal(snapAvatarPosition(0.51),1);
});
