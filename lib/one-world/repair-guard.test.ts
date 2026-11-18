import {strict as assert} from "node:assert";
import {test} from "node:test";
import {validateRepair} from "./repair-guard";
const base={actorId:"a",idempotencyKey:"repair-1",plotOwnerId:"a",buildingId:"home",durability:20,maxDurability:100,walletXp:50,costXp:10};
test("owner with valid repair cost passes pure authorization",()=>assert.deepEqual(validateRepair(base),{ok:true}));
test("non-owner and unowned plot rejected",()=>{
  for(const plotOwnerId of ["b",null]) assert.equal(validateRepair({...base,plotOwnerId}).ok,false);
});
test("invalid durability and cost rejected",()=>{
  for(const patch of [{durability:101},{durability:-1},{durability:1.5},{maxDurability:0},{walletXp:-1},{costXp:0},{costXp:NaN}])
    assert.equal(validateRepair({...base,...patch}).ok,false);
});
test("insufficient wallet and full durability rejected",()=>{
  assert.deepEqual(validateRepair({...base,walletXp:9}),{ok:false,reason:"INSUFFICIENT_XP"});
  assert.deepEqual(validateRepair({...base,durability:100}),{ok:false,reason:"ALREADY_FULL"});
});
test("malformed runtime identity and keys fail closed",()=>{
  for(const patch of [{actorId:" "},{idempotencyKey:""},{idempotencyKey:"x".repeat(129)},{buildingId:" "},{actorId:null}])
    assert.equal(validateRepair({...base,...patch} as typeof base).ok,false);
  assert.equal(validateRepair(null as unknown as typeof base).ok,false);
});
