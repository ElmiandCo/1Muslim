/** Shared, frame-rate independent projectile physics for the recovered world engine. */
export type BallisticBody={x:number;y:number;z:number;vx:number;vy?:number;vz:number;life:number};
export function gravityForWorld(world:string,moonWalking=false):number{
 if(moonWalking||/moon|lunar/i.test(world))return 1.62;
 if(/space|orbit|zero.gravity/i.test(world))return 0;
 return 9.81;
}
/** Advances position in world units; existing laser weapons remain straight unless gravity is explicitly supplied. */
export function stepProjectile<T extends BallisticBody>(shot:T,dt:number,gravity=0):T{
 const step=Number.isFinite(dt)?Math.max(0,Math.min(dt,.05)):0;
 shot.x+=shot.vx*step;
 shot.y+=(shot.vy??0)*step-.5*gravity*step*step;
 shot.vy=(shot.vy??0)-gravity*step;
 shot.z+=shot.vz*step;
 shot.life-=step;
 return shot;
}
export function hitSphere(a:{x:number;y:number;z:number},b:{x:number;y:number;z:number},radius:number){
 return (a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2<=radius*radius;
}

/** Continuous collision against a spherical target. Prevents fast shots skipping a player between frames. */
export function hitSweptSphere(from:{x:number;y:number;z:number},to:{x:number;y:number;z:number},target:{x:number;y:number;z:number},radius:number):boolean{
 if(!Number.isFinite(radius)||radius<0)return false;
 const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
 const len2=dx*dx+dy*dy+dz*dz;
 const t=len2>0?Math.max(0,Math.min(1,((target.x-from.x)*dx+(target.y-from.y)*dy+(target.z-from.z)*dz)/len2)):0;
 const x=from.x+dx*t-target.x,y=from.y+dy*t-target.y,z=from.z+dz*t-target.z;
 return x*x+y*y+z*z<=radius*radius;
}
