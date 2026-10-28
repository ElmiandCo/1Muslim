/**
 * World Engine / Ancient Egypt: solid geometry matching Bot B's palace and
 * market render cubes. The market's walking spine and palace's southern gate
 * remain genuinely open, including at low visual LOD.
 *
 * The geometry is interpretive and makes no claim about Moses-era pyramids.
 * Static colliders are created once and never depend on player draw distance.
 */
import {EGYPT_MARKET,EGYPT_PALACE} from "./AncientEgyptMarketPalaceScene";
import type {GameCollider} from "./gamePhysics";

export function createEgyptDistrictColliders():readonly GameCollider[]{
 const solids:GameCollider[]=[];
 const add=(x:number,z:number,hx:number,hz:number,bottom:number,top:number)=>
  solids.push({x,z,hx,hz,bottom,top});
 const {x,z,halfWidth:hw,halfDepth:hd,gateWidth:gw}=EGYPT_PALACE;
 // Render-matched 3.4m thick perimeter, not a solid precinct rectangle.
 for(const side of [-1,1])add(x+side*hw,z,1.7,hd,0,9.6);
 add(x,z-hd,hw,1.7,0,9.6);
 const flankHalf=(hw-gw/2)/2;
 for(const side of [-1,1])
  add(x+side*(gw/2+flankHalf),z+hd,flankHalf,1.7,0,9.6);
 // The pylons flank the entrance. The lintel is high enough to walk under.
 for(const side of [-1,1])
  add(x+side*(gw/2+6),z+hd+3,5.5,3.5,0,16.4);
 add(x,z+hd+3,17.5,3.5,14.2,16.3);
 // Hall columns and capitals: no invisible wall across the courtyard.
 for(const side of [-1,1])for(let i=0;i<6;i++){
  const cx=x+side*26,cz=z-51+i*12;
  add(cx,cz,1.15,1.15,0,11.6);
  add(cx,cz,2.3,2.3,11.35,13);
 }
 // Raised dais and low decorative crates are walkable/solid, not hollow air.
 add(x,z-56,12,6.5,0,2.725);
 for(let i=0;i<8;i++)add(x-18+i*5,z+18+(i%2)*4,1.2,1.2,0,1.925);
 const market=EGYPT_MARKET;
 // The omitted middle column is an unobstructed north/south market lane.
 for(let row=0;row<market.rows;row++)for(let col=0;col<market.columns;col++){
  if(col===2)continue;
  const sx=market.x+(col-2)*21,sz=market.z+(row-1)*26;
  add(sx,sz,6.5,5.5,0,.8);
  for(const side of [-1,1])for(const end of [-1,1])
   add(sx+side*5.5,sz+end*4.6,.3,.3,.3,6.1);
  add(sx,sz,7,6,5.875,6.325);
  // Three pottery/basket piles, including the small lids atop each pile.
  for(let k=0;k<3;k++)add(sx-3+k*3,sz+2,1,1,.55,2.15);
 }
 return solids;
}
