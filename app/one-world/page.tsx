"use client";
import {useState} from "react";
import "./one-world.css";
import IsometricLandscape from "./IsometricLandscape";
export default function OneWorldPage(){
 const [overview,setOverview]=useState(false);
 return <main className="ow"><header><div><small>1MUSLIM GAME STUDIO</small><h1>🌍 ONE WORLD</h1></div><span>PUBLIC PLAYABLE PREVIEW</span></header><nav><button onClick={()=>setOverview(v=>!v)}>{overview?"↩ Return to valley":"🌐 World overview"}</button><label>🪙 XP: not connected</label><span>🕊 Peaceful prototype</span></nav>{overview?<section className="owStage"><div className="owWorld"><span>🌎</span><h2>Earth → Country → State → Region → Plot</h2><p>Geographic navigation is being developed by World Architect.</p><button onClick={()=>setOverview(false)}>Enter your valley</button></div></section>:<IsometricLandscape/>}<footer style={{marginTop:16}}>Guest preview · No sign-in required. Terrain, buildings and claims are temporary and reset on refresh. No account XP is spent.</footer></main>;
}
