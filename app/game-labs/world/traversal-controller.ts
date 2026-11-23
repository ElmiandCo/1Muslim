/** Preview-world traversal integrator. Renderer agnostic: bind to real GLB root and camera. */
import type {CameraAngles,MotionIntent} from "./adventure-input";
export type WorldPoint=Readonly<{x:number;y:number;z:number}>;
export type TraversalState=Readonly<{position:WorldPoint;verticalVelocity:number;grounded:boolean;heading:number}>;
export type TraversalInput=Readonly<{motion:MotionIntent;camera:CameraAngles;jump:boolean}>;
export type TerrainQuery=(x:number,z:number)=>number;
export type SweepQuery=(from:WorldPoint,to:WorldPoint,radius:number)=>WorldPoint;
const valid=(...values:number[])=>values.every(Number.isFinite);
export const initialTraversalState=(position:WorldPoint={x:0,y:0,z:0}):TraversalState=>({position,verticalVelocity:0,grounded:true,heading:0});
/** One bounded fixed step. Integrate at 60Hz; never feed raw frame deltas without an accumulator. */
export function stepTraversal(state:TraversalState,input:TraversalInput,dt:number,terrain:TerrainQuery,sweep:SweepQuery=(a,b)=>b):TraversalState{
 const {position,verticalVelocity,heading}=state;
 const {motion,camera,jump}=input;
 if(!valid(dt,position.x,position.y,position.z,verticalVelocity,heading,motion.right,motion.forward,motion.intensity,camera.yaw,camera.pitch)||dt<=0||dt>1/30)throw new RangeError("Invalid traversal step");
 const intensity=Math.min(1,Math.max(0,motion.intensity));
 const speed=(intensity>=.72?6.2:3.2)*intensity;
 const horizontalLength=Math.hypot(motion.right,motion.forward);
 const scale=horizontalLength>1?1/horizontalLength:1;
 const nextX=position.x+motion.right*scale*speed*dt;
 const nextZ=position.z+motion.forward*scale*speed*dt;
 const vy=state.grounded&&jump?5.8:verticalVelocity;
 const nextVy=vy-18*dt;
 const desired={x:nextX,y:position.y+vy*dt-9*dt*dt,z:nextZ};
 const resolved=sweep(position,desired,.36);
 if(!valid(resolved.x,resolved.y,resolved.z))throw new RangeError("Invalid collision result");
 const ground=terrain(resolved.x,resolved.z);
 if(!Number.isFinite(ground))throw new RangeError("Invalid terrain height");
 const grounded=resolved.y<=ground;
 const nextPosition={x:resolved.x,y:grounded?ground:resolved.y,z:resolved.z};
 const nextHeading=horizontalLength>.08?Math.atan2(motion.right,motion.forward):heading;
 return {position:nextPosition,verticalVelocity:grounded?0:nextVy,grounded,heading:nextHeading};
}
export type CameraPose=Readonly<{position:WorldPoint;target:WorldPoint}>;
/** Third-person shoulder-free orbit; collision query shortens the boom around walls. */
export function followCamera(player:WorldPoint,angles:CameraAngles,blocked:(from:WorldPoint,to:WorldPoint)=>WorldPoint=(a,b)=>b):CameraPose{
 if(!valid(player.x,player.y,player.z,angles.yaw,angles.pitch))throw new RangeError("Invalid camera pose");
 const target={x:player.x,y:player.y+1.55,z:player.z};
 const distance=4.8,cos=Math.cos(angles.pitch);
 const desired={x:target.x-Math.sin(angles.yaw)*cos*distance,y:target.y+Math.sin(angles.pitch)*distance+1,z:target.z-Math.cos(angles.yaw)*cos*distance};
 const position=blocked(target,desired);
 if(!valid(position.x,position.y,position.z))throw new RangeError("Invalid camera collision");
 return {position,target};
}
