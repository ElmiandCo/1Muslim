import test from "node:test";
import assert from "node:assert/strict";
import { beginQuest, INITIAL_MISSION_PROGRESS } from "../app/game-labs/world/mission-graph.ts";
import { applyInteraction, currentObjective, distanceXZ } from "../app/game-labs/world/interaction-adapter.ts";

test("only the next quest target within its radius advances progress", () => {
  const start = beginQuest(INITIAL_MISSION_PROGRESS, "arrival");
  assert.equal(currentObjective(start)?.id, "meet-keeper");
  const far = applyInteraction(start, [0, 0, 0], {kind:"talk",targetId:"npc-safiya"});
  assert.equal(far.reason, "out-of-range");
  const wrong = applyInteraction(start, [-270,0,-140], {kind:"talk",targetId:"npc-idris"});
  assert.equal(wrong.reason, "wrong-target");
  const done = applyInteraction(start, [-270,0,-140], {kind:"talk",targetId:"npc-safiya"});
  assert.equal(done.accepted, true);
  assert.equal(currentObjective(done.progress)?.id, "find-library");
  assert.equal(start.completedObjectives.length, 0);
});

test("drive delivery requires actual vehicle and secured cargo", () => {
  let p = beginQuest(INITIAL_MISSION_PROGRESS, "arrival");
  p = applyInteraction(p, [-270,0,-140], {kind:"talk",targetId:"npc-safiya"}).progress;
  p = applyInteraction(p, [70,0,-35], {kind:"reach",targetId:"library"}).progress;
  p = beginQuest(p, "missing-courier");
  p = applyInteraction(p, [72,0,-40], {kind:"talk",targetId:"npc-idris"}).progress;
  p = applyInteraction(p, [145,0,-90], {kind:"collect",targetId:"ledger"}).progress;
  const unsafe = applyInteraction(p, [175,0,-75], {kind:"defend",targetId:"courier-encounter",civiliansSafe:false,encounterResolved:true});
  assert.equal(unsafe.reason,"requirements-not-met");
  p = applyInteraction(p, [175,0,-75], {kind:"defend",targetId:"courier-encounter",civiliansSafe:true,encounterResolved:true}).progress;
  p = beginQuest(p, "road-to-ridge");
  p = applyInteraction(p, [-220,0,-100], {kind:"talk",targetId:"npc-nura"}).progress;
  const walking = applyInteraction(p, [335,0,250], {kind:"drive",targetId:"ridge-outpost",inVehicle:false,cargoSecured:true});
  assert.equal(walking.reason,"requirements-not-met");
  assert.equal(applyInteraction(p,[335,0,250],{kind:"drive",targetId:"ridge-outpost",inVehicle:true,cargoSecured:true}).accepted,true);
});

test("world proximity uses horizontal metres and rejects invalid coordinates", () => {
  assert.equal(distanceXZ([0,100,0],[3,-20,4]),5);
  assert.throws(()=>distanceXZ([Infinity,0,0],[0,0,0]),RangeError);
});
