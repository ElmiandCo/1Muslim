"use client";
import {useEffect,useRef} from "react";
import {usePilot} from "./usePilot";
import {renderFuture} from "./futureScene";
import FutureControls from "./FutureControls";
export default function FutureExperience(){
 const {pos,boost,fly,setBoost,setFly,keys}=usePilot(),canvas=useRef<HTMLCanvasElement>(null),player=useRef(pos);
 player.current=pos;
 useEffect(()=>{let frame=0;const paint=(t:number)=>{const node=canvas.current,c=node?.getContext("2d");if(node&&c){node.width=node.clientWidth;node.height=node.clientHeight;renderFuture(c,player.current,node.width,node.height,t);}frame=requestAnimationFrame(paint);};frame=requestAnimationFrame(paint);return()=>cancelAnimationFrame(frame);},[]);
 return <main style={{background:"#061127",color:"white",padding:12}}><h1>🌌 Future City</h1><canvas ref={canvas} style={{width:"100%",height:"65vh",background:"#030819"}}/><FutureControls {...{pos,boost,fly,setBoost,setFly,keys}}/></main>;
}
