"use client";
import {useEffect,useRef,useState} from "react";
export default function FutureGame(){
 const [pos,setPos]=useState({x:0,z:110,y:2}),[boost,setBoost]=useState(false),[fly,setFly]=useState(false);
 const held=useRef<Record<string,boolean>>({});
 useEffect(()=>{const down=(e:KeyboardEvent)=>{held.current[e.key.toLowerCase()]=true;};const up=(e:KeyboardEvent)=>{held.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",down);window.addEventListener("keyup",up);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)}},[]);
 return <main style={{minHeight:"100vh",background:"#050b22",color:"white"}}><h1>Future City</h1><p>Playable preview under construction.</p></main>;
}
