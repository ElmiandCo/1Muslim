import test from "node:test";
import assert from "node:assert/strict";
import {shouldOfferContinue,countdownRemaining} from "../app/components/editorialCutoff";

const video={videoId:"example",startSeconds:15,endSeconds:120};
test("no automatic cutoff when endSeconds is null",()=>assert.equal(shouldOfferContinue({...video,endSeconds:null},900,new Set()),false));
test("does not cut before configured editorial end",()=>assert.equal(shouldOfferContinue(video,119.9,new Set()),false));
test("offers Continue at configured cutoff",()=>assert.equal(shouldOfferContinue(video,120,new Set()),true));
test("remembered Continue bypasses cutoff",()=>assert.equal(shouldOfferContinue(video,180,new Set(["example"])),false));
test("invalid cutoffs cannot skip",()=>assert.equal(shouldOfferContinue({...video,endSeconds:10},180,new Set()),false));
test("three second countdown",()=>{assert.equal(countdownRemaining(0),3);assert.equal(countdownRemaining(1.2),2);assert.equal(countdownRemaining(2.1),1)});
