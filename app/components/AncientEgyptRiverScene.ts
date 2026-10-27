/**
 * Living Worlds / Ancient Egypt: interpretive Nile-side construction district.
 * New isolated scene helper for Bot A's future separate Egypt-world portal.
 * No prophets or identifiable historical persons. The scene does NOT assert
 * that the pyramids were built in Moses's lifetime.
 * Render-only geometry except exported solid prop footprints for engine wiring.
 */
export type EgyptDraw=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void;
export type EgyptSolid={id:string;x:number;z:number;hx:number;hz:number;bottom:number;top:number;kind:"palm"|"pyramid"|"scaffold"|"hut"|"dock"};
export const EGYPT_BOUNDS={minX:-460,maxX:460,minZ:-520,maxZ:520} as const;
export const EGYPT_SPAWN={x:-28,y:2,z:120} as const;
export const EGYPT_CONSTRUCTION={x:-145,z:-145} as const;
export const EGYPT_RIVER_WIDTH=55;
export const egyptRiverCenterX=(z:number)=>185+16*Math.sin(z*.007);
const near2=(x:number,z:number,px:number,pz:number,r:number)=>(x-px)**2+(z-pz)**2<=r*r;
const SAND=[.78,.61,.37],STONE=[.87,.76,.56],LIMESTONE=[.91,.85,.68],RIVER=[.13,.43,.58],FERTILE=[.22,.43,.24];
const WOOD=[.43,.29,.15],PALM=[.16,.43,.22],REED=[.36,.51,.24],LINEN=[.82,.75,.57];
export const EGYPT_PALMS=Array.from({length:54},(_,i)=>{
 const z=-490+(i*113)%980;
 const side=i%2===0?-1:1;
 const x=egyptRiverCenterX(z)+side*(EGYPT_RIVER_WIDTH/2+13+(i*19)%42);
 return {id:i,x,z,height:10+(i%6)*1.2,phase:i*2.399963};
}).filter(p=>!near2(p.x,p.z,EGYPT_CONSTRUCTION.x,EGYPT_CONSTRUCTION.z,72));
export const EGYPT_WORKERS=Array.from({length:22},(_,i)=>({
 id:i,phase:i*1.71,carrying:i%3!==0,
 x:-175+(i%6)*14,z:-196+Math.floor(i/6)*25
}));
export const EGYPT_BOATS=Array.from({length:4},(_,i)=>({id:i,z:-345+i*195,phase:i*1.9}));
export const EGYPT_BIRDS=Array.from({length:12},(_,i)=>({z:-435+i*79,phase:i*2.31}));
export const EGYPT_DOCKS=[-210,155,375] as const;
/** Cargo crews stay on the west-bank dock, avoiding the Nile's riverbed. */
export const EGYPT_DOCK_CREWS=Array.from({length:6},(_,id)=>({
 id,dockIndex:Math.floor(id/2),phase:id*.43,offset:id%2===0?-3:3
}));
/** Tiny wildlife groups are deterministic, never networked or collidable. */
export const EGYPT_RIVER_WILDLIFE=Array.from({length:12},(_,id)=>({
 id,z:-450+id*79,phase:id*1.83,kind:id%3===0?"fish" as const:"heron" as const
}));
/** Back-and-forth unloading: limestone is carried inland and the worker
 * returns empty-handed. Physics is intentionally owned by Bot A. */
export function egyptDockWorkerPose(nowMs:number,index:number){
 const crew=EGYPT_DOCK_CREWS[index%EGYPT_DOCK_CREWS.length];
 const z=EGYPT_DOCKS[crew.dockIndex]+crew.offset;
 const dockX=egyptRiverCenterX(z)-EGYPT_RIVER_WIDTH/2-5;
 const cycle=((nowMs*.00024+crew.phase)%2+2)%2;
 const carrying=cycle<1;
 const progress=carrying?cycle:2-cycle;
 return {x:dockX-1-progress*14,z,heading:carrying?-Math.PI/2:Math.PI/2,
  carrying,step:Math.sin(nowMs*.009+crew.phase)*.12};
}
export const EGYPT_PYRAMIDS=[
 {x:-145,z:-145,base:88,height:59,stages:9},
 {x:-295,z:-300,base:62,height:44,stages:8},
 {x:-275,z:235,base:43,height:32,stages:7}
] as const;

