"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {acquirePointer,movementFromAnalog,normalizeAnalog,releasePointer,rotateCamera,type CameraAngles,type MotionIntent,type TouchOwnership,type Vec2} from "./adventure-input";

export type AdventureControlFrame=Readonly<{camera:CameraAngles;motion:MotionIntent}>;
type Props={onFrame:(frame:AdventureControlFrame)=>void;disabled?:boolean};

/** Preview-only input surface: no game meshes, renderer, or production integration. */
export default function AdventureTouchControls({onFrame,disabled=false}:Props){
 const [stick,setStick]=useState<Vec2>({x:0,y:0});
 const state=useRef<TouchOwnership>({movePointer:null,lookPointer:null});
 const stickRef=useRef<Vec2>({x:0,y:0});
 const cameraRef=useRef<CameraAngles>({yaw:0,pitch:0});
 const lastLook=useRef<{x:number;y:number}|null>(null);
 const callback=useRef(onFrame);
 useEffect(()=>{callback.current=onFrame},[onFrame]);
 const emit=useCallback(()=>{
  callback.current({camera:cameraRef.current,motion:movementFromAnalog(stickRef.current,cameraRef.current.yaw)});
 },[]);
 const reset=useCallback(()=>{
  state.current={movePointer:null,lookPointer:null};lastLook.current=null;
  stickRef.current={x:0,y:0};setStick({x:0,y:0});emit();
 },[emit]);
 useEffect(()=>{if(disabled)reset();return reset},[disabled,reset]);
 const move=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(disabled||state.current.movePointer!==event.pointerId)return;
  const rect=event.currentTarget.getBoundingClientRect();
  const next=normalizeAnalog(event.clientX,event.clientY,rect.left+rect.width/2,rect.top+rect.height/2,rect.width*.36);
  stickRef.current=next;setStick(next);emit();
 };
 const look=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(disabled||state.current.lookPointer!==event.pointerId)return;
  const last=lastLook.current;
  if(last){cameraRef.current=rotateCamera(cameraRef.current,event.clientX-last.x,event.clientY-last.y);emit();}
  lastLook.current={x:event.clientX,y:event.clientY};
 };
 const releaseMove=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(state.current.movePointer!==event.pointerId)return;
  state.current=releasePointer(state.current,event.pointerId);
  stickRef.current={x:0,y:0};setStick({x:0,y:0});emit();
 };
 const releaseLook=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(state.current.lookPointer!==event.pointerId)return;
  state.current=releasePointer(state.current,event.pointerId);lastLook.current=null;
 };
 return <div aria-label="Adventure touch controls" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:20}}>
  <div aria-label="Swipe to turn camera" onPointerDown={e=>{if(disabled)return;state.current=acquirePointer(state.current,e.pointerId,"look");if(state.current.lookPointer===e.pointerId){e.currentTarget.setPointerCapture(e.pointerId);lastLook.current={x:e.clientX,y:e.clientY};}}} onPointerMove={look} onPointerUp={releaseLook} onPointerCancel={releaseLook} onLostPointerCapture={releaseLook}
   style={{position:"absolute",inset:0,touchAction:"none",pointerEvents:disabled?"none":"auto"}}/>
  <div role="group" aria-label="Analog movement joystick" onPointerDown={e=>{if(disabled)return;e.stopPropagation();state.current=acquirePointer(state.current,e.pointerId,"move");if(state.current.movePointer===e.pointerId){e.currentTarget.setPointerCapture(e.pointerId);move(e);}}} onPointerMove={move} onPointerUp={releaseMove} onPointerCancel={releaseMove} onLostPointerCapture={releaseMove}
   style={{position:"absolute",left:"max(16px, env(safe-area-inset-left))",bottom:"max(20px, env(safe-area-inset-bottom))",width:124,height:124,borderRadius:"50%",border:"1px solid rgba(220,230,210,.7)",background:"rgba(8,45,38,.35)",backdropFilter:"blur(12px)",touchAction:"none",pointerEvents:disabled?"none":"auto",userSelect:"none"}}>
   <div aria-hidden="true" style={{position:"absolute",left:"50%",top:"50%",width:54,height:54,borderRadius:"50%",background:"rgba(195,228,210,.8)",border:"2px solid #d4c28b",transform:`translate(calc(-50% + ${stick.x*38}px),calc(-50% + ${stick.y*38}px))`,transition:state.current.movePointer===null?"transform .14s ease-out":"none",pointerEvents:"none"}}/>
  </div>
 </div>;
}
