// Original Roman Judea geometry recovered from elite/roman-judea-world.
// Interpretive architecture; no depictions of prophets. LOD does not affect collision.
import {buildStaticGameCollisionIndex,type GameCollider} from "./gamePhysics";
export const ROMAN_PORTAL={x:0,z:-90,radius:7} as const;
export const ROMAN_BOUNDS={minX:-650,maxX:650,minZ:-650,maxZ:650} as const;
export type RomanCity="Jerusalem"|"Rome";
export type RomanDraw=(vp:number[],x:number,y:number,z:number,sx:number,sy:number,sz:number,col:number[],alpha?:number,angle?:number)=>void;
function solids(city:RomanCity):GameCollider[]{
 const a:GameCollider[]=[];
 for(let i=0;i<72;i++){const x=(i%9-4)*39,z=(Math.floor(i/9)-3.5)*48;if(Math.abs(x)<24||Math.abs(z)<24)continue;a.push({x,z,hx:12,hz:13,bottom:-1,top:8+(i%4)*2});}
 for(const side of [-1,1])a.push({x:side*235,z:0,hx:7,hz:220,bottom:-1,top:14});
 for(const z of [-220,220])for(let x=-230;x<=230;x+=14){if(Math.abs(x)<22)continue;a.push({x,z,hx:6,hz:6,bottom:-1,top:14});}
 for(let i=0;i<16;i++){const z=-165+i*22,x=(i%2?1:-1)*18;a.push({x,z,hx:3.5,hz:2,bottom:-1,top:3});}
 if(city==="Rome")a.push({x:0,z:-165,hx:38,hz:9.5,bottom:-1,top:26});
 return a;
}
export const ROMAN_JERUSALEM_COLLIDERS=solids("Jerusalem"),ROMAN_ROME_COLLIDERS=solids("Rome");
const jerusalemIndex=buildStaticGameCollisionIndex(ROMAN_JERUSALEM_COLLIDERS),romeIndex=buildStaticGameCollisionIndex(ROMAN_ROME_COLLIDERS);
export const romanJudeaCollisionIndex=(city:RomanCity)=>city==="Rome"?romeIndex:jerusalemIndex;
// Non-solid market life. All placements are deterministic and culled independently of physics.
type RomanPaint=(x:number,y:number,z:number,sx:number,sy:number,sz:number,col:number[],alpha?:number,angle?:number)=>void;
const JERUSALEM_MARKET={cloth:[[.59,.31,.23],[.39,.49,.33],[.67,.51,.31]],robes:[[.51,.38,.26],[.57,.46,.35]],goods:[[.35,.43,.2],[.6,.43,.2],[.45,.29,.39]]};
const ROME_MARKET={cloth:[[.65,.36,.25],[.38,.46,.55],[.7,.58,.32]],robes:[[.62,.48,.35],[.48,.36,.28]],goods:[[.46,.38,.21],[.51,.28,.38],[.35,.45,.24]]};
export function renderRomanMarketLife(paint:RomanPaint,now:number,player:{x:number;z:number},city:RomanCity){
 const palette=city==="Rome"?ROME_MARKET:JERUSALEM_MARKET;
 // Sixteen existing market stalls gain fluttering valances, traders and pottery.
 for(let i=0;i<16;i++){
  const side=i%2?1:-1,x=side*18,z=-165+i*22,dx=x-player.x,dz=z-player.z,d2=dx*dx+dz*dz;
  if(d2>115*115)continue;
  const cloth=palette.cloth[i%3],flutter=Math.sin(now*.0014+i*1.7)*.26;
  paint(x-2.5,3.57+flutter,z+2.45,1.5,.7,.18,cloth);
  paint(x+2.5,3.57-flutter,z+2.45,1.5,.7,.18,cloth);
  if(d2>65*65)continue;
  const traderX=side*23.7,robe=palette.robes[i%2],gesture=Math.sin(now*.0018+i*2.1)*.28;
  paint(traderX,1.48,z,1,2.25,.9,robe);
  paint(traderX,3.04,z,.84,.84,.84,[.64,.46,.33]);
  paint(traderX-side*.55,2.4+gesture,z+.2,.32,1.1,.36,robe);
  // Goods rest on the existing counter, so no new player collision is required.
  paint(x-1.6,2.86,z-.7,.85,.86,.85,[.62,.39,.24]);
  paint(x-1.6,3.32,z-.7,.54,.12,.54,[.73,.53,.36]);
  paint(x+1.55,2.84,z+.7,.8,.82,.8,[.66,.43,.28]);
  paint(x,2.68,z+.15,2.2,.4,1.25,[.43,.29,.18]);
  paint(x,3.02,z+.15,1.75,.28,1.05,palette.goods[i%3]);
  if(d2<32*32)paint(x,3.3,z+.15,1.2,.15,.75,palette.goods[(i+1)%3]);
 }
 // Small birds circle over the market street; they never participate in collision or AI.
 for(let i=0;i<12;i++){
  const phase=now*.00043+i*1.47,x=Math.sin(phase*1.2+i)*5.5,z=-132+i*24+Math.cos(phase)*6;
  const dx=x-player.x,dz=z-player.z,d2=dx*dx+dz*dz;
  if(d2>95*95)continue;
  const y=7+Math.sin(phase*4+i)*.65,wing=Math.sin(phase*10)*.43;
  paint(x,y,z,1.05,.4,.65,[.55,.53,.48]);
  if(d2<55*55){
   paint(x-.7,y+wing,z,.95,.15,.45,[.67,.65,.6],1,wing*.4);
   paint(x+.7,y-wing,z,.95,.15,.45,[.67,.65,.6],1,-wing*.4);
   paint(x,y+.08,z-.47,.24,.2,.45,[.42,.41,.39]);
  }
 }
}
export function renderRomanJudea(vp:number[],draw:RomanDraw,now:number,player:{x:number;z:number},city:RomanCity){
 const inRome=city==="Rome";
 const paint=(x:number,y:number,z:number,sx:number,sy:number,sz:number,col:number[],alpha=1,angle=0)=>{
  if(Math.abs(x-player.x)>250+sx*.5||Math.abs(z-player.z)>250+sz*.5)return;
  draw(vp,x,y,z,sx,sy,sz,col,alpha,angle);
 };
 const stone=inRome?[.73,.68,.59]:[.69,.63,.52];
      for(let ix=-6;ix<=6;ix++)for(let iz=-6;iz<=6;iz++){const x=ix*100,z=iz*100;paint(x,-.32,z,100,.64,100,[.55+.025*Math.sin(ix+iz),.49,.37]);}
      // Walkable crossroads, walled quarters, stone homes, stalls and gates.
      for(let z=-590;z<=590;z+=20){paint(0,.035,z,20,.07,20,[.66,.61,.52]);}
      for(let x=-590;x<=590;x+=20)paint(x,.04,0,20,.08,20,[.67,.61,.52]);
      for(let i=0;i<72;i++){const x=(i%9-4)*39,z=(Math.floor(i/9)-3.5)*48;if(Math.abs(x)<24||Math.abs(z)<24)continue;const h=8+(i%4)*2;paint(x,h/2,z,24,h,26,stone);paint(x,h+.25,z,26,.5,28,[.46,.39,.32]);paint(x,2.6,z+13.1,3,4,.2,[.29,.24,.19]);for(const side of [-1,1])paint(x+side*8,h*.6,z+13.2,2,2,.25,[.24,.19,.15]);}
      for(const side of [-1,1]){paint(side*235,7,0,14,14,440,[.61,.54,.44]);for(let z=-210;z<=210;z+=12)paint(side*235,15,z,15,2,8,[.54,.47,.38]);}
      for(let x=-230;x<=230;x+=14){if(Math.abs(x)<22)continue;paint(x,7,-220,12,14,12,[.61,.54,.44]);paint(x,7,220,12,14,12,[.61,.54,.44]);}
      // Market awnings and counters along the central road.
      for(let i=0;i<16;i++){const z=-165+i*22,side=i%2?1:-1,x=side*18;paint(x,1.2,z,6,2.4,3,[.44,.31,.2]);paint(x,4,z,7,.35,5,i%3?[.66,.32,.24]:[.34,.47,.38]);}
      // The gold walk-through portal joins the two historical cities without loading another page.
       paint(0,.15,ROMAN_PORTAL.z,15,.3,12,[.67,.51,.25]);
       for(const side of [-1,1]){paint(side*6,5,ROMAN_PORTAL.z,1.7,10,2,[.85,.71,.4]);paint(side*6,10.5,ROMAN_PORTAL.z,2.4,1,2.5,[.95,.79,.48]);}
       paint(0,11,ROMAN_PORTAL.z,14,2,2.5,[.84,.68,.37]);
       paint(0,5,ROMAN_PORTAL.z,.35,8,.4,[.4,.8,.72],.75);
       // Stylized travelers and soldiers; simple motion, no prophets depicted.
      for(let i=0;i<34;i++){const soldier=i%5===0;const phase=now*.00022*(soldier?1.2:.65)+i*2.1;const x=Math.sin(phase+i)*((i%3)*5+5),z=((i*37)%310)-155+Math.cos(phase)*9;paint(x,1.4,z,.95,2.8,.8,soldier?[.63,.19,.15]:[.67,.51,.35]);paint(x,3.15,z,.9,.9,.9,[.58,.39,.28]);if(soldier){paint(x,3.72,z,1.3,.35,1.2,[.54,.51,.48]);paint(x+1.1,2,z,.15,4,.15,[.42,.36,.3]);}}
      if(inRome){ // Distinct Rome destination: forum, columns and civic buildings.
        paint(0,.2,-130,85,.4,72,[.76,.71,.62]);paint(0,13,-165,76,26,19,[.77,.71,.62]);
        for(let x=-30;x<=30;x+=12){paint(x,13,-153,2,24,2,[.89,.83,.72]);paint(x,26,-153,7,2,7,[.83,.76,.66]);}
         // Colosseum-inspired amphitheater, triumphal arch, and aqueduct (stylized).
         for(let i=0;i<36;i++){const a=i*Math.PI/18,x=150+Math.cos(a)*46,z=-145+Math.sin(a)*32;paint(x,7,z,6,14,6,[.77,.69,.56]);paint(x,19,z,6,8,6,[.83,.75,.61]);paint(x,24,z,8,2,8,[.66,.56,.44]);}
         paint(150,.15,-145,78,.3,51,[.59,.46,.32]);
         for(const side of [-1,1])paint(side*8,8,-300,4,16,5,[.83,.76,.62]);
         paint(0,17,-300,22,3,6,[.86,.79,.66]);
         for(let i=0;i<14;i++){const x=-300+i*18;paint(x,11,-330,4,22,5,[.75,.68,.57]);paint(x,23,-330,19,3,6,[.69,.6,.49]);}
      }else{ // Jerusalem: layered stone hills and fortified hilltop precinct, no precise Temple reconstruction.
        for(let i=0;i<28;i++){const x=Math.sin(i*2.4)*310,z=Math.cos(i*1.9)*310;paint(x,15,z,65,30,75,[.51,.46,.34]);}
        paint(100,9,-135,75,18,65,[.72,.66,.55]);for(let i=0;i<7;i++)paint(70+i*10,19,-110,3,10,3,[.8,.75,.64]);
      
 }
 renderRomanMarketLife(paint,now,player,city);
 // Animated olive groves outside the original city walls. Non-solid decorative life.
 for(let i=0;i<36;i++){
  const x=(i%2?1:-1)*(267+(i%5)*13),z=-185+Math.floor(i/5)*53;
  const dist=Math.hypot(x-player.x,z-player.z);if(dist>125)continue;
  const sway=Math.sin(now*.00065+i*2.3)*.25;
  paint(x,2.8,z,.65,5.6,.65,[.42,.3,.2]);paint(x+sway,6.2,z,5,3.2,4.8,[.24,.37,.2]);
  if(dist<55){paint(x-1.8+sway,6.6,z,2.5,2.5,3,[.32,.46,.24]);paint(x+1.6+sway,6.5,z,2.6,2.7,3,[.28,.42,.22]);
   for(let j=0;j<3;j++)paint(x+(j-1)*1.7,.35,z+3,1,.65,1,[.36,.43,.21]);}
 }
}
