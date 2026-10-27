// Parted Sea: fictionalized historical environment, no depictions of prophets.
// Distances are game meters (9,000 ft long, ~70 ft wide).
export const SEA_LENGTH = 2743;
export const SEA_WIDTH = 21.34;
export const SEA_BOUNDS = {minX: -10.1, maxX: 10.1, minZ: -SEA_LENGTH + 3, maxZ: -3} as const;
export const SEA_SPAWN_Z = -SEA_LENGTH / 2;
export type SeaActor = {x:number;y:number;z:number;yaw:number};
export type SeaShot = {x:number;y:number;z:number;life:number;prevX?:number;prevY?:number;prevZ?:number};
export type SeaImpact = {x:number;y:number;z:number;at:number};
export type SeaBox = {x:number;z:number;hx:number;hz:number;bottom:number;top:number};
export type SeaDraw = (vp:number[],x:number,y:number,z:number,sx:number,sy:number,sz:number,col:number[],alpha?:number,angle?:number)=>void;
type SeaNpc = {id:number;kind:"refugee"|"soldier";x:number;z:number;speed:number;alive:boolean;hits:number;lastAttack:number;fallAt:number};
export type SeaState = {npcs:SeaNpc[];nextId:number;lastWave:number;hits:number[];invulnerableUntil:number;lastHintAt:number;impacts:SeaImpact[];lastDamageAt:number;lastDefeatAt:number};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const refugeZ=[-240,-515,-790,-1070,-1340,-1610,-1880,-2140,-2400];
export function partedSeaColliders():SeaBox[]{
 return refugeZ.map((z,i)=>({x:i%2===0?-7:7,z,hx:2.3,hz:5,bottom:-1,top:3.2+(i%3)*1.1}));
}
export function createPartedSeaState():SeaState {
 const npcs:SeaNpc[]=[];
 for(let i=0;i<25;i++)npcs.push({id:i,kind:"refugee",x:(i%5-2)*2.2,z:-SEA_LENGTH*.38-(i*67)%1450,speed:3.5+(i%4)*.6,alive:true,hits:0,lastAttack:0,fallAt:0});
 for(let i=0;i<22;i++)npcs.push({id:100+i,kind:"soldier",x:(i%7-3)*2.2,z:-30-i*65,speed:10.5,alive:true,hits:0,lastAttack:0,fallAt:0});
 return {npcs,nextId:200,lastWave:0,hits:[],invulnerableUntil:performance.now()+3500,lastHintAt:0,impacts:[],lastDamageAt:0,lastDefeatAt:0};
}
export function updatePartedSea(state:SeaState,dt:number,now:number,player:SeaActor,shots:SeaShot[]):{hits:number;respawn:boolean;defeated:number;sinai:boolean}{
 let hitCount=0,defeated=0;
 state.impacts=state.impacts.filter(i=>now-i.at<650);
 // Local preview AI: bounded population; only nearby enemies chase in detail.
 if(now-state.lastWave>5500&&state.npcs.filter(n=>n.kind==="soldier"&&n.alive).length<72){
  state.lastWave=now;
  for(let i=0;i<3;i++)state.npcs.push({id:state.nextId++,kind:"soldier",x:(i-1)*3.3,z:-10-i*6,speed:10.5,alive:true,hits:0,lastAttack:0,fallAt:0});
 }
 for(const npc of state.npcs){
  if(!npc.alive)continue;
  if(npc.kind==="refugee"){
   npc.z=Math.max(-SEA_LENGTH+15,npc.z-npc.speed*dt);
   continue;
  }
  const nearPlayer=Math.hypot(player.x-npc.x,player.z-npc.z)<35;
  let target:{x:number;z:number}|null=nearPlayer?player:null;
  if(!target){
   let closest=45;
   for(const refugee of state.npcs){if(!refugee.alive||refugee.kind!=="refugee")continue;const d=Math.hypot(refugee.x-npc.x,refugee.z-npc.z);if(d<closest){closest=d;target=refugee;}}
  }
  const desiredX=target?.x??npc.x,desiredZ=target?.z??npc.z-15;
  const dx=desiredX-npc.x,dz=desiredZ-npc.z,dist=Math.hypot(dx,dz)||1;
  const rate=dist<90?1:.28; // far formations use low-cost movement
  if(dist>2){npc.x=clamp(npc.x+dx/dist*npc.speed*dt*rate,-8.7,8.7);npc.z=clamp(npc.z+dz/dist*npc.speed*dt*rate,-SEA_LENGTH*.75,-8);}
  // Soldiers cannot ascend rocky refuges.
  if(refugeZ.some((z,i)=>Math.abs(npc.z-z)<6&&Math.abs(npc.x-(i%2===0?-7:7))<3))npc.x=clamp(npc.x+(npc.x>=0?-1:1)*npc.speed*dt,-8.7,8.7);
  if(nearPlayer&&Math.hypot(player.x-npc.x,player.z-npc.z)<2.8&&player.y<2.8&&now>state.invulnerableUntil&&now-npc.lastAttack>1250){
   npc.lastAttack=now;state.hits=state.hits.filter(t=>now-t<10000);state.hits.push(now);hitCount=state.hits.length;state.lastDamageAt=now;state.invulnerableUntil=now+1050;
  }else if(target&&"kind" in target&&Math.hypot(target.x-npc.x,target.z-npc.z)<2.5&&now-npc.lastAttack>1600){
   npc.lastAttack=now;const victim=target as SeaNpc;victim.hits++;if(victim.hits>=3){victim.alive=false;victim.fallAt=now;}
  }
  for(const shot of shots){if(shot.life<=0)continue;const ax=shot.prevX??shot.x,az=shot.prevZ??shot.z,ay=shot.prevY??shot.y;const dx=shot.x-ax,dz=shot.z-az;const t=clamp(((npc.x-ax)*dx+(npc.z-az)*dz)/(dx*dx+dz*dz||1),0,1);const hx=ax+dx*t,hz=az+dz*t,hy=ay+(shot.y-ay)*t;if(Math.hypot(hx-npc.x,hz-npc.z)<.75&&hy>.3&&hy<2.55){npc.alive=false;npc.fallAt=now;shot.life=0;state.impacts.push({x:hx,y:hy,z:hz,at:now});defeated++;break;}}
 }
 // Bound history and remove defeated NPCs after fall animation.
 state.npcs=state.npcs.filter(n=>n.alive||now-n.fallAt<1300);
 const respawn=state.hits.length>=3;
 if(respawn){state.lastDefeatAt=now;state.hits=[];state.invulnerableUntil=now+3500;}
 return {hits:hitCount,respawn,defeated,sinai:player.z<-SEA_LENGTH+16};
}
// Living Worlds: deterministic shoals behind the water wall. Decorative, not collidable.
// Generated once; nearby-only detail avoids per-frame arrays and distant GPU work.
const SEA_SHOALS=Array.from({length:26},(_,i)=>({
 z:-76-i*102,side:i%2===0?-1:1,y:7+(i*7)%30,phase:i*1.618
}));
const SEA_FISH_BODY:number[]=[.73,.9,.91];
const SEA_FISH_FIN:number[]=[.48,.74,.81];
const SEA_BUBBLE:number[]=[.75,.96,1];
const SEA_FOAM:number[]=[.85,.98,1];
function renderSeaShoals(vp:number[],draw:SeaDraw,now:number,p:SeaActor):void{
 const t=now*.001;
 for(const school of SEA_SHOALS){
  const distance=Math.abs(school.z-p.z);
  if(distance>190)continue;
  const x=school.side*(15.7+Math.sin(t*.45+school.phase)*.4);
  const y=school.y+Math.sin(t*.6+school.phase)*.65;
  for(let j=0;j<5;j++){
   const phase=t*.88+school.phase+j*.8;
   const z=school.z+(j-2)*.9+Math.sin(phase)*2.1;
   const fy=y+(j-2)*.35+Math.cos(phase*.75)*.45;
   const fx=x+school.side*(j%3)*.3;
   draw(vp,fx,fy,z,.85,.34,.27,SEA_FISH_BODY,.72);
   if(distance<105){
    draw(vp,fx-school.side*.46,fy,z,.32,.43,.14,SEA_FISH_FIN,.65);
    draw(vp,fx,fy+.23,z,.28,.21,.12,SEA_FISH_FIN,.62);
   }
  }
  if(distance<105)for(let j=0;j<4;j++){
   const bubbleY=2+((t*(.7+j*.11)+j*4+school.phase)%37);
   draw(vp,school.side*14.6,bubbleY,school.z+(j-1.5)*1.7,.16,.16,.16,SEA_BUBBLE,.36);
  }
 }
}

