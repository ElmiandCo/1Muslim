import {proj,type Camera} from "./futureMath";
export function box(c:CanvasRenderingContext2D,p:Camera,w:number,h:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,col:string){
 const pt=(a:number,b:number,d:number)=>proj(p,a,b,d,w,h);
 const a=pt(x-sx/2,y,z+sz/2),b=pt(x+sx/2,y,z+sz/2),d=pt(x-sx/2,y+sy,z+sz/2),e=pt(x+sx/2,y+sy,z+sz/2),f=pt(x-sx/2,y+sy,z-sz/2),g=pt(x+sx/2,y+sy,z-sz/2);
 if(!a||!b||!d||!e||!f||!g)return;
 const face=(v:readonly (readonly number[])[],color:string)=>{c.fillStyle=color;c.beginPath();c.moveTo(v[0][0],v[0][1]);for(const q of v.slice(1))c.lineTo(q[0],q[1]);c.closePath();c.fill();};
 face([d,e,g,f],"#28465b");face([a,b,e,d],col);
}
