import {proj,type Camera} from "./futureMath";
import {box} from "./futureBox";
import {FUTURE_TOWERS} from "../components/FutureCityScene";
import {drawTraffic} from "./futureTraffic";
export function renderFuture(c:CanvasRenderingContext2D,p:Camera,w:number,h:number,t:number){
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,"#03051c");g.addColorStop(1,"#183b53");c.fillStyle=g;c.fillRect(0,0,w,h);
 c.fillStyle="#101b34";c.fillRect(0,h*.48,w,h);
 for(let z=-560;z<560;z+=30){const a=proj(p,-18,0,z,w,h),b=proj(p,18,0,z,w,h);if(!a||!b)continue;c.strokeStyle="#17617a";c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
 for(const a of [...FUTURE_TOWERS].sort((a,b)=>a.z-b.z)){box(c,p,w,h,a.x,0,a.z,28,a.height,28,a.accent===1?"#32254f":"#152a42");}
 drawTraffic(c,p,w,h,t);
 box(c,p,w,h,0,0,-310,16,14,2,"#1c7eaa");
}
