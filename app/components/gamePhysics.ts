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

/** A reusable X/Z broadphase for immutable world geometry. Visual LOD never
 * removes collision geometry. Build once per scene, not once per frame. */
export type GameCollisionIndex=Readonly<{
  query:(minX:number,maxX:number,minZ:number,maxZ:number)=>readonly GameCollider[];
}>;
export type GameCollisionSource=readonly GameCollider[]|GameCollisionIndex;

export function buildStaticGameCollisionIndex(
  colliders:readonly GameCollider[],cellSize=64
):GameCollisionIndex{
  if(!Number.isFinite(cellSize)||cellSize<=0)throw new RangeError("Invalid collision cell size");
  const cells=new Map<string,GameCollider[]>();
  const key=(x:number,z:number)=>x+":"+z;
  for(const b of colliders){
    const x0=Math.floor((b.x-b.hx)/cellSize),x1=Math.floor((b.x+b.hx)/cellSize);
    const z0=Math.floor((b.z-b.hz)/cellSize),z1=Math.floor((b.z+b.hz)/cellSize);
    for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
      const k=key(x,z),bucket=cells.get(k);
      if(bucket)bucket.push(b);else cells.set(k,[b]);
    }
  }
  return {query(minX,maxX,minZ,maxZ){
    const x0=Math.floor(minX/cellSize),x1=Math.floor(maxX/cellSize);
    const z0=Math.floor(minZ/cellSize),z1=Math.floor(maxZ/cellSize);
    const result:GameCollider[]=[],seen=new Set<GameCollider>();
    for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
      for(const b of cells.get(key(x,z))??[]){
        if(seen.has(b))continue;
        seen.add(b);
        if(b.x+b.hx>=minX&&b.x-b.hx<=maxX&&
           b.z+b.hz>=minZ&&b.z-b.hz<=maxZ)result.push(b);
      }
    }
    return result;
  }};
}

const queryGameColliders=(source:GameCollisionSource,
  minX:number,maxX:number,minZ:number,maxZ:number):readonly GameCollider[]=>
  "query" in source?source.query(minX,maxX,minZ,maxZ):source;

/**
 * Uses bounded substeps with axis-separated sliding so fast boosted movement
 * cannot skip narrow existing colliders between two rendered frames.
 * A small swept broadphase keeps collision checks local in large worlds.
 */
export function resolveHorizontalGameMovement(
  currentX:number,currentZ:number,targetX:number,targetZ:number,
  feetY:number,colliders:GameCollisionSource
):GameMovementResult{
  const lowX=Math.min(currentX,targetX)-PLAYER_RADIUS;
  const highX=Math.max(currentX,targetX)+PLAYER_RADIUS;
  const lowZ=Math.min(currentZ,targetZ)-PLAYER_RADIUS;
  const highZ=Math.max(currentZ,targetZ)+PLAYER_RADIUS;
  const nearby=queryGameColliders(colliders,lowX,highX,lowZ,highZ).filter(b=>
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

/** Crossing-aware vertical collision, independent of world rendering/LOD.
 *
 * Land on a solid top when descending across it; stop at a raised underside
 * when ascending into it. Do not clamp arbitrary high-altitude flight and do
 * not teleport players who started inside existing geometry.
 */
export type GameVerticalMovementResult=Readonly<{
  y:number;landedOnSolid:boolean;hitCeiling:boolean;
}>;

export function resolveVerticalGameMovement(
  currentFeetY:number,proposedFeetY:number,x:number,z:number,
  colliders:GameCollisionSource
):GameVerticalMovementResult{
  if(currentFeetY===proposedFeetY)
    return {y:proposedFeetY,landedOnSolid:false,hitCeiling:false};
  const descending=proposedFeetY<currentFeetY;
  let y=proposedFeetY,landedOnSolid=false,hitCeiling=false;
  for(const b of queryGameColliders(colliders,x-PLAYER_RADIUS,x+PLAYER_RADIUS,z-PLAYER_RADIUS,z+PLAYER_RADIUS)){
    if(Math.abs(x-b.x)>=b.hx+PLAYER_RADIUS||
       Math.abs(z-b.z)>=b.hz+PLAYER_RADIUS)continue;
    if(descending){
      // First roof crossed wins, including fast falls from high altitude.
      if(currentFeetY>=b.top-EPS&&proposedFeetY<b.top&&b.top>y){
        y=b.top;landedOnSolid=true;
      }
    }else{
      const underside=b.bottom-PLAYER_HEIGHT;
      // Raised bridges, cave lintels and overhangs block upward flight.
      // Already-intersecting geometry is left alone so players can escape.
      if(currentFeetY<=underside+EPS&&proposedFeetY>underside&&underside<y){
        y=underside;hitCeiling=true;
      }
    }
  }
  return {y,landedOnSolid,hitCeiling};
}