/** Fixed geometry footprints only. Bot A must integrate with its physics
 * broadphase and terrain/riverbank colliders; visual boxes alone are NOT solid. */
export function ancientEgyptSolidProps():EgyptSolid[]{
 const props:EgyptSolid[]=EGYPT_PALMS.map(p=>({
  id:"palm-"+p.id,x:p.x,z:p.z,hx:.8,hz:.8,bottom:0,top:p.height*.86,kind:"palm"
 }));
 for(let i=0;i<EGYPT_PYRAMIDS.length;i++){
  const p=EGYPT_PYRAMIDS[i];
  props.push({id:"pyramid-"+i,x:p.x,z:p.z,hx:p.base*.48,hz:p.base*.48,bottom:0,top:p.height,kind:"pyramid"});
 }
 for(let i=0;i<EGYPT_DOCKS.length;i++){
  const z=EGYPT_DOCKS[i],x=egyptRiverCenterX(z)-EGYPT_RIVER_WIDTH/2-5;
  props.push({id:"dock-"+i,x,z,hx:6,hz:9,bottom:-.2,top:1.1,kind:"dock"});
 }
 for(let i=0;i<6;i++)props.push({
  id:"scaffold-"+i,x:-193+i*13,z:-210,hx:.7,hz:.7,bottom:0,top:13,kind:"scaffold"
 });
 for(let i=0;i<8;i++)props.push({
  id:"hut-"+i,x:-365+(i%4)*25,z:85+Math.floor(i/4)*31,hx:7,hz:6,bottom:0,top:7,kind:"hut"
 });
 return props;
}
/** Pure path state: limestone carriers approach a construction ramp and return.
 * Visual movement only; workers are not physically collidable. */
export function egyptWorkerPose(nowMs:number,index:number){
 const worker=EGYPT_WORKERS[index%EGYPT_WORKERS.length];
 const t=((nowMs*.00033+worker.phase)%2+2)%2;
 const forward=t<1;
 const f=forward?t:2-t;
 return {x:worker.x+f*39,z:worker.z+f*23,heading:forward?Math.atan2(39,23):Math.atan2(-39,-23),
  carrying:worker.carrying&&forward,step:Math.sin(nowMs*.009+worker.phase)*.14};
}
export function egyptBoatPose(nowMs:number,index:number){
 const boat=EGYPT_BOATS[index%EGYPT_BOATS.length];
 const z=boat.z+Math.sin(nowMs*.00016+boat.phase)*42;
 return {x:egyptRiverCenterX(z),z,bob:Math.sin(nowMs*.0015+boat.phase)*.12,
  heading:Math.cos(nowMs*.00016+boat.phase)>=0?0:Math.PI};
}
/** Existing WebGL cube renderer; LOD budgets are local to this scene.
 * Terrain, water solidity and portal placement belong to Bot A. */
