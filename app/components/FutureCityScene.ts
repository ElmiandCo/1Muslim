// Shared WebGL world geometry. The Future universe uses the same renderer, camera,
// avatar, multiplayer presence and movement loop as the main 1Muslim game.
export const FUTURE_BOUNDS={minX:-380,maxX:380,minZ:-380,maxZ:380} as const;
export const FUTURE_PORTAL={x:0,z:-76} as const;
export const FUTURE_TOWERS=Array.from({length:64},(_,i)=>{
 const col=i%8,row=Math.floor(i/8);
 return {x:(col-3.5)*84,z:(row-3.5)*88,height:46+((i*17)%8)*13,width:25+(i%3)*3,depth:26+((i+1)%3)*3,accent:i%3};
});
export const FUTURE_WALKWAYS=[-176,176].map(z=>({x:0,z,y:34,width:84,depth:8}));
export const FUTURE_SKYWAYS=[-220,-132,132,220].map(z=>({x:0,z,y:32,width:85,depth:8}));
export const futureSkywayFloor=(x:number,y:number,z:number)=>
 FUTURE_SKYWAYS.some(w=>Math.abs(x-w.x)<w.width/2&&Math.abs(z-w.z)<w.depth/2&&y>=w.y-.6&&y<=w.y+2.5)?32:-Infinity;
