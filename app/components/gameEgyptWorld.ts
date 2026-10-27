/**
 * Game-only Ancient Egypt terrain, portal and immutable collision integration.
 * Pairs with Bot B's isolated Nile/pyramid/palm renderer. The construction-era
 * setting is interpretive, not a historical claim about Moses' lifetime.
 * No site components, global physics, or other world scenes are changed.
 */
import {
 EGYPT_BOUNDS,EGYPT_DOCKS,EGYPT_PALMS,EGYPT_PYRAMIDS,EGYPT_RIVER_WIDTH,
 egyptRiverCenterX,type EgyptDraw
} from "./AncientEgyptRiverScene";
import {buildStaticGameCollisionIndex,type GameCollider} from "./gamePhysics";

export const MOSES_TO_EGYPT_PORTAL={x:0,z:-14,radius:6} as const;
export const EGYPT_TO_MOSES_PORTAL={x:-28,z:170,radius:6} as const;
export const EGYPT_MOSES_RETURN={x:0,y:1,z:-48} as const;

/** Physical arch supports and lintels; the middle remains open for travel. */
export const MOSES_PORTAL_COLLIDERS:readonly GameCollider[]=[-14,-2743+13].flatMap(z=>[
 {x:-5.2,z,hx:.55,hz:.55,bottom:0,top:12},
 {x:5.2,z,hx:.55,hz:.55,bottom:0,top:12},
 {x:0,z,hx:6,hz:1,bottom:11.45,top:12.55}
]);

/** Shallow riverbed instead of an invisible floor on top of the Nile.
 * Full swimming and boat boarding are separate future gameplay tasks. */
export function egyptTerrainFloor(x:number,z:number):number{
 const fromCenter=Math.abs(x-egyptRiverCenterX(z));
 const bank=EGYPT_RIVER_WIDTH/2;
 if(fromCenter>=bank+3)return 0;
 if(fromCenter<=bank-3)return -1;
 return -1+(fromCenter-(bank-3))/6;
}

/** Collision volumes mirror the actual cube geometry, not whole pyramid
 * bounding boxes or solid-filled huts. All stay active beyond visual LOD. */
export function createAncientEgyptColliders():readonly GameCollider[]{
 const solids:GameCollider[]=[];
 for(const palm of EGYPT_PALMS)
  solids.push({x:palm.x,z:palm.z,hx:.65,hz:.65,bottom:0,top:palm.height*.86});
 for(const pyramid of EGYPT_PYRAMIDS){
  const heightPerStep=pyramid.height/pyramid.stages;
  for(let level=0;level<pyramid.stages;level++){
   const half=pyramid.base*(1-level/pyramid.stages)/2;
   solids.push({x:pyramid.x,z:pyramid.z,hx:half,hz:half,
    bottom:level*heightPerStep,top:(level+1)*heightPerStep});
  }
  // Eight climbable-by-jumping/flying construction ramp steps.
  for(let k=0;k<8;k++)solids.push({
   x:pyramid.x+pyramid.base*.56+k*3,z:pyramid.z+pyramid.base*.24,
   hx:2.5,hz:6,bottom:k*.7-.35,top:k*.7+.95
  });
 }
 for(let i=0;i<6;i++){
  const x=-193+i*13,z=-210;
  solids.push({x,z,hx:.375,hz:.375,bottom:0,top:13});
  for(const y of [8,12.6])solids.push({x,z,hx:6.5,hz:.55,bottom:y-.24,top:y+.24});
 }
 for(let i=0;i<13;i++)solids.push({
  x:-190+(i%7)*6,z:-225+Math.floor(i/7)*5,hx:1.8,hz:1.6,bottom:0,top:1.2
 });
 // Open-front houses: separate side/back/front wall sections and solid roof.
 for(let i=0;i<8;i++){
  const x=-365+(i%4)*25,z=85+Math.floor(i/4)*31;
  for(const side of [-1,1]){
   solids.push({x:x+side*5,z,hx:.5,hz:6,bottom:0,top:7});
   solids.push({x:x+side*3,z:z+5.5,hx:2,hz:.5,bottom:0,top:7});
  }
  solids.push({x,z:z-5.5,hx:5,hz:.5,bottom:0,top:7});
  solids.push({x,z,hx:5.5,hz:6,bottom:6.875,top:7.325});
 }
 for(const z of EGYPT_DOCKS){
  const x=egyptRiverCenterX(z)-EGYPT_RIVER_WIDTH/2-5;
  solids.push({x,z,hx:6,hz:9,bottom:-.05,top:.55});
  for(let k=0;k<3;k++)solids.push({
   x:x-2+k*1.35,z:z-2,hx:.55,hz:.55,bottom:.55,top:1.65
  });
 }
 const portal=EGYPT_TO_MOSES_PORTAL;
 for(const side of [-1,1])solids.push({
  x:portal.x+side*5.2,z:portal.z,hx:.55,hz:.55,bottom:0,top:11
 });
 solids.push({x:portal.x,z:portal.z,hx:6,hz:1,bottom:10.7,top:12});
 return solids;
}
export const EGYPT_COLLIDERS=createAncientEgyptColliders();
export const EGYPT_COLLISION_INDEX=buildStaticGameCollisionIndex(EGYPT_COLLIDERS,48);

