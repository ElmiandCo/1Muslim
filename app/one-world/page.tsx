"use client";
import {useState} from "react";
import "./one-world.css";
import IsometricLandscape from "./IsometricLandscape";
import GeographicNavigator from "./GeographicNavigator";

export default function OneWorldPage(){
 const [selectedPlot,setSelectedPlot]=useState(78);
 return <main className="ow">
  <header><div><small>1MUSLIM GAME STUDIO</small><h1>🌍 ONE WORLD</h1></div><span>EARLY PROTOTYPE</span></header>
  <nav><a href="#one-world-geography">🌐 Explore world</a><label>🪙 XP: not connected</label><span>🕊 Peaceful prototype</span></nav>
  <div id="one-world-geography"><GeographicNavigator plot={selectedPlot} onPlotChange={setSelectedPlot}/></div>
  <IsometricLandscape selectedPlot={selectedPlot} onPlotChange={setSelectedPlot}/>
  <footer style={{marginTop:16}}>Development preview: terrain, buildings and claims are local-only. No account XP is spent.</footer>
 </main>;
}
