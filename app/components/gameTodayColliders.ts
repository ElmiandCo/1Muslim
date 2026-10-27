/**
 * Cached, world-specific collision geometry for Keemy's Adventure World.
 *
 * Keep this separate from visual LOD: distant and hidden solids must still
 * collide. The immutable indices are created once per game mount, while
 * destructible plaza props are filtered against the live damage map at query
 * time (no 80-prop rebuild each animation frame).
 */
import {buildStaticGameCollisionIndex,type GameCollider,type GameCollisionIndex} from "./gamePhysics";

export type TodayPropCollider=GameCollider&Readonly<{id:string}>;

export const TODAY_PROP_COLLIDERS:readonly TodayPropCollider[]=Array.from({length:80},(_,i)=>({
  id:"prop-"+i,x:12+(i%20)*5,z:(Math.floor(i/20)-1.5)*24,
  hx:1.35,hz:1.35,bottom:0,top:2.7
}));
const PROP_INDEX=buildStaticGameCollisionIndex(TODAY_PROP_COLLIDERS,32);

/** The historical scene has its own geometry, not Today's destructible props. */
export function createPropheticColliders():readonly GameCollider[]{
  const solids:GameCollider[]=[];
  for(let i=0;i<84;i++){
    const col=i%12,row=Math.floor(i/12),x=(col-5.5)*42,z=(row-3)*53;
    if(Math.abs(x)<44&&Math.abs(z)<44)continue;
    solids.push({x,z,hx:11,hz:13,bottom:-1,top:3.1});
  }
  for(let i=0;i<44;i++){
    const col=i%11,row=Math.floor(i/11),x=(col-5)*36,z:-380-row*40;
    if(Math.abs(x)<30)continue;
    solids.push({x,z,hx:11,hz:12,bottom:-1,top:3.5});
  }
  return solids;
}
export const PROPHETIC_COLLISION_INDEX=buildStaticGameCollisionIndex(createPropheticColliders(),48);

/** Matches the existing rendered Today geometry; do not cull by draw distance. */
export function createTodayStaticColliders(terrain:(x:number,z:number)=>number):readonly GameCollider[]{
  const solids:GameCollider[]=[];
  for(const z of [-49,49])solids.push({x:161,z,hx:29,hz:3,bottom:0,top:17});
  solids.push({x:189,z:0,hx:3,hz:52,bottom:0,top:17});
  for(const z of [-35,35])solids.push({x:133,z,hx:3,hz:15,bottom:0,top:17});
  for(let x=5;x<85;x+=14)for(const side of [-1,1]){
    const z=side*15,height=5+(Math.floor(x/14)%3)*2;
    solids.push({x,z,hx:3.7,hz:3.2,bottom:0,top:height+.9});
    solids.push({x:x+4,z:z-side*5,hx:1.35,hz:1.1,bottom:0,top:2});
  }
  for(let x=235;x<=285;x+=12)for(const side of [-1,1])
    solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:0,top:6.1});
  for(let x=1090;x<=1140;x+=12)for(const side of [-1,1])
    solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:25,top:31.1});
  for(const x of [1155,1174,1190])for(const z of [-13,13])
    solids.push({x,z,hx:3.1,hz:1.8,bottom:25,top:27.6});
  for(let i=0;i<46;i++){
    const row=Math.floor(i/8),col=i%8,x=-90+col*27,z=-625-row*42,h=7+((i*13)%19);
    solids.push({x,z,hx:7,hz:8,bottom:terrain(x,z)-.5,top:h+.55});
  }
  for(let n=0;n<25;n++){
    const z=-620-n*34;
    for(const side of [-1,1]){
      const x=side*(110+n*6),height=18+Math.abs(Math.sin(n*2.3))*37;
      solids.push({x,z,hx:26,hz:24,bottom:-1,top:height});
    }
  }
  for(let i=0;i<75;i++){
    const x=-180+(i*47)%365,z=-580-(i*31)%380;
    solids.push({x,z,hx:.45,hz:.45,bottom:0,top:4.6});
  }
  solids.push({x:180,z:-780,hx:48,hz:39,bottom:0,top:15});
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
    const x=-120+col*37,z=-380-row*38,h=19+((row*7+col*11)%7)*12;
    solids.push({x,z,hx:11,hz:11.5,bottom:0,top:h+.8});
  }
  return solids;
}

/** Build once per mount. The damage map is mutable and intentionally read live. */
export function createTodayCollisionSource(
  terrain:(x:number,z:number)=>number,
  damaged:ReadonlyMap<string,number>
):GameCollisionIndex{
  const staticIndex=buildStaticGameCollisionIndex(createTodayStaticColliders(terrain),48);
  return {query(minX,maxX,minZ,maxZ){
    const fixed=staticIndex.query(minX,maxX,minZ,maxZ);
    const props=(PROP_INDEX.query(minX,maxX,minZ,maxZ) as readonly TodayPropCollider[])
      .filter(prop=>!damaged.has(prop.id));
    return props.length?[...fixed,...props]:fixed;
  }};
}
