/**
 * Living Worlds / Rome: interpretive monumental arena and ambient street cats.
 * Render-only. Bot A owns authoritative lion AI, combat, arena solidity and navigation.
 * No claim that this stylized amphitheater represents a specific historical building.
 */
export type RomanArenaDraw=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,angle?:number)=>void;
export type RomanLionVisualState={x:number;z:number;heading:number;attackProgress?:number;active:boolean};
export const ROMAN_GRAND_ARENA={
 x:365,z:-345,outerX:90,outerZ:68,innerX:62,innerZ:45,
 entrance:{x:365,z:-277,width:16},height:31,
} as const;
const TRAVERTINE=[.84,.78,.67],LIGHT_STONE=[.93,.86,.73],SHADOW=[.47,.39,.32],SAND=[.67,.52,.35],BRONZE=[.62,.43,.23];
const dist=(x:number,z:number,px:number,pz:number)=>Math.hypot(x-px,z-pz);
const gap=(a:number)=>Math.abs(Math.sin(a))>.975||Math.cos(a)<-.975;
export function renderRomanGrandArena(paint:RomanArenaDraw,now:number,player:{x:number;z:number}){
 const d=dist(ROMAN_GRAND_ARENA.x,ROMAN_GRAND_ARENA.z,player.x,player.z);
 if(d>315)return;
 const {x:cx,z:cz,outerX,outerZ}=ROMAN_GRAND_ARENA;
 const close=d<155,segments=close?32:16;
 // Broad, open arena floor and accessible-looking southern gateway. Collision
 // remains Bot A's separate task: the visuals do not define walkable physics.
 paint(cx,.09,cz,130,.18,94,SAND);
 paint(cx,.13,cz,113,.08,80,[.73,.58,.4],.7);
 for(let i=0;i<segments;i++){
  const a=i*Math.PI*2/segments,open=gap(a);
  if(open)continue;
  const ca=Math.cos(a),sa=Math.sin(a),x=cx+outerX*ca,z=cz+outerZ*sa;
  // Three open tiers, with a continuous exterior rhythm of columns and arches.
  paint(x,6,z,4.1,12,4.4,TRAVERTINE);
  paint(x,12.5,z,7,1.2,6,LIGHT_STONE);
  if(close){
   paint(x,18.3,z,3.7,10,4.1,TRAVERTINE);
   paint(x,24,z,6.6,1.2,5.6,LIGHT_STONE);
   paint(x,28.1,z,3.2,6.6,3.8,TRAVERTINE);
   paint(x,31.8,z,7.4,1.1,6.5,SHADOW);
   // Four ascending interior seating courses; clear sightline to the sand.
   for(let j=0;j<4;j++){
    const r=(j+1)/5,rx=outerX-(outerX-62)*r,rz=outerZ-(outerZ-45)*r;
    paint(cx+rx*ca,1.15+j*1.6,cz+rz*sa,6.2,.9,5.1,j%2?LIGHT_STONE:TRAVERTINE);
   }
  }else{
   paint(x,22,z,5.2,17,5.1,TRAVERTINE);
   paint(x,31.8,z,7.4,1.1,6.5,SHADOW);
  }
 }
 // Entry court, gate markers, and a gently stepped stone approach.
 for(let j=0;j<9;j++){
  const t=j/8;
  paint(cx,.12,cz+outerZ+5+j*7,17,.24,7.1,[.69+t*.07,.61+t*.06,.51+t*.05]);
 }
 for(const side of [-1,1]){
  paint(cx+side*10,7,cz+outerZ,3.3,14,5,TRAVERTINE);
  paint(cx+side*10,15,cz+outerZ,4.1,1.2,6,LIGHT_STONE);
  if(close){
   paint(cx+side*9,22,cz+outerZ-2,2.2,13,3.4,TRAVERTINE);
   paint(cx+side*9,29,cz+outerZ-2,4,1.1,4.4,BRONZE);
  }
 }
 if(close){
  // Colorful shade pennants on upper bays and sparse, non-interactive spectators.
  for(let i=0;i<16;i++){
   const a=i*Math.PI/8+.14,x=cx+85*Math.cos(a),z=cz+63*Math.sin(a);
   if(gap(a))continue;
   paint(x,34,z,3.2,4.8,.2,i%3===0?[.61,.22,.18]:i%3===1?[.75,.58,.25]:[.4,.45,.54],.88);
  }
  for(let i=0;i<28;i++){
   const a=i*2.39996,x=cx+72*Math.cos(a),z=cz+54*Math.sin(a);
   if(gap(a))continue;
   const sway=Math.sin(now*.0011+i)*.15;
   paint(x,9+sway,z,.65,1.5,.65,i%3?[.61,.42,.28]:[.55,.2,.16]);
   paint(x,10+sway,z,.62,.65,.62,[.68,.51,.38]);
  }
 }
}
export function renderRomanCats(paint:RomanArenaDraw,now:number,player:{x:number;z:number}){
 // Cats stay near Roman market streets and the new amphitheater entrance.
 for(let i=0;i<14;i++){
  const arena=i>=8;
  const ox=arena?ROMAN_GRAND_ARENA.x:0,oz=arena?ROMAN_GRAND_ARENA.z+92:-110;
  const phase=now*.00022*(1+i%3*.25)+i*2.41;
  const x=ox+Math.sin(phase)*(arena?24:12)+(i%4-1.5)*6;
  const z=oz+Math.cos(phase*.8)*(arena?16:24)+(i%3-1)*11;
  const d=dist(x,z,player.x,player.z);
  if(d>75)continue;
  const dark=i%3===0,fur=dark?[.29,.27,.24]:i%3===1?[.73,.57,.37]:[.58,.56,.51];
  const bob=Math.sin(now*.004+i)*.06;
  paint(x,.48+bob,z,1.15,.72,.52,fur);
  paint(x+.57,.69+bob,z,.49,.55,.47,fur);
  paint(x+.66,1.07+bob,z-.17,.14,.24,.13,fur);
  paint(x+.66,1.07+bob,z+.17,.14,.24,.13,fur);
  if(d<38){
   paint(x-.65,.81+bob,z,.16,.9,.16,fur,.95,Math.sin(phase)*.35);
   paint(x+.84,.71+bob,z-.12,.08,.07,.07,[.12,.11,.09]);
   paint(x+.84,.71+bob,z+.12,.08,.07,.07,[.12,.11,.09]);
  }
 }
}
/** Visual only. Supply server-authoritative lion state from Bot A before wiring. */
export function renderRomanArenaLion(paint:RomanArenaDraw,now:number,player:{x:number;z:number},lion:RomanLionVisualState){
 if(!lion.active||dist(lion.x,lion.z,player.x,player.z)>115)return;
 const {x,z,heading}=lion,leap=Math.max(0,Math.min(1,lion.attackProgress??0));
 const bob=Math.sin(now*.012)*.11+leap*1.1;
 paint(x,1.35+bob,z,3.5,1.75,1.45,[.7,.47,.22],1,heading);
 paint(x+1.8,1.8+bob,z,1.6,1.85,1.65,[.47,.27,.13],1,heading);
 paint(x+2.6,1.7+bob,z,1.3,1.15,1.15,[.78,.55,.28],1,heading);
 for(const side of [-1,1])for(const forward of [-1,1]){
  paint(x+forward*1.15,.6+bob,z+side*.52,.5,1.2,.48,[.63,.41,.2]);
 }
 paint(x-2.15,1.75+bob,z,.22,1.7,.22,[.62,.38,.2],1,Math.sin(now*.004)*.3);
}
