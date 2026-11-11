/**
 * Living Worlds / Ancient Egypt: interpretive Nile market and palace quarter.
 * Visual-only. Bot A owns terrain, riverbanks, collision and navigation.
 * Era-inspired, not a claim that these buildings coexisted with Moses.
 */
import type {EgyptDraw} from "./AncientEgyptRiverScene";

export const EGYPT_PALACE={x:15,z:-370,halfWidth:56,halfDepth:70,gateWidth:19} as const;
export const EGYPT_MARKET={x:-20,z:290,columns:5,rows:3} as const;
export type EgyptDistrictFootprint={id:string;x:number;z:number;halfX:number;halfZ:number;kind:"palace"|"market"};
/** Bot A may use these to plan narrow solid wall volumes and walkable entries. */
export const EGYPT_DISTRICT_FOOTPRINTS:EgyptDistrictFootprint[]=[
 {id:"palace-quarter",x:EGYPT_PALACE.x,z:EGYPT_PALACE.z,halfX:56,halfZ:70,kind:"palace"},
 {id:"market-quarter",x:EGYPT_MARKET.x,z:EGYPT_MARKET.z,halfX:54,halfZ:43,kind:"market"}
];
const SAND:[number,number,number]=[.78,.62,.42];
const MUD:[number,number,number]=[.61,.43,.29];
const STONE:[number,number,number]=[.87,.73,.48];
const PAINT:[number,number,number]=[.18,.42,.48];
const GOLD:[number,number,number]=[.82,.62,.23];
const PAPYRUS:[number,number,number]=[.17,.43,.29];
const near=(x:number,z:number,px:number,pz:number,r:number)=>(x-px)**2+(z-pz)**2<=r*r;

/** Fixed LOD and draw budgets; all motion is deterministic and decorative. */
export function renderEgyptMarketPalace(draw:EgyptDraw,nowMs:number,playerX:number,playerZ:number){
 const palace=EGYPT_PALACE, market=EGYPT_MARKET;
 const palaceNear=near(palace.x,palace.z,playerX,playerZ,380);
 const marketNear=near(market.x,market.z,playerX,playerZ,330);
 if(!palaceNear&&!marketNear)return;
 if(palaceNear){
  const {x,z,halfWidth:hw,halfDepth:hd,gateWidth:gw}=palace;
  // Rectangular mudbrick palace precinct, not a European castle.
  draw(x,.035,z,hw*2,.07,hd*2,[.67,.53,.34]);
  for(const side of [-1,1]){
   draw(x+side*hw,4.8,z,3.4,9.6,hd*2,MUD);
   if(side===-1)draw(x,4.8,z-hd,hw*2,9.6,3.4,MUD);
   else for(const flank of [-1,1])draw(x+flank*(gw/2+(hw-gw/2)/2),4.8,z+hd,hw-gw/2,9.6,3.4,MUD);
  }
  // Southern gate: genuinely open gap in the wall for an enterable courtyard.
  // No invisible doorway collider; Bot A must supply matching side-wall solids.
  // Monumental pylons, carved lintel and painted entry.
  for(const side of [-1,1]){
   draw(x+side*(gw/2+6),8.2,z+hd+3,11,16.4,7,STONE);
   draw(x+side*(gw/2+6),13.2,z+hd+6,9,.5,.5,PAINT);
  }
  draw(x,15.2,z+hd+3,35,2,7,STONE);
  draw(x,16.3,z+hd+3,28,.55,7,GOLD);
  // Interior columned audience hall with an open central courtyard.
  draw(x,.13,z-29,68,.25,42,STONE);
  for(const side of [-1,1]){
   for(let i=0;i<6;i++){
    const cx=x+side*26,cz=z-51+i*12;
    draw(cx,5.8,cz,2.3,11.6,2.3,STONE);
    draw(cx,11.9,cz,4.2,1.1,4.2,PAINT);
    draw(cx,12.7,cz,4.6,.55,4.6,GOLD);
   }
  }
  draw(x,1.25,z-56,24,2.5,13,STONE);
  draw(x,2.6,z-56,21,.25,10,GOLD);
  // A shaded water garden; water is a thin surface, NOT a swimmable river.
  for(const side of [-1,1]){
   const px=x+side*35,pz=z+27;
   draw(px,.14,pz,11,.18,22,[.22,.47,.53],.86);
   if(near(px,pz,playerX,playerZ,125)){
    for(let j=0;j<8;j++){
     const fz=pz-9+j*2.5;
     draw(px+side*7,.8,fz,.32,1.6,.32,PAPYRUS);
     draw(px+side*7,1.7,fz,1.25,.6,1.25,[.35,.52,.24]);
    }
   }
  }
  // Distant profile remains cheap: detail only inside 170 units.
  if(near(x,z,playerX,playerZ,170)){
   for(let i=0;i<8;i++){
    const cx=x-18+i*5,cz=z+18+(i%2)*4;
    draw(cx,.85,cz,2.4,1.7,2.4,[.78,.62,.39]);
    draw(cx,1.8,cz,1.4,.25,1.4,PAINT);
   }
  }
 }
 if(marketNear){
  const {x,z,columns,rows}=market;
  // Riverside market street; an open 10-unit central lane.
  draw(x,.05,z,110,.1,90,SAND);
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const sx=x+(col-2)*21,sz=z+(row-1)*26;
   if(col===2)continue; // unobstructed walking spine
   draw(sx,.4,sz,13,.8,11,MUD);
   for(const side of [-1,1])for(const end of [-1,1])
    draw(sx+side*5.5,3.2,sz+end*4.6,.6,5.8,.6,[.43,.29,.17]);
   draw(sx,6.1,sz,14,.45,12,(row+col)%2?[.77,.56,.33]:[.68,.73,.56]);
   draw(sx,6.4,sz,14,.12,1.1,PAINT,.9);
   if(near(sx,sz,playerX,playerZ,145)){
    for(let k=0;k<3;k++){
     const px=sx-3+k*3;
     draw(px,1.25,sz+2,2,1.4,2,(k+row)%2?GOLD:[.46,.27,.16]);
     draw(px,2,sz+2,1.4,.3,1.4,[.83,.68,.42]);
    }
   }
  }
  // Faceless shoppers and porters; they remain visual-only until Bot A paths them.
  if(near(x,z,playerX,playerZ,145)){
   for(let i=0;i<10;i++){
    const phase=nowMs*.00036+i*1.43;
    const px=x+(i%2?5:-5)+Math.sin(phase)*2.1;
    const pz=z-32+i*6.5+Math.cos(phase)*1.3;
    const step=Math.sin(nowMs*.009+i)*.1;
    draw(px,1.35+step,pz,1.2,2.4,.9,(i%3)?[.85,.76,.59]:[.62,.5,.4]);
    draw(px,2.95+step,pz,.9,.9,.9,[.48,.31,.22]);
    if(i%3===0)draw(px+.8,1.25+step,pz,1.2,1.1,1.2,[.56,.38,.2]);
   }
   // Quiet market cats, animated tails; no eyes or facial details.
   for(let i=0;i<4;i++){
    const cx=x-42+i*28,cz=z+30+(i%2)*5;
    const fur=i%2?[.64,.52,.39]:[.27,.26,.24];
    draw(cx,.48,cz,1.3,.7,.65,fur);
    draw(cx+.7,.75,cz,.6,.55,.55,fur);
    draw(cx-.8,.9,cz,.14,1.2,.14,fur,1,Math.sin(nowMs*.003+i)*.4);
   }
  }
 }
}
