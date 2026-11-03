/**
 * World Engine / Ancient Egypt: immutable colliders for Bot B's long Nile
 * oasis palms. Visual LOD never changes collision state. These cylinders are
 * represented by tight AABBs matching the rendered 1.15m-wide trunks; moving
 * fronds, reeds, birds and visual-only skiffs intentionally remain non-solid.
 * Ancient Egyptian inspired environment, not a historical dating claim.
 */
import {LONG_NILE_OASIS_PALMS} from "./AncientEgyptLongNileLifeScene";
import type {GameCollider} from "./gamePhysics";

/** Exactly one static trunk per visual palm, including at far draw distance. */
export function createLongNilePalmColliders():readonly GameCollider[]{
 return LONG_NILE_OASIS_PALMS.map(({x,z,height})=>({
  x,z,hx:.575,hz:.575,bottom:0,top:height*.9
 }));
}
