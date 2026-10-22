// Jurassic scene for the existing SharedGameLobby WebGL engine. No external assets.
export type JurassicDino={x:number;z:number;heading:number;predator:boolean;phase:number};
export const JURASSIC_LIMIT=1080; // Double width and depth = four times the explorable area.
export const GIANT_CAVE={x:650,z:420,radius:105};
const near=(x:number,z:number,a:number,b:number,r:number)=>Math.hypot(x-a,z-b)<r;
export const jurassicTerrain=(x:number,z:number)=>1.4*Math.sin(x*.018)*Math.cos(z*.021)+.7*Math.sin(z*.053);
export const jurassicDinos:JurassicDino[]=Array.from({length:38},(_,i)=>({x:Math.sin(i*2.41)* (95+i*23),z:Math.cos(i*1.77)*(100+i*22),heading:i*1.7,predator:i%5===0,phase:i*2.3}));
export const jurassicTrees=Array.from({length:650},(_,i)=>({x:Math.sin(i*2.399963)* (45+Math.sqrt(i/650)*1050),z:Math.cos(i*2.399963)*(45+Math.sqrt(i/180)*530),height:11+(i%9)*2}));
export const jurassicRocks=Array.from({length:130},(_,i)=>({x:Math.sin(i*3.71)* (60+i*7),z:Math.cos(i*2.67)*(70+i*7),size:2+i%5}));
export function updateJurassicDinos(dt:number,now:number,player:{x:number;z:number;y:number},damage:()=>void){
 for(const d of jurassicDinos){
  const dx=player.x-d.x,dz=player.z-d.z,dist=Math.hypot(dx,dz);
  const chase=d.predator&&dist<65&&player.y<9;
  const heading=chase?Math.atan2(dx,dz):d.phase+Math.sin(now*.00024+d.phase)*1.4;
  d.heading=heading;const speed=chase?8: d.predator?2.6:1.6;
  d.x+=Math.sin(heading)*speed*dt;d.z+=Math.cos(heading)*speed*dt;
  d.x=Math.max(-JURASSIC_LIMIT,Math.min(JURASSIC_LIMIT,d.x));d.z=Math.max(-JURASSIC_LIMIT,Math.min(JURASSIC_LIMIT,d.z));
  if(chase&&dist<3.8)damage();
 }
 // Apex dinosaur patrols the rock city, then charges intruders into its cave.
 const giant=jurassicGiant;
 const dx=player.x-giant.x,dz=player.z-giant.z,dist=Math.hypot(dx,dz);
 const aggro=dist<210&&player.y<65;
 giant.heading=aggro?Math.atan2(dx,dz):Math.atan2(GIANT_CAVE.x-giant.x,GIANT_CAVE.z-giant.z);
 const speed=aggro?16:2.2;
 giant.x+=Math.sin(giant.heading)*speed*dt;giant.z+=Math.cos(giant.heading)*speed*dt;
 if(!aggro&&Math.hypot(giant.x-GIANT_CAVE.x,giant.z-GIANT_CAVE.z)<10){giant.x=GIANT_CAVE.x;giant.z=GIANT_CAVE.z;}
 if(aggro&&dist<29)damage();
}
export const jurassicGiant:JurassicDino={x:GIANT_CAVE.x,z:GIANT_CAVE.z,heading:0,predator:true,phase:0};
export function drawJurassic(draw:(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void,now:number,playerX=0,playerZ=0){
 for(let x=Math.max(-JURASSIC_LIMIT,Math.floor((playerX-230)/25)*25);x<=Math.min(JURASSIC_LIMIT,playerX+230);x+=25)for(let z=Math.max(-JURASSIC_LIMIT,Math.floor((playerZ-230)/25)*25);z<=Math.min(JURASSIC_LIMIT,playerZ+230);z+=25){
  const river=Math.abs(z-48*Math.sin(x*.012))<19;
  draw(x,jurassicTerrain(x,z)-.65,z,25,1.2,25,river?[.08,.38,.56]:[.14+.04*Math.sin(x),.38+.05*Math.cos(z),.16]);
 }
 for(const t of jurassicTrees){if(!near(playerX,playerZ,t.x,t.z,250)||near(t.x,t.z,GIANT_CAVE.x,GIANT_CAVE.z,145))continue;const y=jurassicTerrain(t.x,t.z);draw(t.x,y+t.height*.43,t.z,2,t.height*.86,2,[.29,.19,.10]);draw(t.x,y+t.height*.94,t.z,12,t.height*.65,12,[.06,.29+(t.height%5)*.015,.12]);draw(t.x,y+t.height*1.22,t.z,7,7,7,[.09,.39,.16]);}
 for(const r of jurassicRocks.filter(r=>near(playerX,playerZ,r.x,r.z,250)&&!near(r.x,r.z,GIANT_CAVE.x,GIANT_CAVE.z,145)))draw(r.x,jurassicTerrain(r.x,r.z)+r.size*.38,r.z,r.size*1.6,r.size*.8,r.size*1.4,[.33,.36,.31]);
 for(const d of jurassicDinos){if(!near(playerX,playerZ,d.x,d.z,260))continue;const y=jurassicTerrain(d.x,d.z),c=d.predator?[.42,.24,.14]:[.29,.43,.22],a=d.heading;
  draw(d.x,y+2.5,d.z,3.2,3.2,7.5,c,1,a);
  draw(d.x+Math.sin(a)*4,y+4,d.z+Math.cos(a)*4,2.3,2.4,3,c,1,a);
  draw(d.x-Math.sin(a)*5,y+2,d.z-Math.cos(a)*5,1.2,1.1,6,c,1,a);
  for(const side of [-1,1])draw(d.x+Math.cos(a)*side*1.1,y+.9,d.z-Math.sin(a)*side*1.1,1,1.8,1.2,c,1,a);
  if(d.predator)draw(d.x+Math.sin(a)*5,y+4.4,d.z+Math.cos(a)*5,2,1.2,2.6,[.49,.31,.2],1,a);
 }
 // Rock City: concentric basalt towers, accessible arched cave and an apex dinosaur 15x scale.
 if(near(playerX,playerZ,GIANT_CAVE.x,GIANT_CAVE.z,330)){
  const {x:cx,z:cz}=GIANT_CAVE;
  for(let i=0;i<30;i++){const a=i*Math.PI*2/30,r=GIANT_CAVE.radius+(i%3)*12,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;
   const h=38+(i%6)*13;draw(x,jurassicTerrain(x,z)+h*.5,z,16,h,18,[.27,.29,.30]);draw(x,jurassicTerrain(x,z)+h,z,21,8,21,[.34,.35,.35]);}
  // Dark cave mouth, tall stone lintel and side columns. Leave the central passage open.
  draw(cx-34,27,cz+60,19,54,28,[.22,.23,.24]);
  draw(cx+34,27,cz+60,19,54,28,[.22,.23,.24]);
  draw(cx,62,cz+60,90,16,30,[.24,.26,.26]);
  draw(cx,1,cz+30,82,2,96,[.16,.18,.18]);
  const d=jurassicGiant,y=jurassicTerrain(d.x,d.z),a=d.heading;
  const g=(x:number,yy:number,z:number,sx:number,sy:number,sz:number,c:number[])=>draw(x,yy,z,sx,sy,sz,c,1,a);
  g(d.x,y+37,d.z,48,48,112,[.37,.23,.17]);
  g(d.x+Math.sin(a)*58,y+66,d.z+Math.cos(a)*58,36,37,42,[.41,.25,.18]);
  g(d.x+Math.sin(a)*81,y+54,d.z+Math.cos(a)*81,40,19,29,[.32,.19,.14]);
  g(d.x-Math.sin(a)*74,y+24,d.z-Math.cos(a)*74,17,17,110,[.33,.21,.15]);
  for(const side of [-1,1])g(d.x+Math.cos(a)*side*20,y+15,d.z-Math.sin(a)*side*20,15,30,20,[.31,.19,.14]);
 }
}
export function jurassicBlocked(x:number,z:number){return (near(x,z,GIANT_CAVE.x,GIANT_CAVE.z,140)?false:jurassicRocks.some(r=>Math.hypot(x-r.x,z-r.z)<r.size*1.1))||jurassicTrees.some(t=>!near(t.x,t.z,GIANT_CAVE.x,GIANT_CAVE.z,145)&&Math.hypot(x-t.x,z-t.z)<2.1);}