export function renderPartedSea(vp:number[],draw:SeaDraw,now:number,p:SeaActor,state:SeaState):void{
 const time=now*.001;
 // Dry, winding seabed and uninterrupted water walls. Geometry is culled to a
 // 460m radius of the player, preserving a wide vista without thousands of draws.
 for(let z=-18;z>-SEA_LENGTH;z-=36){
  if(Math.abs(z-p.z)>470)continue;
  draw(vp,0,-.42,z,SEA_WIDTH,.84,36.3,[.73,.57,.37]);
  for(const side of [-1,1]){
   const x=side*11.7, crest=49+4*Math.sin(z*.012+time*.35);
   draw(vp,x,crest/2,z,2.8,crest,36.5,[.06,.36,.67],.9);
   draw(vp,x-side*1.5,crest/2,z,.75,crest,36.5,[.13,.75,.92],.36);
   draw(vp,x,crest+.6,z,3.4,1.3,36.5,[.69,.95,1],.78);
   // Wind-driven foam stays on the inner wall, never across the dry crossing.
   if(Math.abs(z-p.z)<175&&Math.round(Math.abs(z)/36)%3===0)
    draw(vp,side*10.2,.45+Math.sin(time*1.2+z*.03)*.12,z,.32,.35,24,SEA_FOAM,.44);
   for(let k=0;k<2;k++){const y=9+k*19+Math.sin(time+z*.02+k)*2;draw(vp,x-side*2.9,y,z,.15,1.6,27,[.68,.95,1],.27);}
  }
 }
 // Stones and high refuges: players can fly onto them, soldiers cannot.
 refugeZ.forEach((z,i)=>{if(Math.abs(z-p.z)>480)return;const x=i%2===0?-7:7,h=3.2+(i%3)*1.1;draw(vp,x,h/2,z,4.6,h,10,[.49,.42,.35]);draw(vp,x,h+.25,z,5.5,.5,11,[.66,.59,.48]);draw(vp,x+1,h+1,z-2,2.1,1.7,3,[.63,.55,.44]);});
 // Fish silhouettes are kept behind the walls, never in the dry corridor.
 for(let i=0;i<34;i++){const z=-((i*113+470)%SEA_LENGTH);if(Math.abs(z-p.z)>200)continue;const side=i%2?1:-1,x=side*(14.8+Math.sin(time+i)*.5),y=9+(i*7)%34;draw(vp,x,y,z+Math.sin(time*.9+i)*2,1.4,.65,.35,[.75,.87,.87],.68);draw(vp,x+side*.9,y,z,.55,.55,.5,[.85,.92,.86],.5);}
 // Five-fish shoals and bubble columns move behind the parted walls.
 renderSeaShoals(vp,draw,now,p);
 // Golden Egyptian origin arch at positive Z; far Sinai arch stays distinct and reserved.
 for(const z of [-14,-SEA_LENGTH+13]){if(Math.abs(z-p.z)>560)continue;for(const side of [-1,1])draw(vp,side*5.2,6,z,1.1,12,1.1,[.81,.66,.3]);draw(vp,0,12,z,12,1.1,2,[.92,.78,.39]);draw(vp,0,5.8,z,.45,10,9,z===-14?[.95,.58,.16]:[.18,.91,.73],.27);}
 // Human silhouettes are generic game NPCs; no prophets are represented.
 for(const n of state.npcs){if(Math.abs(n.z-p.z)>190)continue;const soldier=n.kind==="soldier";const c=soldier?[.46,.28,.18]:[.8,.72,.58];const y=n.alive?0:-1.1;
  draw(vp,n.x,y+1.1,n.z,.75,1.5,.65,c,1);
  draw(vp,n.x,y+2.1,n.z,.55,.6,.55,soldier?[.58,.39,.25]:[.69,.52,.38]);
  for(const s of [-1,1])draw(vp,n.x+s*.25,y+.35,n.z,.24,.75,.3,c);
  if(soldier){const striking=now-n.lastAttack<360;const thrust=striking?Math.sin((now-n.lastAttack)/360*Math.PI)*1.9:0;draw(vp,n.x+.55,y+1.1,n.z+thrust,.13,2.4,.13,[.56,.52,.43]);draw(vp,n.x+.55,y+2.35,n.z+thrust,.38,.65,.3,[.82,.81,.76]);}
 }
 // Short-lived sparks burst outward from every confirmed projectile hit.
 for(const impact of state.impacts){if(Math.abs(impact.z-p.z)>190)continue;const age=(now-impact.at)/650;if(age<0||age>1)continue;for(let i=0;i<14;i++){const angle=i*2.39996;const radius=age*(1.8+(i%4)*.45);draw(vp,impact.x+Math.cos(angle)*radius,impact.y+Math.sin(i*1.7)*radius*.7,impact.z+Math.sin(angle)*radius,.16*(1-age)+.035,.16*(1-age)+.035,.16*(1-age)+.035,i%3===0?[1,.38,.15]:[1,.85,.22],1-age);}}
}
