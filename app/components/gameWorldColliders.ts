/**
 * Game-only solid geometry built from the same deterministic scene coordinates
 * used by the renderers. Keep this independent of draw-distance culling:
 * invisible-at-distance objects must remain solid when approached.
 *
 * The scene modules are owned by Living Worlds (Bot B); this module only
 * references their exported geometry and never changes their render paths.
 */
import {FUTURE_SKYWAYS,FUTURE_TOWERS} from "./FutureCityScene";
import {GIANT_CAVE,jurassicRocks,jurassicTerrain,jurassicTrees} from "./JurassicScene";
import type {GameCollider} from "./gamePhysics";

const nearCave=(x:number,z:number,radius:number)=>
  Math.hypot(x-GIANT_CAVE.x,z-GIANT_CAVE.z)<radius;

export const FUTURE_COLLIDERS:readonly GameCollider[]=[
  ...FUTURE_TOWERS.map(t=>({
    x:t.x,z:t.z,hx:t.width/2,hz:t.depth/2,bottom:-1,top:t.height
  })),
  ...FUTURE_SKYWAYS.flatMap(w=>[
    {x:w.x,z:w.z,hx:w.width/2,hz:w.depth/2,bottom:w.y-.36,top:w.y},
    ...[-35,35].map(x=>({x,z:w.z,hx:.75,hz:.75,bottom:0,top:w.y}))
  ])
];

// Trunks and upper canopies are separate volumes so the walking path stays
// narrow while airborne players still collide with the visible branches.
const jurassicTreeSolids:GameCollider[]=jurassicTrees
  .filter(t=>!nearCave(t.x,t.z,145))
  .flatMap(t=>{
    const ground=jurassicTerrain(t.x,t.z);
    return [
      {x:t.x,z:t.z,hx:1,hz:1,bottom:ground-.2,top:ground+t.height*.86},
      {x:t.x,z:t.z,hx:6,hz:6,bottom:ground+t.height*.615,top:ground+t.height*1.22+3.5}
    ];
  });

const jurassicRockSolids:GameCollider[]=jurassicRocks
  .filter(r=>!nearCave(r.x,r.z,145))
  .map(r=>{
    const ground=jurassicTerrain(r.x,r.z);
    return {x:r.x,z:r.z,hx:r.size*.8,hz:r.size*.7,bottom:ground-.2,top:ground+r.size*.78};
  });

// These structures are already drawn in JurassicScene. Keep the cave mouth and
// secret tunnel center unobstructed; the overhead lintels remain solid.
const caveRing:GameCollider[]=Array.from({length:30},(_,i)=>{
  const a=i*Math.PI*2/30,r=GIANT_CAVE.radius+(i%3)*12;
  const x=GIANT_CAVE.x+Math.sin(a)*r,z=GIANT_CAVE.z+Math.cos(a)*r;
  const h=38+(i%6)*13,ground=jurassicTerrain(x,z);
  return {x,z,hx:10.5,hz:10.5,bottom:ground-.5,top:ground+h+4};
});

const cx=GIANT_CAVE.x,cz=GIANT_CAVE.z;
const caveStructures:GameCollider[]=[
  {x:cx-34,z:cz+60,hx:9.5,hz:14,bottom:0,top:54},
  {x:cx+34,z:cz+60,hx:9.5,hz:14,bottom:0,top:54},
  {x:cx,z:cz+60,hx:45,hz:15,bottom:54,top:70},
  {x:cx-11,z:cz-92,hx:1.5,hz:65,bottom:0,top:24},
  {x:cx+11,z:cz-92,hx:1.5,hz:65,bottom:0,top:24},
  {x:cx,z:cz-92,hx:13,hz:65,bottom:24,top:28},
  {x:cx-43,z:cz-176,hx:2.5,hz:35,bottom:0,top:38},
  {x:cx+43,z:cz-176,hx:2.5,hz:35,bottom:0,top:38},
  {x:cx,z:cz-176,hx:45,hz:36,bottom:37.5,top:42.5}
];

export const JURASSIC_COLLIDERS:readonly GameCollider[]=[
  ...jurassicTreeSolids,...jurassicRockSolids,...caveRing,...caveStructures
];
