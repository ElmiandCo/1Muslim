"use client";
import type {usePilot} from "./usePilot";
type Props=ReturnType<typeof usePilot>;
export default function FutureControls({pos,boost,fly,setBoost,setFly,keys}:Props){
 const portal=Math.hypot(pos.x,pos.z+310)<14&&pos.y<15;
 const move=(key:string,label:string)=><button key={key} type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current[key]=true;}} onPointerUp={()=>keys.current[key]=false} onPointerCancel={()=>keys.current[key]=false} style={{padding:14,minWidth:52}}>{label}</button>;
 return <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
 {move("w","▲")}{move("a","◀")}{move("s","▼")}{move("d","▶")}{move(" ","Up")}{move("c","Down")}
 <button onClick={()=>setFly(!fly)}>Fly {fly?"ON":"OFF"}</button>
 <button onClick={()=>setBoost(!boost)}>Boost {boost?"ON":"OFF"}</button>
 <a href="/" style={{color:"#8ef4ff"}}>{portal?"🌀 Enter Portal · Lobby":"↩ Lobby"}</a>
 </div>;
}
