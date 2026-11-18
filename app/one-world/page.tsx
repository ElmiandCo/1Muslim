"use client";
import {useState} from "react";
import "./one-world.css";
import IsometricLandscape from "./IsometricLandscape";
import GeographicNavigator from "./GeographicNavigator";
export default function OneWorldPage(){
 const [overview,setOverview]=useState(false);
 return <main className="ow"><header><div><small>1MUSLIM GAME STUDIO</small><h1>🌍 ONE WORLD</h1></div><span>EARLY PROTOTYPE</span></header><nav><button onClick={()=>setOverview(v=>!v)}>{overview?"↩ Return to valley":"🌐 World overview"}</button><label>🪙 XP: not connected</label><span>🕊 Peaceful prototype</span></nav>{overview?<section className="owStage"><div className="owWorld"><span>🌎</span><h2>Earth → Country → State → Region → Plot</h2><p>Geographic navigation is being developed by World Architect.</p><button onClick={()=>setOverview(false)}>Enter your valley</button></div></section>:<><GeographicNavigator/><IsometricLandscape/></>}<footer style={{marginTop:16}}>Development preview: terrain, buildings and claims are local-only. No account XP is spent.</footer></main>;
