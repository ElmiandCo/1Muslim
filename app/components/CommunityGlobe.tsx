"use client";
import {useEffect,useRef} from "react";
export default function CommunityGlobe({active}:{active:boolean}){
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{if(!active)return;frame.current?.focus()},[active]);
 return <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",touchAction:"pan-y"}} onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}><iframe ref={frame} title="1Muslim interactive community globe" src="/maps" style={{border:0,width:"100%",height:"100%",display:"block"}} loading="lazy"/></div>
}