type Draw=(vp:number[],x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void;

/**
 * Decorative, non-solid bioluminescent gardens in the existing Future City.
 * Static coordinates deliberately avoid tower footprints, skyway decks and
 * the return portal. Keep them independent of the shared physics engine.
 */
const FUTURE_GARDEN_SITES=[
 {x:-72,z:0,tint:0},{x:72,z:0,tint:1},{x:0,z:72,tint:2},
 {x:-122,z:0,tint:2},{x:122,z:0,tint:0},{x:0,z:112,tint:1},
] as const;
const FUTURE_GARDEN_BLOOMS=Array.from({length:7},(_,i)=>{
 const angle=i*2.399963229728653, radius=1.8+(i%3)*1.45;
 return {dx:Math.cos(angle)*radius,dz:Math.sin(angle)*radius,phase:i*1.73};
});
export function renderFutureGardens(vp:number[],draw:Draw,playerX:number,playerZ:number,now:number){
 const palette=[[.15,.93,.89],[.98,.73,.34],[.72,.44,.99]] as const;
 for(let siteIndex=0;siteIndex<FUTURE_GARDEN_SITES.length;siteIndex++){
  const site=FUTURE_GARDEN_SITES[siteIndex];
  const distance=Math.hypot(playerX-site.x,playerZ-site.z);
  if(distance>150)continue; // Garden-level LOD; no per-frame allocations.
  const near=distance<84,detail=distance<55;
  const tint=palette[site.tint];
  // Ground-level reflective basin: thin enough not to obstruct player movement.
  draw(vp,site.x,.035,site.z,14,.06,14,[.035,.13,.19],.94);
  draw(vp,site.x,.074,site.z,12,.025,12,[.13,.53,.64],.35);
  for(let i=0;i<FUTURE_GARDEN_BLOOMS.length;i++){
   const bloom=FUTURE_GARDEN_BLOOMS[i],x=site.x+bloom.dx,z=site.z+bloom.dz;
   const sway=near?Math.sin(now*.00135+bloom.phase+siteIndex)*.18:0;
   draw(vp,x,.65,z,.14,1.12,.14,[.12,.55,.48],.95);
   draw(vp,x+sway,1.28,z-sway*.65,.55,.36,.55,tint,.84);
   if(detail){
    for(let petal=0;petal<4;petal++){
     const a=petal*Math.PI/2+now*.0002,px=Math.cos(a)*.43,pz=Math.sin(a)*.43;
     draw(vp,x+sway+px,1.28,z-sway*.65+pz,.38,.18,.38,petal%2?tint:[.72,.98,.9],.78);
    }
   }
  }
  // Small hovering pollinators; their loops are visual-only, not combat targets.
  if(near){
   const orbit=now*.0008+siteIndex*1.7;
   const bx=site.x+Math.cos(orbit)*4.2,bz=site.z+Math.sin(orbit)*4.2;
   const by=2.6+Math.sin(now*.002+siteIndex)*.36;
   draw(vp,bx,by,bz,.43,.24,.65,[.12,.25,.39],.94,orbit);
   draw(vp,bx-.44,by,bz,.5,.06,.38,tint,.62,orbit);
   draw(vp,bx+.44,by,bz,.5,.06,.38,tint,.62,orbit);
  }
 }
}

export function renderFutureWorld(vp:number[],draw:Draw,playerX:number,playerZ:number,now:number){
 const visible=(x:number,z:number,r=390)=>Math.hypot(playerX-x,playerZ-z)<r;
 const cyan=[.13,.9,.99],gold=[1,.71,.28],violet=[.69,.35,.98];
 const accents=[cyan,gold,violet];
 // Ground slabs and luminous street grid: only render cells near the player.
 const cx=Math.round(playerX/64),cz=Math.round(playerZ/64);
 for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){
  if(dx*dx+dz*dz>30)continue;
  const x=(cx+dx)*64,z=(cz+dz)*64;
  draw(vp,x,-.35,z,64,.65,64,(dx+dz)%2===0?[.035,.055,.12]:[.05,.075,.15]);
  if((cx+dx)%2===0)draw(vp,x,.012,z,1.2,.03,64,[.12,.39,.56],.6);
  if((cz+dz)%2===0)draw(vp,x,.014,z,64,.03,1.2,[.12,.39,.56],.6);
 }
 // Open central arrival plaza, holographic stage and radial beacons.
 draw(vp,0,.09,0,68,.18,68,[.065,.12,.2]);
 draw(vp,0,.22,0,26,.2,26,[.13,.28,.34],.86);
 for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a)*31,z=Math.sin(a)*31;
  draw(vp,x,.18,z,1.1,.2,4.5,i%2?cyan:gold,.75,-a);
  if(i%4===0){draw(vp,x,3.2,z,.6,6,.6,[.16,.3,.45]);draw(vp,x,6.3,z,2,.35,2,cyan,.9);}
 }
 // Future plaza's living gardens use distance-based detail without new colliders.
 renderFutureGardens(vp,draw,playerX,playerZ,now);
 // Tall tower clusters. Geometry, trims, and windows are distance-culled.
 for(const t of FUTURE_TOWERS){
  if(!visible(t.x,t.z))continue;
  const c=accents[t.accent],h=t.height;
  draw(vp,t.x,h/2,t.z,t.width,h,t.depth,[.045+.01*t.accent,.085,.16+.025*t.accent]);
  draw(vp,t.x,h+.5,t.z,t.width+2,1.1,t.depth+2,c,.75);
  draw(vp,t.x,h*.55,t.z,t.width+.12,.8,t.depth+.12,c,.6);
  draw(vp,t.x,h*.22,t.z,t.width+.14,.45,t.depth+.14,c,.65);
  for(const side of [-1,1])draw(vp,t.x+side*(t.width/2+.12),h*.49,t.z,.3,h*.92,.35,c,.55);
  // A bright rooftop beacon gives vertical depth without dozens of windows.
  draw(vp,t.x,h+4,t.z,.9,7,.9,c,.8);
 }
 // Elevated glass bridges are fly-to landable surfaces, with luminous railings.
 for(const w of FUTURE_SKYWAYS){
  if(!visible(w.x,w.z,420))continue;
  draw(vp,w.x,w.y-.18,w.z,w.width,.36,w.depth,[.25,.76,.9],.55);
  for(const side of [-1,1]){
   draw(vp,w.x,w.y+1.2,w.z+side*w.depth/2,w.width,.28,.25,cyan,.65);
   draw(vp,w.x,w.y+.65,w.z+side*w.depth/2,w.width,1.3,.15,[.35,.7,.89],.25);
  }
  for(const x of [-35,35])draw(vp,x,w.y/2,w.z,1.5,w.y,1.5,[.11,.24,.35]);
 }
 // Automated elevated traffic with looped paths. Vehicles are decorative,
 // never a source of surprise collision or damage to a moving player.
 for(let i=0;i<12;i++){
  const lane=i%4,travel=(now*.011*(i%2?1:-1)+i*81)%680;
  const x=-340+((travel+680)%680),z=-28+lane*19,y=9+(i%3)*3;
  if(!visible(x,z,330))continue;
  const c=accents[i%3];
  draw(vp,x,y,z,7,1.6,3.2,[.15,.22,.37],.94);
  draw(vp,x,y+.95,z,3.5,.75,2.5,c,.7);
  draw(vp,x-2,y-.8,z,1,.28,2.5,c,.75);
  draw(vp,x+2,y-.8,z,1,.28,2.5,c,.75);
 }
 // Service robots and citizens traverse a small deterministic plaza circuit.
 for(let i=0;i<18;i++){
  const a=now*.0003*(i%2?1:-1)+i*2.399963,r=12+(i%5)*5;
  const x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(!visible(x,z,220))continue;
  const robot=i%3===0,c=robot?cyan:accents[i%3];
  draw(vp,x,robot?1.1:1.05,z,robot?1.1:.7,robot?1.5:1.25,robot?1:.6,c);
  draw(vp,x,robot?2.1:1.95,z,.55,.65,.55,robot?[.65,.96,1]:[.78,.67,.55]);
  if(robot)draw(vp,x,2.55,z,.8,.14,.8,gold,.8);
 }
 // Drones and animated vertical light spires add motion to the skyline.
 for(let i=0;i<10;i++){
  const a=now*.00021+i*.628,r=70+(i%4)*45,x=Math.cos(a)*r,z=Math.sin(a)*r,y=42+(i%3)*17+Math.sin(now*.002+i)*2;
  if(!visible(x,z,350))continue;
  draw(vp,x,y,z,3,.55,3,[.19,.31,.48]);
  for(const side of [-1,1])draw(vp,x+side*2,y,z,.8,.2,.8,cyan,.8);
 }
 // World exit: actual spatial destination, activated with E or HUD button.
 const pulse=.65+.3*Math.sin(now*.004);
 const gate=FUTURE_PORTAL;
 draw(vp,gate.x,4.8,gate.z,9,9.5,.5,[.09,.23,.38],.6);
 for(const side of [-1,1])draw(vp,gate.x+side*4.6,5,gate.z,.65,10,.75,cyan,pulse);
 draw(vp,gate.x,10.1,gate.z,10,.7,.8,gold,pulse);
 draw(vp,gate.x,5,gate.z,.25,8.5,.25,violet,.18+.2*pulse);
}
