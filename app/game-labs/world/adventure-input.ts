/** Engine-independent input mapping adapted from SharedGameLobby's analog movement.
 * No rendering primitives or production UI dependencies.
 */
export type Vec2 = Readonly<{x:number;y:number}>;
export type CameraAngles = Readonly<{yaw:number;pitch:number}>;
export type MotionIntent = Readonly<{right:number;forward:number;intensity:number;run:boolean}>;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const finite=(...values:number[])=>values.every(Number.isFinite);
export const DEFAULT_DEADZONE=0.12;
/** Pointer coordinates relative to a circular stick; clamp diagonal magnitude. */
export function normalizeAnalog(clientX:number,clientY:number,centerX:number,centerY:number,radius:number):Vec2 {
 if(!finite(clientX,clientY,centerX,centerY,radius)||radius<=0)throw new RangeError("Invalid analog geometry");
 let x=(clientX-centerX)/radius,y=(clientY-centerY)/radius;
 const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
 return {x,y};
}
/** Smooth analog strength outside deadzone, camera-relative direction and walk/run intent. */
export function movementFromAnalog(stick:Vec2,yaw:number,deadzone=DEFAULT_DEADZONE):MotionIntent {
 if(!finite(stick.x,stick.y,yaw,deadzone)||deadzone<0||deadzone>=1)throw new RangeError("Invalid movement input");
 const raw=Math.hypot(stick.x,stick.y),magnitude=clamp(raw,0,1);
 if(magnitude<=deadzone)return {right:0,forward:0,intensity:0,run:false};
 const intensity=(magnitude-deadzone)/(1-deadzone),x=stick.x/raw,y=-stick.y/raw;
 // yaw=0 faces world +Z; rightward stick produces world +X.
 return {right:(x*Math.cos(yaw)+y*Math.sin(yaw))*intensity,
 forward:(y*Math.cos(yaw)-x*Math.sin(yaw))*intensity,
 intensity,run:intensity>=0.72};
}
/** Right-side swipe rotates camera; bounded pitch prevents inversion. */
export function rotateCamera(camera:CameraAngles,deltaX:number,deltaY:number,sensitivity=0.004):CameraAngles {
 if(!finite(camera.yaw,camera.pitch,deltaX,deltaY,sensitivity)||sensitivity<=0)throw new RangeError("Invalid camera input");
 return {yaw:camera.yaw-deltaX*sensitivity,pitch:clamp(camera.pitch-deltaY*sensitivity,-1.2,0.8)};
}
/** First pointer captured by the stick remains its owner; second pointer may independently look. */
export type TouchOwnership=Readonly<{movePointer:number|null;lookPointer:number|null}>;
export function acquirePointer(state:TouchOwnership,id:number,zone:"move"|"look"):TouchOwnership {
 if(!Number.isInteger(id)||id<0)throw new RangeError("Invalid pointer ID");
 if(id===state.movePointer||id===state.lookPointer)return state;
 if(zone==="move"&&state.movePointer===null)return {...state,movePointer:id};
 if(zone==="look"&&state.lookPointer===null)return {...state,lookPointer:id};
 return state;
}
export function releasePointer(state:TouchOwnership,id:number):TouchOwnership {
 return {movePointer:state.movePointer===id?null:state.movePointer,lookPointer:state.lookPointer===id?null:state.lookPointer};
}
