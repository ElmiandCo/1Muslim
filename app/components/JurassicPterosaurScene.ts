/** Jurassic ambient aerial wildlife. Render-only; never modifies physics, dinos, portals or combat. */
export type JurassicPterosaurDraw=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void;
export const JURASSIC_PTEROSAUR_FLOCK=Array.from({length:14},(_,i)=>{
 const x=-720+i*105;
 return {x,z:48*Math.sin(x*.012)+66+(i%4)*22,altitude:38+(i%5)*6,phase:i*2.399963};
});
/** Deterministic glide with mild wing-beat and no allocation-heavy particle effects. */
export function jurassicPterosaurPose(now:number,index:number){
 const bird=JURASSIC_PTEROSAUR_FLOCK[index];
 if(!bird)return null;
 const t=now*.00016+bird.phase;
 const x=bird.x+Math.sin(t)*28;
 const z=bird.z+Math.cos(t*.83)*23;
 const y=bird.altitude+Math.sin(t*1.7)*3.5;
 const dx=Math.cos(t)*28, dz=-Math.sin(t*.83)*23*.83;
 return {x,y,z,heading:Math.atan2(dx,dz),flap:Math.sin(now*.006+bird.phase)};
}
export function renderJurassicPterosaurs(draw:JurassicPterosaurDraw,now:number,playerX:number,playerZ:number){
 for(let i=0;i<JURASSIC_PTEROSAUR_FLOCK.length;i++){
  const bird=JURASSIC_PTEROSAUR_FLOCK[i];
  // Two-stage culling: cheap fixed-origin check before calculating the animated pose.
  if(Math.hypot(playerX-bird.x,playerZ-bird.z)>355)continue;
  const p=jurassicPterosaurPose(now,i);
  if(!p)continue;
  const distance=Math.hypot(playerX-p.x,playerZ-p.z);
  if(distance>315)continue;
  const close=distance<155,heading=p.heading;
  const forwardX=Math.sin(heading),forwardZ=Math.cos(heading);
  const sideX=Math.cos(heading),sideZ=-Math.sin(heading);
  const body=i%3===0?[.40,.29,.21]:i%3===1?[.37,.39,.34]:[.44,.34,.27];
  draw(p.x,p.y,p.z,1.25,.85,3.7,body,1,heading);
  for(const side of [-1,1]){
   const wx=p.x+sideX*side*3.1,wz=p.z+sideZ*side*3.1;
   draw(wx,p.y+.45+Math.abs(p.flap)*.7,wz,6.2,.24,1.7,body,.98,heading);
   if(close){
    draw(p.x+sideX*side*6.2,p.y+1.05+p.flap*.85,p.z+sideZ*side*6.2,2.4,.22,1.1,body,.92,heading);
   }
  }
  if(close){
   draw(p.x+forwardX*2.15,p.y+.18,p.z+forwardZ*2.15,.8,.7,1.1,body,1,heading);
   draw(p.x+forwardX*3.15,p.y-.05,p.z+forwardZ*3.15,.35,.24,1.9,[.58,.43,.27],1,heading);
   draw(p.x-forwardX*2.3,p.y-.18,p.z-forwardZ*2.3,.55,.26,1.6,body,.96,heading);
  }
 }
}
