/**
 * Horizontal player collision for Keemy's Adventure World.
 *
 * The caller owns world-specific solid geometry and ground/roof selection. This
 * helper only resolves the shared on-foot/flying X/Z motion; vehicles, lunar
 * walking, ship and EVA keep their existing dedicated movement rules.
 */
export type GameCollider = Readonly<{
  x:number;z:number;hx:number;hz:number;bottom:number;top:number;
}>;

export type GameMovementResult = Readonly<{
  x:number;z:number;roof:number;blocked:boolean;
}>;

const PLAYER_RADIUS=.42;
const PLAYER_HEIGHT=1.75;
const COLLISION_STEP=.6;
const ROOF_TOLERANCE=.2;
const ROOF_REACH=2.2;
const EPS=1e-6;

/**
 * Uses bounded substeps with axis-separated sliding so fast boosted movement
 * cannot skip narrow existing colliders between two rendered frames.
 * A small swept broadphase keeps collision checks local in large worlds.
 */
export function resolveHorizontalGameMovement(
  currentX:number,currentZ:number,targetX:number,targetZ:number,
  feetY:number,colliders:readonly GameCollider[]
):GameMovementResult{
  const lowX=Math.min(currentX,targetX)-PLAYER_RADIUS;
  const highX=Math.max(currentX,targetX)+PLAYER_RADIUS;
  const lowZ=Math.min(currentZ,targetZ)-PLAYER_RADIUS;
  const highZ=Math.max(currentZ,targetZ)+PLAYER_RADIUS;
  const nearby=colliders.filter(b=>
    b.x+b.hx>=lowX&&b.x-b.hx<=highX&&
    b.z+b.hz>=lowZ&&b.z-b.hz<=highZ&&
    feetY<=b.top+ROOF_REACH&&feetY+PLAYER_HEIGHT>b.bottom
  );
  const dx=targetX-currentX,dz=targetZ-currentZ;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/COLLISION_STEP));
  const sx=dx/steps,sz=dz/steps;
  let x=currentX,z=currentZ,blocked=false;
  for(let i=0;i<steps;i++){
    if(sx!==0){
      const nx=x+sx;
      const hit=nearby.some(b=>
        feetY<b.top-ROOF_TOLERANCE&&
        Math.abs(nx-b.x)<b.hx+PLAYER_RADIUS&&
        Math.abs(z-b.z)<b.hz+PLAYER_RADIUS&&
        // Let a player who spawned inside geometry escape outward.
        Math.abs(nx-b.x)<=Math.abs(x-b.x)+EPS
      );
      if(hit)blocked=true;else x=nx;
    }
    if(sz!==0){
      const nz=z+sz;
      const hit=nearby.some(b=>
        feetY<b.top-ROOF_TOLERANCE&&
        Math.abs(x-b.x)<b.hx+PLAYER_RADIUS&&
        Math.abs(nz-b.z)<b.hz+PLAYER_RADIUS&&
        Math.abs(nz-b.z)<=Math.abs(z-b.z)+EPS
      );
      if(hit)blocked=true;else z=nz;
    }
  }
  let roof=-Infinity;
  for(const b of nearby){
    if(feetY>=b.top-ROOF_TOLERANCE&&feetY<=b.top+ROOF_REACH&&
       Math.abs(x-b.x)<b.hx+PLAYER_RADIUS&&
       Math.abs(z-b.z)<b.hz+PLAYER_RADIUS)roof=Math.max(roof,b.top);
  }
  return {x,z,roof,blocked};
}
