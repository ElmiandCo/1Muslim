import {type Camera} from "./futureMath";
import {box} from "./futureBox";
export function drawTraffic(c:CanvasRenderingContext2D,p:Camera,w:number,h:number,t:number){
 for(let i=0;i<16;i++){
  const z=((t*.012+i*65)%850)-425,x=i%2?25:-25;
  box(c,p,w,h,x,8+i%4*3,z,7,2,4,i%3?"#14a5bc":"#915ce4");
 }
 for(let i=0;i<25;i++){
  const z=((t*.002*(i%3+1)+i*21)%440)-220,x=i%2?20:-20;
  box(c,p,w,h,x,0,z,.9,3,.9,i%4?"#bd92f2":"#6ef4ee");
 }
 for(const z of [-176,176])box(c,p,w,h,0,34,z,84,2,8,"#377e9b");
}
