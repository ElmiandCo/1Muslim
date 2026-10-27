/**
 * Respectful, faceless NPC pilgrims for the existing game-world Kaaba scenes.
 * This is an interpretive animation, not a historical reconstruction or ritual guide.
 * No prophet or identifiable religious figure is depicted.
 * Render-only: no changes to Bot A's physics, colliders, or navigation.
 */
export type HajjDraw = (
  x:number,y:number,z:number,sx:number,sy:number,sz:number,
  color:number[],alpha?:number,angle?:number
)=>void;
export type HajjLayout = Readonly<{
  kaabaX:number;kaabaZ:number;radius:number;
  safaX:number;safaZ:number;marwaX:number;marwaZ:number;
}>;
export type HajjPhase = "tawaf"|"approach"|"sai"|"complete";
export type HajjPilgrimState = {
  x:number;z:number;heading:number;opacity:number;phase:HajjPhase;
  tawafCircuitsCompleted:number;saiTripsCompleted:number;
};

export const TAWAF_CIRCUITS=7;
export const SAI_TRIPS=7;
export const HAJJ_PILGRIM_COUNT=12;
export const HAJJ_WALK_SPEED=1.45; // game-world units per second
const COMPLETE_HOLD_DISTANCE=28;
const TWO_PI=Math.PI*2;

// Safa/Marwa routes are scaled, interpretive wayfinding rather than surveyed positions.
// The historical route uses an existing clear alley (x=40) to avoid Bot A's building colliders.
export const HISTORICAL_HAJJ_LAYOUT:HajjLayout={
  kaabaX:0,kaabaZ:0,radius:17,safaX:40,safaZ:-34,marwaX:40,marwaZ:34
};
export const TODAY_HAJJ_LAYOUT:HajjLayout={
  kaabaX:0,kaabaZ:184,radius:17,safaX:57,safaZ:144,marwaX:57,marwaZ:224
};

export function hajjRouteLengths(layout:HajjLayout){
  const circumference=TWO_PI*layout.radius;
  const tawaf=circumference*TAWAF_CIRCUITS;
  const approach=Math.hypot(layout.safaX-layout.kaabaX-layout.radius,layout.safaZ-layout.kaabaZ);
  const saiTrip=Math.hypot(layout.marwaX-layout.safaX,layout.marwaZ-layout.safaZ);
  const sai=saiTrip*SAI_TRIPS;
  return {circumference,tawaf,approach,saiTrip,sai,total:tawaf+approach+sai+COMPLETE_HOLD_DISTANCE};
}

export function hajjPilgrimState(nowMs:number,index:number,layout:HajjLayout):HajjPilgrimState{
  const d=hajjRouteLengths(layout);
  // Stagger arrivals without resetting all pilgrims together; fade out before recycling.
  const traveled=((Math.max(0,nowMs)*.001*HAJJ_WALK_SPEED+(index%HAJJ_PILGRIM_COUNT)*119)%d.total+d.total)%d.total;
  const startX=layout.kaabaX+layout.radius,startZ=layout.kaabaZ;
  if(traveled<d.tawaf){
    const angle=traveled/layout.radius;
    const opacity=Math.min(1,traveled/6);
    return {x:layout.kaabaX+Math.cos(angle)*layout.radius,
      z:layout.kaabaZ+Math.sin(angle)*layout.radius,
      heading:angle+Math.PI/2,opacity,phase:"tawaf",
      tawafCircuitsCompleted:Math.min(7,Math.floor(traveled/d.circumference)),
      saiTripsCompleted:0};
  }
  if(traveled<d.tawaf+d.approach){
    const fraction=(traveled-d.tawaf)/d.approach;
    return {x:startX+(layout.safaX-startX)*fraction,
      z:startZ+(layout.safaZ-startZ)*fraction,
      heading:Math.atan2(layout.safaZ-startZ,layout.safaX-startX),
      opacity:1,phase:"approach",tawafCircuitsCompleted:7,saiTripsCompleted:0};
  }
  const saiDistance=traveled-d.tawaf-d.approach;
  if(saiDistance<d.sai){
    const leg=Math.min(6,Math.floor(saiDistance/d.saiTrip));
    const t=(saiDistance-leg*d.saiTrip)/d.saiTrip;
    const fraction=leg%2===0?t:1-t;
    return {x:layout.safaX+(layout.marwaX-layout.safaX)*fraction,
      z:layout.safaZ+(layout.marwaZ-layout.safaZ)*fraction,
      heading:leg%2===0?Math.PI/2:-Math.PI/2,
      opacity:1,phase:"sai",tawafCircuitsCompleted:7,saiTripsCompleted:leg};
  }
  // Seven Safa-Marwa traversals finish at Marwa; remain briefly, then fade.
  const holding=saiDistance-d.sai;
  return {x:layout.marwaX,z:layout.marwaZ,heading:0,
    opacity:Math.max(0,Math.min(1,(COMPLETE_HOLD_DISTANCE-holding)/8)),
    phase:"complete",tawafCircuitsCompleted:7,saiTripsCompleted:7};
}

export function renderHajjPilgrims(draw:HajjDraw,nowMs:number,playerX:number,playerZ:number,layout:HajjLayout):void{
  // All positions deterministic, no state allocations for world props or collision updates.
  for(let i=0;i<HAJJ_PILGRIM_COUNT;i++){
    const pilgrim=hajjPilgrimState(nowMs,i,layout);
    const dx=pilgrim.x-playerX,dz=pilgrim.z-playerZ;
    if(dx*dx+dz*dz>115*115||pilgrim.opacity<.025)continue;
    const bob=Math.sin(nowMs*.008+i*1.7)*.055;
    const stride=Math.sin(nowMs*.009+i*2.3)*.11;
    const white=i%3===0?[.91,.9,.85]:i%3===1?[.97,.96,.93]:[.87,.88,.84];
    const skin=i%4===0?[.42,.27,.19]:i%4===1?[.62,.42,.29]:i%4===2?[.77,.57,.39]:[.35,.24,.19];
    const alpha=pilgrim.opacity,angle=pilgrim.heading;
    // No facial features, weapons, or religious-figure likenesses.
    draw(pilgrim.x,.045,pilgrim.z,.9,.07,.8,[.27,.22,.18],alpha*.25);
    draw(pilgrim.x,1.18+bob,pilgrim.z,.87,1.5,.72,white,alpha,angle);
    draw(pilgrim.x,2.22+bob,pilgrim.z,.54,.57,.54,skin,alpha,angle);
    for(const side of [-1,1]){
      draw(pilgrim.x+side*.52,1.4+bob+side*stride,pilgrim.z,.2,.91,.24,white,alpha,angle);
      draw(pilgrim.x+side*.22,.39+Math.max(0,side*stride),pilgrim.z,.23,.74,.27,[.7,.69,.65],alpha,angle);
    }
  }
}
