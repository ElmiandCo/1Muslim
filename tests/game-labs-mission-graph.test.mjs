import assert from "node:assert/strict";
import test from "node:test";
import {QUESTS,DISTRICTS,INITIAL_MISSION_PROGRESS,availableQuests,beginQuest,completeObjective,validateWorldGraph} from "../app/game-labs/world/mission-graph.ts";

test("original city has four distinct traversable districts and a valid acyclic graph",()=>{
  assert.equal(DISTRICTS.length,4);
  assert.deepEqual(validateWorldGraph(),[]);
  assert.equal(new Set(DISTRICTS.map(d=>d.id)).size,DISTRICTS.length);
});
test("story starts at harbor; boss is locked until three quests complete",()=>{
  let state=INITIAL_MISSION_PROGRESS;
  assert.deepEqual(availableQuests(state).map(q=>q.id),["arrival"]);
  assert.throws(()=>beginQuest(state,"dragon-awakening"),/locked/);
  for(const quest of QUESTS){
    state=beginQuest(state,quest.id);
    for(const objective of quest.objectives)state=completeObjective(state,objective.id);
  }
  assert.equal(state.completedQuests.length,4);
  assert.deepEqual(availableQuests(state),[]);
});
test("mission progression rejects out-of-order, unrelated and repeated objectives",()=>{
  let state=beginQuest(INITIAL_MISSION_PROGRESS,"arrival");
  assert.throws(()=>completeObjective(state,"find-library"),/order/);
  assert.throws(()=>completeObjective(state,"dragon-boss"),/does not belong/);
  state=completeObjective(state,"meet-keeper");
  assert.throws(()=>completeObjective(state,"meet-keeper"),/order/);
  state=completeObjective(state,"find-library");
  assert.deepEqual(state.completedQuests,["arrival"]);
  assert.equal(state.activeQuest,null);
});
