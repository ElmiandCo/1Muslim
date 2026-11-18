import test from "node:test";
import assert from "node:assert/strict";
import {plotId,parsePlotId,childrenOf,lineageOf,neighbors,tileBiome,visiblePlotIds,planRelocation} from "./geography";
test("plot identifiers are stable and reversible",()=>{assert.deepEqual(parsePlotId(plotId("us-mn-north",100000,42)),{regionId:"us-mn-north",x:100000,y:42})});
test("world hierarchy is navigable",()=>{assert.equal(childrenOf("earth").length,3);assert.deepEqual(lineageOf("us-mn-north").map(x=>x.level),["world","country","state","region"])});
test("neighbors do not cross region or negative coordinates",()=>{assert.equal(neighbors("a",0,0).length,2)});
test("biomes are deterministic",()=>{assert.equal(tileBiome("a",2,3),tileBiome("a",2,3))});
test("visible viewport is bounded for large worlds",()=>{assert.equal(visiblePlotIds("a",500,500,100,625).length,625)});
test("relocation never silently mutates ownership",()=>{assert.equal(planRelocation("u","a:0:0",["a:0:0","a:0:1"]).destinationPlotId,"a:0:1")});
