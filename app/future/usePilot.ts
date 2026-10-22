"use client";
import {useEffect,useRef,useState} from "react";
import {step,type Position} from "./futurePhysics";
export function usePilot(){
 const [pos,setPos]=useState<Position>({x:0,y:0,z:125}),[boost,setBoost]=useState(false),[fly,setFly]=useState(false);
 const keys=useRef<Record<string,boolean>>({});
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=true;};
  const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[]);
 useEffect(()=>{const id=setInterval(()=>setPos(p=>step(p,keys.current,boost,fly)),32);return()=>clearInterval(id);},[boost,fly]);
 return {pos,boost,fly,setBoost,setFly,keys};
}
