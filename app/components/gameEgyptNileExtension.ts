/**
 * World Engine / Ancient Egypt: progressive long-Nile terrain extension.
 * Keeps Bot B's central 1,040-unit Nile scene untouched. Only draws terrain,
 * riverbed and water outside its bounds. Physics stays in egyptTerrainFloor
 * and is never culled with visual LOD. Interpretive, not historical dating.
 */
import {EGYPT_BOUNDS,EGYPT_RIVER_WIDTH,egyptRiverCenterX,type EgyptDraw} from "./AncientEgyptRiverScene";
export const EGYPT_NAV_BOUNDS={...EGYPT_BOUNDS,minZ:-1700,maxZ:1700} as const;
export const EGYPT_NILE_ORIGINAL_EDGE=520;
const CELL=24;
const SAND_WEST=[.78,.61,.37],SAND_EAST=[.81,.65,.4];
const BANK=[.69,.55,.33],FERTILE=[.34,.46,.27],BED=[.53,.45,.31],WATER=[.13,.43,.58];

/** Two new river stretches; existing Egypt visuals and colliders remain intact.
 * No invisible river wall or water-surface collision is introduced. */
export function renderExtendedEgyptNileTerrain(
 draw:EgyptDraw,playerX:number,playerY:number,playerZ:number,
 terrainFloor:(x:number,z:number)=>number
):void{
 const radius=Math.min(600,270+Math.max(0,playerY)*.42);
 for(const direction of [-1,1]){
  for(let offset=0;offset<EGYPT_NAV_BOUNDS.maxZ-EGYPT_NILE_ORIGINAL_EDGE;offset+=CELL){
   const depth=Math.min(CELL,EGYPT_NAV_BOUNDS.maxZ-EGYPT_NILE_ORIGINAL_EDGE-offset);
   const center=direction*(EGYPT_NILE_ORIGINAL_EDGE+offset+depth*.5);
   if(Math.abs(center-playerZ)>radius+CELL)continue;
   // 12m near-bank segments track the Nile's curve; far terrain uses 24m.
   const close=Math.abs(center-playerZ)<150&&
    Math.abs(egyptRiverCenterX(center)-playerX)<230;
   const subdivisions=close?2:1;
   for(let i=0;i<subdivisions;i++){
    const stripDepth=depth/subdivisions;
    const z=direction*(EGYPT_NILE_ORIGINAL_EDGE+offset+(i+.5)*stripDepth);
    const riverX=egyptRiverCenterX(z);
    const outer=EGYPT_RIVER_WIDTH/2+3;
    const westEnd=riverX-outer,eastStart=riverX+outer;
    const westWidth=westEnd-EGYPT_NAV_BOUNDS.minX;
    const eastWidth=EGYPT_NAV_BOUNDS.maxX-eastStart;
    draw(EGYPT_NAV_BOUNDS.minX+westWidth/2,-.25,z,westWidth,.5,stripDepth+.12,SAND_WEST);
    draw(eastStart+eastWidth/2,-.25,z,eastWidth,.5,stripDepth+.12,SAND_EAST);
    const bands=close?3:1,bandWidth=6/bands;
    for(const side of [-1,1])for(let band=0;band<bands;band++){
     const distance=outer-(band+.5)*bandWidth;
     const x=riverX+side*distance;
     const top=terrainFloor(x,z);
     draw(x,top-.12,z,bandWidth+.04,.24,stripDepth+.12,
      band===bands-1?FERTILE:BANK);
    }
    // Riverbed top -1, water top -.06; players wade below water surface.
    draw(riverX,-1.17,z,EGYPT_RIVER_WIDTH,.34,stripDepth+.12,BED);
    draw(riverX,-.15,z,EGYPT_RIVER_WIDTH,.18,stripDepth+.12,WATER,.9);
   }
  }
 }
}
