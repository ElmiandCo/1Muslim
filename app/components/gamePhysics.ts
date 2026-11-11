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


/**
 * Detect a diagonal flight/fall that crosses a solid roof or underside between
 * frames even when the destination X/Z no longer overlaps that structure.
 * Unlike a visual draw-distance test, this queries the full immutable collider
 * source; an indexed source keeps work local to the swept horizontal bounds.
 *
 * This is a fallback for resolveVerticalGameMovement: call only if its normal
 * destination-position check found no landing/ceiling. On impact the returned
 * X/Z is the crossing position, so we never leave the avatar suspended above
 * a roof it has already flown past.
 */
export type GameSweptVerticalMovementResult=Readonly<{
  x:number;z:number;y:number;landedOnSolid:boolean;hitCeiling:boolean;
}>;
export function resolveSweptVerticalGameMovement(
  startFeetY:number,endFeetY:number,
  startX:number,startZ:number,endX:number,endZ:number,
  colliders:GameCollisionSource
):GameSweptVerticalMovementResult{
  const none={x:endX,z:endZ,y:endFeetY,landedOnSolid:false,hitCeiling:false};
  if(startFeetY===endFeetY||(startX===endX&&startZ===endZ))return none;
  const descending=endFeetY<startFeetY;
  const nearby=queryGameColliders(colliders,
    Math.min(startX,endX)-PLAYER_RADIUS,Math.max(startX,endX)+PLAYER_RADIUS,
    Math.min(startZ,endZ)-PLAYER_RADIUS,Math.max(startZ,endZ)+PLAYER_RADIUS);
  let bestY=descending?-Infinity:Infinity;
  let bestX=endX,bestZ=endZ,hit=false;
  for(const b of nearby){
    const crossingY=descending?b.top:b.bottom-PLAYER_HEIGHT;
    if(descending
      ?!(startFeetY>=crossingY-EPS&&endFeetY<crossingY)
      :!(startFeetY<=crossingY+EPS&&endFeetY>crossingY))continue;
    const t=(crossingY-startFeetY)/(endFeetY-startFeetY);
    if(t<0||t>1)continue;
    // A character already standing on a roof (or touching an underside)
    // must be able to walk/fly OUT over its edge. At t=0 the collision
    // belongs to the start position, not the departing trajectory.
    // Preserve actual landings when the destination still overlaps.
    if(t<=EPS&&(
      Math.abs(endX-b.x)>=b.hx+PLAYER_RADIUS||
      Math.abs(endZ-b.z)>=b.hz+PLAYER_RADIUS
    ))continue;
    // At start-of-frame roof contact, keep X/Z movement across the same
    // surface instead of snapping back to the previous frame position.
    const x=t<=EPS?endX:startX+(endX-startX)*t;
    const z=t<=EPS?endZ:startZ+(endZ-startZ)*t;
    if(Math.abs(x-b.x)>=b.hx+PLAYER_RADIUS||
       Math.abs(z-b.z)>=b.hz+PLAYER_RADIUS)continue;
    // Descending: first (highest) roof. Ascending: first (lowest) underside.
    if(!hit||(descending?crossingY>bestY:crossingY<bestY)){
      bestY=crossingY;bestX=x;bestZ=z;hit=true;
    }
  }
  return hit
    ?{x:bestX,z:bestZ,y:bestY,landedOnSolid:descending,hitCeiling:!descending}
    :none;
}


/**
 * Continuous side-entry check for diagonal falling / climbing flight.
 *
 * The regular horizontal resolver samples the avatar at its STARTING feet
 * height. A player descending from above a tall wall can therefore move into
 * the wall later in the same frame, after dropping below the roof. Sweep the
 * X/Z entry into each radius-expanded collider at the interpolated feet Y.
 * This only catches NEW side entries; vertical roof/underside crossings and
 * spawn-inside escape remain owned by the other resolvers.
 *
 * Only use for ordinary character movement, never ship/plane/EVA/lunar modes.
 */
export type GameSweptSideMovementResult=Readonly<{
  x:number;z:number;blocked:boolean;
}>;
export function resolveSweptSideGameMovement(
  startX:number,startZ:number,startFeetY:number,
  endX:number,endZ:number,endFeetY:number,
  colliders:GameCollisionSource
):GameSweptSideMovementResult{
  const none={x:endX,z:endZ,blocked:false};
  const dx=endX-startX,dz=endZ-startZ;
  if((dx===0&&dz===0)||startFeetY===endFeetY)return none;
  const interval=(start:number,delta:number,min:number,max:number):readonly [number,number]|null=>{
    if(Math.abs(delta)<EPS)return start>min&&start<max?[-Infinity,Infinity]:null;
    const a=(min-start)/delta,b=(max-start)/delta;
    return a<b?[a,b]:[b,a];
  };
  let first=Infinity;
  for(const b of queryGameColliders(colliders,
    Math.min(startX,endX)-PLAYER_RADIUS,Math.max(startX,endX)+PLAYER_RADIUS,
    Math.min(startZ,endZ)-PLAYER_RADIUS,Math.max(startZ,endZ)+PLAYER_RADIUS)){
    const ix=interval(startX,dx,b.x-b.hx-PLAYER_RADIUS,b.x+b.hx+PLAYER_RADIUS);
    const iz=interval(startZ,dz,b.z-b.hz-PLAYER_RADIUS,b.z+b.hz+PLAYER_RADIUS);
    if(!ix||!iz)continue;
    const entry=Math.max(ix[0],iz[0]),exit=Math.min(ix[1],iz[1]);
    // Starting inside the horizontal envelope is handled by the existing
    // escape rule, not by snapping the avatar back into an obstacle.
    if(entry<0||entry>1||exit<=entry)continue;
    const feet=startFeetY+(endFeetY-startFeetY)*entry;
    if(feet>=b.top-EPS||feet+PLAYER_HEIGHT<=b.bottom+EPS)continue;
    first=Math.min(first,entry);
  }
  if(!Number.isFinite(first))return none;
  const safe=Math.max(0,first-1e-4);
  return {x:startX+dx*safe,z:startZ+dz*safe,blocked:true};
}
