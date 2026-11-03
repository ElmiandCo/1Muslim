/**
 * Living Worlds / Bot B: ambient life for Bot A's extended Ancient Egypt Nile.
 * Only Z 600..1640 and -1640..-600; the original central Egypt scene is untouched.
 * Render-only and deterministic: no new collision, portal, physics or network state.
 * Ancient Egyptian inspired tableau, not a claim about Moses-era construction.
 */
import {EGYPT_RIVER_WIDTH,egyptRiverCenterX,type EgyptDraw} from "./AncientEgyptRiverScene";

const BANK_OFFSET=EGYPT_RIVER_WIDTH/2;
const PALM_TRUNK=[.39,.26,.15],PALM_FROND=[.16,.40,.20],REED=[.40,.53,.25];
const SKIFF=[.49,.30,.15],LINEN=[.85,.77,.58],HERON=[.77,.79,.72];

export const LONG_NILE_OASIS_PALMS=Array.from({length:64},(_,id)=>{
 const side=id%2===0?-1:1;
 const segment=Math.floor(id/2);
 const north=segment%2===0;
 const z=(north?1:-1)*(625+(segment*71)%1000);
 return {id,z,side,x:egyptRiverCenterX(z)+side*(BANK_OFFSET+16+(id*17)%39),
   height:9+(id%6)*1.35,phase:id*2.399963};
});
export const LONG_NILE_REED_BEDS=Array.from({length:24},(_,id)=>{
 const side=id%2===0?-1:1;
 const z=(Math.floor(id/2)%2===0?1:-1)*(615+(Math.floor(id/2)*109)%1020);
 return {id,z,side,x:egyptRiverCenterX(z)+side*(BANK_OFFSET+3.5)};
});
export const LONG_NILE_SKIFFS=Array.from({length:8},(_,id)=>({
 id,z:(id%2===0?1:-1)*(665+Math.floor(id/2)*235),side:id%2===0?-1:1,phase:id*1.71
}));
export const LONG_NILE_HERONS=Array.from({length:16},(_,id)=>({
 id,z:(id%2===0?1:-1)*(620+Math.floor(id/2)*139),side:id%3===0?-1:1,phase:id*2.21
}));
export function longNileSkiffPose(nowMs:number,index:number){
 const boat=LONG_NILE_SKIFFS[index%LONG_NILE_SKIFFS.length];
 const z=boat.z+Math.sin(nowMs*.00017+boat.phase)*19;
 return {x:egyptRiverCenterX(z)+boat.side*12,z,
   bob:Math.sin(nowMs*.0016+boat.phase)*.08,
   heading:Math.cos(nowMs*.00017+boat.phase)>=0?0:Math.PI};
}
const close=(x:number,z:number,px:number,pz:number,r:number)=>
 (x-px)*(x-px)+(z-pz)*(z-pz)<r*r;

/** Strict local LOD. Never draws anything inside the original +/-520 Egypt scene. */
export function renderExtendedEgyptNileLife(
 draw:EgyptDraw,nowMs:number,playerX:number,playerZ:number
):void{
 for(const palm of LONG_NILE_OASIS_PALMS){
  if(!close(palm.x,palm.z,playerX,playerZ,150))continue;
  const sway=Math.sin(nowMs*.00075+palm.phase)*.7;
  draw(palm.x,palm.height*.45,palm.z,1.15,palm.height*.9,1.15,PALM_TRUNK);
  draw(palm.x+sway*.3,palm.height*.92,palm.z,3.4,1.3,3.4,PALM_FROND);
  for(const side of [-1,1]){
   draw(palm.x+side*2.8+sway,palm.height*.86,palm.z,5.6,.32,1.1,PALM_FROND,.93,side*.24);
   draw(palm.x+sway,palm.height*.84,palm.z+side*2.8,1.1,.32,5.6,PALM_FROND,.93);
  }
 }
 for(const bed of LONG_NILE_REED_BEDS){
  if(!close(bed.x,bed.z,playerX,playerZ,105))continue;
  for(let i=0;i<5;i++){
   const z=bed.z+(i-2)*1.6;
   const wave=Math.sin(nowMs*.001+i+bed.id)*.11;
   draw(bed.x+bed.side*(i%2)*.8+wave,.7,z,.18,1.4,.18,REED,.88);
  }
 }
 for(let i=0;i<LONG_NILE_SKIFFS.length;i++){
  const p=longNileSkiffPose(nowMs,i);
  if(!close(p.x,p.z,playerX,playerZ,145))continue;
  draw(p.x,-.05+p.bob,p.z,4.8,.55,8.2,SKIFF);
  draw(p.x,1.25+p.bob,p.z,1.1,2.5,1.1,[.47,.30,.20]);
  draw(p.x,2.6+p.bob,p.z,1.2,.9,1.2,LINEN);
  draw(p.x+1.1,1.0+p.bob,p.z-1.2,.2,2.5,.2,[.40,.28,.18],.9,.16);
 }
 for(const bird of LONG_NILE_HERONS){
  const x=egyptRiverCenterX(bird.z)+bird.side*(BANK_OFFSET+8);
  if(!close(x,bird.z,playerX,playerZ,110))continue;
  const bob=Math.sin(nowMs*.001+bird.phase)*.08;
  draw(x,1.25+bob,bird.z,.35,1.4,.42,HERON);
  draw(x,2.1+bob,bird.z+.2,.35,.5,.36,HERON);
  draw(x,1.5+bob,bird.z+.55,.12,.12,1.1,[.63,.48,.20]);
 }
}
