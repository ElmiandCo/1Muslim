/** Living Worlds / Future: lightweight, non-solid aerial courier traffic.
 * Purely visual: does not change flight physics, collisions, weapons or multiplayer.
 * Routes stay above the highest existing Future City tower (137 world units).
 */
export type FutureCourierDraw=(vp:number[],x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void;
export type FutureCourierPose={x:number;y:number;z:number;heading:number};
export const FUTURE_COURIER_ROUTES=Array.from({length:12},(_,i)=>({
 radius:88+(i%6)*31,
 altitude:166+(i%4)*10,
 phase:i*2.399963229728653,
 speed:(i%2===0?1:-1)*(.00009+(i%3)*.000012),
 tint:i%3,
}));
const COURIER_COLORS:number[][]=[[.17,.94,.96],[1,.72,.3],[.74,.52,.99]];
export function futureCourierPose(now:number,index:number):FutureCourierPose{
 const route=FUTURE_COURIER_ROUTES[index];
 const theta=route.phase+now*route.speed;
 const direction=route.speed>0?1:-1;
 const x=Math.cos(theta)*route.radius,z=Math.sin(theta)*route.radius;
 const heading=theta+direction*Math.PI/2;
 return {x,y:route.altitude+Math.sin(now*.0012+index)*.7,z,heading};
}
/** Camera-distance LOD: max 12 couriers; no meshes, timers or per-frame scene allocations. */
export function renderFutureSkyCouriers(vp:number[],draw:FutureCourierDraw,now:number,playerX:number,playerZ:number){
 for(let i=0;i<FUTURE_COURIER_ROUTES.length;i++){
  const pose=futureCourierPose(now,i),route=FUTURE_COURIER_ROUTES[i];
  const distance=Math.hypot(playerX-pose.x,playerZ-pose.z);
  if(distance>270)continue;
  const {x,y,z,heading}=pose,tint=COURIER_COLORS[route.tint];
  // One bright moving silhouette at far distance; detail only close to the camera.
  draw(vp,x,y,z,2.5,.52,1.8,tint,.85,heading);
  if(distance>155)continue;
  const sn=Math.sin(heading),cs=Math.cos(heading);
  draw(vp,x+sn*1.3,y,z+cs*1.3,.75,.34,.8,[.84,.94,1],.9,heading);
  for(const side of [-1,1]){
   const wx=x+cs*side*1.45,wz=z-sn*side*1.45;
   draw(vp,wx,y-.12,wz,1.35,.12,.62,[.13,.24,.35],.94,heading);
   if(distance<95){
    const pulse=.55+.2*Math.sin(now*.004+i*1.3+side);
    draw(vp,wx,y-.25,wz,.42,.14,.42,tint,pulse);
   }
  }
  if(distance<95){
   draw(vp,x-sn*1.65,y-.1,z-cs*1.65,.55,.25,.55,[.22,.85,.94],.6,heading);
   draw(vp,x-sn*2.4,y-.15,z-cs*2.4,.4,.08,1.25,tint,.25,heading);
  }
 }
}
