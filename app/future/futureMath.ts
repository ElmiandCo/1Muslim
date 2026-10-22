export type Camera={x:number;y:number;z:number};
export const proj=(p:Camera,x:number,y:number,z:number,w:number,h:number)=>{
 const d=p.z-z+18;if(d<=2)return null;const k=Math.min(3000,Math.min(w,h)*1.4/d);
 return [w/2+(x-p.x)*k,h*.48+(p.y+6-y)*k] as const;
};
export function box(c:CanvasRenderingContext2D,p:Camera,w:number,h:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,col:string){
 const a=proj(p,x-sx/2,y,z+sz/2,w,h),b=proj(p,x+sx/2,y,z+sz/2,w,h),d=proj(p,x-sx/2,y+sy,z+sz/2,w,h),e=proj(p,x+sx/2,y+sy,z+sz/2,w,h);
 if(!a||!b||!d||!e)return;
 c.fillStyle=col;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...e);c.lineTo(...d);c.closePath();c.fill();
 c.strokeStyle="#55d7f9";c.lineWidth=1;c.stroke();
}
