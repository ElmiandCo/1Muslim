"use client";
import {useState} from "react";
import HudHudGestureRecorder from "./HudHudGestureRecorder";
import ElmiLightLab from "./ElmiLightLab";

/** Two isolated test zones; the private light laboratory remains admin-only. */
export default function HudHudLabLaunchers({isAdmin=false}:{isAdmin?:boolean}){
 const [touchOpen,setTouchOpen]=useState(false);
 const [lightOpen,setLightOpen]=useState(false);
 return <div className="hh-two-labs" role="group" aria-label="HudHud testing laboratories">
  <button type="button" className="hh-lab-button hh-touch-button" onClick={()=>setTouchOpen(true)}>🔵 <span>Open Full-Screen Touch Test Space<small>Gesture capture · velocity · neon trails · replay</small></span> ↗</button>
  <button type="button" className="hh-lab-button hh-light-button" disabled={!isAdmin} aria-label={isAdmin?"Open Elmi Light Animation Lab":"Elmi Light Animation Lab requires admin sign-in"} onClick={()=>setLightOpen(true)}>✦ <span>Elmi Light Animation Lab<small>{isAdmin?"Private light animation · interactive touch":"Admin sign-in required"}</small></span> ↗</button>
  {touchOpen&&<HudHudGestureRecorder onClose={()=>setTouchOpen(false)}/>}
  {lightOpen&&isAdmin&&<ElmiLightLab onClose={()=>setLightOpen(false)}/>}
  <style jsx>{`
  .hh-two-labs{display:grid;gap:12px;width:100%;min-width:0}
  .hh-lab-button{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:72px;width:100%;border-radius:18px;padding:13px 17px;color:#f3fbff;font-weight:750;font-size:15px;cursor:pointer;text-align:left}
  .hh-lab-button span{flex:1;min-width:0}.hh-lab-button small{display:block;margin-top:5px;font-size:11px;font-weight:400;line-height:1.4;color:#c3e7ff}
  .hh-touch-button{border:1px solid #2fbbff;background:linear-gradient(110deg,#053a72,#1266a8);box-shadow:inset 0 0 20px #38aaff30}
  .hh-light-button{border:1px solid #b8e7ef;background:linear-gradient(110deg,#08283c,#244b59);box-shadow:inset 0 0 20px #a4f7ff18}
  .hh-lab-button:disabled{opacity:.65;cursor:not-allowed}.hh-lab-button:focus-visible{outline:3px solid #fff;outline-offset:3px}
  @media(prefers-reduced-motion:reduce){.hh-lab-button{transition:none!important}}
  `}</style>
 </div>;
}
