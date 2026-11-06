import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldOfferContinue, remainingContinueSeconds} from '../app/components/editorialCutoff.mjs';
test('no editorial end means natural playback',()=>assert.equal(shouldOfferContinue(500,null,false),false));
test('cutoff is only reached at configured time',()=>{
 assert.equal(shouldOfferContinue(119.9,120,false),false);
 assert.equal(shouldOfferContinue(120,120,false),true);
 assert.equal(shouldOfferContinue(121,120,true),false);
});
test('invalid player times never advance',()=>{
 assert.equal(shouldOfferContinue(NaN,120,false),false);
 assert.equal(shouldOfferContinue(Infinity,120,false),false);
});
test('countdown lasts three seconds',()=>{
 assert.equal(remainingContinueSeconds(0),3);
 assert.equal(remainingContinueSeconds(1000),2);
 assert.equal(remainingContinueSeconds(2000),1);
 assert.equal(remainingContinueSeconds(3000),1);
});
