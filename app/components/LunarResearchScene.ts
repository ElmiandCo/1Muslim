// Lunar settlement ambience for the EXISTING Moon renderer in SharedGameLobby.
// Render-only, deterministic geometry. Moon movement, ship physics and collision are untouched.
export type LunarResearchDraw = (
  x:number,y:number,z:number,sx:number,sy:number,sz:number,
  color:number[],alpha?:number,angle?:number
)=>void;

// Keep equipment outside the lander (0,0), observatory (30,0), and settlement domes.
// Arrays and survey rovers are artistic game-world props, not historical/real mission claims.
const SOLAR_ARRAYS = [[95,42],[115,55],[-94,48],[-117,61]] as const;
const PATH_LIGHTS = [[4,-14],[4,14],[10,-14],[10,14],[16,-14],[16,14],[22,-14],[22,14]] as const;
const SURVEY_ROVERS = [
  {x:120,z:96,radius:16,phase:0},
  {x:-125,z:-92,radius:19,phase:2.4}
] as const;

export function renderLunarResearchLife(draw:LunarResearchDraw,now:number,playerX:number,playerZ:number):void {
  // Cheaper than sqrt; visual LOD never changes solid collision geometry.
  const visible=(x:number,z:number,r:number)=>Math.abs(x-playerX)<r&&Math.abs(z-playerZ)<r;
  for(let i=0;i<SOLAR_ARRAYS.length;i++){
    const [x,z]=SOLAR_ARRAYS[i];
    if(!visible(x,z,130))continue;
    const track=Math.sin(now*.00018+i*1.7)*.28;
    draw(x,.16,z,14,.32,5,[.32,.36,.42]); // anchored, low-profile footing
    draw(x,1.2,z,.8,2,.8,[.7,.75,.83]);
    draw(x,2.2,z,13,.2,.45,[.82,.7,.34],.9,track);
    for(const side of [-1,1]){
      draw(x+side*3.25,2.3,z,5.8,.16,3.6,[.08,.2,.35],.96,track);
      draw(x+side*3.25,2.4,z,5.3,.06,3.15,[.14,.45,.72],.82,track);
    }
  }
  // Approach markers guide the walk between the lander and the existing observatory.
  for(let i=0;i<PATH_LIGHTS.length;i++){
    const [x,z]=PATH_LIGHTS[i];
    if(!visible(x,z,75))continue;
    const pulse=.64+.26*(.5+.5*Math.sin(now*.003+i*.65));
    draw(x,.18,z,.75,.36,.75,[.27,.32,.39]);
    draw(x,.48,z,.4,.22,.4,[.34,.8,1],pulse);
    draw(x,.61,z,.21,.06,.21,[.85,.95,1],pulse);
  }
  // Two low-speed autonomous survey rovers traverse remote, non-player-critical loops.
  // Their visuals are non-solid until Bot A adds optional moving-object colliders.
  for(let i=0;i<SURVEY_ROVERS.length;i++){
    const rover=SURVEY_ROVERS[i],a=now*.00012+rover.phase;
    const x=rover.x+Math.cos(a)*rover.radius,z=rover.z+Math.sin(a)*rover.radius;
    if(!visible(x,z,100))continue;
    draw(x,1.02,z,3.5,1.1,2.2,[.8,.84,.89],1,a);
    draw(x,1.67,z,2.5,.25,1.6,[.13,.31,.46],.95,a);
    for(const side of [-1,1])for(const axle of [-1,1]){
      draw(x+side*1.75,.42,z+axle*.82,.65,.82,.7,[.18,.22,.27],1,a);
    }
    draw(x,2.45,z,.12,1.5,.12,[.7,.77,.83]);
    draw(x,3.18,z,1.2,.18,.42,[.14,.5,.77],.92,Math.sin(now*.0007+i)*.6);
    const blink=.5+.4*(.5+.5*Math.sin(now*.004+i*3));
    draw(x,1.1,z-1.17,.5,.28,.1,[.28,.87,1],blink,a);
  }
}