/** Continuous sandy west/east banks with a real lowered riverbed.
 * Z strips are camera-culled but never affect physics. */
export function renderAncientEgyptTerrain(draw:EgyptDraw,playerX:number,playerY:number,playerZ:number):void{
 const radius=Math.min(520,270+Math.max(0,playerY)*.42);
 const segmentCount=44,segmentDepth=(EGYPT_BOUNDS.maxZ-EGYPT_BOUNDS.minZ)/segmentCount;
 for(let i=0;i<segmentCount;i++){
  const z=EGYPT_BOUNDS.minZ+(i+.5)*segmentDepth;
  if(Math.abs(z-playerZ)>radius+segmentDepth)continue;
  const riverX=egyptRiverCenterX(z);
  const westEnd=riverX-EGYPT_RIVER_WIDTH/2;
  const eastStart=riverX+EGYPT_RIVER_WIDTH/2;
  const westWidth=westEnd-EGYPT_BOUNDS.minX;
  const eastWidth=EGYPT_BOUNDS.maxX-eastStart;
  draw(EGYPT_BOUNDS.minX+westWidth/2,-.25,z,westWidth,.5,segmentDepth+.05,[.78,.61,.37]);
  draw(eastStart+eastWidth/2,-.25,z,eastWidth,.5,segmentDepth+.05,[.81,.65,.4]);
  draw(riverX,-1.17,z,EGYPT_RIVER_WIDTH,.34,segmentDepth+.05,[.53,.45,.31]);
  // Bot B draws animated water within 230m; maintain the Nile silhouette
  // beyond that range for players viewing the landscape from altitude.
  if(Math.abs(z-playerZ)>228)
   draw(riverX,-.15,z,EGYPT_RIVER_WIDTH,.18,segmentDepth+.05,[.13,.43,.58],.88);
 }
}

/** Return portal is safely away from the spawn; no immediate bounce. */
export function renderAncientEgyptReturnPortal(draw:EgyptDraw,playerX:number,playerZ:number):void{
 const portal=EGYPT_TO_MOSES_PORTAL;
 if(Math.hypot(playerX-portal.x,playerZ-portal.z)>300)return;
 for(const side of [-1,1])draw(portal.x+side*5.2,5.5,portal.z,1.1,11,1.1,[.78,.63,.31]);
 draw(portal.x,11.4,portal.z,12,1.2,2,[.9,.76,.39]);
 draw(portal.x,5.5,portal.z,.28,10,8,[.14,.8,.74],.3);
 draw(portal.x,.035,portal.z+7,11,.07,9,[.72,.57,.29],.75);
}
