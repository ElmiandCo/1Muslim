// Jurassic scene for the existing SharedGameLobby WebGL engine. No external assets.
export type JurassicDino={x:number;z:number;heading:number;predator:boolean;phase:number};
export const JURASSIC_LIMIT=1080; // Double width and depth = four times the explorable area.
export const GIANT_CAVE={x:650,z:420,radius:105};
export const JURASSIC_EXIT_PORTAL={x:0,z:-95,radius:8} as const;
export const isAtJurassicExit=(x:number,z:number,y:number)=>Math.hypot(x-JURASSIC_EXIT_PORTAL.x,z-JURASSIC_EXIT_PORTAL.z)<JURASSIC_EXIT_PORTAL.radius&&y<14;
export const APEX_AGGRO_RADIUS=400;
export const APEX_SPEED=49.5*15; // Fifteen times standard flight boost.
export const APEX_RESPAWN_MS=300000;
export const APEX_REQUIRED_HITS=100;
export const jurassicApexState={hits:0,hiddenUntil:0,returning:false,spawnIndex:0};
const APEX_SPAWNS=[{x:200,z:870},{x:950,z:-120},{x:-90,z:640}];
export function hitJurassicApex(now:number,x:number,z:number,y:number){const a=jurassicApexState,d=jurassicGiant;if(a.hiddenUntil>now)return false;const dist=Math.hypot(x-d.x,z-d.z);if(dist>105||Math.abs(y-(jurassicTerrain(d.x,d.z)+50))>75)return false;a.hits++;if(a.hits>=APEX_REQUIRED_HITS){a.hits=0;a.hiddenUntil=now+APEX_RESPAWN_MS;a.returning=true;}return true;}
export function apexRemainingHits(){return APEX_REQUIRED_HITS-jurassicApexState.hits;}
const near=(x:number,z:number,a:number,b:number,r:number)=>Math.hypot(x-a,z-b)<r;
export const jurassicTerrain=(x:number,z:number)=>1.4*Math.sin(x*.018)*Math.cos(z*.021)+.7*Math.sin(z*.053);
export const jurassicDinos:JurassicDino[]=Array.from({length:38},(_,i)=>({x:Math.sin(i*2.41)* (95+i*23),z:Math.cos(i*1.77)*(100+i*22),heading:i*1.7,predator:i%5===0,phase:i*2.3}));
export const jurassicTrees=Array.from({length:650},(_,i)=>({x:Math.sin(i*2.399963)* (45+Math.sqrt(i/650)*1050),z:Math.cos(i*2.399963)*(45+Math.sqrt(i/650)*1050),height:11+(i%9)*2}));
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
 const state=jurassicApexState;
 if(state.hiddenUntil>now)return;
 if(state.hiddenUntil&&now>=state.hiddenUntil){state.hiddenUntil=0;const spawn=APEX_SPAWNS[state.spawnIndex++%APEX_SPAWNS.length];giant.x=spawn.x;giant.z=spawn.z;state.returning=true;}
 const dx=player.x-giant.x,dz=player.z-giant.z,dist=Math.hypot(dx,dz);
 const aggro=dist<APEX_AGGRO_RADIUS&&player.y<140;
 giant.heading=aggro?Math.atan2(dx,dz):Math.atan2(GIANT_CAVE.x-giant.x,GIANT_CAVE.z-giant.z);
 const speed=aggro?APEX_SPEED:state.returning?16:2.2;
 const step=Math.min(dist,Math.max(0,speed*dt));
 giant.x=Math.max(-JURASSIC_LIMIT,Math.min(JURASSIC_LIMIT,giant.x+Math.sin(giant.heading)*step));
 giant.z=Math.max(-JURASSIC_LIMIT,Math.min(JURASSIC_LIMIT,giant.z+Math.cos(giant.heading)*step));
 if(!aggro&&Math.hypot(giant.x-GIANT_CAVE.x,giant.z-GIANT_CAVE.z)<10){giant.x=GIANT_CAVE.x;giant.z=GIANT_CAVE.z;state.returning=false;}
 if(aggro&&dist<58&&Math.abs(player.y-jurassicTerrain(giant.x,giant.z))<94)damage();
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
  // A secret tunnel leads behind the cave wall to a hidden chamber.
  draw(cx,2,cz-72,16,3,160,[.13,.15,.16]);
  for(const side of [-1,1])draw(cx+side*11,12,cz-92,3,24,130,[.25,.27,.28]);
  draw(cx,26,cz-92,26,4,130,[.24,.25,.26]);
  draw(cx,2,cz-176,82,3,68,[.20,.22,.23]);
  for(const side of [-1,1])draw(cx+side*43,19,cz-176,5,38,70,[.27,.28,.3]);
  draw(cx,40,cz-176,90,5,72,[.27,.28,.3]);
  draw(cx,7,cz-192,18,10,18,[.51,.37,.12]);
  draw(cx,14,cz-192,10,4,10,[.79,.64,.27]);
 }
 // The illuminated return portal is visible from the arrival clearing and works on foot.
 if(near(playerX,playerZ,JURASSIC_EXIT_PORTAL.x,JURASSIC_EXIT_PORTAL.z,255)){
  const {x,z}=JURASSIC_EXIT_PORTAL;
  draw(x,jurassicTerrain(x,z)+.15,z,22,.3,19,[.28,.24,.16]);
  for(const side of [-1,1])draw(x+side*7,8,z,2.8,16,3,[.76,.57,.2]);
  draw(x,17,z,18,2.6,4,[.92,.75,.31]);
  draw(x,9,z,12,14,.7,[.08,.85,.68],.48);
  draw(x,8,z+.7,10,12,.3,[.34,.92,.78],.3);
 }
 // The apex remains visible while hunting beyond the cave city.
 if(near(playerX,playerZ,jurassicGiant.x,jurassicGiant.z,440)){
   const d=jurassicGiant,y=jurassicTerrain(d.x,d.z),a=d.heading;
   if(jurassicApexState.hiddenUntil<=now&&near(playerX,playerZ,d.x,d.z,440)){
   const g=(x:number,yy:number,z:number,sx:number,sy:number,sz:number,c:number[])=>draw(x,yy,z,sx,sy,sz,c,1,a);
   g(d.x,y+37,d.z,48,48,112,[.37,.23,.17]);
   g(d.x+Math.sin(a)*58,y+66,d.z+Math.cos(a)*58,36,37,42,[.41,.25,.18]);
   g(d.x+Math.sin(a)*81,y+54,d.z+Math.cos(a)*81,40,19,29,[.32,.19,.14]);
   g(d.x-Math.sin(a)*74,y+24,d.z-Math.cos(a)*74,17,17,110,[.33,.21,.15]);
   for(const side of [-1,1])g(d.x+Math.cos(a)*side*20,y+15,d.z-Math.sin(a)*side*20,15,30,20,[.31,.19,.14]);
   }
 }

}
export function jurassicBlocked(x:number,z:number){
 const within=(cx:number,cz:number,hx:number,hz:number)=>Math.abs(x-cx)<hx+1&&Math.abs(z-cz)<hz+1;
 // Match the rock-city towers and cave pillars to visible geometry; leave the cave mouth and tunnel open.
 if(near(x,z,GIANT_CAVE.x,GIANT_CAVE.z,190)){
  for(let i=0;i<30;i++){const a=i*Math.PI*2/30,r=GIANT_CAVE.radius+(i%3)*12,cx=GIANT_CAVE.x+Math.sin(a)*r,cz=GIANT_CAVE.z+Math.cos(a)*r;
   if(within(cx,cz,8,9))return true;
  }
  if(within(GIANT_CAVE.x-34,GIANT_CAVE.z+60,9.5,14)||within(GIANT_CAVE.x+34,GIANT_CAVE.z+60,9.5,14))return true;
  if(within(GIANT_CAVE.x-11,GIANT_CAVE.z-92,1.5,65)||within(GIANT_CAVE.x+11,GIANT_CAVE.z-92,1.5,65))return true;
  if(within(GIANT_CAVE.x-43,GIANT_CAVE.z-176,2.5,35)||within(GIANT_CAVE.x+43,GIANT_CAVE.z-176,2.5,35))return true;
 }
 return jurassicRocks.some(r=>!near(r.x,r.z,GIANT_CAVE.x,GIANT_CAVE.z,145)&&Math.hypot(x-r.x,z-r.z)<r.size*1.1)||jurassicTrees.some(t=>!near(t.x,t.z,GIANT_CAVE.x,GIANT_CAVE.z,145)&&Math.hypot(x-t.x,z-t.z)<2.1);
}