export function renderAncientEgyptRiverLife(draw:EgyptDraw,nowMs:number,playerX:number,playerZ:number){
 const t=nowMs*.001;
 // Continuous Nile water with green banks and reeds. Riverbanks remain
 // non-collidable until Bot A's terrain mesh/physics integration.
 const start=Math.max(-520,Math.floor((playerZ-230)/24)*24);
 const end=Math.min(520,playerZ+230);
 for(let z=start;z<=end;z+=24){
  const x=egyptRiverCenterX(z);
  draw(x,-.15,z,EGYPT_RIVER_WIDTH,.18,24.5,RIVER,.9);
  for(const side of [-1,1]){
   const bank=x+side*(EGYPT_RIVER_WIDTH/2+5);
   draw(bank,-.19,z,10,.16,24.5,FERTILE,.92);
   if(near2(bank,z,playerX,playerZ,100)){
    for(let j=0;j<3;j++){
     const rz=z+(j-1)*7;
     draw(bank+side*(1+j*1.7),.5+Math.sin(t*.9+rz)*.06,rz,.13,1.05,.13,REED,.86);
    }
   }
  }
 }
 // Layered unfinished limestone pyramids, visible from afar.
 for(const pyramid of EGYPT_PYRAMIDS){
  if(!near2(pyramid.x,pyramid.z,playerX,playerZ,410))continue;
  for(let level=0;level<pyramid.stages;level++){
   const scale=1-level/pyramid.stages;
   const h=pyramid.height/pyramid.stages;
   draw(pyramid.x,level*h+h/2,pyramid.z,pyramid.base*scale,h,pyramid.base*scale,
    level%2?STONE:LIMESTONE);
  }
  // Diagonal interpretive ramp, its solid collision is not yet integrated.
  if(near2(pyramid.x,pyramid.z,playerX,playerZ,240)){
   for(let k=0;k<8;k++)draw(pyramid.x+pyramid.base*.56+k*3,k*.7+.3,
    pyramid.z+pyramid.base*.24,5,1.3,12,SAND);
  }
 }
 // Timber construction scaffolds, crossbeams and staged limestone.
 if(near2(-150,-190,playerX,playerZ,210)){
  for(let i=0;i<6;i++){
   const x=-193+i*13;
   draw(x,6.5,-210,.75,13,.75,WOOD);
   draw(x,8,-210,13,.48,1.1,WOOD);
   draw(x,12.6,-210,13,.42,1.1,WOOD);
  }
  for(let i=0;i<13;i++)draw(-190+(i%7)*6,.6,-225+Math.floor(i/7)*5,3.6,1.2,3.2,LIMESTONE);
 }
 // Palm trunks are solid-footprint candidates; fronds animate only near camera.
 for(const palm of EGYPT_PALMS){
  if(!near2(palm.x,palm.z,playerX,playerZ,230))continue;
  draw(palm.x,palm.height*.43,palm.z,1.3,palm.height*.86,1.3,WOOD);
  const sway=Math.sin(t*.72+palm.phase)*.38;
  if(!near2(palm.x,palm.z,playerX,playerZ,100)){
   draw(palm.x+sway,palm.height*.91,palm.z,7,1.1,7,PALM);
   continue;
  }
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,reach=4.2+(i%3)*.7;
   draw(palm.x+Math.cos(a)*reach*.52+sway,palm.height*.96-(i%2)*.5,
    palm.z+Math.sin(a)*reach*.52,reach,.35,1.35,i%2?PALM:REED,.95,-a);
  }
  draw(palm.x+sway*.3,palm.height*.95,palm.z,1.4,.8,1.4,PALM);
 }
 // Clay-brick riverside settlement: simple roofs, entrances are left open.
 for(let i=0;i<8;i++){
  const x=-365+(i%4)*25,z=85+Math.floor(i/4)*31;
  if(!near2(x,z,playerX,playerZ,180))continue;
  draw(x-5,3.5,z,1,7,12,SAND);
  draw(x+5,3.5,z,1,7,12,SAND);
  draw(x,3.5,z-5.5,10,7,1,SAND);
  draw(x-3,3.5,z+5.5,4,7,1,SAND);
  draw(x+3,3.5,z+5.5,4,7,1,SAND);
  draw(x,7.1,z,11,.45,12,STONE);
 }
 // Limestone transport workers; near-only limbs, faceless and unarmed.
 for(let i=0;i<EGYPT_WORKERS.length;i++){
  const w=egyptWorkerPose(nowMs,i);
  if(!near2(w.x,w.z,playerX,playerZ,135))continue;
  draw(w.x,1.18,w.z,.8,1.4,.65,LINEN,1,w.heading);
  draw(w.x,2.12,w.z,.52,.55,.52,[.55,.36,.22]);
  if(w.carrying)draw(w.x,2.67,w.z,1.15,.55,.72,LIMESTONE,1,w.heading);
  if(near2(w.x,w.z,playerX,playerZ,70))
   for(const side of [-1,1])draw(w.x+side*.22,.4+side*w.step,w.z,.22,.78,.25,LINEN);
 }
 // Moving river craft with timber hulls, linen sails and stone unloading docks.
 for(let i=0;i<EGYPT_BOATS.length;i++){
  const boat=egyptBoatPose(nowMs,i);
  if(!near2(boat.x,boat.z,playerX,playerZ,200))continue;
  draw(boat.x,.2+boat.bob,boat.z,6,1.15,15,WOOD,1,boat.heading);
  draw(boat.x,3.4+boat.bob,boat.z,.28,6.4,.28,WOOD);
  draw(boat.x,4.7+boat.bob,boat.z,4.7,3.9,.18,LINEN,.85,boat.heading);
  for(let k=0;k<3;k++)draw(boat.x-1.2+k*1.2,1.12+boat.bob,boat.z+2,
   1.2,.9,1.5,LIMESTONE);
 }
 for(const z of EGYPT_DOCKS){
  const x=egyptRiverCenterX(z)-EGYPT_RIVER_WIDTH/2-5;
  if(!near2(x,z,playerX,playerZ,190))continue;
  draw(x,.25,z,12,.6,18,WOOD);
  if(near2(x,z,playerX,playerZ,110))for(let k=0;k<4;k++){
   draw(x-2+k*1.35,1.1,z-2,1.1,1.1,1.1,LIMESTONE);
  }
 }
 // Small dock crews unload limestone in view of the Nile.
 // All crew geometry is visual-only; never add invisible collision walls.
 for(let i=0;i<EGYPT_DOCK_CREWS.length;i++){
  const w=egyptDockWorkerPose(nowMs,i);
  if(!near2(w.x,w.z,playerX,playerZ,125))continue;
  draw(w.x,1.15,w.z,.75,1.35,.62,LINEN,1,w.heading);
  draw(w.x,2.08,w.z,.52,.53,.52,[.55,.36,.22]);
  if(w.carrying)draw(w.x,2.57,w.z,1.12,.52,.84,LIMESTONE,1,w.heading);
  if(near2(w.x,w.z,playerX,playerZ,75))
   for(const side of [-1,1])draw(w.x+side*.23,.4+side*w.step,w.z,.22,.78,.25,LINEN);
 }
 // Riverbank herons and fish breaking the surface: no hitboxes or sound spam.
 // Far silhouettes are a single draw; close details add at most four cubes.
 for(const life of EGYPT_RIVER_WILDLIFE){
  const riverX=egyptRiverCenterX(life.z);
  const x=life.kind==="fish"?riverX+Math.sin(t*.75+life.phase)*9:
   riverX-EGYPT_RIVER_WIDTH/2-7;
  const z=life.z+Math.sin(t*.35+life.phase)*2;
  if(!near2(x,z,playerX,playerZ,105))continue;
  if(life.kind==="fish"){
   const leap=Math.max(0,Math.sin(t*1.3+life.phase));
   draw(x,-.02+leap*.28,z,.7,.14,1.15,[.58,.68,.62],.9,t*.2);
   if(near2(x,z,playerX,playerZ,55)){
    draw(x,-.03,z,2.1,.035,1.6,[.48,.7,.7],.48);
    draw(x,-.02+leap*.32,z-.45,.18,.34,.35,[.45,.6,.56],.85);
   }
  }else{
   const nod=Math.sin(t*.85+life.phase)*.12;
   draw(x,.92,z,.48,1.15,.48,[.84,.83,.73]);
   if(near2(x,z,playerX,playerZ,60)){
    draw(x,1.68+nod,z,.36,.5,.38,[.88,.87,.76]);
    draw(x+.26,1.56+nod,z,.55,.12,.16,[.72,.59,.32]);
    for(const side of [-1,1])draw(x+side*.13,.2,z,.09,.55,.1,[.57,.46,.29]);
   }
  }
 }
 // Distant flock silhouettes use one draw; near flapping wings use three.
 for(const bird of EGYPT_BIRDS){
  const x=egyptRiverCenterX(bird.z)+Math.sin(t*.45+bird.phase)*13;
  const z=bird.z+Math.cos(t*.4+bird.phase)*10;
  if(!near2(x,z,playerX,playerZ,165))continue;
  const y=7+Math.sin(t*1.2+bird.phase)*.9;
  draw(x,y,z,.25,.23,.9,[.88,.85,.74],.9,t*.5+bird.phase);
  if(near2(x,z,playerX,playerZ,80)){
   const flap=Math.sin(t*8+bird.phase)*.3;
   draw(x-.55,y+flap,z,.9,.1,.25,[.9,.86,.77],.9,flap);
   draw(x+.55,y-flap,z,.9,.1,.25,[.9,.86,.77],.9,-flap);
  }
 }
}
