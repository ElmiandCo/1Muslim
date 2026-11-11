/**
 * Living Worlds / Ancient Egypt — Nile journey details.
 * Era-inspired, visual-only fishing skiffs, shore moorings and reed beds.
 * Bot A owns river navigation, water physics, solid riverbanks and LOD integration.
 * Does not claim a particular site existed in Moses's lifetime.
 */
import {EGYPT_RIVER_WIDTH,egyptRiverCenterX,type EgyptDraw} from "./AncientEgyptRiverScene";

const WOOD=[.42,.27,.15],REED=[.27,.45,.23],LINEN=[.84,.76,.57];
const RIVER_GLINT=[.48,.71,.7],CLAY=[.68,.49,.3];
const nearby=(x:number,z:number,px:number,pz:number,r:number)=>
 (x-px)*(x-px)+(z-pz)*(z-pz)<=r*r;

/** Six shore landings spread along the existing 1,040-unit Nile corridor. */
export const NILE_FISHING_LANDINGS=[
 {id:"north-ferry",z:-440,side:1},
 {id:"north-fishery",z:-310,side:-1},
 {id:"central-reeds",z:-80,side:1},
 {id:"southern-fishery",z:90,side:-1},
 {id:"southern-reeds",z:290,side:1},
 {id:"south-ferry",z:450,side:-1}
] as const;

/** Small craft keep the center of the river open for Bot A's future navigation. */
export const NILE_FISHING_SKIFFS=[
 {id:"skiff-north",z:-345,side:-1,phase:.4},
 {id:"skiff-center",z:-30,side:1,phase:2.1},
 {id:"skiff-south",z:335,side:-1,phase:4.2}
] as const;

export function nileFishingSkiffPose(nowMs:number,index:number){
 const boat=NILE_FISHING_SKIFFS[index%NILE_FISHING_SKIFFS.length];
 const t=nowMs*.00024+boat.phase;
 const z=boat.z+Math.sin(t)*24;
 const x=egyptRiverCenterX(z)+boat.side*13+Math.sin(t*.63)*1.4;
 return {x,z,heading:Math.cos(t)>=0?0:Math.PI,bob:Math.sin(nowMs*.0018+boat.phase)*.045};
}

/** Only additive visual geometry. No collision, gameplay or networking changes. */
export function renderAncientEgyptNileJourney(
 draw:EgyptDraw,nowMs:number,playerX:number,playerZ:number
){
 const t=nowMs*.001;
 // Current glints are translucent strips on the existing river surface.
 // They are not an extra water plane and never block a boat or player.
 for(let z=-470;z<=470;z+=78){
  const animatedZ=z+Math.sin(t*.24+z*.01)*4;
  const x=egyptRiverCenterX(animatedZ);
  if(!nearby(x,animatedZ,playerX,playerZ,145))continue;
  draw(x-7,.038,animatedZ,.32,.025,11,RIVER_GLINT,.25);
  draw(x+8,.038,animatedZ+6,.24,.025,8,RIVER_GLINT,.19);
 }
 for(const landing of NILE_FISHING_LANDINGS){
  const x=egyptRiverCenterX(landing.z)+landing.side*(EGYPT_RIVER_WIDTH*.5+7);
  const z=landing.z;
  if(!nearby(x,z,playerX,playerZ,160))continue;
  // Mooring posts stay outside the navigable river corridor.
  for(const offset of [-5,5]){
   draw(x,.9,z+offset,.42,1.8,.42,WOOD);
   draw(x,1.9,z+offset,.75,.2,.75,CLAY);
  }
  // Two bundles of river reeds sway gently without collision volumes.
  for(const side of [-1,1]){
   const rx=x+landing.side*7,rz=z+side*8;
   draw(rx,.6,rz,2.3,1.1,2.3,REED,.78);
   if(!nearby(rx,rz,playerX,playerZ,72))continue;
   for(let k=0;k<4;k++){
    const sway=Math.sin(t*.8+landing.z*.1+k)*.17;
    draw(rx-1+k*.65+sway,1.25,rz,.18,2.5,.18,REED,.95);
    draw(rx-1+k*.65+sway,2.54,rz,.34,.45,.34,CLAY,.75);
   }
  }
  // Faceless fisher and woven net; near-only detail to save mobile draw calls.
  if(nearby(x,z,playerX,playerZ,85)){
   const fx=x+landing.side*3,fz=z+2;
   draw(fx,1.08,fz,.75,1.5,.65,LINEN);
   draw(fx,2.04,fz,.55,.55,.55,[.5,.32,.22]);
   draw(fx-landing.side*1.4,1.05,fz+2,2.5,.08,3.6,[.66,.55,.34],.68);
   for(let k=0;k<3;k++)
    draw(fx-landing.side*(.6+k*.7),1.12,fz+2,.06,.08,3.4,LINEN,.52);
  }
 }
 for(let i=0;i<NILE_FISHING_SKIFFS.length;i++){
  const boat=nileFishingSkiffPose(nowMs,i);
  if(!nearby(boat.x,boat.z,playerX,playerZ,165))continue;
  draw(boat.x,.18+boat.bob,boat.z,3.8,.7,9.5,WOOD,1,boat.heading);
  draw(boat.x,.55+boat.bob,boat.z,3.15,.18,7.5,CLAY,.93,boat.heading);
  // A low mast and simple linen shade distinguish skiffs from stone barges.
  draw(boat.x,2.05+boat.bob,boat.z,.2,3,.2,WOOD);
  draw(boat.x,3.1+boat.bob,boat.z,2.4,1.3,.15,LINEN,.84,boat.heading);
  if(nearby(boat.x,boat.z,playerX,playerZ,78)){
   draw(boat.x,.98+boat.bob,boat.z+2,.6,1.05,.55,LINEN);
   draw(boat.x,1.68+boat.bob,boat.z+2,.45,.45,.45,[.52,.34,.22]);
   // Short wake strokes, intentionally visual-only.
   for(let k=0;k<3;k++)
    draw(boat.x+(k-1)*1.2,.045,boat.z-6-k*2,1.1,.035,.35,RIVER_GLINT,.35);
  }
 }
}
