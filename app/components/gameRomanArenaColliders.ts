/**
 * Game Bot A / Rome: solid, immutable collision geometry for Living Worlds'
 * monumental amphitheater. Coordinates deliberately share the visual scene's
 * ROMAN_GRAND_ARENA landmark; distance-based render LOD NEVER culls physics.
 *
 * The visual has discrete pillars and seating, not an unbroken wall. Keep the
 * north/south/west open bays open and the southern entry's 16-unit center clear.
 * This is a stylized interpretation, not a historical reconstruction.
 */
import {ROMAN_GRAND_ARENA} from "./RomanArenaScene";
import {type GameCollider} from "./gamePhysics";

const BAY_COUNT=32;
/** Match RomanArenaScene's visible arch openings, including the south gate. */
export const romanArenaBayOpen=(angle:number)=>
  Math.abs(Math.sin(angle))>.975||Math.cos(angle)<-.975;

export const ROMAN_ARENA_COLLIDERS:readonly GameCollider[]=(()=>{
  const {x:cx,z:cz,outerX,outerZ}=ROMAN_GRAND_ARENA;
  const solids:GameCollider[]=[];
  for(let i=0;i<BAY_COUNT;i++){
    const angle=i*Math.PI*2/BAY_COUNT;
    if(romanArenaBayOpen(angle))continue;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const x=cx+outerX*cos,z=cz+outerZ*sin;
    // Three stacked facade tiers occupy the same narrow column footprint.
    solids.push({x,z,hx:2.05,hz:2.2,bottom:-.25,top:32.35});
    // Four low stepped seating courses: real foot-level obstructions even
    // when their detailed meshes are omitted by medium-distance LOD.
    for(let j=0;j<4;j++){
      const r=(j+1)/5;
      const rx=outerX-(outerX-62)*r,rz=outerZ-(outerZ-45)*r;
      solids.push({
        x:cx+rx*cos,z:cz+rz*sin,hx:3.1,hz:2.55,
        bottom:0,top:1.6+j*1.6
      });
    }
  }
  // Southern entry markers flank (never block) the central open passage.
  for(const side of [-1,1]){
    solids.push({
      x:cx+side*10,z:cz+outerZ,hx:1.65,hz:2.5,
      bottom:0,top:29.55
    });
  }
  return solids;
})();
