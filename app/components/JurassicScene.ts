// Jurassic scene for the existing SharedGameLobby WebGL engine. No external assets.
export type JurassicDino={x:number;z:number;heading:number;predator:boolean;phase:number};
export const jurassicTerrain=(x:number,z:number)=>1.4*Math.sin(x*.018)*Math.cos(z*.021)+.7*Math.sin(z*.053);
export const jurassicDinos:JurassicDino[]=Array.from({length:22},(_,i)=>({x:Math.sin(i*2.41)* (75+i*9),z:Math.cos(i*1.77)*(85+i*8),heading:i*1.7,predator:i%5===0,phase:i*2.3}));
export const jurassicTrees=Array.from({length:180},(_,i)=>({x:Math.sin(i*2.399963)* (45+Math.sqrt(i/180)*530),z:Math.cos(i*2.399963)*(45+Math.sqrt(i/180)*530),height:11+(i%9)*2}));
export const jurassicRocks=Array.from({length:55},(_,i)=>({x:Math.sin(i*3.71)* (60+i*8),z:Math.cos(i*2.67)*(70+i*7),size:2+i%5}));
export function updateJurassicDinos(dt:number,now:number,player:{x:number;z:number;y:number},damage:()=>void){
 for(const d of jurassicDinos){
  const dx=player.x-d.x,dz=player.z-d.z,dist=Math.hypot(dx,dz);
  const chase=d.predator&&dist<65&&player.y<9;
  const heading=chase?Math.atan2(dx,dz):d.phase+Math.sin(now*.00024+d.phase)*1.4;
  d.heading=heading;const speed=chase?8: d.predator?2.6:1.6;
  d.x+=Math.sin(heading)*speed*dt;d.z+=Math.cos(heading)*speed*dt;
  d.x=Math.max(-540,Math.min(540,d.x));d.z=Math.max(-540,Math.min(540,d.z));
  if(chase&&dist<3.8)damage();
 }
}
export function drawJurassic(draw:(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void,now:number){
 for(let x=-550;x<=550;x+=25)for(let z=-550;z<=550;z+=25){
  const river=Math.abs(z-48*Math.sin(x*.012))<19;
  draw(x,jurassicTerrain(x,z)-.65,z,25,1.2,25,river?[.08,.38,.56]:[.14+.04*Math.sin(x),.38+.05*Math.cos(z),.16]);
 }
 for(const t of jurassicTrees){const y=jurassicTerrain(t.x,t.z);draw(t.x,y+t.height*.43,t.z,2,t.height*.86,2,[.29,.19,.10]);draw(t.x,y+t.height*.94,t.z,12,t.height*.65,12,[.06,.29+(t.height%5)*.015,.12]);draw(t.x,y+t.height*1.22,t.z,7,7,7,[.09,.39,.16]);}
 for(const r of jurassicRocks)draw(r.x,jurassicTerrain(r.x,r.z)+r.size*.38,r.z,r.size*1.6,r.size*.8,r.size*1.4,[.33,.36,.31]);
 for(const d of jurassicDinos){const y=jurassicTerrain(d.x,d.z),c=d.predator?[.42,.24,.14]:[.29,.43,.22],a=d.heading;
  draw(d.x,y+2.5,d.z,3.2,3.2,7.5,c,1,a);
  draw(d.x+Math.sin(a)*4,y+4,d.z+Math.cos(a)*4,2.3,2.4,3,c,1,a);
  draw(d.x-Math.sin(a)*5,y+2,d.z-Math.cos(a)*5,1.2,1.1,6,c,1,a);
  for(const side of [-1,1])draw(d.x+Math.cos(a)*side*1.1,y+.9,d.z-Math.sin(a)*side*1.1,1,1.8,1.2,c,1,a);
  if(d.predator)draw(d.x+Math.sin(a)*5,y+4.4,d.z+Math.cos(a)*5,2,1.2,2.6,[.49,.31,.2],1,a);
 }
}
export function jurassicBlocked(x:number,z:number){return jurassicRocks.some(r=>Math.hypot(x-r.x,z-r.z)<r.size*1.1)||jurassicTrees.some(t=>Math.hypot(x-t.x,z-t.z)<2.1);}
