import {FUTURE_TOWERS,FUTURE_WALKWAYS} from "../components/FutureCityScene";
export type Position={x:number;y:number;z:number};
export function step(p:Position,k:Record<string,boolean>,fast:boolean,fly:boolean){
 const v=fast?1.1:.24,dx=(Number(!!(k.d||k.arrowright))-Number(!!(k.a||k.arrowleft)))*v;
 const dz=(Number(!!(k.s||k.arrowdown))-Number(!!(k.w||k.arrowup)))*v;
 let x=Math.max(-540,Math.min(540,p.x+dx)),z=Math.max(-540,Math.min(540,p.z+dz));
 if(FUTURE_TOWERS.some(t=>Math.abs(t.x-x)<16&&Math.abs(t.z-z)<16&&p.y<t.height)){x=p.x;z=p.z;}
 const deck=FUTURE_WALKWAYS.some(b=>Math.abs(x-b.x)<42&&Math.abs(z-b.z)<4&&p.y>=33.5)?34:0;
 const y=fly?Math.max(0,Math.min(140,p.y+(k[" "]?.5:0)-(k.c?.5:0))):Math.max(deck,p.y-.5);
 return {x,y,z};
}
